/**
 * editor-setup.js
 * Builds an Editor.js instance with this project's tool set (CLAUDE.md:
 * "Core + official plugins (Header, List, Bold, Link) + custom plugins
 * (image-row layout, Embed, Add Link, Layout Grid)"). Bold and Link are
 * Editor.js core's built-in inline tools — no separate package needed for
 * those, only Header/List are separate vendored bundles. One factory
 * function so every place that needs an editor (page body, news body)
 * configures it identically. Block type keys here ("header", "list",
 * "imageRow", "embed", "addLink", "layoutGrid") must match what
 * js/render-content.js and netlify/functions/utils/content-to-text.js
 * switch on — don't rename without updating both.
 */
(function (global) {
  "use strict";

  function createEditor(holderId, initialContent, onChange) {
    var hasContent = initialContent && Array.isArray(initialContent.blocks) && initialContent.blocks.length;

    return new EditorJS({
      holder: holderId,
      autofocus: false,
      placeholder: "Skrifaðu efni hér...",
      data: hasContent ? initialContent : { blocks: [] },
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
          config: { levels: [2, 3, 4], defaultLevel: 2 }
        },
        list: {
          class: EditorjsList,
          inlineToolbar: true
        },
        imageRow: window.ImageRowTool,
        embed: window.EmbedTool,
        addLink: window.AddLinkTool,
        layoutGrid: window.LayoutGridTool
      },
      onChange: onChange || function () {}
    });
  }

  global.EditorSetup = { createEditor: createEditor };
})(window);
