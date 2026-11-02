"use client";

// ============================================================
// /studio — landing + template gallery + editor
// ============================================================

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Search, Ruler, Wand2 } from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORIES, CANVAS_PRESETS, type Template, type StudioDesign, emptyDesign } from "@/lib/studio";
import { generateFromPrompt, generateVariants, type Variant } from "@/lib/aiDesigner";
import { DesignRenderer } from "@/components/studio/DesignRenderer";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { BriefWizard } from "@/components/studio/BriefWizard";

export default function StudioPage() {
  const [editing, setEditing] = useState<StudioDesign | null>(null);
  const [mode, setMode] = useState<"gallery" | "wizard">("gallery");
  const [wizardVariants, setWizardVariants] = useState<Variant[] | null>(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [quickPrompt, setQuickPrompt] = useState("");
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1350);

  const filtered = useMemo(() => {
    let t = TEMPLATES;
    if (category !== "All") t = t.filter((x) => x.category === category);
    if (query) {
      const q = query.toLowerCase();
      t = t.filter((x) => x.name.toLowerCase().includes(q) || x.category.toLowerCase().includes(q));
    }
    return t;
  }, [category, query]);

  const startTemplate = (t: Template) => setEditing(structuredClone(t.design));
  const startBlank = (w: number, h: number, name: string) => setEditing(emptyDesign({ id: "custom", name, w, h, category: "Custom" }));

  const startAi = () => {
    if (!quickPrompt.trim()) return;
    const { design } = generateFromPrompt(quickPrompt);
    setEditing(design);
  };

  if (editing) {
    return <StudioEditor initialDesign={editing} onExit={() => setEditing(null)} />;
  }

  // ---------- wizard mode ----------
  if (mode === "wizard") {
    return (
      <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">P</div>
              <div>
                <h1 className="text-base font-bold tracking-tight">Printa Studio</h1>
                <p className="text-[10px] text-white/40">Answer 6 questions — get 3 designs</p>
              </div>
            </div>
            <button onClick={() => { setMode("gallery"); setWizardVariants(null); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-colors">
              ← Browse templates instead
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 py-10 overflow-y-auto">
          {wizardVariants ? (
            <div className="max-w-4xl w-full">
              <h2 className="text-xl font-bold mb-1">Pick your favorite</h2>
              <p className="text-xs text-white/40 mb-6">All three are fully editable — choose a direction to start.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {wizardVariants.map((v) => (
                  <button key={v.style} onClick={() => setEditing(structuredClone(v.design))}
                    className="group rounded-2xl border border-white/10 hover:border-violet-500/50 bg-white/[0.03] overflow-hidden transition-all text-left">
                    <div className="p-3 flex items-center justify-center bg-black/40 max-h-[290px] overflow-hidden">
                      <DesignRenderer design={v.design} width={v.design.width / v.design.height > 2.2 ? 260 : 150} className="rounded-lg shadow-xl" />
                    </div>
                    <div className="px-3 py-2.5 border-t border-white/10">
                      <div className="text-xs font-semibold group-hover:text-violet-300 transition-colors">{v.style}</div>
                      <div className="text-[10px] text-white/35">{v.design.width}×{v.design.height} · {v.design.elements.length} editable layers</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setWizardVariants(null)} className="mt-6 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors">
                ← Change my answers
              </button>
            </div>
          ) : (
            <BriefWizard onApply={(variants) => setWizardVariants(variants)} llmCfg={null} />
          )}
        </div>
      </div>
    );
  }

  // ---------- gallery mode ----------
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white">
      {/* ============ HERO ============ */}
      <div className="border-b border-white/10 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-5">
              <Sparkles className="w-3.5 h-3.5" /> AI-powered · No design skills needed
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              What do you want to design <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">today?</span>
            </h1>
            <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
              Don&apos;t know where to start? Answer 6 simple questions — we&apos;ll design it for you. Or pick a template below.
            </p>
            <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
              <button onClick={() => setMode("wizard")}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-semibold text-sm transition-all shadow-lg shadow-violet-500/25 flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> Design it for me — free
              </button>
              <a href="#templates" className="px-6 py-3.5 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 font-medium text-sm transition-all flex items-center gap-2">
                I&apos;ll pick a template <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-2 pl-4 focus-within:border-violet-500/50 transition-colors">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <input
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") startAi(); }}
                placeholder="…or just describe it — “a grand opening poster for Meera’s Bakery, warm cream colors”"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/25"
              />
              <button onClick={startAi} disabled={!quickPrompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-30">
                <Sparkles className="w-4 h-4" /> Design it
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============ TEMPLATES ============ */}
      <div id="templates" className="max-w-6xl mx-auto px-6 py-12 scroll-mt-16">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h2 className="text-xl font-bold">Start with a template</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3">
              <Search className="w-3.5 h-3.5 text-white/30" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="bg-transparent outline-none text-xs py-2 w-28 placeholder:text-white/25" />
            </div>
            <div className="flex gap-1">
              {TEMPLATE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${category === c ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-white/40 hover:text-white/70 border border-transparent"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => startTemplate(t)}
              className="group text-left rounded-2xl border border-white/10 hover:border-violet-500/40 bg-white/[0.03] hover:bg-violet-500/5 transition-all overflow-hidden"
            >
              <div className="relative aspect-[4/5] overflow-hidden flex items-center justify-center bg-black/30 p-3">
                <div className="w-full" style={{ maxWidth: t.design.width > t.design.height * 1.3 ? "100%" : "auto", maxHeight: "100%" }}>
                  <PreviewThumb design={t.design} />
                </div>
                <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-violet-600 text-xs font-semibold flex items-center gap-1.5">
                    Use this template <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
              <div className="p-3">
                <div className="text-xs font-medium truncate">{t.name}</div>
                <div className="text-[10px] text-white/35 mt-0.5">{t.category} · {t.design.width}×{t.design.height}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ============ CUSTOM SIZE ============ */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Ruler className="w-5 h-5 text-violet-400" /> Custom size</h2>
          <p className="text-xs text-white/40 mb-4">Exact pixels for anything — print, web, social</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            {CANVAS_PRESETS.map((p) => (
              <button key={p.id} onClick={() => startBlank(p.w, p.h, p.name)}
                className="p-3 rounded-xl bg-white/5 hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/30 text-left transition-all">
                <div className="text-[11px] font-medium">{p.name}</div>
                <div className="text-[9px] text-white/35 mt-0.5">{p.w}×{p.h}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="number" value={customW} onChange={(e) => setCustomW(Math.max(50, parseInt(e.target.value) || 1080))} className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none focus:border-violet-500" />
            <span className="text-white/30 text-xs">×</span>
            <input type="number" value={customH} onChange={(e) => setCustomH(Math.max(50, parseInt(e.target.value) || 1350))} className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs outline-none focus:border-violet-500" />
            <button onClick={() => startBlank(customW, customH, "Custom design")}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors flex items-center gap-1.5">
              Start blank canvas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render a scaled-down thumbnail without interactivity
function PreviewThumb({ design }: { design: StudioDesign }) {
  const w = Math.min(220, design.width > design.height * 1.3 ? 220 : (design.height > design.width ? 110 * (design.width / design.height) * 1.4 : 180));
  return <DesignRenderer design={design} width={w} className="rounded-lg shadow-xl" />;
}
