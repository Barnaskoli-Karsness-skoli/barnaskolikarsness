/**
 * admin-api.js
 * Thin wrappers around the Phase 5 Netlify Functions — every admin save
 * action goes through exactly one of these, so the fetch/error-handling
 * pattern (and now the auth header) lives in one place.
 *
 * Every call attaches `Authorization: Bearer <jwt>` when a Netlify
 * Identity user is logged in (see admin/js/admin.js's initLoginGate,
 * Phase 8). Using user.jwt() rather than the cached user.token.access_token
 * matters here: jwt() returns a promise for a token the widget has already
 * refreshed if the cached one was stale, so a long-open admin tab doesn't
 * start failing saves with an expired token. The public read calls
 * (getPageData etc.) get the header too when a user happens to be logged
 * in, but those Functions don't require it — only the save/upload
 * Functions actually check it server-side (netlify/functions/utils/auth.js).
 *
 * If jwt() itself fails — the refresh token has also gone stale, not just
 * the access token — that means the session is actually dead, not just
 * due for a refresh. Rather than silently sending the request with no
 * Authorization header (a 401 the caller sees as a generic "failed to
 * save" error with no indication why), this calls admin.js's shared
 * window.AdminAuth.forceReLogin(), the same recovery path
 * initLoginGate()'s own proactive check uses on page load, so a session
 * going stale mid-use cleanly drops the admin back to the login screen
 * too instead of leaving the dashboard up but non-functional.
 */
(function (global) {
  "use strict";

  var BASE = "/.netlify/functions";

  function authHeaders() {
    var user = global.netlifyIdentity && global.netlifyIdentity.currentUser();
    if (!user) return Promise.resolve({});
    return user
      .jwt()
      .then(function (token) {
        return { Authorization: "Bearer " + token };
      })
      .catch(function (err) {
        console.error("admin-api: failed to get a fresh Identity token:", err);
        if (global.AdminAuth) global.AdminAuth.forceReLogin();
        return {};
      });
  }

  function postJson(path, body) {
    return authHeaders().then(function (extraHeaders) {
      return fetch(BASE + "/" + path, {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, extraHeaders),
        body: JSON.stringify(body)
      });
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          throw new Error((data && data.error) || ("HTTP " + response.status));
        }
        return data;
      });
    });
  }

  function getJson(path) {
    return authHeaders().then(function (extraHeaders) {
      // cache: "no-store" — every one of these reads (get-page-data,
      // get-news-item, list-news) is a write-then-read confirmation inside
      // the admin (load-to-edit, or a post-save/-delete list refresh), and
      // each carries a public Cache-Control: max-age=300 header meant for
      // the public site's CDN caching, not the admin's own browser. Without
      // this, a browser that had already loaded the same URL once (e.g.
      // opening news.html?id=x before deleting it) can serve that stale
      // response straight from its local disk cache — the server-side
      // Cache-Tag purge these save/delete Functions already do only
      // invalidates the CDN, not a browser's own cache.
      return fetch(BASE + "/" + path, { headers: extraHeaders, cache: "no-store" });
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          throw new Error((data && data.error) || ("HTTP " + response.status));
        }
        return data;
      });
    });
  }

  global.AdminApi = {
    getPageData: function (slug) {
      return getJson("get-page-data?slug=" + encodeURIComponent(slug));
    },
    getNewsItem: function (id) {
      return getJson("get-news-item?id=" + encodeURIComponent(id));
    },
    listNews: function () {
      return getJson("list-news");
    },
    listNewsAdmin: function () {
      return getJson("list-news-admin");
    },
    savePage: function (slug, title, content) {
      return postJson("save-page", { slug: slug, title: title, content: content });
    },
    saveNews: function (id, title, date, content, coverImage) {
      return postJson("save-news", { id: id, title: title, date: date, content: content, coverImage: coverImage || null });
    },
    deleteNews: function (id) {
      return postJson("delete-news", { id: id });
    },
    saveSiteSettings: function (settings) {
      return postJson("save-site-settings", settings);
    },
    saveBanner: function (banner) {
      return postJson("save-banner", banner);
    },
    uploadImage: function (base64) {
      return postJson("upload-image", { base64: base64 });
    }
  };
})(window);
