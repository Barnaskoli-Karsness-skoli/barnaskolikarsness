/**
 * layout-grid-tool.js
 * Custom Editor.js block for laying out text and images side by side
 * within any page's content — a reusable version of the layout the
 * homepage's hardcoded intro section already uses (text left, photo
 * right), available on any page instead of just the homepage. Not an npm
 * package — authored locally, vendored here per the local-vendoring rule,
 * same as image-row/embed/add-link.
 *
 * Deliberately small/capped (1–2 columns, 2–3 rows) — this is a layout
 * choice, not a spreadsheet-style table. Each cell is either plain text
 * (a plain <textarea>, not a nested Editor.js instance — Editor.js
 * doesn't support real nested editors well, same reasoning as
 * image-row-tool's plain alt-text <input>) or a single image, reusing the
 * exact same compression + upload + required-alt-text pipeline as
 * image-row-tool.js (window.ImageCompress / window.AdminApi).
 *
 * Output shape matches js/render-content.js's renderLayoutGrid():
 * { columns, rows, cells: [{type:"text", text} | {type:"image", url, alt}, ...] }
 * (cells in row-major order, length always columns*rows).
 */
class LayoutGridTool {
  static get toolbox() {
    return {
      title: "Efni í dálkum (Layout Grid)",
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>'
    };
  }

  static get MIN_COLUMNS() { return 1; }
  static get MAX_COLUMNS() { return 2; }
  static get MIN_ROWS() { return 2; }
  static get MAX_ROWS() { return 3; }

  constructor({ data }) {
    this.data = {
      columns: this._clamp(data && data.columns, LayoutGridTool.MIN_COLUMNS, LayoutGridTool.MAX_COLUMNS, 2),
      rows: this._clamp(data && data.rows, LayoutGridTool.MIN_ROWS, LayoutGridTool.MAX_ROWS, 2),
      cells: (data && Array.isArray(data.cells)) ? data.cells.map((c) => this._normalizeCell(c)) : []
    };
    this._resizeCells();
    this.wrapper = null;
    this.gridEl = null;
  }

  _clamp(value, min, max, fallback) {
    var n = parseInt(value, 10);
    if (isNaN(n)) n = fallback;
    return Math.min(Math.max(n, min), max);
  }

  _normalizeCell(cell) {
    if (cell && cell.type === "image") {
      return { type: "image", url: cell.url || "", alt: cell.alt || "" };
    }
    return { type: "text", text: (cell && cell.text) || "" };
  }

  // Resizing the grid preserves existing cells at indices that still
  // exist (shrinking just drops trailing cells, growing appends blank
  // text cells) rather than resetting everything the admin already typed.
  _resizeCells() {
    var total = this.data.columns * this.data.rows;
    while (this.data.cells.length < total) this.data.cells.push({ type: "text", text: "" });
    this.data.cells.length = total;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "layout-grid-tool";
    this.wrapper.appendChild(this._buildControls());

    this.gridEl = document.createElement("div");
    this.gridEl.className = "layout-grid-editor-grid";
    this.wrapper.appendChild(this.gridEl);

    this._renderCells();

    return this.wrapper;
  }

  _buildControls() {
    var controls = document.createElement("div");
    controls.className = "layout-grid-controls";
    controls.appendChild(this._buildDimensionGroup("Dálkar", "columns", LayoutGridTool.MIN_COLUMNS, LayoutGridTool.MAX_COLUMNS));
    controls.appendChild(this._buildDimensionGroup("Línur", "rows", LayoutGridTool.MIN_ROWS, LayoutGridTool.MAX_ROWS));
    return controls;
  }

  _buildDimensionGroup(labelText, key, min, max) {
    var group = document.createElement("div");
    group.className = "layout-grid-dim-group";

    var label = document.createElement("span");
    label.textContent = labelText + ":";
    group.appendChild(label);

    var options = [];
    for (var n = min; n <= max; n++) options.push(n);

    // .forEach (not a raw for-loop) so each button's click handler closes
    // over its OWN `value` via the callback parameter — a `var` loop
    // counter would be shared/stale by the time these handlers fire.
    options.forEach((value) => {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(value);
      btn.className = "layout-grid-dim-btn" + (this.data[key] === value ? " is-selected" : "");
      btn.addEventListener("click", () => {
        if (this.data[key] === value) return;
        this.data[key] = value;
        this._resizeCells();
        group.querySelectorAll(".layout-grid-dim-btn").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        this._renderCells();
      });
      group.appendChild(btn);
    });

    return group;
  }

