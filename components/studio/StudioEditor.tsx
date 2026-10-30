"use client";

// ============================================================
// StudioEditor — the full interactive design editor.
// Shared by /studio (standalone) and /embed (Magento iframe).
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft, Download, Undo2, Redo2, Trash2, Lock, Unlock, Plus,
  Type, Square, Sticker, Palette, Upload, Layers, Sparkles, Copy,
  ChevronDown, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Loader2, Check, Maximize2,
} from "lucide-react";
import type { StudioDesign, StudioElement, ShapeKind } from "@/lib/studio";
import { uid, textDefaults, GRADIENT_PRESETS, SOLID_SWATCHES } from "@/lib/studio";
import { FONT_LIBRARY, CLIPART } from "@/lib/data";
import { DesignRenderer, fontStack } from "./DesignRenderer";
import { exportPng, downloadDataUrl } from "@/lib/exportDesign";
import { generateFromPrompt } from "@/lib/aiDesigner";

export interface StudioEditorProps {
  initialDesign: StudioDesign;
  onExit?: () => void;
  /** embed mode: show "Add to cart" style done button instead of download-only */
  embedMode?: boolean;
  onDone?: (design: StudioDesign, previewPng: string) => void;
}

type Tab = "text" | "shapes" | "clipart" | "uploads" | "background" | "layers";

interface HistoryState {
  past: StudioDesign[];
  present: StudioDesign;
  future: StudioDesign[];
}

type DragMode =
  | { kind: "none" }
  | { kind: "move"; id: string; startX: number; startY: number; orig: StudioElement }
  | { kind: "resize"; id: string; handle: string; startX: number; startY: number; orig: StudioElement; designW: number; designH: number }
  | { kind: "rotate"; id: string; cx: number; cy: number; startAngle: number; orig: number };

