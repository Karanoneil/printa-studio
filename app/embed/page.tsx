"use client";

// ============================================================
// /embed — chromeless editor for iframe embedding (Magento PDP).
//
// postMessage protocol (parent ⇄ iframe):
//   parent → iframe: { type: "printa:init", product, preset?, design? }
//   iframe → parent: { type: "printa:ready" }
//   iframe → parent: { type: "printa:cancel" }
//   iframe → parent: { type: "printa:complete", design, previewPng,
//                      width, height }
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { TEMPLATES, emptyDesign, type StudioDesign, CANVAS_PRESETS } from "@/lib/studio";
import type { Variant } from "@/lib/aiDesigner";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { BriefWizard } from "@/components/studio/BriefWizard";
import { DesignRenderer } from "@/components/studio/DesignRenderer";

interface EmbedConfig {
  product?: { sku?: string; name?: string; width?: number; height?: number; price?: number };
  preset?: string; // CANVAS_PRESETS id
  design?: StudioDesign; // previously saved design (edit mode)
}

export default function EmbedPage() {
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [pendingInit, setPendingInit] = useState<EmbedConfig | null>(null);
  const [wizardResult, setWizardResult] = useState<Variant[] | null>(null);
  const [mode, setMode] = useState<"await-init" | "start" | "wizard" | "wizard-result" | "template-pick" | "editing">("await-init");

  const pickTemplate = (d: StudioDesign) => {
    setConfig((c) => ({ ...c, design: d }));
    setMode("editing");
  };

  const handleInit = useCallback((event: MessageEvent) => {
    if (!event.data || typeof event.data !== "object") return;
    const msg = event.data as { type?: string; product?: EmbedConfig["product"]; preset?: string; design?: StudioDesign };
    if (msg.type === "printa:init") {
      setConfig({ product: msg.product, preset: msg.preset, design: msg.design });
      setMode(msg.design ? "editing" : "start");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleInit);
    // tell parent we're listening
    if (window.parent !== window) {
      window.parent.postMessage({ type: "printa:ready" }, "*");
    }
    // URL params fallback (no postMessage needed)
    const params = new URLSearchParams(window.location.search);
    if (params.has("preset") || params.has("product") || params.has("autostart")) {
      const preset = params.get("preset");
      const product = params.get("product");
      const autostart = params.get("autostart") === "1";
      setConfig({
        product: product ? { name: product, sku: params.get("sku") || undefined } : undefined,
        preset: preset || undefined,
      });
      setMode(autostart ? "editing" : "start");
    }
    return () => window.removeEventListener("message", handleInit);
  }, [handleInit]);

  const onDone = useCallback((design: StudioDesign, previewPng: string) => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: "printa:complete",
        design,
        previewPng,
        width: design.width,
        height: design.height,
      }, "*");
    }
    // store for same-tab persistence
    try { sessionStorage.setItem("printa:last-design", JSON.stringify(design)); } catch { /* noop */ }
  }, []);

  const onCancel = useCallback(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "printa:cancel" }, "*");
    }
  }, []);

  // ---------- await merchant init ----------
  if (mode === "await-init") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0c0c0f] text-white/40 text-sm">
        Waiting for product context…
      </div>
        );
  }

  // ---------- start chooser ----------
  if (mode === "start") {
    const preset = config?.preset ? CANVAS_PRESETS.find((p) => p.id === config.preset) : undefined;
    return (
      <div className="min-h-screen bg-[#0c0c0f] text-white p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">
              {config?.product?.name ? `Design your ${config.product.name}` : "Let's create your design"}
            </h1>
            <p className="text-xs text-white/40 mt-1.5">Two ways to start — both end with an editable design.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setMode("wizard")}
              className="p-5 rounded-2xl border border-violet-500/40 bg-gradient-to-b from-violet-500/15 to-transparent hover:from-violet-500/25 transition-all text-left group">
              <div className="text-3xl mb-3">🪄</div>
              <div className="text-sm font-bold group-hover:text-violet-300 transition-colors">Design it for me</div>
              <div className="text-[11px] text-white/40 mt-1 leading-relaxed">Answer 6 quick questions — brand, occasion, offer, style — and pick from 3 designs.</div>
            </button>
            <button onClick={() => setMode("template-pick")}
              className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/30 transition-all text-left group">
              <div className="text-3xl mb-3">🎨</div>
              <div className="text-sm font-bold group-hover:text-white transition-colors">Start from a template</div>
              <div className="text-[11px] text-white/40 mt-1 leading-relaxed">Browse professionally designed layouts and swap in your own text.</div>
            </button>
          </div>
          <div className="mt-6 text-center">
            <button onClick={onCancel} className="text-xs text-white/30 hover:text-white/60 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- wizard ----------
  if (mode === "wizard") {
    return (
      <div className="min-h-screen bg-[#0c0c0f] text-white flex items-start justify-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <BriefWizard
            sizePreset={config?.preset}
            llmCfg={null}
            onApply={(variants: Variant[]) => {
              setConfig((c) => ({ ...c }));
              setWizardResult(variants);
              setMode("wizard-result");
            }}
          />
        </div>
      </div>
    );
  }

  // ---------- wizard result ----------
  if (mode === "wizard-result" && wizardResult) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] text-white p-6 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <h2 className="text-lg font-bold mb-1">Pick your favorite</h2>
          <p className="text-xs text-white/40 mb-5">Fully editable — you can change everything next.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {wizardResult.map((v) => (
              <button key={v.style} onClick={() => pickTemplate(v.design)}
                className="group rounded-2xl border border-white/10 hover:border-violet-500/50 bg-white/[0.03] overflow-hidden transition-all text-left">
                <div className="p-3 flex items-center justify-center bg-black/40 max-h-[280px] overflow-hidden">
                  <DesignRenderer design={v.design} width={v.design.width / v.design.height > 2.2 ? 240 : 140} className="rounded-lg shadow-xl" />
                </div>
                <div className="px-3 py-2.5 border-t border-white/10">
                  <div className="text-xs font-semibold group-hover:text-violet-300 transition-colors">{v.style}</div>
                  <div className="text-[10px] text-white/35">{v.design.elements.length} editable layers</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setMode("wizard")} className="mt-5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors">
            ← Change my answers
          </button>
        </div>
      </div>
    );
  }

  // ---------- template picker ----------
  if (mode === "template-pick") {
    const preset = config?.preset ? CANVAS_PRESETS.find((p) => p.id === config.preset) : undefined;
    return (
      <div className="min-h-screen bg-[#0c0c0f] text-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-5">
            <h1 className="text-xl font-bold">
              {config?.product?.name ? `Design your ${config.product.name}` : "Pick a starting point"}
            </h1>
            <p className="text-xs text-white/40 mt-1">Choose a template or a blank canvas — you can change anything after.</p>
          </div>
          {preset && (
            <button onClick={() => pickTemplate(emptyDesign(preset, preset.name))}
              className="w-full mb-5 p-4 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15 text-left transition-colors">
              <div className="text-sm font-semibold flex items-center gap-2">✦ Start blank — {preset.name} ({preset.w}×{preset.h})</div>
              <div className="text-[11px] text-white/40 mt-0.5">Recommended size for this product</div>
            </button>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TEMPLATES.slice(0, 8).map((t) => (
              <button key={t.id} onClick={() => pickTemplate(structuredClone(t.design))}
                className="rounded-xl border border-white/10 hover:border-violet-500/40 bg-white/[0.03] p-3 text-left transition-all">
                <div className="text-[11px] font-medium truncate">{t.name}</div>
                <div className="text-[9px] text-white/35 mt-0.5">{t.category} · {t.design.width}×{t.design.height}</div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- editing ----------
  const startDesign = config?.design
    ? config.design
    : (() => {
        const preset = config?.preset ? CANVAS_PRESETS.find((p) => p.id === config.preset) : undefined;
        if (config?.product?.width && config.product.height) {
          return emptyDesign({ id: "product", name: config.product.name || "Product design", w: config.product.width, h: config.product.height, category: "Product" }, config.product.name);
        }
        if (preset) return emptyDesign(preset, preset.name);
        return emptyDesign(CANVAS_PRESETS[0]);
      })();

  return (
    <StudioEditor
      key={startDesign.name + startDesign.width + startDesign.height + (startDesign.elements.length ? "-has" : "-blank")}
      initialDesign={startDesign}
      embedMode
      onExit={onCancel}
      onDone={onDone}
    />
  );
}
