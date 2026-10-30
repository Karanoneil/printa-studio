"use client";

// ============================================================
// DesignRenderer — single source of truth for drawing a
// StudioDesign. Used by the editor canvas (interactive),
// template thumbnails, and previews — guaranteed WYSIWYG.
// ============================================================

import React from "react";
import type { StudioDesign, StudioElement } from "@/lib/studio";
import { FONT_LIBRARY } from "@/lib/data";

export function fontStack(fontId?: string): string {
  const f = fontId ? FONT_LIBRARY.find((x) => x.id === fontId) : undefined;
  return f ? `'${f.googleFont}', 'Segoe UI', sans-serif` : "'Segoe UI', sans-serif";
}

export function renderBackground(design: StudioDesign): React.CSSProperties {
  const { from, to, angle } = design.background;
  const rgbFrom = hexToRgb(from), rgbTo = hexToRgb(to);
  if (!rgbFrom || !rgbTo) return { background: from };
  return {
    background: `linear-gradient(${angle}deg, rgba(${rgbFrom.r},${rgbFrom.g},${rgbFrom.b},1) 0%, rgba(${rgbTo.r},${rgbTo.g},${rgbTo.b},1) 100%)`,
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "");
  if (m.length !== 6) return null;
  const n = parseInt(m, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function patternLayer(design: StudioDesign): React.ReactNode {
  const { pattern } = design.background;
  if (pattern === "dots") {
    return <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }} />;
  }
  if (pattern === "grid") {
    return (
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
    );
  }
  if (pattern === "diagonal") {
    return <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px)" }} />;
  }
  return null;
}

export function ElementView({ el, scale }: { el: StudioElement; scale: number }) {
  const common: React.CSSProperties = {
    position: "absolute",
    left: el.x * scale,
    top: el.y * scale,
    width: el.w * scale,
    height: el.h * scale,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    transformOrigin: "center center",
    opacity: el.opacity,
  };

  if (el.type === "text") {
    const display = el.uppercase ? el.text?.toUpperCase() : el.text;
    return (
      <div style={{
        ...common,
        fontFamily: fontStack(el.font),
        fontSize: (el.fontSize || 40) * scale,
        fontWeight: el.fontWeight || 400,
        fontStyle: el.italic ? "italic" : "normal",
        color: el.color,
        textAlign: el.align || "center",
        lineHeight: el.lineHeight || 1.2,
        letterSpacing: (el.letterSpacing || 0) * scale,
        whiteSpace: "pre-wrap",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "visible",
      }}>
        {display}
      </div>
    );
  }

  if (el.type === "shape") {
    const isLine = el.shape === "line";
    const radius = el.shape === "circle" ? "50%" : el.shape === "pill" ? "999px" : "0";
    if (el.shape === "triangle") {
      return (
        <div style={{
          ...common,
          width: 0, height: 0,
          borderLeft: `${(el.w * scale) / 2}px solid transparent`,
          borderRight: `${(el.w * scale) / 2}px solid transparent`,
          borderBottom: `${el.h * scale}px solid ${el.fill}`,
          background: "transparent",
        }} />
      );
    }
    return <div style={{ ...common, background: isLine ? el.fill : el.fill, borderRadius: isLine ? 0 : radius, height: isLine ? Math.max(2 * scale, el.h * scale) : el.h * scale }} />;
  }

  if (el.type === "image" && el.src) {
    return <img src={el.src} alt="" draggable={false} style={{ ...common, objectFit: "contain" }} />;
  }

  if (el.type === "clipart") {
    return (
      <div style={{
        ...common,
        fontSize: (el.fontSize || Math.min(el.w, el.h)) * scale,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        userSelect: "none",
      }}>
        {el.emoji}
      </div>
    );
  }

  return null;
}

interface RendererProps {
  design: StudioDesign;
  /** displayed width in CSS px; canvas scales proportionally */
  width: number;
  className?: string;
  children?: React.ReactNode; // overlays (selection handles etc.)
  onPointerDownBg?: (e: React.PointerEvent) => void;
}

export function DesignRenderer({ design, width, className, children, onPointerDownBg }: RendererProps) {
  const scale = width / design.width;
  return (
    <div
      className={`relative overflow-hidden ${className || ""}`}
      style={{ width, height: design.height * scale, ...renderBackground(design) }}
      onPointerDown={onPointerDownBg}
    >
      {design.background.image && (
        <img src={design.background.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {design.background.image && (
        <div className="absolute inset-0" style={{ ...renderBackground(design), opacity: design.background.overlayOpacity ?? 0.75 }} />
      )}
      {patternLayer(design)}
      {design.elements.map((el) => (
        <ElementView key={el.id} el={el} scale={scale} />
      ))}
      {children}
    </div>
  );
}
