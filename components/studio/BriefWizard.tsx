"use client";

// ============================================================
// BriefWizard — the layman's entry point. Asks how the product
// must look, step by step, then generates 3 design directions.
// ============================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Upload, Check } from "lucide-react";
import { CANVAS_PRESETS } from "@/lib/studio";
import { generateVariantsFromBrief, briefToPrompt, generateVariantsWithLLM, type DesignBriefInput, type Variant, type LLMConfig, type BriefOccasion } from "@/lib/aiDesigner";
import { DesignRenderer } from "./DesignRenderer";

const OCCASIONS: (BriefOccasion & { label: string })[] = [
  { id: "sale", label: "A sale or discount", emoji: "🏷️", headline: "MEGA SALE", sub: "Limited time only", offerDefault: "Up to 50% OFF everything" },
  { id: "grand-opening", label: "Grand opening / launch", emoji: "✨", headline: "GRAND OPENING", sub: "Doors open soon", offerDefault: "Opening week specials" },
  { id: "event", label: "An event or party", emoji: "🎉", headline: "COMING SOON", sub: "Save the date", offerDefault: "Tickets selling fast" },
  { id: "food", label: "Food / menu special", emoji: "☕", headline: "FRESH & HOT", sub: "Made with love", offerDefault: "Try our chef's special" },
  { id: "new-product", label: "New product / service", emoji: "🚀", headline: "NOW AVAILABLE", sub: "Something new for you", offerDefault: "Starting today" },
  { id: "wedding", label: "Wedding / celebration", emoji: "🌿", headline: "SAVE THE DATE", sub: "Together with their families", offerDefault: "Reception to follow" },
  { id: "holiday", label: "Festive / holiday", emoji: "🎊", headline: "HAPPY HOLIDAYS", sub: "Season's greetings", offerDefault: "Special festive offers" },
  { id: "general", label: "General branding", emoji: "⭐", headline: "WELCOME", sub: "Say hello to us", offerDefault: "Come visit us today" },
];

const STYLES: { id: DesignBriefInput["styleId"]; label: string; emoji: string; desc: string; preview: string }[] = [
  { id: "bold", label: "Bold & Loud", emoji: "💪", desc: "Huge type, high contrast, energetic", preview: "linear-gradient(135deg,#1A0505,#7F1D1D)" },
  { id: "elegant", label: "Elegant", emoji: "🥂", desc: "Premium serif, refined, classy", preview: "linear-gradient(135deg,#FDF6F0,#F3D9C9)" },
  { id: "minimal", label: "Minimal", emoji: "◻️", desc: "Clean, whitespace, modern", preview: "linear-gradient(135deg,#0F172A,#1E293B)" },
  { id: "fun", label: "Fun & Playful", emoji: "🎈", desc: "Bright, quirky, friendly", preview: "linear-gradient(135deg,#2D1B69,#EC4899)" },
];

const PALETTES: { name: string; from: string; to: string; accent: string; text: string; sub: string; light?: boolean }[] = [
  { name: "Midnight Violet", from: "#1A1033", to: "#4C1D95", accent: "#F59E0B", text: "#FFFFFF", sub: "#C4B5FD" },
  { name: "Deep Ocean", from: "#0B2545", to: "#1D3557", accent: "#FCBF49", text: "#FFFFFF", sub: "#A8DADC" },
  { name: "Forest Green", from: "#052E1B", to: "#065F46", accent: "#10B981", text: "#FFFFFF", sub: "#A7F3D0" },
  { name: "Berry Purple", from: "#2D1B3D", to: "#7B2D8E", accent: "#E0AFFF", text: "#FFFFFF", sub: "#D8B4FE" },
  { name: "Ember Red", from: "#1A0505", to: "#7F1D1D", accent: "#F59E0B", text: "#FFFFFF", sub: "#FCA5A5" },
  { name: "Tech Slate", from: "#0F172A", to: "#1E293B", accent: "#38BDF8", text: "#FFFFFF", sub: "#94A3B8" },
  { name: "Warm Cream", from: "#FFF8DC", to: "#F4E4C1", accent: "#8B5A2B", text: "#3B2412", sub: "#8B5A2B", light: true },
  { name: "Blush Rose", from: "#FDF6F0", to: "#F3D9C9", accent: "#9A7B4F", text: "#4A3222", sub: "#9A7B4F", light: true },
  { name: "Sage Nature", from: "#F5F0E0", to: "#D4E4C4", accent: "#2D5F3F", text: "#2D5F3F", sub: "#4A6B57", light: true },
  { name: "Sky Blue", from: "#F0F9FF", to: "#DBEAFE", accent: "#1D3557", text: "#0F2A4A", sub: "#3B6EA5", light: true },
];

const STEPS = ["What are you making?", "Your brand", "What's it for?", "The offer & details", "How should it look?", "Colors"] as const;

