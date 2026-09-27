/**
 * render-content.js
 * Public-facing JSON-to-HTML renderer for Editor.js output. Converts each
 * recognized block type to an HTML string, then sanitizes the assembled
 * string with the locally vendored DOMPurify (js/vendor/dompurify.min.js —
 * downloaded from cdnjs, not CDN-linked at runtime, same vendoring pattern
 * CLAUDE.md specifies for Editor.js itself) before injecting it into the
 * page. The Editor.js library/editor never ships here — only this small
 * renderer does (CLAUDE.md: "public pages load a small JSON-to-HTML
 * renderer only").
 */
(function (global) {
  "use strict";

  // Embed block domain allowlist (CLAUDE.md "Embed & Add Link blocks") —
  // checked here, in trusted renderer code, never trusted from the block's
  // own data.
  var EMBED_ALLOWED_DOMAINS = ["canva.com", "docs.google.com", "drive.google.com"];

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function isAllowedEmbedUrl(url) {
    try {
      var host = new URL(url).hostname.replace(/^www\./, "");
      return EMBED_ALLOWED_DOMAINS.some(function (domain) {
        return host === domain || host.slice(-(domain.length + 1)) === "." + domain;
      });
    } catch (e) {
      return false;
    }
  }

  function renderParagraph(block) {
    // Editor.js's inline toolbar (Bold, Link) produces a small, known set
    // of inline HTML inside `text` — DOMPurify (run on the fully assembled
    // string in sanitize()) is what actually enforces safety, not this
    // function.
    return block.data.text ? "<p>" + block.data.text + "</p>" : "";
  }

  function renderHeader(block) {
    var level = Math.min(Math.max(parseInt(block.data.level, 10) || 2, 2), 4);
    return block.data.text ? "<h" + level + ">" + block.data.text + "</h" + level + ">" : "";
  }

  function renderList(block) {
    var tag = block.data.style === "ordered" ? "ol" : "ul";
    var items = (block.data.items || [])
      .map(function (item) {
        var text = typeof item === "string" ? item : (item && item.content) || "";
        return text ? "<li>" + text + "</li>" : "";
      })
      .join("");
    return items ? "<" + tag + ">" + items + "</" + tag + ">" : "";
  }

  function renderImageRow(block) {
    var images = (block.data && block.data.images) || [];
    var figures = images
      .map(function (img) {
        if (!img || !img.url) return "";
        // Required alt text is stored as regular content on the block
        // itself (CLAUDE.md Images) — read straight from img.alt, never
        // from Blob metadata.
        return (
          '<figure class="content-image"><img src="' + escapeHtml(img.url) + '" alt="' + escapeHtml(img.alt) + '" loading="lazy"></figure>'
        );
      })
      .join("");
    return figures ? '<div class="content-image-row">' + figures + "</div>" : "";
  }

  // Layout Grid (admin/vendor/editorjs/tools/layout-grid-tool.js) — the
  // same text+image side-by-side layout the homepage's hardcoded intro
  // section uses, as a reusable block on any page. Text cells are plain
  // strings from a <textarea> (not Editor.js inline HTML like paragraph's
  // text), so they're escaped here rather than injected raw.
  function renderLayoutGridCell(cell) {
    if (!cell) return "";
    if (cell.type === "image") {
      if (!cell.url) return "";
      return (
        '<div class="layout-grid-cell-image"><img src="' + escapeHtml(cell.url) + '" alt="' + escapeHtml(cell.alt) + '" loading="lazy"></div>'
      );
    }
    if (!cell.text) return "";
    return '<div class="layout-grid-cell-text"><p>' + escapeHtml(cell.text).replace(/\n/g, "<br>") + "</p></div>";
  }

  function renderLayoutGrid(block) {
    var data = block.data || {};
    var columns = Math.min(Math.max(parseInt(data.columns, 10) || 1, 1), 2);
    var cellsHtml = (data.cells || []).map(renderLayoutGridCell).join("");
    if (!cellsHtml) return "";
    return '<div class="content-layout-grid" style="--layout-grid-columns:' + columns + '">' + cellsHtml + "</div>";
  }

  function renderEmbed(block) {
    var url = block.data && block.data.url;
    if (!url || !isAllowedEmbedUrl(url)) {
      // Missing or off-allowlist domain — render nothing rather than an
      // iframe pointed at an unapproved source.
      return "";
    }
    return (
      '<div class="content-embed"><iframe src="' + escapeHtml(url) + '" loading="lazy" allowfullscreen ' +
      'referrerpolicy="no-referrer-when-downgrade"></iframe></div>'
    );
  }

  function renderAddLinkCard(block) {
    var data = block.data || {};
    if (!data.url || !data.label) return "";
    // Linked Resources use their own 10-icon set (js/resource-icons.js),
    // distinct from Quick Links' icon set (js/icons.js) — different module,
    // different purpose.
    var svg = global.ResourceIcons ? global.ResourceIcons.get(data.icon) : "";
    return (
      '<a class="resource-card" href="' + escapeHtml(data.url) + '" target="_blank" rel="noopener">' +
        '<span class="resource-icon" aria-hidden="true">' + svg + "</span>" +
        '<span class="resource-label">' + escapeHtml(data.label) + "</span>" +
      "</a>"
    );
  }

  var BLOCK_RENDERERS = {
    paragraph: renderParagraph,
    header: renderHeader,
    list: renderList,
    imageRow: renderImageRow,
    layoutGrid: renderLayoutGrid,
    embed: renderEmbed
    // Note: "addLink" is handled separately in renderBlocks — it's grouped
    // into one resources section rather than rendered inline.
  };

  function blockToHtml(block) {
    if (!block || !block.type) return "";
    var renderer = BLOCK_RENDERERS[block.type];
    if (!renderer) return ""; // unknown/future block type — skip, don't throw
    try {
      return renderer(block) || "";
    } catch (err) {
      console.error("render-content: failed to render block type '" + block.type + "':", err);
      return "";
    }
  }

  // Add Link blocks (CLAUDE.md "Linked Resources") render outside the
  // normal reading flow, grouped into one "Tengd skjöl" section at the
  // end — matching the static .linked-resources markup already used on
  // the hand-authored pages from Phase 3.
  function renderBlocks(blocks) {
    var html = "";
    var resourceCards = "";

    blocks.forEach(function (block) {
      if (block && block.type === "addLink") {
        resourceCards += renderAddLinkCard(block);
      } else {
        html += blockToHtml(block);
      }
    });

    if (resourceCards) {
      html += "<h2>Tengd skjöl</h2><div class=\"linked-resources\">" + resourceCards + "</div>";
    }

    return html;
  }

  function sanitize(html) {
    if (!global.DOMPurify) {
      console.error("render-content: DOMPurify is not loaded — refusing to inject unsanitized HTML.");
      return "";
    }
    return global.DOMPurify.sanitize(html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allowfullscreen", "loading", "referrerpolicy"]
    });
  }

  /**
   * Renders Editor.js content into `container`. Returns true if it rendered
   * real content, false if there was nothing to render — callers should
   * leave the container's existing hand-authored placeholder markup alone
   * in that case (that's the "not seeded yet" state, not an error).
   */
  function renderContentInto(container, editorJsContent) {
    if (!container || !editorJsContent || !Array.isArray(editorJsContent.blocks) || !editorJsContent.blocks.length) {
      return false;
    }
    var rawHtml = renderBlocks(editorJsContent.blocks);
    if (!rawHtml) return false;
    container.innerHTML = sanitize(rawHtml);
    return true;
  }

  global.RenderContent = { renderContentInto: renderContentInto };
})(window);
