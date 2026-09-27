/**
 * image-compress.js
 * Client-side image compression shared by the Image Row Editor.js tool and
 * the homepage carousel manager (CLAUDE.md Images: canvas-resize to
 * ~1920px max width, target 300–500KB, converted to WebP, 1MB hard
 * ceiling). Runs entirely in the browser before anything reaches
 * upload-image.js — the Function only ever sees an already-compressed file.
 */
(function (global) {
  "use strict";

  var MAX_WIDTH = 1920;
  var TARGET_MAX_BYTES = 500 * 1024;
  var HARD_CEILING_BYTES = 1024 * 1024;
  var QUALITY_STEPS = [0.82, 0.7, 0.58, 0.46, 0.34];

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function (err) {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(
        function (blob) {
          if (blob) resolve(blob);
          else reject(new Error("canvas.toBlob returned null"));
        },
        "image/webp",
        quality
      );
    });
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        // Strip the "data:image/webp;base64," prefix — upload-image.js
        // expects raw base64 only.
        var result = String(reader.result || "");
        var commaIndex = result.indexOf(",");
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Compresses `file` (any browser-readable image) down to a WebP blob
   * within the target size, trying progressively lower quality until it
   * fits under TARGET_MAX_BYTES (or the HARD_CEILING_BYTES at worst).
   * Resolves to { blob, base64, width, height }.
   */
  async function compressImage(file) {
    var img = await loadImage(file);

    var scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
    var width = Math.round(img.naturalWidth * scale);
    var height = Math.round(img.naturalHeight * scale);

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    var blob = null;
    for (var i = 0; i < QUALITY_STEPS.length; i++) {
      blob = await canvasToBlob(canvas, QUALITY_STEPS[i]);
      if (blob.size <= TARGET_MAX_BYTES) break;
    }

    if (!blob || blob.size > HARD_CEILING_BYTES) {
      throw new Error("Myndin er of stór eftir þjöppun (yfir 1MB hámarki).");
    }

    var base64 = await blobToBase64(blob);
    return { blob: blob, base64: base64, width: width, height: height };
  }

  global.ImageCompress = { compressImage: compressImage };
})(window);
