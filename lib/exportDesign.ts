// ============================================================
// exportDesign — renders a StudioDesign to an HTMLCanvasElement
// at full resolution without any external dependency.
// ============================================================

import type { StudioDesign, StudioElement } from "./studio";
import { FONT_LIBRARY } from "./data";

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function googleFont(el: StudioElement): string {
  const f = el.font ? FONT_LIBRARY.find((x) => x.id === el.font) : undefined;
  return f ? `'${f.googleFont}'` : "sans-serif";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawPattern(ctx: CanvasRenderingContext2D, design: StudioDesign) {
  const { pattern } = design.background;
  const W = design.width, H = design.height;
  ctx.save();
  ctx.globalAlpha = pattern === "none" ? 0 : 0.07;
  if (pattern === "dots") {
    ctx.fillStyle = "#FFFFFF";
    const s = 22;
    for (let y = s / 2; y < H; y += s) {
      for (let x = s / 2; x < W; x += s) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === "grid") {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    const s = 48;
    for (let x = 0; x <= W; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else if (pattern === "diagonal") {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    const s = 14;
    ctx.beginPath();
    for (let d = -H; d < W + H; d += s) {
      ctx.moveTo(d, 0);
      ctx.lineTo(d + H, H);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, el: StudioElement) {
  const text = el.uppercase ? (el.text || "").toUpperCase() : el.text || "";
  const lines = text.split("\n");
  const fontSize = el.fontSize || 40;
  const lh = (el.lineHeight || 1.2) * fontSize;

  ctx.save();
  ctx.font = `${el.italic ? "italic " : ""}${el.fontWeight || 400} ${fontSize}px ${googleFont(el)}, sans-serif`;
  ctx.fillStyle = el.color || "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = el.align || "center";
  try {
    // modern browsers support letterSpacing on 2D context
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${el.letterSpacing || 0}px`;
  } catch {
    /* noop — older browsers just ignore spacing */
  }

  const centerX = el.x + el.w / 2;
  const totalH = lines.length * lh;
  let startY = el.y + el.h / 2 - totalH / 2 + lh / 2;

  for (const line of lines) {
    const tx = el.align === "left" ? el.x : el.align === "right" ? el.x + el.w : centerX;
    ctx.fillText(line, tx, startY);
    startY += lh;
  }
  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, el: StudioElement) {
  ctx.save();
  ctx.globalAlpha = el.opacity;
  ctx.fillStyle = el.fill || "#000";
  if (el.shape === "line") {
    ctx.fillRect(el.x, el.y, el.w, Math.max(2, el.h));
  } else if (el.shape === "circle") {
    ctx.beginPath();
    ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (el.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(el.x + el.w / 2, el.y);
    ctx.lineTo(el.x, el.y + el.h);
    ctx.lineTo(el.x + el.w, el.y + el.h);
    ctx.closePath();
    ctx.fill();
  } else if (el.shape === "pill") {
    const r = Math.min(el.w, el.h) / 2;
    ctx.beginPath();
    ctx.roundRect(el.x, el.y, el.w, el.h, r);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(el.x, el.y, el.w, el.h, 0);
    ctx.fill();
  }
  ctx.restore();
}

export async function drawDesignToCanvas(design: StudioDesign): Promise<HTMLCanvasElement> {
  // make sure all fonts are ready before measuring/drawing
  if (typeof document !== "undefined" && (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts) {
    await (document as unknown as { fonts: FontFaceSet }).fonts.ready;
  }

  const canvas = document.createElement("canvas");
  canvas.width = design.width;
  canvas.height = design.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // background gradient
  const [r1, g1, b1] = hexToRgb(design.background.from);
  const [r2, g2, b2] = hexToRgb(design.background.to);
  const rad = ((design.background.angle - 90) * Math.PI) / 180;
  const cx = design.width / 2, cy = design.height / 2;
  const len = Math.abs(Math.cos(rad)) * design.width / 2 + Math.abs(Math.sin(rad)) * design.height / 2;
  const grad = ctx.createLinearGradient(
    cx - Math.cos(rad) * len, cy - Math.sin(rad) * len,
    cx + Math.cos(rad) * len, cy + Math.sin(rad) * len
  );
  grad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
  grad.addColorStop(1, `rgb(${r2},${g2},${b2})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, design.width, design.height);

  // background image under overlay
  if (design.background.image) {
    try {
      const img = await loadImage(design.background.image);
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(img, 0, 0, design.width, design.height);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = design.background.overlayOpacity ?? 0.75;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, design.width, design.height);
      ctx.restore();
    } catch {
      /* skip broken image */
    }
  }

  drawPattern(ctx, design);

  // elements (images loaded in parallel first)
  const imageEls = design.elements.filter((e) => e.type === "image" && e.src);
  const imgs = new Map<string, HTMLImageElement>();
  await Promise.all(imageEls.map(async (e) => {
    if (!e.src) return;
    try { imgs.set(e.id, await loadImage(e.src)); } catch { /* skip */ }
  }));

  for (const el of design.elements) {
    if (el.type === "text") {
      drawText(ctx, el);
    } else if (el.type === "shape") {
      drawShape(ctx, el);
    } else if (el.type === "image" && el.src) {
      const img = imgs.get(el.id);
      if (img) {
        ctx.save();
        ctx.globalAlpha = el.opacity;
        ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
        ctx.rotate((el.rotation || 0) * Math.PI / 180);
        ctx.drawImage(img, -el.w / 2, -el.h / 2, el.w, el.h);
        ctx.restore();
        continue;
      }
    } else if (el.type === "clipart") {
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
      ctx.rotate((el.rotation || 0) * Math.PI / 180);
      ctx.font = `${el.fontSize || Math.min(el.w, el.h)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(el.emoji || "", 0, 0);
      ctx.restore();
    }
  }

  return canvas;
}

export async function exportPng(design: StudioDesign, scale = 1): Promise<string> {
  const canvas = await drawDesignToCanvas(design);
  if (scale !== 1) {
    const scaled = document.createElement("canvas");
    scaled.width = Math.round(canvas.width * scale);
    scaled.height = Math.round(canvas.height * scale);
    const sctx = scaled.getContext("2d");
    if (sctx) {
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
      return scaled.toDataURL("image/png");
    }
  }
  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
