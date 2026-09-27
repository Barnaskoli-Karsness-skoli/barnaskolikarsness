/**
 * add-link-tool.js
 * Custom Editor.js block for Linked Resources (CLAUDE.md Section 15 —
 * { icon, label, url } cards for PDFs/docs/videos, since the site hosts no
 * files directly). Icon picker reads the same 10-icon set
 * js/resource-icons.js exposes to the public renderer, so admin and public
 * rendering always agree on what each icon id looks like. Not an npm
 * package — authored locally, vendored here per the local-vendoring rule.
 */
class AddLinkTool {
  static get toolbox() {
    return {
      title: "Tengill (Add Link)",
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.6 4.9a3.5 3.5 0 0 1 5 5L15.9 11.6"/><path d="M13 17.5 11.4 19.1a3.5 3.5 0 0 1-5-5L8.1 12.4"/></svg>'
    };
  }

  static get ICON_IDS() {
    return ["pdf", "document", "presentation", "video", "youtube", "facebook", "calendar", "event", "photo", "link"];
  }

  constructor({ data }) {
    this.data = {
      icon: (data && data.icon) || "link",
      label: (data && data.label) || "",
      url: (data && data.url) || ""
    };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "add-link-tool";

    const iconGrid = document.createElement("div");
    iconGrid.className = "add-link-icon-grid";

    AddLinkTool.ICON_IDS.forEach((id) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "add-link-icon-btn" + (id === this.data.icon ? " is-selected" : "");
      btn.innerHTML = window.ResourceIcons ? window.ResourceIcons.get(id) : "";
      btn.title = id;
      btn.addEventListener("click", () => {
        this.data.icon = id;
        iconGrid.querySelectorAll(".add-link-icon-btn").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });
      iconGrid.appendChild(btn);
    });
    this.wrapper.appendChild(iconGrid);

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.placeholder = 'Heiti hlekks (t.d. "Reglur (PDF)")';
    labelInput.value = this.data.label;
    labelInput.addEventListener("input", () => { this.data.label = labelInput.value; });
    this.wrapper.appendChild(labelInput);

    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.placeholder = "https://...";
    urlInput.value = this.data.url;
    urlInput.addEventListener("input", () => { this.data.url = urlInput.value; });
    this.wrapper.appendChild(urlInput);

    return this.wrapper;
  }

  save() {
    return { icon: this.data.icon, label: this.data.label, url: this.data.url };
  }

  validate(savedData) {
    return Boolean(savedData.label && savedData.url);
  }
}

window.AddLinkTool = AddLinkTool;