export function BriefWizard({ onApply, llmCfg, sizePreset }: {
  onApply: (variants: Variant[]) => void;
  llmCfg: LLMConfig | null;
  sizePreset?: string;
}) {
  const [step, setStep] = useState(0);
  const [sizeId, setSizeId] = useState(sizePreset || "poster");
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number] | null>(null);
  const [offer, setOffer] = useState("");
  const [date, setDate] = useState("");
  const [contact, setContact] = useState("");
  const [styleId, setStyleId] = useState<DesignBriefInput["styleId"]>("bold");
  const [palette, setPalette] = useState(PALETTES[0]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canNext = () => {
    if (step === 1) return brandName.trim().length > 0;
    if (step === 2) return occasion !== null;
    return true;
  };

  const generate = async () => {
    if (!occasion) return;
    setBusy(true);
    const brief: DesignBriefInput = {
      sizeId, brandName: brandName.trim(), tagline: tagline.trim() || undefined,
      occasion, offer: offer.trim() || undefined, date: date.trim() || undefined,
      contact: contact.trim() || undefined, styleId, palette, logoDataUrl: logoDataUrl || undefined,
    };

    // LLM first if configured, deterministic always as fallback
    if (llmCfg) {
      try {
        const { designs } = await generateVariantsWithLLM(briefToPrompt(brief), llmCfg, sizeId);
        if (designs.length) {
          onApply(designs.map((d, i) => ({
            style: ["Direction 1", "Direction 2", "Direction 3"][i] || `Direction ${i + 1}`,
            design: d, notes: [`Generated with ${llmCfg.model}`],
          })));
          return;
        }
      } catch { /* fall through to built-in */ }
    }

    // slight delay for perceived effort
    await new Promise((r) => setTimeout(r, 600));
    onApply(generateVariantsFromBrief(brief));
  };

  const handleLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* progress */}
      <div className="flex items-center gap-1.5 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-violet-500" : "bg-white/10"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ============ STEP 0: WHAT ARE YOU MAKING ============ */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">What are you making?</h2>
              <p className="text-xs text-white/40 mt-1">Pick the size — you can change it later.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {CANVAS_PRESETS.map((p) => (
                <button key={p.id} onClick={() => setSizeId(p.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${sizeId === p.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="text-[10px] text-white/35 mt-0.5">{p.w} × {p.h}px · {p.category}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ STEP 1: BRAND ============ */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">What&apos;s your brand called?</h2>
              <p className="text-xs text-white/40 mt-1">This becomes the headline of your design.</p>
            </div>
            <input autoFocus value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Meera's Bakery"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-violet-500" />
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tagline (optional) — e.g. Fresh from the oven daily"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-violet-500" />
            <div>
              <p className="text-xs text-white/40 mb-2">Have a logo? It gets placed on every design. (optional)</p>
              {logoDataUrl ? (
                <div className="flex items-center gap-3">
                  <img src={logoDataUrl} alt="logo" className="w-14 h-14 object-contain rounded-lg bg-white/5 p-1.5" />
                  <button onClick={() => setLogoDataUrl(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 w-fit px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors text-xs">
                  <Upload className="w-3.5 h-3.5" /> Upload logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogo(f); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </motion.div>
        )}

        {/* ============ STEP 2: OCCASION ============ */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">What&apos;s it for?</h2>
              <p className="text-xs text-white/40 mt-1">This decides the headline, tone and graphics.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {OCCASIONS.map((o) => (
                <button key={o.id} onClick={() => setOccasion(o)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${occasion?.id === o.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                  <div className="text-xl mb-1.5">{o.emoji}</div>
                  <div className="text-xs font-medium">{o.label}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ STEP 3: OFFER & DETAILS ============ */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">The details</h2>
              <p className="text-xs text-white/40 mt-1">Skip anything that doesn&apos;t apply.</p>
            </div>
            <input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder={`Main offer — e.g. ${occasion?.offerDefault || "50% OFF everything"}`}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-violet-500" />
            <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="When — e.g. This Friday, 14 November"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-violet-500" />
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact — e.g. www.yourbrand.com or 555-0123"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-violet-500" />
          </motion.div>
        )}

        {/* ============ STEP 4: STYLE ============ */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">How should it look?</h2>
              <p className="text-xs text-white/40 mt-1">The overall personality of the design.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => setStyleId(s.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${styleId === s.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                  <div className="h-8 rounded-lg mb-3" style={{ background: s.preview }} />
                  <div className="text-xs font-semibold">{s.emoji} {s.label}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ STEP 5: COLORS ============ */}
        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">Pick your colors</h2>
              <p className="text-xs text-white/40 mt-1">You can fine-tune every color in the editor.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {PALETTES.map((p) => (
                <button key={p.name} onClick={() => setPalette(p)}
                  className={`p-3 rounded-xl border text-left transition-all ${palette.name === p.name ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                  <div className="h-9 rounded-lg mb-2 flex">
                    <div className="flex-1" style={{ background: p.from }} />
                    <div className="flex-1" style={{ background: p.to }} />
                    <div className="w-4" style={{ background: p.accent }} />
                  </div>
                  <div className="text-[11px] font-medium">{p.name}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ NAV ============ */}
      <div className="flex items-center gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <button onClick={() => canNext() && setStep((s) => s + 1)} disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold transition-all disabled:opacity-30">
            Next <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={generate} disabled={busy || !brandName.trim() || !occasion}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-xs font-semibold transition-all disabled:opacity-30">
            {busy ? (
              <><Sparkles className="w-4 h-4 animate-pulse" /> Designing…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate my designs</>
            )}
          </button>
        )}
      </div>
      {step === STEPS.length - 1 && !brandName.trim() && (
        <p className="text-[11px] text-red-400/70 mt-2">Brand name is required (step 2).</p>
      )}
    </div>
  );
}