  _renderCells() {
    this.gridEl.innerHTML = "";
    this.gridEl.style.setProperty("--layout-grid-columns", this.data.columns);
    this.data.cells.forEach((cell, index) => {
      this.gridEl.appendChild(this._buildCell(cell, index));
    });
  }

  _buildCell(cell, index) {
    var cellEl = document.createElement("div");
    cellEl.className = "layout-grid-cell-editor";

    var toggle = document.createElement("div");
    toggle.className = "layout-grid-cell-type-toggle";
    ["text", "image"].forEach((type) => {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = type === "text" ? "Texti" : "Mynd";
      btn.className = "layout-grid-type-btn" + (cell.type === type ? " is-selected" : "");
      btn.addEventListener("click", () => {
        if (cell.type === type) return;
        this.data.cells[index] = type === "image" ? { type: "image", url: "", alt: "" } : { type: "text", text: "" };
        this._renderCells();
      });
      toggle.appendChild(btn);
    });
    cellEl.appendChild(toggle);

    cellEl.appendChild(cell.type === "image" ? this._buildImageEditor(cell, index) : this._buildTextEditor(cell, index));

    return cellEl;
  }

  _buildTextEditor(cell, index) {
    var textarea = document.createElement("textarea");
    textarea.className = "layout-grid-text-input";
    textarea.placeholder = "Texti fyrir þennan reit...";
    textarea.rows = 4;
    textarea.value = cell.text || "";
    textarea.addEventListener("input", () => {
      this.data.cells[index].text = textarea.value;
    });
    return textarea;
  }

  _buildImageEditor(cell, index) {
    var wrap = document.createElement("div");
    wrap.className = "layout-grid-image-editor";

    if (cell.url) {
      var img = document.createElement("img");
      img.className = "layout-grid-image-thumb";
      img.src = cell.url;
      wrap.appendChild(img);

      var altInput = document.createElement("input");
      altInput.type = "text";
      altInput.placeholder = "Alt-texti (skylda)";
      altInput.value = cell.alt || "";
      altInput.addEventListener("input", () => {
        this.data.cells[index].alt = altInput.value;
      });
      wrap.appendChild(altInput);

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "layout-grid-image-remove";
      removeBtn.setAttribute("aria-label", "Fjarlægja mynd");
      removeBtn.innerHTML = "&times;";
      removeBtn.addEventListener("click", () => {
        this.data.cells[index] = { type: "image", url: "", alt: "" };
        this._renderCells();
      });
      wrap.appendChild(removeBtn);
    } else {
      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "layout-grid-image-add";
      addBtn.textContent = "+ Bæta við mynd";
      addBtn.addEventListener("click", () => this._pickAndUpload(index, wrap));
      wrap.appendChild(addBtn);
    }

    return wrap;
  }

  _pickAndUpload(index, wrap) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", async () => {
      var file = input.files && input.files[0];
      if (!file) return;

      var progress = document.createElement("p");
      progress.className = "layout-grid-image-progress";
      progress.textContent = "Þjappa mynd...";
      wrap.appendChild(progress);

      try {
        if (!window.ImageCompress || !window.AdminApi) {
          throw new Error("Myndaþjöppun er ekki tiltæk á þessari síðu.");
        }
        var compressed = await window.ImageCompress.compressImage(file);
        progress.textContent = "Hleð upp mynd...";
        var result = await window.AdminApi.uploadImage(compressed.base64);
        this.data.cells[index] = { type: "image", url: result.url, alt: "" };
        this._renderCells();
      } catch (err) {
        console.error("LayoutGridTool: upload failed", err);
        progress.textContent = "Villa: " + err.message;
      }
    });
    input.click();
  }

  save() {
    return { columns: this.data.columns, rows: this.data.rows, cells: this.data.cells };
  }

  // Every cell must be filled in — same all-or-nothing strictness as
  // image-row-tool's "every image needs alt text" rule — so a
  // half-finished grid (or one left completely blank) gets flagged by
  // admin.js's invalid-block marker instead of silently saving gaps.
  validate(savedData) {
    var total = (savedData.columns || 0) * (savedData.rows || 0);
    var cells = savedData.cells || [];
    if (!total || cells.length !== total) return false;
    return cells.every((cell) => {
      if (!cell) return false;
      if (cell.type === "image") return Boolean(cell.url && cell.alt && cell.alt.trim());
      return Boolean(cell.text && cell.text.trim());
    });
  }
}

window.LayoutGridTool = LayoutGridTool;
