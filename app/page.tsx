"use client";

// ============================================================
// / — landing page for Printa Studio
// ============================================================

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Wand2, MousePointerClick, ShoppingCart, ArrowRight, Layers, Palette, Globe } from "lucide-react";
import { TEMPLATES } from "@/lib/studio";
import { DesignRenderer } from "@/components/studio/DesignRenderer";

const FEATURES = [
  { icon: Wand2, title: "AI designs for you", text: "Type what you need in plain words — \"50% off sale poster for Bella's Boutique\" — and get a finished design. No design skills needed." },
  { icon: MousePointerClick, title: "Effortless editing", text: "Drag, resize, rotate. Double-click text to rewrite it. Undo works like you expect. If you can use a phone, you can use this." },
  { icon: Layers, title: "Templates for everything", text: "Social posts, stories, posters, flyers, business cards, menus, banners — professionally composed starting points." },
  { icon: Palette, title: "Your brand, your fonts", text: "12 curated fonts, gradients, patterns, photo backgrounds, your logo — everything stays editable at all times." },
  { icon: Globe, title: "Embeds in Magento", text: "One script tag on your product page and customers design right in your store. The design travels with the cart item to checkout." },
  { icon: ShoppingCart, title: "Print-ready output", text: "Export exact-size PNG at full resolution, or receive the design JSON server-side for production rendering." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white">
      {/* nav */}
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/25">P</div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Printa Studio</h1>
              <p className="text-[10px] text-white/40">AI design tool anyone can use</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/docs" className="hidden sm:block px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">For developers</Link>
            <Link href="/print" className="hidden sm:block px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">Print shop flow</Link>
            <Link href="/studio" className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-xs font-semibold transition-all flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Start designing
            </Link>
          </div>
        </div>
      </nav>

      {/* hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Describe it → done. That&apos;s the whole workflow.
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
              The design tool for
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">people who aren&apos;t designers</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto mb-8">
              Type what you want in plain English. Printa designs it. Tweak anything with simple drag &amp; drop — then download print-quality files or let customers design right inside your Magento store.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/studio" className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-semibold text-sm transition-all shadow-lg shadow-violet-500/25 flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> Design something now
              </Link>
              <Link href="/docs" className="px-6 py-3 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 font-medium text-sm transition-all flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Embed in Magento
              </Link>
            </div>
          </motion.div>

          {/* template strip */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-14 flex flex-wrap justify-center gap-4">
            {TEMPLATES.slice(0, 5).map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                className="hover:-translate-y-1.5 transition-transform duration-300">
                <Link href="/studio">
                  <div className="rounded-xl overflow-hidden border border-white/10 hover:border-violet-500/40 shadow-2xl shadow-black/50 transition-colors">
                    <DesignRenderer design={t.design} width={t.design.width > t.design.height * 1.3 ? 260 : 150} className="rounded-none" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* features */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Why normal people finish designs here</h2>
        <p className="text-white/40 text-sm text-center mb-10">No layers-obsessed pro tool. No 40-tutorial learning curve. Just: describe, tweak, done.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-sm font-bold mb-1.5">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* embed section */}
      <div className="border-t border-white/10 bg-gradient-to-b from-emerald-500/[0.04] to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 mb-4">
                <Globe className="w-3.5 h-3.5" /> Magento integration
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Your customers design, your store sells</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Install the Printa module, paste your studio URL in config, and every product page gets a <span className="text-violet-300 font-medium">Customize &amp; Design</span> button. The finished design rides along with the cart item — quote, checkout, order, admin — with zero core hacks.
              </p>
              <ul className="space-y-2 text-xs text-white/60 mb-6">
                {[
                  "Layout XML injection on product pages — no template edits",
                  "Design JSON + preview PNG stored on the quote/order item",
                  "Works with any Magento 2.3/2.4 install (module + one script)",
                  "The editor is your host: styles, fonts and pricing stay yours",
                ].map((li) => (
                  <li key={li} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span> {li}
                  </li>
                ))}
              </ul>
              <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                Read the 5-minute integration guide <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 font-mono text-[11px] leading-relaxed overflow-x-auto">
              <div className="text-white/30 mb-2">{"<!-- Magento product page → Printa Designer -->"}</div>
              <div className="text-sky-400">{"<div"}</div>
              <div className="pl-4">id=<span className="text-emerald-300">&quot;printa-designer-root&quot;</span></div>
              <div className="pl-4">data-mage-init=<span className="text-emerald-300">{"'{ Printa_Designer/js/designer: { ... } }'"}</span></div>
              <div className="pl-8 text-white/60">origin: <span className="text-emerald-300">&quot;https://your-studio.com&quot;</span></div>
              <div className="pl-8 text-white/60">product: <span className="text-emerald-300">{"{ sku: 'BANNER-3X6', name: 'Vinyl Banner' }"}</span></div>
              <div className="pl-4">{"}}' >"}</div>
              <div className="text-sky-400">{"</div>"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to make your first design?</h2>
          <p className="text-white/40 text-sm mb-6">It takes about 30 seconds. No account, no card, no software.</p>
          <Link href="/studio" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-semibold transition-all shadow-lg shadow-violet-500/25">
            Open the studio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/30">
        Printa Studio — built with Next.js · <Link href="/print" className="hover:text-white/60 transition-colors">print shop flow</Link> · <Link href="/docs" className="hover:text-white/60 transition-colors">developer docs</Link>
      </footer>
    </div>
  );
}
