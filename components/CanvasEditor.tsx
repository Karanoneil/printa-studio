"use client";

import { useState, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Type, Square, Palette, Download, Undo2, Redo2,
  Layers, Italic, Trash2, Lock, Unlock, Plus, Ruler, Frame,
  Sticker, Upload,
} from "lucide-react";
import { FONT_LIBRARY, CLIPART, BORDERS } from "@/lib/data";
import type { GeneratedDesign, DesignElement } from "@/lib/designEngine";

interface Props {
  design: GeneratedDesign;
  onUpdate: (design: GeneratedDesign) => void;
  onBack: () => void;
  onContinue: () => void;
}

type Tab = "text" | "shapes" | "clipart" | "borders" | "colors" | "logo" | "layers";

export function CanvasEditor({ design, onUpdate, onBack, onContinue }: Props) {
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [history, setHistory] = useState<GeneratedDesign[]>([design]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const idCounter = useRef(0);
  const nextId = () => `el-${++idCounter.current}`;
  const aspectRatio = design.widthIn / design.heightIn;
  const current = history[historyIndex];

  const pushHistory = (d: GeneratedDesign) => {
    const h = history.slice(0, historyIndex + 1);
    h.push(d);
    setHistory(h);
    setHistoryIndex(h.length - 1);
    onUpdate(d);
  };

  const updateElement = (i: number, updates: Partial<DesignElement>) => {
    const els = [...current.elements];
    els[i] = { ...els[i], ...updates };
    pushHistory({ ...current, elements: els });
  };

  const updateColors = (bg?: string, text?: string, accent?: string) => {
    pushHistory({
      ...current,
      bgGradient: bg || current.bgGradient,
      textColor: text || current.textColor,
      accentColor: accent || current.accentColor,
    });
  };

  const addText = () => {
    const el: DesignElement = { id: nextId(), type: "text", content: "New Text", role: "info", x: 50, y: 50, fontSize: 24, color: current.textColor, fontWeight: 600, fontId: current.fontId };
    pushHistory({ ...current, elements: [...current.elements, el] });
    setSelectedElement(current.elements.length);
  };

  const addClipart = (emoji: string) => {
    const el: DesignElement = { id: nextId(), type: "clipart", content: emoji, role: "decoration", x: 50, y: 50, fontSize: 48, color: "transparent", fontWeight: 0 };
    pushHistory({ ...current, elements: [...current.elements, el] });
    setSelectedElement(current.elements.length);
  };

  const addShape = (shape: string) => {
    const el: DesignElement = { id: nextId(), type: "shape", content: shape, role: "decoration", x: 50, y: 50, width: 20, height: 20, fontSize: 0, color: current.accentColor, fontWeight: 0, opacity: 0.8 };
    pushHistory({ ...current, elements: [...current.elements, el] });
    setSelectedElement(current.elements.length);
  };

  const deleteElement = (i: number) => {
    pushHistory({ ...current, elements: current.elements.filter((_, idx) => idx !== i) });
    setSelectedElement(null);
  };

  const toggleLock = (i: number) => {
    updateElement(i, { locked: !current.elements[i].locked });
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const tabs: { id: Tab; label: string; icon: typeof Type }[] = [
    { id: "text", label: "Text", icon: Type },
    { id: "shapes", label: "Shapes", icon: Square },
    { id: "clipart", label: "Clipart", icon: Sticker },
    { id: "borders", label: "Frames", icon: Frame },
    { id: "colors", label: "Colors", icon: Palette },
    { id: "logo", label: "Logo", icon: Upload },
    { id: "layers", label: "Layers", icon: Layers },
  ];

  const renderElement = (el: DesignElement, i: number) => {
    if (el.type === "shape" && el.content === "line") {
      return <div key={el.id} className="absolute" style={{ left: `${el.x - (el.width || 40) / 2}%`, width: `${el.width || 40}%`, top: `${el.y}%`, height: "2px", background: el.color, opacity: el.opacity || 0.6 }} />;
    }
    if (el.type === "logo" && el.src) {
      return <img key={el.id} src={el.src} alt="logo" className="absolute object-contain" style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width || 12}%`, height: `${el.height || 12}%`, transform: "translate(-50%, -50%)" }} />;
    }
    if (el.type === "clipart") {
      return <div key={el.id} onClick={() => setSelectedElement(i)} className={`absolute cursor-pointer ${selectedElement === i ? "ring-2 ring-violet-500 rounded" : ""}`} style={{ left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%, -50%)", fontSize: `${el.fontSize}px` }}>{el.content}</div>;
    }
    if (el.type === "shape") {
      return <div key={el.id} onClick={() => setSelectedElement(i)} className={`absolute cursor-pointer ${selectedElement === i ? "ring-2 ring-violet-500" : ""} ${el.content === "circle" ? "rounded-full" : ""}`} style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width || 20}%`, aspectRatio: "1", transform: "translate(-50%, -50%)", background: el.color, opacity: el.opacity || 0.8, borderRadius: el.content === "rounded" ? "12px" : el.content === "circle" ? "50%" : "0" }} />;
    }
    return (
      <div key={el.id} onClick={() => setSelectedElement(i)} className={`absolute cursor-pointer px-2 ${selectedElement === i ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent rounded" : ""} ${el.locked ? "cursor-not-allowed" : ""}`} style={{
        left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%, -50%)",
        fontSize: `${el.fontSize}px`, color: el.color, fontWeight: el.fontWeight,
        fontStyle: el.italic ? "italic" : "normal", whiteSpace: "nowrap",
        fontFamily: el.fontId ? `'${FONT_LIBRARY.find((f) => f.id === el.fontId)?.googleFont}', sans-serif` : undefined,
      }}>
        {el.content}
      </div>
    );
  };

  const sel = selectedElement !== null ? current.elements[selectedElement] : null;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-white/10 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <button onClick={() => canUndo && setHistoryIndex(historyIndex - 1)} disabled={!canUndo} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-colors">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => canRedo && setHistoryIndex(historyIndex + 1)} disabled={!canRedo} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-colors">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-xs text-white/40 hidden md:block">
          {current.productName} &middot; {current.widthIn}&quot; &times; {current.heightIn}&quot;
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onContinue} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-xs font-medium transition-all flex items-center gap-1.5">
            Done &middot; See bundle <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px]">
        {/* Canvas */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-[10px] text-white/30 mb-2 flex items-center gap-3">
            <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {current.widthIn}&quot; &times; {current.heightIn}&quot;</span>
            <span className="text-violet-400/50">Bleed: {current.bleedIn}&quot;</span>
            <span className="text-emerald-400/50">Safe: {current.safeZoneIn}&quot;</span>
          </div>
          <div className="relative w-full max-w-lg rounded-lg overflow-hidden shadow-2xl" style={{ aspectRatio: `${aspectRatio}` }}>
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute border-2 border-dashed border-red-500/30" style={{
                top: `${(current.bleedIn / current.heightIn) * 100}%`, bottom: `${(current.bleedIn / current.heightIn) * 100}%`,
                left: `${(current.bleedIn / current.widthIn) * 100}%`, right: `${(current.bleedIn / current.widthIn) * 100}%`,
              }} />
              <div className="absolute border border-dashed border-emerald-500/20" style={{
                top: `${(current.safeZoneIn / current.heightIn) * 100}%`, bottom: `${(current.safeZoneIn / current.heightIn) * 100}%`,
                left: `${(current.safeZoneIn / current.widthIn) * 100}%`, right: `${(current.safeZoneIn / current.widthIn) * 100}%`,
              }} />
            </div>
            <div className="absolute inset-0 checker-bg" />
            {current.bgImageUrl && <img src={current.bgImageUrl} alt="background" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35, zIndex: 0 }} />}
            <div className="absolute inset-0" style={{ background: current.bgGradient, opacity: current.bgImageUrl ? 0.6 : 1, zIndex: 0 }} />
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
              {current.bgPattern === "dots" && <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />}
              {current.bgPattern === "grid" && <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />}
              {current.elements.map((el, i) => renderElement(el, i))}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-white/20">Red = bleed edge &middot; Green = safe zone &middot; Click any element to edit</div>
        </div>

        {/* Sidebar */}
        <div className="border-l border-white/10 bg-black/20">
          <div className="flex flex-wrap border-b border-white/10">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[60px] py-2.5 flex flex-col items-center gap-0.5 text-[10px] transition-colors ${activeTab === tab.id ? "text-violet-400 border-b-2 border-violet-500 bg-violet-500/5" : "text-white/40 hover:text-white/60"}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 max-h-[500px] overflow-y-auto">
            {/* TEXT */}
            {activeTab === "text" && (
              <div className="space-y-3">
                <button onClick={addText} className="w-full py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-xs text-violet-300 flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add text
                </button>
                {sel?.type === "text" && selectedElement !== null && (
                  <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-violet-500/20">
                    <input value={sel.content} onChange={(e) => updateElement(selectedElement, { content: e.target.value })} className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={sel.fontSize} onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 16 })} className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs" />
                      <select value={sel.fontWeight} onChange={(e) => updateElement(selectedElement, { fontWeight: parseInt(e.target.value) })} className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs">
                        <option value={300}>Light</option><option value={400}>Regular</option><option value={600}>SemiBold</option><option value={700}>Bold</option><option value={800}>ExtraBold</option><option value={900}>Black</option>
                      </select>
                    </div>
                    <select value={sel.fontId || "inter"} onChange={(e) => updateElement(selectedElement, { fontId: e.target.value })} className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs">
                      {FONT_LIBRARY.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.category})</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="range" min="0" max="100" value={sel.x} onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) })} className="w-full accent-violet-500" />
                      <input type="range" min="0" max="100" value={sel.y} onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) })} className="w-full accent-violet-500" />
                    </div>
                    <div className="flex gap-2">
                      <input type="color" value={sel.color.startsWith("#") ? sel.color : "#ffffff"} onChange={(e) => updateElement(selectedElement, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10" />
                      <button onClick={() => updateElement(selectedElement, { italic: !sel.italic })} className={`px-2 py-1 rounded text-xs ${sel.italic ? "bg-violet-500/20 text-violet-300" : "bg-white/5"}`}><Italic className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleLock(selectedElement)} className={`px-2 py-1 rounded text-xs ${sel.locked ? "bg-amber-500/20 text-amber-300" : "bg-white/5"}`}>{sel.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => deleteElement(selectedElement)} className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SHAPES */}
            {activeTab === "shapes" && (
              <div className="grid grid-cols-3 gap-2">
                {[{ id: "square", label: "Square" }, { id: "circle", label: "Circle" }, { id: "rounded", label: "Rounded" }, { id: "line", label: "Line" }, { id: "triangle", label: "Triangle" }, { id: "diamond", label: "Diamond" }].map((s) => (
                  <button key={s.id} onClick={() => addShape(s.id)} className="p-3 rounded-lg bg-white/5 hover:bg-violet-500/10 text-xs flex flex-col items-center gap-1.5 transition-colors">
                    <div className={`w-8 h-8 ${s.id === "circle" ? "rounded-full" : s.id === "rounded" ? "rounded" : ""} ${s.id === "line" ? "h-1 w-8" : ""}`} style={{ background: s.id === "line" ? current.accentColor : current.accentColor }} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* CLIPART */}
            {activeTab === "clipart" && (
              <div className="space-y-3">
                <p className="text-xs text-white/40">Click to add to your design</p>
                {Array.from(new Set(CLIPART.map((c) => c.category))).map((cat) => (
                  <div key={cat}>
                    <div className="text-[10px] font-semibold text-white/30 uppercase mb-1.5">{cat}</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {CLIPART.filter((c) => c.category === cat).map((c) => (
                        <button key={c.id} onClick={() => addClipart(c.emoji)} className="aspect-square rounded-lg bg-white/5 hover:bg-violet-500/10 flex items-center justify-center text-lg transition-colors" title={c.label}>{c.emoji}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BORDERS */}
            {activeTab === "borders" && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 mb-2">Add a decorative frame</p>
                {BORDERS.map((b) => (
                  <button key={b.id} className="w-full p-3 rounded-lg bg-white/5 hover:bg-violet-500/10 text-xs flex items-center justify-between transition-colors">
                    <span className="font-medium">{b.name}</span>
                    <span className="font-mono text-white/40">{b.preview}</span>
                  </button>
                ))}
              </div>
            )}

            {/* COLORS */}
            {activeTab === "colors" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Primary (background)</label>
                  <div className="flex gap-2">
                    <input type="color" value={current.primaryColor} onChange={(e) => updateColors(`linear-gradient(135deg, ${e.target.value} 0%, ${current.accentColor} 100%)`, undefined, undefined)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10" />
                    <span className="text-[10px] font-mono text-white/40 self-center">{current.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Accent</label>
                  <div className="flex gap-2">
                    <input type="color" value={current.accentColor} onChange={(e) => updateColors(`linear-gradient(135deg, ${current.primaryColor} 0%, ${e.target.value} 100%)`, undefined, e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10" />
                    <span className="text-[10px] font-mono text-white/40 self-center">{current.accentColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Text</label>
                  <div className="flex gap-2">
                    <input type="color" value={current.textColor} onChange={(e) => updateColors(undefined, e.target.value, undefined)} className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10" />
                    <span className="text-[10px] font-mono text-white/40 self-center">{current.textColor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* LOGO */}
            {activeTab === "logo" && (
              <div className="space-y-3">
                <p className="text-xs text-white/40">Upload your logo to place it on the design</p>
                <label className="block border-2 border-dashed border-white/15 rounded-lg p-4 text-center cursor-pointer hover:border-violet-500/40 transition-colors">
                  <Upload className="w-6 h-6 mx-auto text-white/30 mb-2" />
                  <span className="text-xs">Upload logo (PNG/JPG)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = URL.createObjectURL(f);
                    const el: DesignElement = { id: nextId(), type: "logo", content: "logo", role: "logo", x: 50, y: 90, width: 15, height: 15, fontSize: 0, color: "transparent", fontWeight: 0, src: url, locked: true };
                    pushHistory({ ...current, elements: [...current.elements, el] });
                  }} />
                </label>
              </div>
            )}

            {/* LAYERS */}
            {activeTab === "layers" && (
              <div className="space-y-1">
                {current.elements.map((el, i) => (
                  <div key={el.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${selectedElement === i ? "bg-violet-500/15 text-violet-300" : "hover:bg-white/5 text-white/60"}`} onClick={() => setSelectedElement(i)}>
                    {el.type === "text" ? <Type className="w-3.5 h-3.5" /> : el.type === "clipart" ? <Sticker className="w-3.5 h-3.5" /> : el.type === "logo" ? <Upload className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    <span className="flex-1 truncate">{el.content || el.type}</span>
                    {el.locked ? <Lock className="w-3 h-3 text-amber-400" /> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
