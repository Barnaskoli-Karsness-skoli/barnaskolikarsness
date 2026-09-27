/**
 * embed-tool.js
 * Custom Editor.js block (CLAUDE.md "Embed & Add Link blocks" — Embed
 * stores only { url }, never raw HTML/iframe markup). The domain
 * allowlist check here is UX only — it stops an editor from saving an
 * off-allowlist URL in the first place. The actual security boundary is
 * js/render-content.js's identical check on the public read side, which
 * re-validates independently rather than trusting this block's data.
 * Not an npm package — authored locally, vendored here per the
 * local-vendoring rule.
 */
class EmbedTool {
  static get toolbox() {
    return {
      title: "Innfelling (Embed)",
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 9l3 3-3 3"/></svg>'
    };
  }

  static get ALLOWED_DOMAINS() {
    return ["canva.com", "docs.google.com", "drive.google.com"];
  }

  constructor({ data }) {
    this.data = { url: (data && data.url) || "" };
    this.wrapper = null;
    this.errorEl = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "embed-tool";

    const label = document.createElement("div");
    label.textContent = "Hlekkur á Canva, Google Slides eða Google Drive:";
    label.style.fontSize = "11px";
    label.style.color = "#5d7b84";
    this.wrapper.appendChild(label);

    const input = document.createElement("input");
    input.type = "url";
    input.placeholder = "https://...";
    input.value = this.data.url;
    input.addEventListener("input", () => {
      this.data.url = input.value;
      this._showValidation(input.value);
    });
    this.wrapper.appendChild(input);

    this.errorEl = document.createElement("div");
    this.errorEl.className = "embed-tool-error";
    this.wrapper.appendChild(this.errorEl);

    if (this.data.url) this._showValidation(this.data.url);

    return this.wrapper;
  }

  _isAllowed(url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return EmbedTool.ALLOWED_DOMAINS.some((domain) => host === domain || host.slice(-(domain.length + 1)) === "." + domain);
    } catch (e) {
      return false;
    }
  }

  _showValidation(url) {
    if (!url) {
      this.errorEl.textContent = "";
      return;
    }
    this.errorEl.textContent = this._isAllowed(url)
      ? ""
      : "Aðeins hlekkir frá canva.com, docs.google.com eða drive.google.com eru leyfðir.";
  }

  save() {
    // Never save an off-allowlist URL, even if the input still shows one.
    return { url: this._isAllowed(this.data.url) ? this.data.url : "" };
  }

  validate(savedData) {
    return Boolean(savedData.url);
  }
}

window.EmbedTool = EmbedTool;
