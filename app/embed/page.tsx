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
import { StudioEditor } from "@/components/studio/StudioEditor";

interface EmbedConfig {
  product?: { sku?: string; name?: string; width?: number; height?: number; price?: number };
  preset?: string; // CANVAS_PRESETS id
  design?: StudioDesign; // previously saved design (edit mode)
}

export default function EmbedPage() {
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [pendingInit, setPendingInit] = useState<EmbedConfig | null>(null);
  const [mode, setMode] = useState<"await-init" | "template-pick" | "editing">("await-init");

  const pickTemplate = (d: StudioDesign) => {
    setConfig((c) => ({ ...c, design: d }));
    setMode("editing");
  };

  const handleInit = useCallback((event: MessageEvent) => {
    if (!event.data || typeof event.data !== "object") return;
    const msg = event.data as { type?: string; product?: EmbedConfig["product"]; preset?: string; design?: StudioDesign };
    if (msg.type === "printa:init") {
      setConfig({ product: msg.product, preset: msg.preset, design: msg.design });
      setMode(msg.design ? "editing" : "template-pick");
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
      setMode(autostart ? "editing" : "template-pick");
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
