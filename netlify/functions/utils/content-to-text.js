/**
 * content-to-text.js
 * Converts an Editor.js output object into plain text. One shared utility
 * used by both the search-snippet generator and the Google Sheets backup
 * (CLAUDE.md: "via one shared JSON→plain-text utility, also used for
 * search snippets"). Deliberately forgiving of unknown/future block
 * types — an unrecognized block is skipped rather than throwing, since
 * Editor.js's final plugin set (Phase 7) isn't built yet.
 */
function stripInlineMarkup(text) {
  return String(text || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function listItemText(item) {
  if (typeof item === "string") return stripInlineMarkup(item);
  return stripInlineMarkup(item && item.content);
}

function blockToText(block) {
  if (!block || !block.data) return "";

  switch (block.type) {
    case "header":
    case "paragraph":
      return stripInlineMarkup(block.data.text);

    case "list":
      return (block.data.items || []).map((item) => "• " + listItemText(item)).join("\n");

    // Custom blocks from CLAUDE.md's "Embed & Add Link blocks" — structured
    // data only, never raw HTML, per the spec.
    case "addLink":
      return [block.data.label, block.data.url].filter(Boolean).join(" — ");
    case "embed":
      return block.data.url ? `[Innfelling: ${block.data.url}]` : "";

    // Image-row layout tool — no alt text lives on the block itself in the
    // Editor.js output today, so this stays a placeholder marker.
    case "imageRow":
    case "image":
      return "[Mynd]";

    // Layout Grid tool — pull each text cell's own text; image cells fall
    // back to the same "[Mynd]" placeholder as imageRow above.
    case "layoutGrid":
      return (block.data.cells || [])
        .map((cell) => (cell && cell.type === "image" ? "[Mynd]" : stripInlineMarkup(cell && cell.text)))
        .filter(Boolean)
        .join("\n");

    default:
      return "";
  }
}

function contentToPlainText(editorJsOutput) {
  if (!editorJsOutput || !Array.isArray(editorJsOutput.blocks)) return "";
  return editorJsOutput.blocks.map(blockToText).filter(Boolean).join("\n\n");
}

function contentToExcerpt(editorJsOutput, maxLength) {
  const limit = maxLength || 160;
  const text = contentToPlainText(editorJsOutput).replace(/\n+/g, " ");
  return text.length > limit ? text.slice(0, limit).trim() + "…" : text;
}

module.exports = { contentToPlainText, contentToExcerpt };
