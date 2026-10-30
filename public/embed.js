/*!
 * Printa Studio Embed Loader v1.0.0
 * ------------------------------------------------------------
 * Drop-in designer for any storefront (Magento, Shopify, Woo…).
 *
 * USAGE (host page):
 *   <div id="printa-designer"></div>
 *   <script src="https://YOUR-HOST/embed.js"></script>
 *   <script>
 *     Printa.create("#printa-designer", {
 *       origin: "https://your-printa-host",   // required
 *       product: { sku: "ABC123", name: "Banner 3x6ft" },
 *       preset: "poster",                     // optional canvas preset
 *       design: savedDesignJson,              // optional (edit mode)
 *       onComplete: function (result) { ... },
 *       onCancel: function () { ... }
 *     });
 *   </script>
 *
 * COMPLETE EVENT (result):
 *   { design: StudioDesign, previewPng: "data:image/png;base64,…",
 *     width: 1080, height: 1350 }
 *
 * The design JSON is what you attach to the cart item (buyRequest
 * option / quote item option); previewPng is a low-res preview you
 * can show in the cart/checkout.
 * ------------------------------------------------------------
 */
(function () {
  "use strict";

  var VERSION = "1.0.0";

  function PrintaDesigner(hostEl, options) {
    if (!hostEl) throw new Error("Printa: container element not found");
    if (!options || !options.origin) throw new Error("Printa: options.origin is required");

    var self = this;
    this.hostEl = hostEl;
    this.options = options;
    this.design = options.design || null;
    this.iframe = null;

    // ---- build UI ----
    hostEl.innerHTML = "";
    hostEl.style.position = hostEl.style.position || "relative";

    var launchBtn = document.createElement("button");
    launchBtn.type = "button";
    launchBtn.id = "printa-launch";
    launchBtn.innerHTML = "&#10024; Customize & Design";
    launchBtn.style.cssText = [
      "display:inline-flex", "align-items:center", "gap:8px",
      "padding:12px 22px", "border:0", "border-radius:10px",
      "background:linear-gradient(90deg,#7C3AED,#C026D3)",
      "color:#fff", "font:600 15px/1 system-ui,sans-serif",
      "cursor:pointer", "box-shadow:0 4px 14px rgba(124,58,237,.35)",
    ].join(";");
    launchBtn.onmouseover = function () { launchBtn.style.filter = "brightness(1.1)"; };
    launchBtn.onmouseout = function () { launchBtn.style.filter = "none"; };

    var modal = document.createElement("div");
    modal.id = "printa-modal";
    modal.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999";
    var frameWrap = document.createElement("div");
    frameWrap.style.cssText = "position:absolute;inset:16px;border-radius:14px;overflow:hidden;background:#0c0c0f;box-shadow:0 24px 80px rgba(0,0,0,.6)";
    var frame = document.createElement("iframe");
    frame.style.cssText = "width:100%;height:100%;border:0;display:block";
    frame.setAttribute("title", "Printa design studio");
    frame.setAttribute("allow", "clipboard-write");
    frameWrap.appendChild(frame);
    modal.appendChild(frameWrap);

    hostEl.appendChild(launchBtn);
    document.body.appendChild(modal);

    this.open = function () {
      var qs = [];
      if (self.options.product) qs.push("product=" + encodeURIComponent(self.options.product.name || ""));
      if (self.options.preset) qs.push("preset=" + encodeURIComponent(self.options.preset));
      frame.src = self.options.origin + "/embed" + (qs.length ? "?" + qs.join("&") : "");
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    };

    this.close = function () {
      modal.style.display = "none";
      frame.src = "about:blank";
      document.body.style.overflow = "";
    };

    this.setDesign = function (design) {
      self.design = design;
    };

    launchBtn.addEventListener("click", function () { self.open(); });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) self.close();
    });

    window.addEventListener("message", function (event) {
      if (event.origin !== self.options.origin) return;
      var msg = event.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "printa:ready") {
        // send product context once the editor is listening
        frame.contentWindow.postMessage({
          type: "printa:init",
          product: self.options.product,
          preset: self.options.preset,
          design: self.design,
        }, self.options.origin);
      } else if (msg.type === "printa:complete") {
        self.design = msg.design;
        if (typeof self.options.onComplete === "function") {
          self.options.onComplete({
            design: msg.design,
            previewPng: msg.previewPng,
            width: msg.width,
            height: msg.height,
          });
        }
        self.close();
      } else if (msg.type === "printa:cancel") {
        if (typeof self.options.onCancel === "function") self.options.onCancel();
        self.close();
      }
    });

    return this;
  }

  var Printa = {
    version: VERSION,
    create: function (selector, options) {
      var el = typeof selector === "string" ? document.querySelector(selector) : selector;
      return new PrintaDesigner(el, options);
    },
  };

  // AMD / CommonJS / global
  if (typeof define === "function" && define.amd) define(function () { return Printa; });
  else if (typeof module === "object" && module.exports) module.exports = Printa;
  else window.Printa = Printa;
})();
