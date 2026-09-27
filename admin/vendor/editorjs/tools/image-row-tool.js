/**
 * image-row-tool.js
 * Custom Editor.js block (CLAUDE.md "image-row layout for 2–3 images side
 * by side"). Not an npm package — authored locally, vendored here
 * alongside the third-party Editor.js bundles per the same
 * local-vendoring rule. Output shape matches js/render-content.js's
 * renderImageRow(): { images: [{ url, alt }] }. Required alt text is
 * collected per image and stored as regular block data (CLAUDE.md Images:
 * "stored as regular content, not Blob metadata"), never left blank.
 *
 * Depends on window.ImageCompress (admin/js/image-compress.js) and
 * window.AdminApi (admin/js/admin-api.js) — load both before this file.
 */
class ImageRowTool {
  static get toolbox() {
    return {
      title: "Myndir í röð",
      icon: '<svg width="17" height="15" viewBox="0 0 17 15"><rect x="0" y="2" width="5" height="11" rx="1" fill="currentColor"/><rect x="6" y="0" width="5" height="15" rx="1" fill="currentColor"/><rect x="12" y="2" width="5" height="11" rx="1" fill="currentColor"/></svg>'
    };
  }

  constructor({ data }) {
    this.data = { images: (data && data.images) || [] };
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "image-row-tool";
    this._renderItems();
    return this.wrapper;
  }

  _renderItems() {
    this.wrapper.innerHTML = "";

    this.data.images.forEach((image, index) => {
      const item = document.createElement("div");
      item.className = "image-row-item";

      const imgEl = document.createElement("img");
      imgEl.src = image.url;
      imgEl.alt = image.alt || "";
      item.appendChild(imgEl);

      const altInput = document.createElement("input");
      altInput.type = "text";
      altInput.placeholder = "Alt-texti (skylda)";
      altInput.value = image.alt || "";
      altInput.addEventListener("input", () => {
        this.data.images[index].alt = altInput.value;
      });
      item.appendChild(altInput);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "image-row-item-remove";
      removeBtn.setAttribute("aria-label", "Fjarlægja mynd");
      removeBtn.innerHTML = "&times;";
      removeBtn.addEventListener("click", () => {
        this.data.images.splice(index, 1);
        this._renderItems();
      });
      item.appendChild(removeBtn);

      this.wrapper.appendChild(item);
    });

    if (this.data.images.length < 3) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "image-row-add";
      addBtn.textContent = "+ Bæta við mynd";
      addBtn.addEventListener("click", () => this._pickAndUpload());
      this.wrapper.appendChild(addBtn);
    }
  }

  _pickAndUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;

      const progress = document.createElement("p");
      progress.className = "image-row-progress";
      progress.textContent = "Þjappa mynd...";
      this.wrapper.appendChild(progress);

      try {
        if (!window.ImageCompress || !window.AdminApi) {
          throw new Error("Myndaþjöppun er ekki tiltæk á þessari síðu.");
        }
        const compressed = await window.ImageCompress.compressImage(file);
        progress.textContent = "Hleð upp mynd...";
        const result = await window.AdminApi.uploadImage(compressed.base64);
        this.data.images.push({ url: result.url, alt: "" });
        this._renderItems();
      } catch (err) {
        console.error("ImageRowTool: upload failed", err);
        progress.textContent = "Villa: " + err.message;
      }
    });
    input.click();
  }

  save() {
    return { images: this.data.images };
  }

  validate(savedData) {
    return Array.isArray(savedData.images) && savedData.images.length > 0 && savedData.images.every((img) => img.alt);
  }
}

window.ImageRowTool = ImageRowTool;
