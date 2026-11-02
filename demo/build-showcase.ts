// Generates demo/showcase.html using REAL output from lib/aiDesigner.ts
import { writeFileSync, mkdirSync } from "fs";
import { generateVariants } from "../lib/aiDesigner";
import type { StudioDesign } from "../lib/studio";

const demos: { prompt: string; hint?: string }[] = [
  { prompt: "50% off sale poster for Bella's Boutique, elegant gold and black, sale starts Friday, www.bella.com" },
  { prompt: "grand opening poster for Meera's Bakery, warm cream colors, opens June 14, call 555-0123" },
  { prompt: "gym fitness story promo, bold green energetic, JOIN NOW 30% off" },
  { prompt: "web banner for a tech startup called DeployDev, ship faster, dark tech" },
];

const FONT_MAP: Record<string, string> = {
  inter: "Inter", poppins: "Poppins", montserrat: "Montserrat", playfair: "'Playfair Display'",
  lora: "Lora", oswald: "Oswald", "bebas-neue": "'Bebas Neue'", anton: "Anton",
  pacifico: "Pacifico", "dancing-script": "'Dancing Script'", caveat: "Caveat", jetbrains: "'JetBrains Mono'",
};

function patternCSS(d: StudioDesign): string {
  if (d.background.pattern === "dots")
    return `<div style="position:absolute;inset:0;opacity:.07;background-image:radial-gradient(circle,#fff 1.5px,transparent 1.5px);background-size:22px 22px"></div>`;
  if (d.background.pattern === "grid")
    return `<div style="position:absolute;inset:0;opacity:.06;background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);background-size:48px 48px"></div>`;
  if (d.background.pattern === "diagonal")
    return `<div style="position:absolute;inset:0;opacity:.05;background-image:repeating-linear-gradient(45deg,#fff 0px,#fff 1px,transparent 1px,transparent 14px)"></div>`;
  return "";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderDesign(d: StudioDesign, displayW: number): string {
  const s = displayW / d.width;
  const els = d.elements.map((el) => {
    const box = `left:${el.x * s}px;top:${el.y * s}px;width:${el.w * s}px;height:${el.h * s}px;${el.rotation ? `transform:rotate(${el.rotation}deg);` : ""}`;
    if (el.type === "text") {
      return `<div class="el" style="${box}display:flex;flex-direction:column;justify-content:center;white-space:pre-wrap;overflow:visible;font-family:${FONT_MAP[el.font || "poppins"]},sans-serif;font-size:${(el.fontSize || 40) * s}px;font-weight:${el.fontWeight || 400};${el.italic ? "font-style:italic;" : ""}color:${el.color};text-align:${el.align || "center"};line-height:${el.lineHeight || 1.2};letter-spacing:${(el.letterSpacing || 0) * s}px">${esc(el.uppercase ? (el.text || "").toUpperCase() : el.text || "")}</div>`;
    }
    if (el.type === "shape") {
      if (el.shape === "triangle")
        return `<div class="el" style="${box}width:0;height:0;border-left:${(el.w * s) / 2}px solid transparent;border-right:${(el.w * s) / 2}px solid transparent;border-bottom:${el.h * s}px solid ${el.fill}"></div>`;
      const radius = el.shape === "circle" ? "50%" : el.shape === "pill" ? "999px" : "0";
      const h = el.shape === "line" ? Math.max(2 * s, el.h * s) : el.h * s;
      return `<div class="el" style="${box}background:${el.fill};border-radius:${radius};height:${h}px"></div>`;
    }
    if (el.type === "clipart")
      return `<div class="el" style="${box}display:flex;align-items:center;justify-content:center;font-size:${(el.fontSize || Math.min(el.w, el.h)) * s}px;line-height:1">${el.emoji}</div>`;
    return "";
  }).join("");
  return `<div style="position:relative;width:${displayW}px;height:${d.height * s}px;background:linear-gradient(${d.background.angle}deg,${d.background.from},${d.background.to});border-radius:12px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.5)">${patternCSS(d)}${els}</div>`;
}

const cards = demos.map(({ prompt }, i) => {
  const variants = generateVariants(prompt);
  const variantHTML = variants.map((v) => {
    const displayW = v.design.width / v.design.height > 2.2 ? 430 : 210;
    return `
      <div class="variant">
        <div class="v-label">${esc(v.style)}</div>
        ${renderDesign(v.design, displayW)}
      </div>`;
  }).join("");
  const notes = variants[0].notes;
  const badges = notes.map((n) => `<span>${esc(n)}</span>`).join("");
  return `
  <section class="card">
    <div class="prompt-row">
      <span class="q">You type</span>
      <code>"${esc(prompt)}"</code>
    </div>
    <div class="result-row">
      <div class="variants-row">${variantHTML}</div>
    </div>
    <div class="notes">
      <span class="q">The AI read this from your sentence</span>
      <div class="badges">${badges}</div>
      <p class="expl">One prompt → three distinct directions, each fully editable — no flat images. This is the built-in engine; connect an LLM key (LLM button in the editor) and the same picker fills with model-generated designs following professional hierarchy rules.</p>
    </div>
  </section>`;
}).join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Printa Studio — How it works</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=Poppins:wght@300;400;600;700;800&family=Montserrat:wght@300;400;600;700;800;900&family=Playfair+Display:wght@400..900&family=Lora:ital,wght@0,400..700;1,400..700&family=Oswald:wght@300;400;500;600;700&family=Bebas+Neue&family=Anton&family=Pacifico&family=Dancing+Script:wght@400;600;700&family=Caveat:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0c0c0f; color:#fff; font-family:Inter,system-ui,sans-serif; padding:40px 44px 60px; }
  h1 { font-size:26px; margin-bottom:6px; }
  .sub { color:rgba(255,255,255,.45); font-size:13px; margin-bottom:28px; }
  .steps { display:flex; gap:10px; margin-bottom:36px; flex-wrap:wrap; }
  .step { flex:1; min-width:150px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.03); border-radius:12px; padding:12px 14px; }
  .step b { display:block; font-size:12px; margin-bottom:3px; }
  .step span { font-size:10.5px; color:rgba(255,255,255,.4); line-height:1.45; display:block; }
  .step .n { color:#a78bfa; font-weight:700; margin-right:5px; }
  .card { border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.03); border-radius:16px; padding:22px; margin-bottom:26px; }
  .prompt-row { margin-bottom:16px; }
  .q { font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:rgba(255,255,255,.35); display:block; margin-bottom:6px; }
  .prompt-row code { display:inline-block; background:rgba(124,58,237,.12); border:1px solid rgba(124,58,237,.3); color:#d8caff; padding:8px 14px; border-radius:10px; font-size:12.5px; font-family:'JetBrains Mono',monospace; }
  .result-row { display:flex; gap:22px; align-items:flex-start; flex-wrap:wrap; }
  .variants-row { display:flex; gap:14px; flex-wrap:wrap; }
  .variant { flex-shrink:0; }
  .v-label { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#a78bfa; margin-bottom:6px; font-weight:600; }
  .notes { margin-top:14px; }
  .badges { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
  .badges span { font-size:10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); padding:4px 9px; border-radius:99px; color:rgba(255,255,255,.65); }
  .expl { font-size:11.5px; color:rgba(255,255,255,.4); line-height:1.55; }
  .toggle { display:flex; align-items:center; gap:8px; margin:2px 0 30px; font-size:12px; color:rgba(255,255,255,.6); cursor:pointer; user-select:none; width:fit-content; }
  .toggle input { accent-color:#7c3aed; width:15px; height:15px; cursor:pointer; }
  body.show-layers .el { outline:1.5px dashed rgba(167,139,250,.85); outline-offset:1px; }
  .cta { margin-top:8px; display:flex; gap:12px; flex-wrap:wrap; }
  .cta a { text-decoration:none; font-size:13px; font-weight:600; padding:11px 20px; border-radius:11px; }
  .cta .primary { background:linear-gradient(90deg,#7c3aed,#c026d3); color:#fff; }
  .cta .ghost { border:1px solid rgba(255,255,255,.18); color:rgba(255,255,255,.8); }
</style>
</head>
<body>
  <h1>How Printa Studio works</h1>
  <p class="sub">Every design below was generated live by the app's AI engine — not mockups. Rendered here exactly as the app renders them.</p>

  <div class="steps">
    <div class="step"><b><span class="n">1</span>Type what you want</b><span>Plain English. No design words required.</span></div>
    <div class="step"><b><span class="n">2</span>AI composes the design</b><span>Occasion, brand, colors, fonts, layout — all detected and placed as editable elements.</span></div>
    <div class="step"><b><span class="n">3</span>Tweak anything</b><span>Drag, resize, rotate, rewrite text. Double-click to edit. Full undo.</span></div>
    <div class="step"><b><span class="n">4</span>Export or embed</b><span>Download print-quality PNG, or embed the whole editor in Magento with one script tag.</span></div>
  </div>

  <label class="toggle"><input type="checkbox" onchange="document.body.classList.toggle('show-layers', this.checked)"> Show the AI's layer structure</label>

  ${cards}

  <div class="cta">
    <a class="primary" href="http://localhost:3000/studio">Try the real studio → localhost:3000/studio</a>
    <a class="ghost" href="http://localhost:3000/docs">Magento integration docs</a>
  </div>
</body>
</html>`;

mkdirSync(new URL(".", import.meta.url).pathname, { recursive: true });
writeFileSync(new URL("./showcase.html", import.meta.url).pathname, html);
console.log("showcase.html written,", html.length, "bytes");
