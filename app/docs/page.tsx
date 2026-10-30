"use client";

// ============================================================
// /docs — developer & merchant integration guide
// ============================================================

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink } from "lucide-react";

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group rounded-xl border border-white/10 bg-black/50 overflow-hidden">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-medium transition-colors"
        >
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed"><code className="language-javascript">{code}</code></pre>
      {lang && <div className="absolute bottom-1.5 right-2 text-[9px] text-white/20 font-mono uppercase">{lang}</div>}
    </div>
  );
}

const EMBED_SNIPPET = `<!-- 1. Anywhere on your product page (or any page) -->
<div id="printa-designer"></div>

<!-- 2. The loader — one line -->
<script src="https://YOUR-STUDIO-HOST/embed.js"></script>

<!-- 3. Wire it up -->
<script>
  var designer = Printa.create("#printa-designer", {
    origin: "https://YOUR-STUDIO-HOST",
    product: {
      sku: "BANNER-3X6",
      name: "Vinyl Banner 3ft x 6ft",
      width: 2160,      // optional: exact canvas px for this product
      height: 4320
    },
    preset: "poster",   // optional: default canvas preset id

    onComplete: function (result) {
      // result.design      — full StudioDesign JSON (geometry + fonts)
      // result.previewPng  — data-URL PNG preview (half res)
      // result.width / result.height — canvas px

      // e.g. stash into your add-to-cart form:
      document.querySelector('form#product_addtocart_form')
        .insertAdjacentHTML('beforeend',
          '<input type="hidden" name="printa_design" value=\\'' +
          JSON.stringify(result.design) + '\\'>');
    },

    onCancel: function () {
      console.log("customer closed the designer");
    }
  });
</script>`;

const MAGENTO_SNIPPET = `# From your Magento project root:

# 1. copy the module in
mkdir -p app/code/Printa
cp -r path/to/magento-module/Printa/Designer app/code/Printa/Designer

# 2. enable + upgrade
php bin/magento module:enable Printa_Designer
php bin/magento setup:upgrade
php bin/magento cache:flush

# 3. configure
# Stores → Configuration → Catalog → Printa Designer
#   Enabled: Yes
#   Studio Origin: https://your-studio-host`;

const WEBHOOK_SNIPPET = `// Server-side: turn design JSON into production files.
// The StudioDesign JSON is a coordinate-exact spec.

const design = JSON.parse(req.body.printa_design);

// Option A — headless render (pixel-identical to the client export):
//   run the same app headless and screenshot /embed with the design
//   passed via printMessage, at design.width x design.height.

// Option B — port lib/exportDesign.ts to node-canvas:
//   same math, draws gradients/shapes/text/emoji/images.

// Option C — keep the data-URL PNG from printa_preview for
//   small-format products (stickers, cards) — it's already
//   production-usable at half resolution.`;

