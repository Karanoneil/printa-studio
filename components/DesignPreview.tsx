"use client";

import { motion } from "framer-motion";
import { Edit3 } from "lucide-react";
import { useState } from "react";
import type { GeneratedDesign } from "@/lib/designEngine";
import { FONT_LIBRARY } from "@/lib/data";

interface Props {
  design: GeneratedDesign;
  onEdit: () => void;
  featured?: boolean;
  compact?: boolean;
}

export function DesignPreview({ design, onEdit, featured, compact }: Props) {
  const aspectRatio = design.widthIn / design.heightIn;
  const font = FONT_LIBRARY.find((f) => f.id === design.fontId);
  const fontFamily = font?.googleFont ? `'${font.googleFont}', sans-serif` : undefined;
  const [showMockup, setShowMockup] = useState(false);

  const renderElement = (el: typeof design.elements[number], scale: number) => {
    if (el.type === "shape" && el.content === "line") {
      return (
        <div
          key={el.id}
          className="absolute"
          style={{
            left: `${el.x - (el.width || 40) / 2}%`,
            width: `${el.width || 40}%`,
            top: `${el.y}%`,
            height: "2px",
            background: el.color,
            opacity: el.opacity || 0.6,
          }}
        />
      );
    }
    if (el.type === "logo" && el.src) {
      return (
        <img
          key={el.id}
          src={el.src}
          alt="logo"
          className="absolute object-contain"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.width || 12}%`,
            height: `${el.height || 12}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      );
    }
    return (
      <div
        key={el.id}
        className="absolute px-2"
        style={{
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: "translate(-50%, -50%)",
          fontSize: `${el.fontSize * scale}px`,
          color: el.color,
          fontWeight: el.fontWeight,
          fontStyle: el.italic ? "italic" : "normal",
          whiteSpace: "nowrap",
          letterSpacing: "-0.02em",
          fontFamily: el.fontId
            ? `'${FONT_LIBRARY.find((f) => f.id === el.fontId)?.googleFont}', sans-serif`
            : fontFamily,
          textShadow: design.bgImageUrl
            ? "0 2px 8px rgba(0,0,0,0.6)"
            : "0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        {el.content}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      className={`group relative rounded-xl overflow-hidden border border-white/10 bg-black/20 transition-all ${featured ? "shadow-2xl shadow-violet-500/10" : ""}`}
    >
      {/* Design / Mockup toggle */}
      {design.mockupUrl && !compact && (
        <div className="absolute top-2 right-2 z-30 flex gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-0.5">
          <button
            onClick={() => setShowMockup(false)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${!showMockup ? "bg-violet-500/30 text-violet-200" : "text-white/50 hover:text-white/80"}`}
          >
            Design
          </button>
          <button
            onClick={() => setShowMockup(true)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${showMockup ? "bg-violet-500/30 text-violet-200" : "text-white/50 hover:text-white/80"}`}
          >
            Mockup
          </button>
        </div>
      )}

      {showMockup && design.mockupUrl ? (
        <div className="relative w-full" style={{ aspectRatio: `${aspectRatio}` }}>
          <img src={design.mockupUrl} alt="Lifestyle mockup" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: featured ? "50%" : "40%", aspectRatio: `${aspectRatio}`, maxHeight: "70%" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded shadow-2xl" style={{ background: design.bgGradient, fontFamily, opacity: 0.95 }}>
                {design.bgImageUrl && <img src={design.bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover rounded opacity-40" />}
                {design.elements.map((el) => renderElement(el, 0.3))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full checker-bg overflow-hidden" style={{ aspectRatio: `${aspectRatio}` }}>
          {/* Bleed indicator */}
          {featured && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute border border-dashed border-white/10" style={{
                top: `${(design.bleedIn / design.heightIn) * 100}%`,
                bottom: `${(design.bleedIn / design.heightIn) * 100}%`,
                left: `${(design.bleedIn / design.widthIn) * 100}%`,
                right: `${(design.bleedIn / design.widthIn) * 100}%`,
              }} />
            </div>
          )}

          {/* Background image */}
          {design.bgImageUrl && (
            <img src={design.bgImageUrl} alt="background" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: design.bgGradient, opacity: design.bgImageUrl ? 0.6 : 1 }} />

          {/* Pattern */}
          {design.bgPattern === "dots" && (
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          )}
          {design.bgPattern === "grid" && (
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          )}

          {/* Elements */}
          {design.elements.map((el) => renderElement(el, compact ? 0.45 : 1))}

          {/* Size badge */}
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[9px] font-mono text-white/60">
            {design.widthIn}&quot; &times; {design.heightIn}&quot;
          </div>
        </div>
      )}

      {/* Hover overlay */}
      {!compact && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <button onClick={onEdit} className="pointer-events-auto px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-xs font-medium flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Edit design
          </button>
        </div>
      )}

      {/* Info bar */}
      <div className="p-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{design.productName}</div>
          <div className="text-[10px] text-white/40">{design.widthIn}&quot; &times; {design.heightIn}&quot;</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-emerald-400">${design.price.toFixed(2)}</div>
          {design.isUpsell && <div className="text-[9px] text-amber-400/70 font-medium">CROSS-SELL</div>}
        </div>
      </div>
    </motion.div>
  );
}
