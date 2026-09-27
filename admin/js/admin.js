/**
 * admin.js
 * Admin portal app logic (CLAUDE.md Section 7). Gated behind real Netlify
 * Identity (Phase 8) via the vendored widget (admin/vendor/netlify-identity)
 * — see initLoginGate(). The @kopskolar.is domain is checked here
 * client-side right after login (belt) purely for UX (log the user back
 * out immediately with a clear message instead of leaving them in a
 * dashboard that will fail every save); the actual security boundary is
 * server-side, in netlify/functions/utils/auth.js, which every save
 * Function already calls through.
 *
 * The News tab lists every news item (via list-news.js, added after Phase 7
 * flagged that get-page-data.js only exposed the homepage's 6 newest) as
 * quick-edit shortcuts, plus a manual id lookup for get-news-item.js.
 */
(function () {
  "use strict";

  var ALLOWED_EMAIL_DOMAIN = "@kopskolar.is";

  var state = {
    currentUser: null,
    hasUnsavedChanges: false,
    pageEditor: null,
    pageEditorReady: false,
    currentPageSlug: null,
    newsEditor: null,
    newsEditorReady: false,
    siteSettings: null, // fetched baseline — Site Info/Banner saves merge into this, not overwrite it
    quickLinkItems: [],
    phoneRows: [],
    hoursRows: []
  };

  var QUICK_LINK_ICON_IDS = ["matsedill", "skoladagatal", "vinaholl", "leyfisbeidni", "mentor", "farsaeld", "einelti", "link"];

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function setMessage(elId, text, cssClass) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.textContent = text;
    el.className = "form-message" + (cssClass ? " " + cssClass : "");
  }

  function markUnsaved() {
    state.hasUnsavedChanges = true;
  }
  function clearUnsaved() {
    state.hasUnsavedChanges = false;
  }

  // ---------------------------------------------------------------
  // Invalid-block markers (Editor.js silently drops any block whose own
  // validate() rejects it — see savePageContent()/saveNewsEntry() below).
  // Flags the exact offending block(s) in the editor UI so the admin
  // doesn't have to hunt for what needs fixing (missing alt text, an
  // empty paragraph/header, etc.) after only reading a text error.
  // ---------------------------------------------------------------
  var INVALID_BLOCK_CLASS = "ce-block--invalid";

  function clearInvalidBlockMarkers(holderId) {
    var holder = document.getElementById(holderId);
    if (!holder) return;
    holder.querySelectorAll("." + INVALID_BLOCK_CLASS).forEach(function (el) {
      el.classList.remove(INVALID_BLOCK_CLASS);
    });
  }

  function markInvalidBlocks(editor, blockIds) {
    blockIds.forEach(function (id) {
      var blockApi = editor.blocks.getById(id);
      if (blockApi && blockApi.holder) blockApi.holder.classList.add(INVALID_BLOCK_CLASS);
    });
  }

  window.addEventListener("beforeunload", function (e) {
    if (!state.hasUnsavedChanges) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // ---------------------------------------------------------------
  // Login gate (Netlify Identity)
  // ---------------------------------------------------------------
  function isAllowedEmail(email) {
    return typeof email === "string" && email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
  }

  function initLoginGate() {
    var loginScreen = document.getElementById("admin-login-screen");
    var dashboard = document.getElementById("admin-dashboard");
    var loginBtn = document.getElementById("admin-login-btn");
    var logoutBtn = document.getElementById("admin-logout-btn");
    var loginError = document.getElementById("admin-login-error");
    var currentUserLabel = document.getElementById("admin-current-user");
    var dashboardBooted = false;

    function showLoginScreen(message) {
      dashboard.hidden = true;
      loginScreen.hidden = false;
      if (loginError) {
        loginError.textContent = message || "";
        loginError.hidden = !message;
      }
    }

    function showDashboard(user) {
      loginScreen.hidden = true;
      dashboard.hidden = false;
      if (currentUserLabel) currentUserLabel.textContent = user.email;
      // Identity's "init"/"login" events can both fire for one real
      // session (e.g. a cached session resolving after page load); only
      // boot the dashboard's data/listeners once.
      if (!dashboardBooted) {
        dashboardBooted = true;
        initDashboard();
      }
    }

    function handleUser(user) {
      if (!user) {
        state.currentUser = null;
        showLoginScreen();
        return;
      }

      if (!isAllowedEmail(user.email)) {
        // Belt: reject client-side immediately with a clear reason. The
        // suspenders (real boundary) is auth.js's identical check on every
        // save Function — this client check is UX only, never trust it
        // as the security control.
        state.currentUser = null;
        window.netlifyIdentity.logout();
        showLoginScreen("Notandinn " + user.email + " hefur ekki aðgang að stjórnborðinu — aðeins @kopskolar.is netföng eru leyfð.");
        return;
      }

      state.currentUser = user;
      showDashboard(user);
    }

    window.netlifyIdentity.on("init", handleUser);
    window.netlifyIdentity.on("login", function (user) {
      handleUser(user);
      window.netlifyIdentity.close();
    });
    window.netlifyIdentity.on("logout", function () {
      // A full reload (rather than resetting in-memory state and letting
      // the dashboard boot again in place) avoids double-attaching every
      // tab's click listeners and leaking Editor.js instances if the same
      // page then logs back in — simpler and safer than tearing all of
      // that down by hand.
      if (dashboardBooted) {
        window.location.reload();
        return;
      }
      showLoginScreen();
    });
    window.netlifyIdentity.on("error", function (err) {
      console.error("Netlify Identity error:", err);
    });

    loginBtn.addEventListener("click", function () {
      window.netlifyIdentity.open("login");
    });
    logoutBtn.addEventListener("click", function () {
      window.netlifyIdentity.logout();
    });

    // Fires the "init" event above with the current user, if any (a
    // previously-logged-in session persisted by the widget) — this is
    // what replaces the old sessionStorage-flag check entirely.
    window.netlifyIdentity.init();
  }

  // ---------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------
  function initTabs() {
    var buttons = document.querySelectorAll(".admin-tab-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-tab");
        buttons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        document.querySelectorAll(".admin-panel").forEach(function (panel) {
          panel.classList.toggle("is-active", panel.id === "panel-" + target);
        });
      });
    });
  }

  // ---------------------------------------------------------------
  // Pages tab
  // ---------------------------------------------------------------
  function hrefToSlug(href) {
    if (href === "/index.html") return "homepage";
    var path = href.replace(/^\//, "").replace(/\.html$/, "");
    var parts = path.split("/");
    if (parts.length === 2 && parts[1] === "index") return parts[0] + "-index";
    return parts.join("-");
  }

  function buildPageOptions() {
    var select = document.getElementById("page-select");
    select.innerHTML = "";

    var homeOpt = document.createElement("option");
    homeOpt.value = "homepage";
    homeOpt.textContent = "Forsíða (heimasíða)";
    select.appendChild(homeOpt);

    window.SiteData.nav.forEach(function (category) {
      if (category.key === "forsida") return;
      var group = document.createElement("optgroup");
      group.label = category.label;

      if (category.href) {
        var catOpt = document.createElement("option");
        catOpt.value = hrefToSlug(category.href);
        catOpt.textContent = category.label + " (yfirlitssíða)";
        group.appendChild(catOpt);
      }

      (category.children || []).forEach(function (child) {
        if (child.external) return;
        var opt = document.createElement("option");
        opt.value = hrefToSlug(child.href);
        opt.textContent = child.label;
        group.appendChild(opt);
      });

      select.appendChild(group);
    });

    select.addEventListener("change", function () {
      if (state.hasUnsavedChanges && !window.confirm("Það eru óvistaðar breytingar. Halda samt áfram?")) {
        select.value = state.currentPageSlug;
        return;
      }
      loadPageIntoEditor(select.value);
    });
  }

  function loadPageIntoEditor(slug) {
    state.currentPageSlug = slug;
    state.pageEditorReady = false;
    setMessage("page-message", "Sæki síðu...", "is-loading");

    var carouselSection = document.getElementById("carousel-manager-section");
    carouselSection.hidden = slug !== "homepage";

    window.AdminApi.getPageData(slug)
      .then(function (data) {
        var content = data.page && data.page.content;
        if (state.pageEditor) {
          state.pageEditor.destroy();
          state.pageEditor = null;
        }
        document.getElementById("editor-holder").innerHTML = "";
        state.pageEditor = window.EditorSetup.createEditor("editor-holder", content, function () {
          if (state.pageEditorReady) markUnsaved();
          clearInvalidBlockMarkers("editor-holder");
        });
        state.pageEditor.isReady.then(function () { state.pageEditorReady = true; });
        setMessage("page-message", "", "");

        if (slug === "homepage") {
          state.siteSettings = data.settings || state.siteSettings;
          loadCarouselManager();
        }
      })
      .catch(function (err) {
        // Don't leave the previous slug's editor instance sitting there
        // bound to this (different) slug — a Save would silently write the
        // old page's content under the new key. Open a blank canvas for
        // this slug instead so the editor stays usable and can't misfire.
        if (state.pageEditor) {
          state.pageEditor.destroy();
          state.pageEditor = null;
        }
        document.getElementById("editor-holder").innerHTML = "";
        state.pageEditor = window.EditorSetup.createEditor("editor-holder", null, function () {
          if (state.pageEditorReady) markUnsaved();
          clearInvalidBlockMarkers("editor-holder");
        });
        state.pageEditor.isReady.then(function () { state.pageEditorReady = true; });
        setMessage("page-message", "Ekki tókst að sækja núverandi efni síðunnar — byrjar á tómum grunni.", "is-error");
      });
  }

  function savePageContent() {
    if (!state.pageEditor || !state.currentPageSlug) return;
    var select = document.getElementById("page-select");
    var title = select.selectedOptions[0] ? select.selectedOptions[0].textContent : state.currentPageSlug;

    setMessage("page-message", "Vista...", "is-loading");
    clearInvalidBlockMarkers("editor-holder");
    var editor = state.pageEditor;
    var blockIdsBeforeSave = [];
    for (var i = 0; i < editor.blocks.getBlocksCount(); i++) {
      blockIdsBeforeSave.push(editor.blocks.getBlockByIndex(i).id);
    }
    editor
      .save()
      .then(function (outputData) {
        // Editor.js's own save() silently drops any block whose tool
        // validate() rejects it (paragraph: truly empty text; imageRow:
        // an image missing its required alt text) — it never rejects or
        // throws for this, so without this check the admin loses that
        // content with zero warning. CLAUDE.md requires explicit
        // success/failure feedback and "no silent saves" — refuse to save
        // and say so instead of persisting a page quietly missing blocks.
        if (outputData.blocks.length < blockIdsBeforeSave.length) {
          var savedIds = outputData.blocks.map(function (b) { return b.id; });
          var invalidIds = blockIdsBeforeSave.filter(function (id) { return savedIds.indexOf(id) === -1; });
          markInvalidBlocks(editor, invalidIds);
          throw new Error(
            (blockIdsBeforeSave.length - outputData.blocks.length) +
            " reit(um) var sleppt við vistun — rauðmerktu reitirnir hér að ofan þurfa lagfæringu (t.d. alt-texta á mynd eða tóman reit)."
          );
        }
        return window.AdminApi.savePage(state.currentPageSlug, title, outputData);
      })
      .then(function () {
        setMessage("page-message", "Vistað!", "is-success");
        clearUnsaved();
      })
      .catch(function (err) {
        setMessage("page-message", "Villa við að vista: " + err.message, "is-error");
      });
  }

  function initPagesTab() {
    buildPageOptions();
    document.getElementById("page-save-btn").addEventListener("click", savePageContent);
    loadPageIntoEditor("homepage");
  }

  // ---------------------------------------------------------------
  // Carousel manager (homepage only)
  // ---------------------------------------------------------------
  var carouselImages = [];

  function renderCarouselManager() {
    var list = document.getElementById("carousel-manager-list");
    list.innerHTML = carouselImages
      .map(function (img, index) {
        return (
          '<div class="carousel-manager-item" data-index="' + index + '">' +
            '<img class="carousel-manager-thumb" src="' + escapeHtml(img.url) + '" alt="">' +
            '<span class="carousel-manager-alt">' + escapeHtml(img.alt || "(engin lýsing)") + "</span>" +
            '<button type="button" class="repeat-row-move" data-move="-1" data-index="' + index + '"' + (index === 0 ? " disabled" : "") + '>↑</button>' +
            '<button type="button" class="repeat-row-move" data-move="1" data-index="' + index + '"' + (index === carouselImages.length - 1 ? " disabled" : "") + '>↓</button>' +
            '<button type="button" class="repeat-row-remove" data-remove="' + index + '" aria-label="Fjarlægja mynd">&times;</button>' +
          "</div>"
        );
      })
      .join("");

    list.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        carouselImages.splice(parseInt(btn.getAttribute("data-remove"), 10), 1);
        markUnsaved();
        renderCarouselManager();
      });
    });
    list.querySelectorAll("[data-move]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var index = parseInt(btn.getAttribute("data-index"), 10);
        var dir = parseInt(btn.getAttribute("data-move"), 10);
        var target = index + dir;
        if (target < 0 || target >= carouselImages.length) return;
        var tmp = carouselImages[index];
        carouselImages[index] = carouselImages[target];
        carouselImages[target] = tmp;
        markUnsaved();
        renderCarouselManager();
      });
    });
  }

  function loadCarouselManager() {
    carouselImages = (state.siteSettings && state.siteSettings.carouselImages) || [];
    renderCarouselManager();
  }

  function initCarouselManager() {
    document.getElementById("carousel-manager-add-btn").addEventListener("click", function () {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", async function () {
        var file = input.files && input.files[0];
        if (!file) return;
        setMessage("carousel-manager-message", "Þjappa og hleð upp mynd...", "is-loading");
        try {
          var compressed = await window.ImageCompress.compressImage(file);
          var result = await window.AdminApi.uploadImage(compressed.base64);
          var alt = window.prompt("Alt-texti fyrir myndina (skylda):", "") || "";
          carouselImages.push({ url: result.url, alt: alt });
          markUnsaved();
          renderCarouselManager();
          setMessage("carousel-manager-message", "Mynd bætt við — mundu að vista.", "is-success");
        } catch (err) {
          setMessage("carousel-manager-message", "Villa: " + err.message, "is-error");
        }
      });
      input.click();
    });

    document.getElementById("carousel-manager-save-btn").addEventListener("click", function () {
      if (!state.siteSettings) return;
      var merged = Object.assign({}, state.siteSettings, { carouselImages: carouselImages });
      setMessage("carousel-manager-message", "Vista...", "is-loading");
      window.AdminApi.saveSiteSettings(merged)
        .then(function (result) {
          state.siteSettings = result.settings;
          setMessage("carousel-manager-message", "Myndaruna vistuð!", "is-success");
          clearUnsaved();
        })
        .catch(function (err) {
          setMessage("carousel-manager-message", "Villa við að vista: " + err.message, "is-error");
        });
    });
  }

  // ---------------------------------------------------------------
  // News tab
  // ---------------------------------------------------------------
  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[áàâä]/g, "a").replace(/[éèêë]/g, "e").replace(/[íìîï]/g, "i")
      .replace(/[óòôö]/g, "o").replace(/[úùûü]/g, "u").replace(/ý/g, "y")
      .replace(/þ/g, "th").replace(/ð/g, "d").replace(/æ/g, "ae")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // ---------------------------------------------------------------
  // News cover image (optional, single image — same {url, alt} shape and
  // compress/upload pipeline as the carousel manager and Image Row tool).
  // ---------------------------------------------------------------
  var newsCoverImage = null; // null, or {url, alt}
  // Tracks whether the form holds a real, already-saved entry (delete-news.js
  // has something to delete) vs. a brand-new one being drafted — set true by
  // loadNewsItem() and by a successful save, set back to false by
  // resetNewsForm(). Drives whether #news-delete-btn is shown at all.
  var newsIsExisting = false;

  function setNewsEditorContent(content) {
    if (state.newsEditor) state.newsEditor.destroy();
    state.newsEditorReady = false;
    document.getElementById("news-editor-holder").innerHTML = "";
    state.newsEditor = window.EditorSetup.createEditor("news-editor-holder", content, function () {
      if (state.newsEditorReady) markUnsaved();
      clearInvalidBlockMarkers("news-editor-holder");
    });
    state.newsEditor.isReady.then(function () { state.newsEditorReady = true; });
  }

  function updateNewsDeleteButtonVisibility() {
    var btn = document.getElementById("news-delete-btn");
    if (btn) btn.hidden = !newsIsExisting;
  }

  function resetNewsForm() {
    document.getElementById("news-id").value = "";
    document.getElementById("news-title").value = "";
    document.getElementById("news-date").value = "";
    newsCoverImage = null;
    renderNewsCoverManager();
    setNewsEditorContent(null);
    newsIsExisting = false;
    updateNewsDeleteButtonVisibility();
  }

  function deleteNewsEntry() {
    var id = document.getElementById("news-id").value.trim();
    if (!id) return;
    var title = document.getElementById("news-title").value.trim() || id;
    if (!window.confirm("Eyða fréttinni \"" + title + "\"? Þessa aðgerð er ekki hægt að afturkalla.")) {
      return;
    }
    setMessage("news-message", "Eyði...", "is-loading");
    window.AdminApi.deleteNews(id)
      .then(function () {
        setMessage("news-message", "Frétt eydd.", "is-success");
        clearUnsaved();
        resetNewsForm();
        loadRecentNews();
      })
      .catch(function (err) {
        setMessage("news-message", "Villa við að eyða frétt: " + err.message, "is-error");
      });
  }

  function renderNewsCoverManager() {
    var wrap = document.getElementById("news-cover-manager");
    var addBtn = document.getElementById("news-cover-add-btn");
    if (!newsCoverImage) {
      wrap.innerHTML = "";
      addBtn.hidden = false;
      return;
    }
    addBtn.hidden = true;
    wrap.innerHTML =
      '<div class="repeat-row">' +
        '<img class="carousel-manager-thumb" src="' + escapeHtml(newsCoverImage.url) + '" alt="">' +
        '<input type="text" id="news-cover-alt-input" placeholder="Alt-texti (skylda)" value="' + escapeHtml(newsCoverImage.alt || "") + '">' +
        '<button type="button" class="repeat-row-remove" id="news-cover-remove-btn" aria-label="Fjarlægja mynd">&times;</button>' +
      "</div>";
    document.getElementById("news-cover-alt-input").addEventListener("input", function () {
      newsCoverImage.alt = this.value;
      markUnsaved();
    });
    document.getElementById("news-cover-remove-btn").addEventListener("click", function () {
      newsCoverImage = null;
      markUnsaved();
      renderNewsCoverManager();
    });
  }

  function initNewsCoverManager() {
    document.getElementById("news-cover-add-btn").addEventListener("click", function () {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", async function () {
        var file = input.files && input.files[0];
        if (!file) return;
        setMessage("news-cover-message", "Þjappa og hleð upp mynd...", "is-loading");
        try {
          var compressed = await window.ImageCompress.compressImage(file);
          var result = await window.AdminApi.uploadImage(compressed.base64);
          newsCoverImage = { url: result.url, alt: "" };
          markUnsaved();
          renderNewsCoverManager();
          setMessage("news-cover-message", "Mynd bætt við — settu inn alt-texta og vistaðu fréttina.", "is-success");
        } catch (err) {
          setMessage("news-cover-message", "Villa: " + err.message, "is-error");
        }
      });
      input.click();
    });
  }

  function loadNewsItem(id) {
    window.AdminApi.getNewsItem(id)
      .then(function (data) {
        var item = data.news;
        document.getElementById("news-id").value = item.id;
        document.getElementById("news-title").value = item.title;
        document.getElementById("news-date").value = item.date;
        newsCoverImage = item.coverImage ? { url: item.coverImage.url, alt: item.coverImage.alt || "" } : null;
        renderNewsCoverManager();
        setNewsEditorContent(item.content);
        newsIsExisting = true;
        updateNewsDeleteButtonVisibility();
        setMessage("news-message", "Frétt hlaðin inn.", "is-success");
      })
      .catch(function (err) {
        setMessage("news-message", "Fréttin fannst ekki: " + err.message, "is-error");
      });
  }

  function renderRecentNews(items) {
    var list = document.getElementById("news-recent-list");
    items = items || [];
    if (!items.length) {
      list.innerHTML = '<p class="editor-empty-hint">Engar fréttir skráðar enn — bættu við fyrstu fréttinni hér til hliðar.</p>';
      return;
    }
    list.innerHTML = items
      .map(function (item) {
        return (
          '<button type="button" class="secondary-button" data-news-id="' + escapeHtml(item.id) + '" style="margin:4px 6px 0 0">' +
            escapeHtml(item.title) +
          "</button>"
        );
      })
      .join("");
    list.querySelectorAll("[data-news-id]").forEach(function (btn) {
      btn.addEventListener("click", function () { loadNewsItem(btn.getAttribute("data-news-id")); });
    });
  }

  function loadRecentNews() {
    window.AdminApi.listNews()
      .then(function (data) { renderRecentNews(data.items || []); })
      .catch(function () {
        // list-news.js itself always answers 200 with an empty list on a
        // read failure now, so this only catches a network-level failure
        // (offline, DNS, etc.) — treat it the same as "no news yet" rather
        // than a scary error; the news form above is unaffected either way.
        renderRecentNews([]);
      });
  }

  function saveNewsEntry() {
    var id = document.getElementById("news-id").value.trim();
    var title = document.getElementById("news-title").value.trim();
    var date = document.getElementById("news-date").value;

    if (!id || !title || !date) {
      setMessage("news-message", "Auðkenni, titill og dagsetning eru öll nauðsynleg.", "is-error");
      return;
    }
    if (!state.newsEditor) return;

    if (newsCoverImage && !newsCoverImage.alt.trim()) {
      setMessage("news-message", "Forsíðumynd þarf alt-texta áður en fréttin er vistuð.", "is-error");
      var altInput = document.getElementById("news-cover-alt-input");
      if (altInput) altInput.focus();
      return;
    }

    setMessage("news-message", "Vista...", "is-loading");
    clearInvalidBlockMarkers("news-editor-holder");
    var editor = state.newsEditor;
    var blockIdsBeforeSave = [];
    for (var i = 0; i < editor.blocks.getBlocksCount(); i++) {
      blockIdsBeforeSave.push(editor.blocks.getBlockByIndex(i).id);
    }
    editor
      .save()
      .then(function (outputData) {
        // Same silent-drop guard as savePageContent() — see its comment.
        if (outputData.blocks.length < blockIdsBeforeSave.length) {
          var savedIds = outputData.blocks.map(function (b) { return b.id; });
          var invalidIds = blockIdsBeforeSave.filter(function (id) { return savedIds.indexOf(id) === -1; });
          markInvalidBlocks(editor, invalidIds);
          throw new Error(
            (blockIdsBeforeSave.length - outputData.blocks.length) +
            " reit(um) var sleppt við vistun — rauðmerktu reitirnir hér að ofan þurfa lagfæringu (t.d. alt-texta á mynd eða tóman reit)."
          );
        }
        return window.AdminApi.saveNews(id, title, date, outputData, newsCoverImage);
      })
      .then(function () {
        setMessage("news-message", "Frétt vistuð!", "is-success");
        clearUnsaved();
        newsIsExisting = true; // a save always leaves behind a real, deletable entry
        updateNewsDeleteButtonVisibility();
        loadRecentNews(); // refresh the browse list — order/content may have changed
      })
      .catch(function (err) {
        setMessage("news-message", "Villa við að vista frétt: " + err.message, "is-error");
      });
  }

  function initNewsTab() {
    loadRecentNews();
    renderNewsCoverManager();
    initNewsCoverManager();

    setNewsEditorContent(null);
    newsIsExisting = false;
    updateNewsDeleteButtonVisibility();

    document.getElementById("news-title").addEventListener("blur", function () {
      var idField = document.getElementById("news-id");
      if (!idField.value) idField.value = slugify(this.value);
    });

    document.getElementById("news-load-btn").addEventListener("click", function () {
      var id = document.getElementById("news-lookup-id").value.trim();
      if (id) loadNewsItem(id);
    });

    document.getElementById("news-save-btn").addEventListener("click", saveNewsEntry);
    document.getElementById("news-delete-btn").addEventListener("click", deleteNewsEntry);
  }

  // ---------------------------------------------------------------
  // Banner tab
  // ---------------------------------------------------------------
  function initBannerTab(banner) {
    banner = banner || {};
    document.getElementById("banner-active").checked = Boolean(banner.active);
    document.getElementById("banner-text").value = banner.bannerText || "";
    document.getElementById("banner-image-url").value = banner.imageURL || "";

    ["banner-active", "banner-text", "banner-image-url"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", markUnsaved);
      document.getElementById(id).addEventListener("change", markUnsaved);
    });

    document.getElementById("banner-save-btn").addEventListener("click", function () {
      var payload = {
        active: document.getElementById("banner-active").checked,
        bannerText: document.getElementById("banner-text").value,
        imageURL: document.getElementById("banner-image-url").value || null
      };
      setMessage("banner-message", "Vista...", "is-loading");
      window.AdminApi.saveBanner(payload)
        .then(function () {
          setMessage("banner-message", "Borði vistaður!", "is-success");
          clearUnsaved();
        })
        .catch(function (err) {
          setMessage("banner-message", "Villa við að vista borða: " + err.message, "is-error");
        });
    });
  }

  // ---------------------------------------------------------------
  // Site Info tab
  // ---------------------------------------------------------------
  function deriveTel(number) {
    var digits = String(number || "").replace(/[^0-9]/g, "");
    return digits ? "+354" + digits : "";
  }

  function renderPhoneRows() {
    var wrap = document.getElementById("phone-rows");
    wrap.innerHTML = state.phoneRows
      .map(function (row, index) {
        return (
          '<div class="repeat-row" data-index="' + index + '">' +
            '<input type="text" placeholder="Heiti (t.d. Skrifstofa)" value="' + escapeHtml(row.label) + '" data-field="label">' +
            '<input type="text" placeholder="Símanúmer (t.d. 441-7000)" value="' + escapeHtml(row.number) + '" data-field="number">' +
            '<button type="button" class="repeat-row-remove" aria-label="Fjarlægja">&times;</button>' +
          "</div>"
        );
      })
      .join("");

    wrap.querySelectorAll(".repeat-row").forEach(function (rowEl) {
      var index = parseInt(rowEl.getAttribute("data-index"), 10);
      rowEl.querySelectorAll("[data-field]").forEach(function (input) {
        input.addEventListener("input", function () {
          state.phoneRows[index][input.getAttribute("data-field")] = input.value;
          markUnsaved();
        });
      });
      rowEl.querySelector(".repeat-row-remove").addEventListener("click", function () {
        state.phoneRows.splice(index, 1);
        markUnsaved();
        renderPhoneRows();
      });
    });
  }

  function renderHoursRows() {
    var wrap = document.getElementById("hours-rows");
    wrap.innerHTML = state.hoursRows
      .map(function (row, index) {
        return (
          '<div class="repeat-row" data-index="' + index + '">' +
            '<input type="text" placeholder="Dagar (t.d. Mán – Fim)" value="' + escapeHtml(row.days) + '" data-field="days">' +
            '<input type="text" placeholder="Tími (t.d. 08:00–15:30)" value="' + escapeHtml(row.hours) + '" data-field="hours">' +
            '<button type="button" class="repeat-row-remove" aria-label="Fjarlægja">&times;</button>' +
          "</div>"
        );
      })
      .join("");

    wrap.querySelectorAll(".repeat-row").forEach(function (rowEl) {
      var index = parseInt(rowEl.getAttribute("data-index"), 10);
      rowEl.querySelectorAll("[data-field]").forEach(function (input) {
        input.addEventListener("input", function () {
          state.hoursRows[index][input.getAttribute("data-field")] = input.value;
          markUnsaved();
        });
      });
      rowEl.querySelector(".repeat-row-remove").addEventListener("click", function () {
        state.hoursRows.splice(index, 1);
        markUnsaved();
        renderHoursRows();
      });
    });
  }

  function renderQuickLinkRows() {
    var wrap = document.getElementById("quicklink-rows");
    wrap.innerHTML = state.quickLinkItems
      .map(function (row, index) {
        var options = QUICK_LINK_ICON_IDS
          .map(function (id) {
            return '<option value="' + id + '"' + (id === row.icon ? " selected" : "") + ">" + id + "</option>";
          })
          .join("");
        return (
          '<div class="repeat-row" data-index="' + index + '">' +
            '<select data-field="icon">' + options + "</select>" +
            '<input type="text" placeholder="Heiti" value="' + escapeHtml(row.label) + '" data-field="label">' +
            '<input type="url" placeholder="https://..." value="' + escapeHtml(row.url) + '" data-field="url">' +
            '<button type="button" class="repeat-row-remove" aria-label="Fjarlægja">&times;</button>' +
          "</div>"
        );
      })
      .join("");

    wrap.querySelectorAll(".repeat-row").forEach(function (rowEl) {
      var index = parseInt(rowEl.getAttribute("data-index"), 10);
      rowEl.querySelectorAll("[data-field]").forEach(function (input) {
        input.addEventListener("input", function () {
          state.quickLinkItems[index][input.getAttribute("data-field")] = input.value;
          markUnsaved();
        });
        input.addEventListener("change", function () {
          state.quickLinkItems[index][input.getAttribute("data-field")] = input.value;
          markUnsaved();
        });
      });
      rowEl.querySelector(".repeat-row-remove").addEventListener("click", function () {
        state.quickLinkItems.splice(index, 1);
        markUnsaved();
        renderQuickLinkRows();
      });
    });
  }

  function populateSiteInfoForm(settings) {
    document.getElementById("principal-name").value = settings.principalName || "";
    document.getElementById("principal-email").value = settings.principalEmail || "";
    document.getElementById("office-email").value = settings.officeEmail || "";
    document.getElementById("address-text").value = (settings.address && settings.address.text) || "";
    document.getElementById("address-map-url").value = (settings.address && settings.address.mapUrl) || "";

    state.phoneRows = (settings.phoneNumbers || []).map(function (p) { return { label: p.label, number: p.number }; });
    state.hoursRows = (settings.officeHours || []).map(function (h) { return { days: h.days, hours: h.hours }; });
    state.quickLinkItems = ((settings.quickLinks && settings.quickLinks.items) || []).map(function (q) {
      return { icon: q.icon, label: q.label, url: q.url };
    });
    document.getElementById("quicklinks-enabled").checked = Boolean(settings.quickLinks && settings.quickLinks.enabled);

    renderPhoneRows();
    renderHoursRows();
    renderQuickLinkRows();
  }

  function saveSiteInfo() {
    if (!state.siteSettings) return;

    var merged = Object.assign({}, state.siteSettings, {
      principalName: document.getElementById("principal-name").value,
      principalEmail: document.getElementById("principal-email").value,
      officeEmail: document.getElementById("office-email").value,
      address: {
        text: document.getElementById("address-text").value,
        mapUrl: document.getElementById("address-map-url").value
      },
      phoneNumbers: state.phoneRows.map(function (p) {
        return { label: p.label, number: p.number, tel: deriveTel(p.number) };
      }),
      officeHours: state.hoursRows.slice(),
      quickLinks: {
        enabled: document.getElementById("quicklinks-enabled").checked,
        items: state.quickLinkItems.slice()
      }
    });

    setMessage("site-info-message", "Vista...", "is-loading");
    window.AdminApi.saveSiteSettings(merged)
      .then(function (result) {
        state.siteSettings = result.settings;
        setMessage("site-info-message", "Vistað!", "is-success");
        clearUnsaved();
      })
      .catch(function (err) {
        setMessage("site-info-message", "Villa við að vista: " + err.message, "is-error");
      });
  }

  function initSiteInfoTab() {
    // state.siteSettings is already populated by initDashboard's single
    // shared fetch (or its fallback) before this runs — no fetch here.
    populateSiteInfoForm(state.siteSettings);

    ["principal-name", "principal-email", "office-email", "address-text", "address-map-url", "quicklinks-enabled"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", markUnsaved);
      document.getElementById(id).addEventListener("change", markUnsaved);
    });

    document.getElementById("phone-add-btn").addEventListener("click", function () {
      state.phoneRows.push({ label: "", number: "" });
      markUnsaved();
      renderPhoneRows();
    });
    document.getElementById("hours-add-btn").addEventListener("click", function () {
      state.hoursRows.push({ days: "", hours: "" });
      markUnsaved();
      renderHoursRows();
    });
    document.getElementById("quicklink-add-btn").addEventListener("click", function () {
      state.quickLinkItems.push({ icon: "link", label: "", url: "" });
      markUnsaved();
      renderQuickLinkRows();
    });

    document.getElementById("site-info-save-btn").addEventListener("click", saveSiteInfo);
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function initDashboard() {
    initTabs();
    // initPagesTab does its own get-page-data fetch for the default
    // "homepage" selection (page content differs per slug, so it always
    // needs a fresh fetch on every dropdown change anyway). initNewsTab
    // has its own independent fetch too (list-news.js, a different
    // endpoint entirely). The one get-page-data fetch here is shared by
    // Banner + Site Info, which only need the singleton settings/banner
    // data — avoids a second redundant hit to the same endpoint at boot.
    initPagesTab();
    initCarouselManager();
    initNewsTab();

    window.AdminApi.getPageData("homepage")
      .then(function (data) {
        state.siteSettings = data.settings || window.SiteData.settings;
        initBannerTab(data.banner || {});
        initSiteInfoTab();
      })
      .catch(function () {
        state.siteSettings = window.SiteData.settings;
        initBannerTab({});
        initSiteInfoTab();
        setMessage("site-info-message", "Ekki tókst að sækja núverandi gögn — sýni sjálfgefin gildi.", "is-error");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLoginGate);
  } else {
    initLoginGate();
  }
})();