const EVENTS = [
  ["printa:ready", "iframe → host", "Editor mounted and listening for init."],
  ["printa:init", "host → iframe", "Product context, preset, and optional saved design (edit mode)."],
  ["printa:complete", "iframe → host", "Customer saved: { design, previewPng, width, height }."],
  ["printa:cancel", "iframe → host", "Customer closed without saving."],
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">P</div>
            <span className="text-sm font-bold">Printa Studio</span>
          </a>
          <div className="flex items-center gap-4 text-xs">
            <a href="/studio" className="text-white/60 hover:text-white transition-colors">Studio</a>
            <span className="text-violet-400 font-medium">Docs</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Integration guide</h1>
          <p className="text-white/50 text-sm mb-10">
            Two paths: drop the designer into any website with one script tag, or install the full Magento 2 module with cart/order persistence.
          </p>

          {/* TOC */}
          <div className="grid sm:grid-cols-2 gap-3 mb-14">
            {[
              ["#universal", "Universal embed (any platform)", "One <script> tag + 10 lines of JS. Works on Magento, Shopify, WooCommerce, or a plain HTML page."],
              ["#magento", "Magento 2 module (full integration)", "Install the Printa_Designer module: PDP button, quote/order item persistence, admin config."],
              ["#protocol", "PostMessage protocol", "The four messages the iframe and host exchange."],
              ["#production", "From design JSON to production files", "How to render print-ready output server-side."],
            ].map(([href, title, desc]) => (
              <a key={href} href={href} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
                <div className="text-sm font-semibold mb-1">{title}</div>
                <div className="text-[11px] text-white/40 leading-relaxed">{desc}</div>
              </a>
            ))}
          </div>

          {/* universal embed */}
          <section id="universal" className="mb-14 scroll-mt-20">
            <h2 className="text-xl font-bold mb-1">Universal embed — any platform</h2>
            <p className="text-xs text-white/40 mb-4">Total effort: ~5 minutes. No platform-specific code required.</p>
            <CodeBlock code={EMBED_SNIPPET} />
            <p className="text-xs text-white/40 mt-3 leading-relaxed">
              The loader opens the full editor in a modal, handles all messaging, and hands you the finished design in <code className="text-violet-300">onComplete</code>. The same <code className="text-violet-300">origin</code> is used for the iframe and postMessage origin checks.
            </p>
          </section>

          {/* magento module */}
          <section id="magento" className="mb-14 scroll-mt-20">
            <h2 className="text-xl font-bold mb-1">Magento 2 module — full integration</h2>
            <p className="text-xs text-white/40 mb-4">
              Ships in this repo at <code className="text-violet-300">magento-module/Printa/Designer</code>. Installs as a standard Magento extension.
            </p>
            <CodeBlock code={MAGENTO_SNIPPET} />
            <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-white/60 leading-relaxed space-y-2">
              <p><span className="text-white font-semibold">What you get:</span></p>
              <p className="flex gap-2"><span className="text-emerald-400">✓</span> A &quot;Customize &amp; Design&quot; button under Add-to-Cart on every product page (layout XML, <code>ifConfig</code>-gated).</p>
              <p className="flex gap-2"><span className="text-emerald-400">✓</span> Design JSON + preview PNG stored on the quote item (observer: <code>checkout_cart_product_add_after</code>).</p>
              <p className="flex gap-2"><span className="text-emerald-400">✓</span> Design carried into the order item (<code>sales_order_item.printa_design</code> column, declarative schema).</p>
              <p className="flex gap-2"><span className="text-emerald-400">✓</span> Admin config: enable/disable + studio origin URL per website/store.</p>
              <p className="flex gap-2"><span className="text-emerald-400">✓</span> Zero core file modifications — remove the folder to uninstall.</p>
            </div>
          </section>

          {/* protocol */}
          <section id="protocol" className="mb-14 scroll-mt-20">
            <h2 className="text-xl font-bold mb-1">PostMessage protocol</h2>
            <p className="text-xs text-white/40 mb-4">The host validates <code className="text-violet-300">event.origin</code> against the configured studio origin — messages from other origins are ignored.</p>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5 text-left">
                    <th className="px-4 py-2.5 font-semibold">Message</th>
                    <th className="px-4 py-2.5 font-semibold">Direction</th>
                    <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Payload / meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map(([name, dir, meaning]) => (
                    <tr key={name} className="border-t border-white/5">
                      <td className="px-4 py-2.5 font-mono text-violet-300">{name}</td>
                      <td className="px-4 py-2.5 text-white/50">{dir}</td>
                      <td className="px-4 py-2.5 text-white/60 hidden sm:table-cell">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* production */}
          <section id="production" className="mb-14 scroll-mt-20">
            <h2 className="text-xl font-bold mb-1">From design JSON to production files</h2>
            <p className="text-xs text-white/40 mb-4">
              The <code className="text-violet-300">StudioDesign</code> JSON carries absolute-px geometry, font ids, colors, and images (as data URLs) — it is a complete, coordinate-exact spec of the artwork.
            </p>
            <CodeBlock code={WEBHOOK_SNIPPET} />
            <p className="text-xs text-white/40 mt-3 leading-relaxed">
              For full-resolution production, render with the same renderer the customer saw — guarantees what they approved is what gets printed. The client-side export (<code className="text-violet-300">lib/exportDesign.ts</code>) is dependency-free Canvas 2D and ports directly to Node with <code className="text-violet-300">node-canvas</code> or a headless browser.
            </p>
          </section>

          <p className="text-xs text-white/30 border-t border-white/10 pt-6">
            Studio routes: <a href="/studio" className="text-violet-400 hover:underline">/studio</a> (full editor) · <a href="/embed" className="text-violet-400 hover:underline">/embed</a> (iframe target) · <a href="/print" className="text-violet-400 hover:underline">/print</a> (conversational print-shop flow) · <a href="/embed.js" className="text-violet-400 hover:underline">/embed.js</a> (loader script)
          </p>
        </motion.div>
      </div>
    </div>
  );
}