export function StudioEditor({ initialDesign, onExit, embedMode, onDone }: StudioEditorProps) {
  const [history, setHistory] = useState<HistoryState>({ past: [], present: initialDesign, future: [] });
  const design = history.present;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [drag, setDrag] = useState<DragMode>({ kind: "none" });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [zoomFit, setZoomFit] = useState(true);

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [areaW, setAreaW] = useState(800);
  const scale = zoomFit ? areaW / design.width : Math.min(areaW / design.width, 0.9);
  const canvasW = design.width * scale;
  const canvasH = design.height * scale;

  const selected = design.elements.find((e) => e.id === selectedId) || null;

  // --- responsive canvas area measurement ---
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const update = () => setAreaW(Math.max(300, el.clientWidth - 64));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- history helpers ---
  const commit = useCallback((next: StudioDesign) => {
    setHistory((h) => ({ past: [...h.past, h.present].slice(-60), present: next, future: [] }));
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<StudioElement>, commitHistory = true) => {
    setHistory((h) => {
      const next = { ...h.present, elements: h.present.elements.map((e) => (e.id === id ? { ...e, ...updates } : e)) };
      return commitHistory ? { past: [...h.past, h.present].slice(-60), present: next, future: [] } : { ...h, present: next };
    });
  }, []);

  const undo = () => setHistory((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h));
  const redo = () => setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));

  // --- element operations ---
  const addElement = (el: StudioElement) => {
    commit({ ...design, elements: [...design.elements, el] });
    setSelectedId(el.id);
    if (el.type === "text") { setEditingTextId(el.id); }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    commit({ ...design, elements: design.elements.filter((e) => e.id !== selectedId) });
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = { ...selected, id: uid(), x: selected.x + 24, y: selected.y + 24 };
    commit({ ...design, elements: [...design.elements, copy] });
    setSelectedId(copy.id);
  };

  const bringForward = () => { if (!selectedId) return; moveLayer(1); };
  const sendBackward = () => { if (!selectedId) return; moveLayer(-1); };
  const moveLayer = (dir: 1 | -1) => {
    const idx = design.elements.findIndex((e) => e.id === selectedId);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= design.elements.length) return;
    const els = [...design.elements];
    const [el] = els.splice(idx, 1);
    els.splice(to, 0, el);
    commit({ ...design, elements: els });
  };

  // --- pointer interactions ---
  const onElementPointerDown = (e: React.PointerEvent, el: StudioElement) => {
    if (el.locked) return;
    e.stopPropagation();
    setSelectedId(el.id);
    setEditingTextId(null);
    setDrag({ kind: "move", id: el.id, startX: e.clientX, startY: e.clientY, orig: el });
  };

  const onHandlePointerDown = (e: React.PointerEvent, handle: string) => {
    if (!selected) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).closest("[data-canvas]")!.getBoundingClientRect();
    setDrag({
      kind: "resize", id: selected.id, handle,
      startX: e.clientX, startY: e.clientY, orig: selected,
      designW: rect.width, designH: rect.height,
    });
  };

  const onRotateHandleDown = (e: React.PointerEvent) => {
    if (!selected) return;
    e.stopPropagation();
    const canvas = (e.currentTarget as HTMLElement).closest("[data-canvas]")!.getBoundingClientRect();
    const cx = canvas.left + (selected.x + selected.w / 2) * scale;
    const cy = canvas.top + (selected.y + selected.h / 2) * scale;
    const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI - (selected.rotation || 0);
    setDrag({ kind: "rotate", id: selected.id, cx, cy, startAngle, orig: selected.rotation || 0 });
  };

  useEffect(() => {
    if (drag.kind === "none") return;
    const move = (e: PointerEvent) => {
      if (drag.kind === "move") {
        const dx = (e.clientX - drag.startX) / scale;
        const dy = (e.clientY - drag.startY) / scale;
        updateElement(drag.id, {
          x: Math.round(drag.orig.x + dx),
          y: Math.round(drag.orig.y + dy),
        }, false);
      } else if (drag.kind === "resize") {
        const dx = (e.clientX - drag.startX) / scale;
        const dy = (e.clientY - drag.startY) / scale;
        const o = drag.orig;
        let { x, y, w, h } = o;
        if (drag.handle.includes("e")) w = Math.max(12, o.w + dx);
        if (drag.handle.includes("s")) h = Math.max(12, o.h + dy);
        if (drag.handle.includes("w")) { x = o.x + dx; w = Math.max(12, o.w - dx); }
        if (drag.handle.includes("n")) { y = o.y + dy; h = Math.max(12, o.h - dy); }
        // keep aspect for clipart / circle
        if ((o.type === "clipart" || (o.type === "shape" && o.shape === "circle")) && (drag.handle.length === 2)) {
          const s = Math.max(w / o.w, h / o.h);
          w = o.w * s; h = o.h * s;
          if (drag.handle.includes("w")) x = o.x + (o.w - w);
          if (drag.handle.includes("n")) y = o.y + (o.h - h);
        }
        updateElement(drag.id, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }, false);
      } else if (drag.kind === "rotate") {
        const angle = (Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx) * 180) / Math.PI - drag.startAngle;
        const snapped = Math.abs(angle % 90) < 4 ? Math.round(angle / 90) * 90 : Math.round(angle);
        updateElement(drag.id, { rotation: snapped }, false);
      }
    };
    const up = () => {
      // commit final position to history on release
      setDrag((d) => {
        if (d.kind !== "none") {
          setHistory((h) => ({ past: [...h.past, { ...h.present }].slice(-60), present: h.present, future: [] }));
        }
        return { kind: "none" };
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, scale, updateElement]);

  // --- keyboard ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); return; }
      const nudge = e.shiftKey ? 20 : 4;
      if (e.key.startsWith("Arrow") && selected) {
        e.preventDefault();
        const dx = e.key === "ArrowLeft" ? -nudge : e.key === "ArrowRight" ? nudge : 0;
        const dy = e.key === "ArrowUp" ? -nudge : e.key === "ArrowDown" ? nudge : 0;
        updateElement(selectedId, { x: selected.x + dx, y: selected.y + dy });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // --- AI generation ---
  const runAi = () => {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    setAiNotes([]);
    setTimeout(() => {
      const { design: d, notes } = generateFromPrompt(aiPrompt);
      commit(d);
      setSelectedId(null);
      setAiNotes(notes);
      setAiBusy(false);
    }, 900);
  };

  // --- export ---
  const handleDownload = async () => {
    setExporting(true);
    try {
      const png = await exportPng(design);
      downloadDataUrl(png, `${design.name.replace(/\s+/g, "-").toLowerCase()}.png`);
    } finally {
      setExporting(false);
    }
  };

  const handleDone = async () => {
    if (!onDone) return;
    setExporting(true);
    try {
      const png = await exportPng(design, 0.5); // preview at half res for payload
      onDone(design, png);
    } finally {
      setExporting(false);
    }
  };

  // --- upload ---
  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = design.width * 0.6;
        const ratio = img.naturalWidth / img.naturalHeight;
        const w = Math.min(maxW, img.naturalWidth);
        addElement({
          id: uid(), type: "image", src,
          x: (design.width - w) / 2, y: design.height * 0.25,
          w, h: w / ratio, rotation: 0, opacity: 1, locked: false,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ============================================================
  // Render helpers
  // ============================================================

  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  const selectionOverlay = selected && (
    <div
      className="absolute pointer-events-none"
      style={{
        left: selected.x * scale, top: selected.y * scale,
        width: selected.w * scale, height: selected.h * scale,
        transform: selected.rotation ? `rotate(${selected.rotation}deg)` : undefined,
        transformOrigin: "center center",
      }}
    >
      <div className="absolute inset-0 border-2 border-[#7C3AED]" />
      {handles.map((h) => {
        const pos: React.CSSProperties = { position: "absolute", width: 10, height: 10, background: "#fff", border: "2px solid #7C3AED", borderRadius: 2, pointerEvents: "auto" };
        if (h.includes("n")) pos.top = -5; if (h.includes("s")) pos.bottom = -5;
        if (h.includes("w")) pos.left = -5; if (h.includes("e")) pos.right = -5;
        if (h === "n" || h === "s") { pos.left = "50%"; pos.marginLeft = -5; }
        if (h === "e" || h === "w") { pos.top = "50%"; pos.marginTop = -5; }
        pos.cursor = `${h}-resize`;
        return <div key={h} style={pos} onPointerDown={(e) => onHandlePointerDown(e, h)} />;
      })}
      {/* rotate handle */}
      <div
        className="absolute pointer-events-auto flex items-center justify-center"
        style={{ left: "50%", top: -30, marginLeft: -9, width: 18, height: 18, background: "#fff", border: "2px solid #7C3AED", borderRadius: "50%", cursor: "grab" }}
        onPointerDown={onRotateHandleDown}
      >
        <Maximize2 style={{ width: 10, height: 10, color: "#7C3AED", transform: "rotate(45deg)" }} />
      </div>
      <div className="absolute -top-8 left-0 px-1.5 py-0.5 rounded bg-[#7C3AED] text-[10px] text-white font-medium whitespace-nowrap">
        {Math.round(selected.w)} × {Math.round(selected.h)}
      </div>
    </div>
  );

  // inline text editor overlay
  const textEditor = editingTextId && (() => {
    const el = design.elements.find((e) => e.id === editingTextId);
    if (!el || el.type !== "text") return null;
    return (
      <textarea
        autoFocus
        value={el.text || ""}
        onChange={(e) => updateElement(el.id, { text: e.target.value }, false)}
        onBlur={() => { commit(design); setEditingTextId(null); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
        }}
        className="absolute z-30 outline-none resize-none bg-transparent"
        style={{
          left: el.x * scale, top: el.y * scale, width: el.w * scale, height: Math.max(el.h * scale, (el.fontSize || 40) * (el.lineHeight || 1.2) * scale * 2),
          fontFamily: fontStack(el.font), fontSize: (el.fontSize || 40) * scale,
          fontWeight: el.fontWeight || 400, color: el.color,
          textAlign: el.align || "center", lineHeight: el.lineHeight || 1.2,
          letterSpacing: (el.letterSpacing || 0) * scale,
        }}
      />
    );
  })();

  const tabs: { id: Tab; label: string; icon: typeof Type }[] = [
    { id: "text", label: "Text", icon: Type },
    { id: "shapes", label: "Shapes", icon: Square },
    { id: "clipart", label: "Graphics", icon: Sticker },
    { id: "uploads", label: "Uploads", icon: Upload },
    { id: "background", label: "Background", icon: Palette },
    { id: "layers", label: "Layers", icon: Layers },
  ];

  // ============================================================
  // Markup
  // ============================================================

  return (
    <div className="h-screen flex flex-col bg-[#0c0c0f] text-white overflow-hidden">
      {/* ============ TOP BAR ============ */}
      <div className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center px-4 gap-3 flex-shrink-0">
        {onExit && (
          <button onClick={onExit} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <div className="w-px h-6 bg-white/10" />
        <input
          value={design.name}
          onChange={(e) => commit({ ...design, name: e.target.value })}
          className="bg-transparent text-sm font-semibold w-48 outline-none border-b border-transparent hover:border-white/20 focus:border-violet-500 transition-colors"
        />
        <div className="hidden md:block text-[11px] text-white/30">
          {design.width} × {design.height}px
        </div>
        <div className="flex-1" />
        <button onClick={undo} disabled={!history.past.length} className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-25 transition-all" title="Undo (⌘Z)">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={redo} disabled={!history.future.length} className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-25 transition-all" title="Redo (⇧⌘Z)">
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-white/10" />
        {embedMode ? (
          <button onClick={handleDone} disabled={exporting} className="px-5 h-9 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {exporting ? "Saving…" : "Save design"}
          </button>
        ) : (
          <>
            <button onClick={() => { const json = JSON.stringify(design, null, 2); downloadDataUrl("data:application/json;charset=utf-8," + encodeURIComponent(json), "design.json"); }}
              className="px-3 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-all hidden sm:block">
              .json
            </button>
            <button onClick={handleDownload} disabled={exporting} className="px-5 h-9 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? "Exporting…" : "Download PNG"}
            </button>
          </>
        )}
      </div>

      {/* ============ AI BAR ============ */}
      <div className="border-b border-white/10 bg-violet-500/5 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
        <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") runAi(); }}
          placeholder={"Describe your design — e.g. 50% off sale poster for Bella's Boutique, elegant gold and black, sale starts Friday, www.bella.com"}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/25"
        />
        <button onClick={runAi} disabled={aiBusy || !aiPrompt.trim()} className="px-4 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold transition-all disabled:opacity-30 flex items-center gap-1.5 flex-shrink-0">
          {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {aiBusy ? "Designing…" : "Generate"}
        </button>
      </div>
      {aiNotes.length > 0 && (
        <div className="bg-violet-500/5 border-b border-violet-500/10 px-4 py-1.5 text-[11px] text-violet-300/70 flex gap-2 flex-wrap flex-shrink-0">
          <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {aiNotes.map((n, i) => <span key={i}>{n}</span>)}
          <button onClick={() => setAiNotes([])} className="ml-auto text-white/30 hover:text-white/60">✕</button>
        </div>
      )}

      {/* ============ MAIN AREA ============ */}
      <div className="flex-1 flex min-h-0">
        {/* ---- canvas ---- */}
        <div ref={canvasAreaRef} className="flex-1 relative overflow-hidden flex items-center justify-center p-8"
          onPointerDown={(e) => { if (e.target === e.currentTarget) { setSelectedId(null); setEditingTextId(null); } }}
        >
          <div className="relative shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-sm">
            <div data-canvas className="relative" style={{ width: canvasW, height: canvasH }}
              onPointerDown={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.bg) { setSelectedId(null); setEditingTextId(null); } }}
            >
              {/* elements layer: rendered individually for interactivity */}
              <div className="absolute inset-0 overflow-hidden checker-bg" style={{ background: undefined }} data-bg="true" />
              <div className="absolute inset-0" data-bg="true" style={{ background: `linear-gradient(${design.background.angle}deg, ${design.background.from}, ${design.background.to})` }} />
              {design.background.image && <img src={design.background.image} alt="" data-bg="true" className="absolute inset-0 w-full h-full object-cover" />}
              {design.background.image && (
                <div data-bg="true" className="absolute inset-0" style={{ background: `linear-gradient(${design.background.angle}deg, ${design.background.from}, ${design.background.to})`, opacity: design.background.overlayOpacity ?? 0.75 }} />
              )}
              <PatternOverlay design={design} />
              {design.elements.map((el) => (
                <div
                  key={el.id}
                  className={`absolute ${el.locked ? "cursor-default" : "cursor-move"} ${el.id === editingTextId ? "opacity-0" : ""}`}
                  style={{
                    left: el.x * scale, top: el.y * scale,
                    width: el.w * scale, height: el.h * scale,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                    transformOrigin: "center center",
                    opacity: el.opacity,
                  }}
                  onPointerDown={(e) => onElementPointerDown(e, el)}
                  onDoubleClick={() => { if (el.type === "text" && !el.locked) { setSelectedId(el.id); setEditingTextId(el.id); } }}
                >
                  <InteractiveElement el={el} scale={scale} />
                </div>
              ))}
              {selectionOverlay}
              {textEditor}
            </div>
          </div>
        </div>

        {/* ---- sidebar ---- */}
        <div className="w-[300px] flex-shrink-0 border-l border-white/10 bg-black/30 flex flex-col min-h-0">
          {/* tabs */}
          <div className="grid grid-cols-6 border-b border-white/10 flex-shrink-0">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`py-2.5 flex flex-col items-center gap-0.5 text-[9px] transition-colors border-b-2 ${activeTab === t.id ? "text-violet-400 border-violet-500 bg-violet-500/5" : "text-white/40 border-transparent hover:text-white/70"}`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* panel */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === "text" && (
              <TextPanel design={design} selected={selected} updateElement={updateElement} commit={commit}
                addText={() => addElement(textDefaults(design))} />
            )}
            {activeTab === "shapes" && (
              <ShapesPanel addShape={(s: ShapeKind) => addElement({
                id: uid(), type: "shape", shape: s, fill: "#F59E0B",
                x: design.width * 0.35, y: design.height * 0.35,
                w: design.width * 0.25, h: design.width * 0.25, rotation: 0, opacity: 0.9, locked: false,
              })} />
            )}
            {activeTab === "clipart" && (
              <ClipartPanel addClipart={(emoji) => addElement({
                id: uid(), type: "clipart", emoji,
                x: design.width * 0.4, y: design.height * 0.3,
                w: Math.round(design.width * 0.2), h: Math.round(design.width * 0.2), rotation: 0, opacity: 1, locked: false,
                fontSize: Math.round(design.width * 0.2),
              })} />
            )}
            {activeTab === "uploads" && (
              <div>
                <label className="block border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
                  <Upload className="w-7 h-7 mx-auto text-white/25 mb-2" />
                  <div className="text-xs font-medium">Click to upload</div>
                  <div className="text-[10px] text-white/35 mt-1">PNG, JPG, SVG — stays in your browser</div>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { Array.from(e.target.files || []).forEach(handleUpload); e.target.value = ""; }} />
                </label>
              </div>
            )}
            {activeTab === "background" && <BackgroundPanel design={design} commit={commit} />}
            {activeTab === "layers" && (
              <LayersPanel design={design} selectedId={selectedId} setSelectedId={setSelectedId}
                updateElement={updateElement} deleteElement={(id) => { commit({ ...design, elements: design.elements.filter((x) => x.id !== id) }); if (selectedId === id) setSelectedId(null); }} />
            )}
          </div>

          {/* action bar for selected */}
          {selected && (
            <div className="border-t border-white/10 p-2 flex items-center gap-1 flex-shrink-0 bg-black/40">
              <button onClick={duplicateSelected} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
              <button onClick={() => updateElement(selected.id, { locked: !selected.locked })} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" title={selected.locked ? "Unlock" : "Lock"}>
                {selected.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <button onClick={bringForward} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-[10px]" title="Bring forward">↑</button>
              <button onClick={sendBackward} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-[10px]" title="Send backward">↓</button>
              <div className="flex-1" />
              <button onClick={deleteSelected} className="w-8 h-8 rounded-lg bg-red-500/15 hover:bg-red-500/25 flex items-center justify-center transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-panels
// ============================================================

function PatternOverlay({ design }: { design: StudioDesign }) {
  const { pattern } = design.background;
  if (pattern === "dots") return <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }} />;
  if (pattern === "grid") return <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />;
  if (pattern === "diagonal") return <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px)" }} />;
  return null;
}

function InteractiveElement({ el, scale }: { el: StudioElement; scale: number }) {
  if (el.type === "text") {
    return (
      <div className="w-full h-full flex flex-col justify-center" style={{
        fontFamily: fontStack(el.font), fontSize: (el.fontSize || 40) * scale,
        fontWeight: el.fontWeight || 400, fontStyle: el.italic ? "italic" : "normal",
        color: el.color, textAlign: el.align || "center",
        lineHeight: el.lineHeight || 1.2, letterSpacing: (el.letterSpacing || 0) * scale,
        whiteSpace: "pre-wrap", overflow: "visible",
      }}>
        {el.uppercase ? (el.text || "").toUpperCase() : el.text}
      </div>
    );
  }
  if (el.type === "shape") {
    if (el.shape === "triangle") {
      return <div className="w-full h-full" style={{ background: "transparent" }} />;
    }
    const radius = el.shape === "circle" ? "50%" : el.shape === "pill" ? "999px" : 0;
    return <div className="w-full h-full" style={{ background: el.fill, borderRadius: radius, height: el.shape === "line" ? Math.max(2 * scale, el.h * scale) : undefined }} />;
  }
  if (el.type === "image" && el.src) {
    return <img src={el.src} alt="" draggable={false} className="w-full h-full object-contain" />;
  }
  if (el.type === "clipart") {
    return (
      <div className="w-full h-full flex items-center justify-center select-none" style={{ fontSize: (el.fontSize || Math.min(el.w, el.h)) * scale, lineHeight: 1 }}>
        {el.emoji}
      </div>
    );
  }
  return null;
}

function TextPanel({ design, selected, updateElement, commit, addText }: {
  design: StudioDesign; selected: StudioElement | null;
  updateElement: (id: string, u: Partial<StudioElement>, c?: boolean) => void;
  commit: (d: StudioDesign) => void; addText: () => void;
}) {
  const fonts = FONT_LIBRARY;
  if (!selected || selected.type !== "text") {
    return (
      <div className="space-y-3">
        <button onClick={addText} className="w-full py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-xs text-violet-300 font-medium flex items-center justify-center gap-1.5 transition-colors">
          <Plus className="w-4 h-4" /> Add a text box
        </button>
        <p className="text-[11px] text-white/30 px-1">Tip: double-click any text on the canvas to edit it.</p>
      </div>
    );
  }
  const el = selected;
  return (
    <div className="space-y-3">
      <button onClick={addText} className="w-full py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-xs text-violet-300 font-medium flex items-center justify-center gap-1.5 transition-colors">
        <Plus className="w-4 h-4" /> Add a text box
      </button>
      <div className="space-y-2.5 p-3 rounded-xl bg-white/5 border border-violet-500/20">
        <textarea
          value={el.text || ""}
          onChange={(e) => updateElement(el.id, { text: e.target.value }, false)}
          onBlur={() => commit(design)}
          rows={2}
          className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs resize-none outline-none focus:border-violet-500"
        />
        <div>
          <label className="text-[10px] text-white/40 block mb-1">Font</label>
          <div className="relative">
            <select value={el.font || "poppins"} onChange={(e) => updateElement(el.id, { font: e.target.value })}
              className="w-full px-2 py-1.5 pr-7 rounded-lg bg-white/5 border border-white/10 text-xs outline-none focus:border-violet-500 appearance-none">
              {fonts.map((f) => <option key={f.id} value={f.id} className="bg-[#1a1a24]">{f.name} · {f.category}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-white/30 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-white/40 block mb-1">Size — {el.fontSize}px</label>
          <input type="range" min={8} max={300} value={el.fontSize || 40} onChange={(e) => updateElement(el.id, { fontSize: parseInt(e.target.value) }, false)} onMouseUp={() => commit(design)} className="w-full accent-violet-500" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex gap-1">
            <button onClick={() => updateElement(el.id, { fontWeight: el.fontWeight === 700 ? 400 : 700 })} className={`flex-1 h-8 rounded-lg text-xs flex items-center justify-center transition-colors ${el.fontWeight === 700 ? "bg-violet-500/25 text-violet-300" : "bg-white/5 hover:bg-white/10"}`}><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={() => updateElement(el.id, { italic: !el.italic })} className={`flex-1 h-8 rounded-lg text-xs flex items-center justify-center transition-colors ${el.italic ? "bg-violet-500/25 text-violet-300" : "bg-white/5 hover:bg-white/10"}`}><Italic className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex gap-1">
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
              <button key={a} onClick={() => updateElement(el.id, { align: a })} className={`flex-1 h-8 rounded-lg text-xs flex items-center justify-center transition-colors ${(el.align || "center") === a ? "bg-violet-500/25 text-violet-300" : "bg-white/5 hover:bg-white/10"}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-white/40">Color</label>
          <input type="color" value={el.color?.startsWith("#") ? el.color : "#FFFFFF"} onChange={(e) => updateElement(el.id, { color: e.target.value }, false)} onMouseUp={() => commit(design)} className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10" />
          <label className="text-[10px] text-white/40 ml-auto">Aa</label>
          <button onClick={() => updateElement(el.id, { uppercase: !el.uppercase })} className={`px-2 h-7 rounded text-[10px] font-semibold transition-colors ${el.uppercase ? "bg-violet-500/25 text-violet-300" : "bg-white/5 hover:bg-white/10"}`}>UPPERCASE</button>
        </div>
        <div>
          <label className="text-[10px] text-white/40 block mb-1">Letter spacing — {el.letterSpacing || 0}px</label>
          <input type="range" min={-5} max={20} value={el.letterSpacing || 0} onChange={(e) => updateElement(el.id, { letterSpacing: parseInt(e.target.value) }, false)} onMouseUp={() => commit(design)} className="w-full accent-violet-500" />
        </div>
        <div>
          <label className="text-[10px] text-white/40 block mb-1">Line height — {el.lineHeight || 1.2}</label>
          <input type="range" min={0.8} max={2} step={0.05} value={el.lineHeight || 1.2} onChange={(e) => updateElement(el.id, { lineHeight: parseFloat(e.target.value) }, false)} onMouseUp={() => commit(design)} className="w-full accent-violet-500" />
        </div>
      </div>
    </div>
  );
}

function ShapesPanel({ addShape }: { addShape: (s: ShapeKind) => void }) {
  const items: { id: ShapeKind; label: string; preview: React.ReactNode }[] = [
    { id: "rect", label: "Rectangle", preview: <div className="w-8 h-6 bg-amber-500/80 rounded-[2px]" /> },
    { id: "pill", label: "Pill", preview: <div className="w-9 h-5 bg-amber-500/80 rounded-full" /> },
    { id: "circle", label: "Circle", preview: <div className="w-7 h-7 bg-amber-500/80 rounded-full" /> },
    { id: "triangle", label: "Triangle", preview: <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[22px] border-l-transparent border-r-transparent border-b-amber-500/80" /> },
    { id: "line", label: "Line", preview: <div className="w-9 h-[3px] bg-amber-500/80 rounded" /> },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((s) => (
        <button key={s.id} onClick={() => addShape(s.id)} className="aspect-square rounded-xl bg-white/5 hover:bg-violet-500/10 border border-white/5 flex flex-col items-center justify-center gap-1.5 transition-colors">
          {s.preview}
          <span className="text-[9px] text-white/50">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function ClipartPanel({ addClipart }: { addClipart: (emoji: string) => void }) {
  const cats = Array.from(new Set(CLIPART.map((c) => c.category)));
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-white/30 px-1">Click any graphic to add it</p>
      {cats.map((cat) => (
        <div key={cat}>
          <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5 px-1">{cat}</div>
          <div className="grid grid-cols-5 gap-1.5">
            {CLIPART.filter((c) => c.category === cat).map((c) => (
              <button key={c.id} onClick={() => addClipart(c.emoji)} title={c.label}
                className="aspect-square rounded-lg bg-white/5 hover:bg-violet-500/15 flex items-center justify-center text-lg transition-colors">
                {c.emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BackgroundPanel({ design, commit }: { design: StudioDesign; commit: (d: StudioDesign) => void }) {
  const setBg = (updates: Partial<StudioDesign["background"]>) => commit({ ...design, background: { ...design.background, ...updates } });
  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setBg({ image: reader.result as string });
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1.5">Gradients</label>
        <div className="grid grid-cols-2 gap-1.5">
          {GRADIENT_PRESETS.map((g) => (
            <button key={g.name} onClick={() => setBg({ from: g.from, to: g.to, image: undefined })}
              className="h-12 rounded-lg border border-white/10 hover:border-violet-500/50 transition-colors relative overflow-hidden group"
              style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}>
              <span className="absolute bottom-0 inset-x-0 text-[8px] py-0.5 bg-black/50 group-hover:bg-black/70 transition-colors">{g.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1.5">Solid colors</label>
        <div className="grid grid-cols-10 gap-1">
          {SOLID_SWATCHES.map((c) => (
            <button key={c} onClick={() => setBg({ from: c, to: c, image: undefined })}
              className="aspect-square rounded-md border border-white/15 hover:scale-110 transition-transform" style={{ background: c }} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1.5">Pattern</label>
        <div className="grid grid-cols-4 gap-1.5">
          {(["none", "dots", "grid", "diagonal"] as const).map((p) => (
            <button key={p} onClick={() => setBg({ pattern: p })}
              className={`py-2 rounded-lg text-[10px] capitalize transition-colors ${design.background.pattern === p ? "bg-violet-500/25 text-violet-300 border border-violet-500/40" : "bg-white/5 border border-white/5 hover:bg-white/10"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1.5">Photo background</label>
        {design.background.image ? (
          <div className="flex items-center gap-2">
            <img src={design.background.image} alt="" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
            <button onClick={() => setBg({ image: undefined })} className="text-[11px] text-red-400 hover:text-red-300">Remove</button>
          </div>
        ) : (
          <label className="block border-2 border-dashed border-white/15 rounded-xl p-5 text-center cursor-pointer hover:border-violet-500/40 transition-colors">
            <Upload className="w-5 h-5 mx-auto text-white/25 mb-1.5" />
            <span className="text-[11px] text-white/50">Upload a photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = ""; }} />
          </label>
        )}
        {design.background.image && (
          <div className="mt-2">
            <label className="text-[10px] text-white/40 block mb-1">Overlay strength — {Math.round((design.background.overlayOpacity ?? 0.75) * 100)}%</label>
            <input type="range" min={0} max={1} step={0.05} value={design.background.overlayOpacity ?? 0.75}
              onChange={(e) => setBg({ overlayOpacity: parseFloat(e.target.value) })} className="w-full accent-violet-500" />
          </div>
        )}
      </div>
    </div>
  );
}

function LayersPanel({ design, selectedId, setSelectedId, updateElement, deleteElement }: {
  design: StudioDesign; selectedId: string | null; setSelectedId: (id: string | null) => void;
  updateElement: (id: string, u: Partial<StudioElement>) => void; deleteElement: (id: string) => void;
}) {
  const layers = [...design.elements].reverse(); // top first
  return (
    <div className="space-y-1">
      {layers.length === 0 && <p className="text-[11px] text-white/30 px-1 py-4 text-center">Nothing here yet — add text or graphics.</p>}
      {layers.map((el) => (
        <div key={el.id}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors ${selectedId === el.id ? "bg-violet-500/15 text-violet-300" : "hover:bg-white/5 text-white/60"}`}
          onClick={() => setSelectedId(el.id)}>
          <span className="w-4 text-center flex-shrink-0">
            {el.type === "text" ? <Type className="w-3 h-3 inline" /> : el.type === "clipart" ? <Sticker className="w-3 h-3 inline" /> : el.type === "image" ? <Upload className="w-3 h-3 inline" /> : <Square className="w-3 h-3 inline" />}
          </span>
          <span className="flex-1 truncate">
            {el.type === "text" ? (el.text || "Text").split("\n")[0] : el.type === "clipart" ? el.emoji : el.type === "image" ? "Image" : (el.shape || "Shape")}
          </span>
          <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }} className="text-white/30 hover:text-amber-400">
            {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="text-white/30 hover:text-red-400">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
