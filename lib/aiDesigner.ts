// ============================================================
// AI Designer — prompt → StudioDesign
//
// Two engines:
//  1. generateVariants() — deterministic composition engine, no key
//     needed. Produces 3 DISTINCT professional directions:
//     Bold Center / Editorial Split / Minimal Luxe.
//  2. generateVariantsWithLLM() — BYOK real LLM (any OpenAI-
//     compatible API). The model receives a strict design schema +
//     proven design principles, returns 3 designs as JSON.
//
// generateFromPrompt() kept for backward compat (variant 0).
// ============================================================

import type { StudioDesign, StudioElement, PatternKind } from "./studio";
import { uid, CANVAS_PRESETS } from "./studio";

export interface LLMConfig {
  baseUrl: string; // e.g. https://api.openai.com/v1
  apiKey: string;
  model: string;   // e.g. gpt-4o-mini
}

export interface Variant {
  style: string;
  design: StudioDesign;
  notes: string[];
}

export interface GenerateResult {
  design: StudioDesign;
  notes: string[];
}

// ------------------------------------------------------------
// Prompt parsing (shared by both engines' fallback path)
// ------------------------------------------------------------

interface OccasionRule {
  id: string;
  emoji: string;
  headline: string;
  sub: string;
  offerDefault: string;
}

const OCCASION_RULES: (OccasionRule & { words: string[] })[] = [
  { id: "grand-opening", words: ["opening", "launch", "inaugurat", "new store", "new shop"], emoji: "✨", headline: "GRAND OPENING", sub: "Doors open soon", offerDefault: "Opening week specials inside" },
  { id: "sale", words: ["sale", "discount", "off", "clearance", "offer", "deal"], emoji: "🏷️", headline: "MEGA SALE", sub: "Limited time only", offerDefault: "Up to 50% OFF everything" },
  { id: "birthday", words: ["birthday", "bday", "party", "anniversary"], emoji: "🎂", headline: "BIRTHDAY BASH", sub: "You are invited", offerDefault: "Cake, music and fun" },
  { id: "wedding", words: ["wedding", "marriage", "invite", "engagement", "shadi"], emoji: "🌿", headline: "SAVE THE DATE", sub: "Together with their families", offerDefault: "Reception to follow" },
  { id: "food", words: ["restaurant", "cafe", "coffee", "food", "pizza", "bakery", "kitchen", "dosa", "menu"], emoji: "☕", headline: "FRESH & HOT", sub: "Made with love", offerDefault: "Try our chef's special" },
  { id: "fitness", words: ["gym", "fitness", "yoga", "workout", "trainer", "zumba"], emoji: "💪", headline: "GET STRONG", sub: "Train with the best", offerDefault: "First session FREE" },
  { id: "salon", words: ["salon", "spa", "hair", "beauty", "nails", "glow", "facial"], emoji: "💅", headline: "GLOW UP", sub: "Salon & Spa", offerDefault: "Premium packages available" },
  { id: "real-estate", words: ["real estate", "property", "house", "apartment", "flat", "plot"], emoji: "🏡", headline: "FOR SALE", sub: "Prime location", offerDefault: "Schedule a visit today" },
  { id: "event", words: ["event", "concert", "festival", "meetup", "show", "night"], emoji: "🎉", headline: "COMING SOON", sub: "Save the date", offerDefault: "Tickets selling fast" },
  { id: "business", words: ["business", "brand", "startup", "agency", "consult"], emoji: "🚀", headline: "NEW VENTURE", sub: "Excellence delivered", offerDefault: "Let us build together" },
];

interface Palette {
  from: string; to: string; accent: string; text: string; sub: string;
}

const DARK_PALETTES: Record<string, Palette> = {
  violet: { from: "#1A1033", to: "#4C1D95", accent: "#F59E0B", text: "#FFFFFF", sub: "#C4B5FD" },
  ocean: { from: "#0B2545", to: "#1D3557", accent: "#FCBF49", text: "#FFFFFF", sub: "#A8DADC" },
  green: { from: "#052E1B", to: "#065F46", accent: "#10B981", text: "#FFFFFF", sub: "#A7F3D0" },
  berry: { from: "#2D1B3D", to: "#7B2D8E", accent: "#E0AFFF", text: "#FFFFFF", sub: "#D8B4FE" },
  red: { from: "#1A0505", to: "#7F1D1D", accent: "#F59E0B", text: "#FFFFFF", sub: "#FCA5A5" },
  tech: { from: "#0F172A", to: "#1E293B", accent: "#38BDF8", text: "#FFFFFF", sub: "#94A3B8" },
};

const LIGHT_PALETTES: Record<string, Palette> = {
  cream: { from: "#FFF8DC", to: "#F4E4C1", accent: "#8B5A2B", text: "#3B2412", sub: "#8B5A2B" },
  sage: { from: "#F5F0E0", to: "#D4E4C4", accent: "#2D5F3F", text: "#2D5F3F", sub: "#4A6B57" },
  blush: { from: "#FDF6F0", to: "#F3D9C9", accent: "#9A7B4F", text: "#4A3222", sub: "#9A7B4F" },
  sky: { from: "#F0F9FF", to: "#DBEAFE", accent: "#1D3557", text: "#0F2A4A", sub: "#3B6EA5" },
};

const DARK_KEYS = Object.keys(DARK_PALETTES);
const LIGHT_KEYS = Object.keys(LIGHT_PALETTES);

// Words that describe the design brief, NOT the brand name —
// these get trimmed from the tail of a captured name.
const DESCRIPTOR_TOKENS = new Set([
  // colors & finish
  "colors", "color", "colour", "colours", "gold", "black", "white", "cream", "warm",
  "green", "red", "blue", "pastel", "dark", "light", "bright", "golden", "silver",
  // style adjectives
  "elegant", "minimal", "simple", "bold", "modern", "energetic", "clean", "quirky",
  "playful", "luxury", "luxurious", "premium", "royal", "vibrant", "retro", "vintage",
  // mediums
  "poster", "flyer", "banner", "story", "card", "menu", "invitation", "invite",
  "sign", "design", "graphic", "post", "reel",
  // misc brief words
  "promo", "promotional", "advert", "ad", "theme", "style", "vibe", "font", "fonts",
  "sale", "opening", "launch", "offer", "discount", "starts", "opens", "call", "text",
  "visit", "book", "order", "online", "www", "com", "join", "buy", "get", "now",
  "off", "free", "new", "grand", "mega", "big",
]);

const NAME_STOP_WORDS = new Set([
  "I", "Im", "My", "Our", "We", "The", "A", "An", "For", "And", "With", "Make",
  "Create", "Design", "Generate", "Please", "Need", "Want", "Mon", "Tues", "Wednes",
  "Thurs", "Fri", "Satur", "Sun", "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday", "January", "February", "March", "April", "May",
  "June", "July", "August", "September", "October", "November", "December",
  "Join", "Now", "Buy", "Get", "Off", "Free", "Sale", "Grand", "Opening", "Sale",
]);

interface ParsedBrief {
  occasion: OccasionRule;
  vibe: string;
  light: boolean;
  palette: Palette;
  altPalette: Palette;
  luxePalette: Palette;
  size: { w: number; h: number; name: string };
  brandName: string;
  offer: string;
  dateStr: string;
  contact: string;
  displayFont: string;
  bodyFont: string;
  pattern: PatternKind;
  notes: string[];
}

function detectOccasion(prompt: string): OccasionRule {
  const p = prompt.toLowerCase();
  let best: OccasionRule = OCCASION_RULES[OCCASION_RULES.length - 1];
  let bestScore = 0;
  for (const rule of OCCASION_RULES) {
    let score = 0;
    for (const w of rule.words) if (p.includes(w)) score += 1;
    if (score > bestScore) { bestScore = score; best = rule; }
  }
  return best;
}

function detectVibe(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/luxur|premium|elegant|royal|gold/.test(p)) return "luxury";
  if (/fun|playful|quirky|colorful|cute|bright/.test(p)) return "fun";
  if (/minimal|clean|simple|modern|sleek/.test(p)) return "minimal";
  if (/bold|loud|energetic|powerful|strong/.test(p)) return "bold";
  return "default";
}

function trimDescriptorTokens(raw: string): string {
  let words = raw.trim().split(/\s+/);
  while (words.length > 1) {
    const last = words[words.length - 1].toLowerCase().replace(/[^\w'’-]/g, "");
    if (DESCRIPTOR_TOKENS.has(last)) { words = words.slice(0, -1); continue; }
    break;
  }
  return words.join(" ").trim();
}

function detectBrandName(prompt: string): string {
  // 1. quoted name wins
  const quoted = prompt.match(/["“']([^"”']{2,30})["”']/);
  if (quoted) return quoted[1].trim();

  // 2. "for <Name..." — capture, cut at digits/punct, trim descriptors
  const forMatch = prompt.match(/\bfor\s+([A-Z][\w&'’.\-]*(?:\s+[\w&'’.\-]+){0,4})/);
  if (forMatch) {
    let name = forMatch[1];
    const digitCut = name.search(/\d/);
    if (digitCut > 0) name = name.slice(0, digitCut);
    name = trimDescriptorTokens(name);
    if (name.length >= 2) return name;
  }

  // 3. capitalized word pairs not in the stop list
  const capWords = prompt.match(/\b[A-Z][\w'’\-]+(?:\s+[A-Z][\w'’\-]+)?\b/g) || [];
  const stop = new Set([...NAME_STOP_WORDS, ...DESCRIPTOR_TOKENS]);
  const stopLower = new Set([...stop].map((s) => s.toLowerCase()));
  for (const w of capWords) {
    const first = w.split(/\s+/)[0];
    if (!stopLower.has(first.toLowerCase()) && w.length > 2) return trimDescriptorTokens(w);
  }
  return "Your Brand";
}

function detectOffer(prompt: string, fallback: string): string {
  const pct = prompt.match(/(\d{1,2})\s*%\s*(off)?/i);
  if (pct) return `${pct[1]}% OFF`;
  const price = prompt.match(/(\$|₹|€)\s?\d[\d,.]*/);
  if (price) return `Only ${price[0]}`;
  const freeMatch = prompt.match(/free ([a-z ]{3,20})/i);
  if (/free/i.test(prompt)) return freeMatch ? `FREE ${freeMatch[1].trim()}` : "FREE with every order";
  const buyMatch = prompt.match(/buy (\d) get (\d)/i);
  if (buyMatch) return `BUY ${buyMatch[1]} GET ${buyMatch[2]} FREE`;
  return fallback;
}

function detectDate(prompt: string): string {
  // strip urls/handles first so they don't bleed into the date phrase
  const cleaned = prompt.replace(/\b(www\.[\w.\-]+|[\w\-]+\.(com|in|net|org|dev|fit|store))\b/gi, "");
  const m = cleaned.match(/\b(mon|tues|wednes|thurs|fri|satur|sun)day\b[^.,;]*/i);
  if (m) {
    // cut trailing glue words that belong to other parts of the brief
    return m[0].replace(/\s+(www|call|visit|book|text|dm|open|opens|join|buy|only|at)\b.*$/i, "").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  }
  const dm = cleaned.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?)\b/i);
  if (dm) return dm[0];
  return "";
}

function detectContact(prompt: string): string {
  const phone = prompt.match(/(\+?\d[\d\s\-()]{7,}\d)/);
  if (phone) return phone[0].trim();
  const web = prompt.match(/\b(www\.[\w.\-]+|[\w\-]+\.(com|in|net|org|dev|fit|store))\b/i);
  if (web) return web[0];
  const handle = prompt.match(/@[\w.]{3,}/);
  if (handle) return handle[0];
  return "";
}

function detectSize(prompt: string): { w: number; h: number; name: string } {
  const p = prompt.toLowerCase();
  if (/story|reel|snap|vertical video/.test(p)) return { w: 1080, h: 1920, name: "Story / Reel" };
  if (/square|instagram|ig /.test(p)) return { w: 1080, h: 1080, name: "Social Post" };
  if (/banner|header|web|hero|billboard/.test(p)) return { w: 1500, h: 500, name: "Web Banner" };
  if (/poster/.test(p)) return { w: 1080, h: 1620, name: "Poster" };
  if (/flyer/.test(p)) return { w: 1080, h: 1400, name: "Flyer" };
  if (/business card/.test(p)) return { w: 1050, h: 600, name: "Business Card" };
  if (/invitation|invite/.test(p)) return { w: 1080, h: 1350, name: "Invitation" };
  if (/menu/.test(p)) return { w: 1200, h: 1800, name: "Menu Board" };
  if (/tall|portrait/.test(p)) return { w: 1080, h: 1350, name: "Portrait" };
  return { w: 1080, h: 1350, name: "Portrait" };
}

function pickDisplayFont(vibe: string, occasionId: string): string {
  if (vibe === "luxury") return "playfair";
  if (vibe === "fun") return "anton";
  if (vibe === "minimal") return "poppins";
  if (vibe === "bold") return "anton";
  if (occasionId === "food") return "bebas-neue";
  return "anton";
}

function pickPattern(occasionId: string, vibe: string): PatternKind {
  if (vibe === "fun" || occasionId === "birthday") return "dots";
  if (["fitness", "event", "business", "sale"].includes(occasionId)) return "diagonal";
  return "none";
}

function detectLight(prompt: string): boolean {
  return /light|white|cream|soft|pastel|clean|minimal|wedding|elegant|luxur/.test(prompt.toLowerCase());
}

function detectPaletteKey(prompt: string, light: boolean): string {
  const p = prompt.toLowerCase();
  if (light) {
    if (/green|sage|nature|yoga|eco|organic/.test(p)) return "sage";
    if (/wedding|rose|blush|pink/.test(p)) return "blush";
    if (/blue|sky|corporate/.test(p)) return "sky";
    return "cream";
  }
  if (/green|nature|eco|organic|money/.test(p)) return "green";
  if (/blue|ocean|corporate|trust|tech/.test(p)) return "ocean";
  if (/purple|violet|berry|royal/.test(p)) return "berry";
  if (/red|fire|spice|hot|love/.test(p)) return "red";
  if (/tech|saas|software|startup|code/.test(p)) return "tech";
  return "violet";
}

function parseBrief(prompt: string, sizeHint?: string): ParsedBrief {
  const occasion = detectOccasion(prompt);
  const vibe = detectVibe(prompt);
  const light = detectLight(prompt);
  const notes: string[] = [];

  const key = detectPaletteKey(prompt, light);
  // alternate palettes for the other variants — different but on-theme
  const darkIdx = DARK_KEYS.indexOf(key) >= 0 ? DARK_KEYS.indexOf(key) : 0;
  const altKey = DARK_KEYS[(darkIdx + 2) % DARK_KEYS.length];
  const luxeKey = light && LIGHT_KEYS.includes(key) ? key : (["cream", "blush", "sage"].includes(detectPaletteKey(prompt, true)) ? detectPaletteKey(prompt, true) : "cream");

  const size = sizeHint
    ? (() => { const p = CANVAS_PRESETS.find((x) => x.id === sizeHint); return p ? { w: p.w, h: p.h, name: p.name } : detectSize(prompt); })()
    : detectSize(prompt);

  const brandName = detectBrandName(prompt);
  const offer = detectOffer(prompt, occasion.offerDefault);
  const dateStr = detectDate(prompt);
  const contact = detectContact(prompt);
  const displayFont = pickDisplayFont(vibe, occasion.id);
  const bodyFont = vibe === "luxury" || light ? "lora" : "poppins";
  const pattern = pickPattern(occasion.id, vibe);

  notes.push(`Occasion: ${occasion.id}`);
  notes.push(`Brand: "${brandName}"`);
  if (offer !== occasion.offerDefault) notes.push(`Offer: "${offer}"`);
  if (dateStr) notes.push(`Date: ${dateStr}`);
  if (contact) notes.push(`Contact: ${contact}`);
  notes.push(`Canvas: ${size.w}×${size.h} (${size.name})`);

  return {
    occasion, vibe, light,
    palette: light && LIGHT_KEYS.includes(key) ? LIGHT_PALETTES[key] : DARK_PALETTES[key],
    altPalette: DARK_PALETTES[altKey],
    luxePalette: LIGHT_PALETTES[luxeKey],
    size, brandName, offer, dateStr, contact,
    displayFont, bodyFont, pattern, notes,
  };
}

// ------------------------------------------------------------
// Text element helper
// ------------------------------------------------------------

function txt(over: Partial<StudioElement>): StudioElement {
  return {
    id: uid("ai"), type: "text", x: 0, y: 0, w: 100, h: 60,
    rotation: 0, opacity: 1, locked: false,
    font: "poppins", fontSize: 40, fontWeight: 400, color: "#FFFFFF",
    align: "center", lineHeight: 1.2, letterSpacing: 0,
    ...over,
  };
}

function shp(over: Partial<StudioElement>): StudioElement {
  return {
    id: uid("ai"), type: "shape", shape: "rect", fill: "#000000",
    x: 0, y: 0, w: 100, h: 100, rotation: 0, opacity: 1, locked: false,
    ...over,
  };
}

function clip(over: Partial<StudioElement>): StudioElement {
  return {
    id: uid("ai"), type: "clipart", emoji: "✨",
    x: 0, y: 0, w: 100, h: 100, rotation: 0, opacity: 1, locked: false,
    ...over,
  };
}

// ------------------------------------------------------------
// Variant 1 — Bold Center (the loud, confident one)
// ------------------------------------------------------------

function buildBoldCenter(b: ParsedBrief): StudioDesign {
  const { w: W, h: H } = b.size;
  const { palette: p, occasion: o } = b;
  const m = Math.min(W, H);
  const els: StudioElement[] = [];

  els.push(clip({ emoji: o.emoji, x: W / 2 - m * 0.1, y: H * 0.08, w: m * 0.2, h: m * 0.2, fontSize: Math.round(m * 0.19) }));

  els.push(txt({
    text: o.sub, color: p.sub, font: b.bodyFont, italic: b.light,
    fontSize: Math.round(m * 0.036), x: W * 0.15, y: H * 0.08 + m * 0.24, w: W * 0.7, h: m * 0.05,
  }));

  els.push(txt({
    text: b.brandName, font: b.displayFont, fontSize: Math.round(m * 0.15),
    fontWeight: b.vibe === "luxury" ? 600 : 800,
    x: W * 0.08, y: H * 0.08 + m * 0.3, w: W * 0.84, h: m * 0.16, lineHeight: 1.05,
  }));

  const lineY = H * 0.08 + m * 0.3 + m * 0.17;
  els.push(shp({ shape: "line", fill: p.accent, x: W / 2 - W * 0.1, y: lineY, w: W * 0.2, h: 3, opacity: 0.9 }));

  els.push(txt({
    text: o.headline, font: b.displayFont, fontSize: Math.round(m * 0.08),
    fontWeight: 600, color: p.accent, letterSpacing: 6,
    x: W * 0.1, y: lineY + m * 0.04, w: W * 0.8, h: m * 0.09,
  }));

  const offerY = lineY + m * 0.17;
  els.push(txt({
    text: b.offer, font: b.bodyFont, fontSize: Math.round(m * 0.055),
    fontWeight: 700, x: W * 0.1, y: offerY, w: W * 0.8, h: m * 0.07,
  }));

  let cursorY = offerY + m * 0.1;
  if (b.dateStr) {
    els.push(txt({ text: b.dateStr, color: p.sub, fontWeight: 500, fontSize: Math.round(m * 0.034), x: W * 0.15, y: cursorY, w: W * 0.7, h: m * 0.045 }));
    cursorY += m * 0.06;
  }
  if (b.contact) {
    els.push(txt({ text: b.contact, color: p.sub, font: "jetbrains", fontSize: Math.round(m * 0.028), x: W * 0.15, y: cursorY, w: W * 0.7, h: m * 0.04 }));
  }

  const pillH = m * 0.11;
  const pillY = H * 0.86;
  els.push(shp({ shape: "pill", fill: p.accent, x: W * 0.28, y: pillY, w: W * 0.44, h: pillH }));
  els.push(txt({
    text: "Learn more →", font: b.bodyFont, fontSize: Math.round(pillH * 0.34),
    fontWeight: 700, color: b.light ? "#FFFFFF" : "#0A0A0A",
    x: W * 0.28, y: pillY + pillH * 0.28, w: W * 0.44, h: pillH * 0.4,
  }));

  return {
    name: `${b.brandName} — ${o.headline.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`,
    width: W, height: H,
    background: { from: p.from, to: p.to, angle: 150, pattern: b.pattern },
    elements: els,
  };
}

// ------------------------------------------------------------
// Variant 2 — Editorial Split (the composed, magazine one)
// ------------------------------------------------------------

function buildEditorialSplit(b: ParsedBrief): StudioDesign {
  const { w: W, h: H } = b.size;
  const p = b.altPalette; // different palette on purpose
  const o = b.occasion;
  const m = Math.min(W, H);
  const els: StudioElement[] = [];

  // large decor circle bleeding off the right edge
  els.push(shp({ shape: "circle", fill: p.accent, x: W * 0.78, y: -H * 0.12, w: H * 0.55, h: H * 0.55, opacity: 0.14 }));
  // second offset ring
  els.push(shp({ shape: "circle", fill: p.accent, x: W * 0.86, y: H * 0.62, w: H * 0.4, h: H * 0.4, opacity: 0.08 }));

  // kicker tag, top-left
  els.push(shp({ shape: "pill", fill: p.accent, x: W * 0.08, y: H * 0.08, w: m * 0.34, h: m * 0.085, opacity: 0.95 }));
  els.push(txt({
    text: o.sub.toUpperCase(), font: "montserrat", fontSize: Math.round(m * 0.028),
    fontWeight: 700, color: b.light ? "#FFFFFF" : "#0A0A0A", letterSpacing: 3,
    x: W * 0.08, y: H * 0.08 + m * 0.026, w: m * 0.34, h: m * 0.034,
  }));

  // giant left-aligned headline block
  els.push(txt({
    text: b.brandName, font: b.displayFont, fontSize: Math.round(m * 0.13),
    fontWeight: 800, align: "left", x: W * 0.08, y: H * 0.26, w: W * 0.68, h: m * 0.3,
    lineHeight: 1.02,
  }));

  // accent slab under headline
  els.push(shp({ shape: "rect", fill: p.accent, x: W * 0.08, y: H * 0.26 + m * 0.32, w: W * 0.3, h: m * 0.014, opacity: 0.95 }));

  // occasion line
  els.push(txt({
    text: o.headline, font: "montserrat", fontSize: Math.round(m * 0.042),
    fontWeight: 600, color: p.accent, align: "left", letterSpacing: 5,
    x: W * 0.08, y: H * 0.26 + m * 0.36, w: W * 0.7, h: m * 0.05,
  }));

  // details block, bottom-left
  els.push(txt({
    text: b.offer, font: b.bodyFont, fontSize: Math.round(m * 0.05),
    fontWeight: 700, align: "left", color: p.text,
    x: W * 0.08, y: H * 0.58, w: W * 0.6, h: m * 0.06,
  }));
  if (b.dateStr) {
    els.push(txt({
      text: b.dateStr, font: b.bodyFont, fontSize: Math.round(m * 0.032),
      fontWeight: 500, align: "left", color: p.sub,
      x: W * 0.08, y: H * 0.58 + m * 0.09, w: W * 0.6, h: m * 0.045,
    }));
  }
  if (b.contact) {
    els.push(txt({
      text: b.contact, font: "jetbrains", fontSize: Math.round(m * 0.026),
      align: "left", color: p.sub,
      x: W * 0.08, y: H * 0.58 + (b.dateStr ? m * 0.15 : m * 0.09), w: W * 0.6, h: m * 0.04,
    }));
  }

  // emoji accent in the upper-right dead space
  els.push(clip({ emoji: o.emoji, x: W * 0.72, y: H * 0.3, w: m * 0.22, h: m * 0.22, rotation: 8, opacity: 0.95, fontSize: Math.round(m * 0.21) }));

  // slim bottom bar
  els.push(shp({ shape: "rect", fill: p.accent, x: 0, y: H - H * 0.035, w: W, h: H * 0.035, opacity: 0.85 }));
  els.push(txt({
    text: b.brandName.toUpperCase(), font: "montserrat", fontSize: Math.round(m * 0.02),
    fontWeight: 700, letterSpacing: 4, color: b.light ? "#FFFFFF" : "#0A0A0A",
    x: 0, y: H - H * 0.032, w: W, h: H * 0.026,
  }));

  return {
    name: `${b.brandName} — Editorial`,
    width: W, height: H,
    background: { from: p.from, to: p.to, angle: 120, pattern: b.pattern === "none" ? "none" : b.pattern },
    elements: els,
  };
}

// ------------------------------------------------------------
// Variant 3 — Minimal Luxe (the quiet, premium one)
// ------------------------------------------------------------

function buildMinimalLuxe(b: ParsedBrief): StudioDesign {
  const { w: W, h: H } = b.size;
  const p = b.luxePalette; // light palette always
  const o = b.occasion;
  const m = Math.min(W, H);
  const els: StudioElement[] = [];

  // centered small caps kicker
  els.push(txt({
    text: o.sub, font: "montserrat", fontSize: Math.round(m * 0.024),
    fontWeight: 600, color: p.sub, letterSpacing: 8, uppercase: true,
    x: W * 0.15, y: H * 0.16, w: W * 0.7, h: m * 0.035,
  }));

  // thin rule
  els.push(shp({ shape: "line", fill: p.accent, x: W / 2 - W * 0.06, y: H * 0.16 + m * 0.055, w: W * 0.12, h: 2, opacity: 0.6 }));

  // serif brand name, generous size
  els.push(txt({
    text: b.brandName, font: "playfair", fontSize: Math.round(m * 0.1),
    fontWeight: 600, color: p.text,
    x: W * 0.1, y: H * 0.3, w: W * 0.8, h: m * 0.22, lineHeight: 1.1,
  }));

  // occasion in small caps with letterspacing
  els.push(txt({
    text: o.headline, font: "montserrat", fontSize: Math.round(m * 0.03),
    fontWeight: 600, color: p.sub, letterSpacing: 10, uppercase: true,
    x: W * 0.1, y: H * 0.3 + m * 0.26, w: W * 0.8, h: m * 0.04,
  }));

  // italic serif offer
  els.push(txt({
    text: b.offer, font: "lora", fontSize: Math.round(m * 0.05),
    fontWeight: 500, italic: true, color: p.accent,
    x: W * 0.1, y: H * 0.55, w: W * 0.8, h: m * 0.06,
  }));

  // details stacked, quiet
  let cursorY = H * 0.66;
  if (b.dateStr) {
    els.push(txt({
      text: b.dateStr, font: "lora", fontSize: Math.round(m * 0.03),
      fontWeight: 400, color: p.sub,
      x: W * 0.1, y: cursorY, w: W * 0.8, h: m * 0.04,
    }));
    cursorY += m * 0.055;
  }
  if (b.contact) {
    els.push(txt({
      text: b.contact, font: "jetbrains", fontSize: Math.round(m * 0.024),
      color: p.sub,
      x: W * 0.1, y: cursorY, w: W * 0.8, h: m * 0.035,
    }));
  }

  // single small emoji accent
  els.push(clip({ emoji: o.emoji, x: W / 2 - m * 0.035, y: H * 0.085, w: m * 0.07, h: m * 0.07, opacity: 0.85, fontSize: Math.round(m * 0.066) }));

  return {
    name: `${b.brandName} — Minimal`,
    width: W, height: H,
    background: { from: p.from, to: p.to, angle: 145, pattern: "none" },
    elements: els,
  };
}

// ------------------------------------------------------------
// Structured brief (from the question wizard) → variants
// ------------------------------------------------------------

export interface BriefOccasion {
  id: string;
  emoji: string;
  headline: string;
  sub: string;
  offerDefault: string;
}

export interface DesignBriefInput {
  sizeId?: string;          // CANVAS_PRESETS id
  customW?: number;
  customH?: number;
  brandName: string;
  tagline?: string;
  occasion: BriefOccasion;
  offer?: string;
  date?: string;
  contact?: string;
  styleId: "bold" | "elegant" | "minimal" | "fun";
  palette: Palette & { light?: boolean };
  logoDataUrl?: string;
}

const STYLE_MAP: Record<string, { vibe: string; font: string; body: string; pattern: PatternKind; desc: string }> = {
  bold:    { vibe: "bold",   font: "anton",    body: "poppins", pattern: "diagonal", desc: "bold, loud, high-contrast, huge typography" },
  elegant: { vibe: "luxury", font: "playfair", body: "lora",    pattern: "none",      desc: "elegant, refined, premium, serif typography" },
  minimal: { vibe: "minimal",font: "poppins", body: "inter",   pattern: "none",      desc: "minimal, clean, lots of whitespace, modern" },
  fun:     { vibe: "fun",    font: "anton",   body: "poppins", pattern: "dots",      desc: "fun, playful, bright, energetic" },
};

export function briefToPrompt(b: DesignBriefInput): string {
  const preset = b.sizeId ? CANVAS_PRESETS.find((p) => p.id === b.sizeId) : undefined;
  const s = STYLE_MAP[b.styleId];
  return [
    `Design a ${preset?.name || `${b.customW}x${b.customH}px graphic`} for "${b.brandName}".`,
    b.tagline ? `Tagline: ${b.tagline}.` : "",
    `Purpose: ${b.occasion.sub || b.occasion.headline}.`,
    `Main headline: ${b.occasion.headline || b.brandName}.`,
    b.occasion.sub && b.occasion.headline ? `Supporting line: ${b.occasion.sub}.` : "",
    b.offer ? `Offer / CTA: ${b.offer}.` : "",
    b.date ? `Date: ${b.date}.` : "",
    b.contact ? `Contact: ${b.contact}.` : "",
    `Style: ${s.desc}.`,
    `Colors: background gradient from ${b.palette.from} to ${b.palette.to}, accent ${b.palette.accent}, text ${b.palette.text}.`,
    b.logoDataUrl ? "Place the provided logo tastefully (small, bottom)." : "",
  ].filter(Boolean).join(" ");
}

function appendLogo(design: StudioDesign, logoDataUrl: string): void {
  const W = design.width, H = design.height;
  const s = Math.round(Math.min(W, H) * 0.18);
  const wide = W > H * 1.4;
  const el: StudioElement = wide
    ? { id: uid("logo"), type: "image", src: logoDataUrl, x: W - s * 1.7, y: (H - s) / 2, w: s, h: s, rotation: 0, opacity: 0.95, locked: true }
    : { id: uid("logo"), type: "image", src: logoDataUrl, x: (W - s) / 2, y: H - s * 1.45, w: s, h: s, rotation: 0, opacity: 0.95, locked: true };
  design.elements.push(el);
}

export function generateVariantsFromBrief(b: DesignBriefInput): Variant[] {
  const preset = b.sizeId ? CANVAS_PRESETS.find((p) => p.id === b.sizeId) : undefined;
  const W = b.customW || preset?.w || 1080;
  const H = b.customH || preset?.h || 1350;
  const sizeName = preset?.name || "Custom size";
  const s = STYLE_MAP[b.styleId] || STYLE_MAP.bold;

  const occasion: OccasionRule = {
    id: b.occasion.id || "custom",
    emoji: b.occasion.emoji || "✨",
    headline: b.occasion.headline || "SPECIAL ANNOUNCEMENT",
    sub: b.occasion.sub || "You are invited",
    offerDefault: b.occasion.offerDefault || "Special offer",
  };

  // alternate + luxe palettes for variants 2 and 3 (distinct directions)
  const altPalette = b.palette.light ? DARK_PALETTES.ocean : DARK_PALETTES[(DARK_KEYS.indexOf("violet") + 2) % DARK_KEYS.length];
  const luxePalette = LIGHT_PALETTES.blush;

  const brandName = (b.brandName || "Your Brand").trim();
  const notes = [
    `Brand: "${brandName}"`,
    `Purpose: ${occasion.id}`,
    b.offer ? `Offer: "${b.offer}"` : "",
    b.date ? `Date: ${b.date}"` : "",
    b.contact ? `Contact: ${b.contact}` : "",
    `Style: ${b.styleId}`,
    `Canvas: ${W}×${H} (${sizeName})`,
  ].filter(Boolean);

  const brief: ParsedBrief = {
    occasion,
    vibe: s.vibe,
    light: !!b.palette.light,
    palette: b.palette,
    altPalette,
    luxePalette,
    size: { w: W, h: H, name: sizeName },
    brandName,
    offer: (b.offer || occasion.offerDefault || "Special offer").trim(),
    dateStr: b.date || "",
    contact: b.contact || "",
    displayFont: s.font,
    bodyFont: s.body,
    pattern: s.pattern,
    notes,
  };

  const builders = [buildBoldCenter, buildEditorialSplit, buildMinimalLuxe];
  const variants = builders.map((build, i) => ({
    style: VARIANT_STYLES[i],
    design: build(brief),
    notes,
  }));

  if (b.logoDataUrl) {
    for (const v of variants) appendLogo(v.design, b.logoDataUrl);
  }
  return variants;
}

// ------------------------------------------------------------
// Public: deterministic 3-variant generation
// ------------------------------------------------------------

const VARIANT_STYLES = ["Bold Center", "Editorial Split", "Minimal Luxe"];

export function generateVariants(prompt: string, sizeHint?: string): Variant[] {
  const brief = parseBrief(prompt, sizeHint);
  const builders = [buildBoldCenter, buildEditorialSplit, buildMinimalLuxe];
  return builders.map((build, i) => ({
    style: VARIANT_STYLES[i],
    design: build(brief),
    notes: brief.notes,
  }));
}

export function generateFromPrompt(prompt: string, sizeHint?: string): GenerateResult {
  const v = generateVariants(prompt, sizeHint)[0];
  return { design: v.design, notes: v.notes };
}

// ------------------------------------------------------------
// BYOK LLM generation (OpenAI-compatible chat completions)
// ------------------------------------------------------------

const FONT_IDS = [
  "inter", "poppins", "montserrat", "playfair", "lora", "oswald",
  "bebas-neue", "anton", "pacifico", "dancing-script", "caveat", "jetbrains",
];

const LLM_SYSTEM_PROMPT = `You are a senior brand designer producing small-format marketing graphics (social posts, posters, flyers, banners, cards, menus).
Return STRICT JSON only: {"designs": [DESIGN, DESIGN, DESIGN], "notes": [short string per design]}

DESIGN = {
  "name": string,
  "width": int, "height": int,            // canvas pixels, 500-4000
  "background": {"from": "#RRGGBB", "to": "#RRGGBB", "angle": int (0-360), "pattern": "none"|"dots"|"grid"|"diagonal"},
  "elements": ELEMENT[]                    // 6-12 elements
}

ELEMENT (x,y = top-left in canvas px; w,h = box size in px; rotation degrees; opacity 0-1):
- {"type":"text","text":string (use \\n for line breaks),"font":FONT,"fontSize":int,"fontWeight":int (300-900),"color":"#RRGGBB","x":int,"y":int,"w":int,"h":int,"rotation":0,"opacity":1,"align":"left"|"center"|"right","lineHeight":1.1,"letterSpacing":int,"uppercase":bool}
- {"type":"shape","shape":"rect"|"pill"|"circle"|"triangle"|"line","fill":"#RRGGBB",...same box fields...}
- {"type":"clipart","emoji":"one emoji",...same box fields...}

FONT is one of: ${FONT_IDS.join(", ")}

DESIGN PRINCIPLES — these are the patterns real consumers engage with, apply them strictly:
- ONE clear focal point. Strong hierarchy: headline is 3-6x the body size.
- Keep a 10% safe margin on every edge; nothing touches the border.
- Max 2 font families per design. Contrast weights (800-900 display vs 400 body).
- Quiet background gradient, ONE accent color used sparingly (CTA pill, kicker, rule lines).
- The offer gets visual weight — put it on a pill or plate shape.
- 1-2 emoji maximum, as tone.
- 3 DISTINCT directions: [1] bold loud centered, [2] editorial asymmetric split with decor circles, [3] minimal elegant light background serif.`;

function coerceDesign(raw: unknown, fallbackW: number, fallbackH: number): StudioDesign | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const clampInt = (v: unknown, lo: number, hi: number, fb: number): number => {
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : fb;
  };
  const hex = (v: unknown, fb: string): string => {
    const s = typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
    return s;
  };

  const W = clampInt(d.width, 400, 4000, fallbackW);
  const H = clampInt(d.height, 400, 4000, fallbackH);

  const bgRaw = (d.background || {}) as Record<string, unknown>;
  const patterns: PatternKind[] = ["none", "dots", "grid", "diagonal"];
  const pattern = patterns.includes(bgRaw.pattern as PatternKind) ? (bgRaw.pattern as PatternKind) : "none";

  const rawEls = Array.isArray(d.elements) ? d.elements : [];
  const elements: StudioElement[] = [];
  for (const re of rawEls.slice(0, 24)) {
    const e = re as Record<string, unknown>;
    const type = e.type === "text" || e.type === "shape" || e.type === "clipart" ? e.type : (e.type === "image" ? null : null);
    if (!type) continue;
    const base = {
      id: uid("llm"),
      x: clampInt(e.x, -W, W * 2, 0),
      y: clampInt(e.y, -H, H * 2, 0),
      w: clampInt(e.w, 4, W * 2, W * 0.3),
      h: clampInt(e.h, 4, H * 2, H * 0.1),
      rotation: clampInt(e.rotation, -180, 180, 0),
      opacity: typeof e.opacity === "number" ? Math.max(0.05, Math.min(1, e.opacity)) : 1,
      locked: false,
    };
    if (type === "text") {
      elements.push({
        ...base, type: "text",
        text: typeof e.text === "string" ? e.text.slice(0, 400) : "Text",
        font: FONT_IDS.includes(e.font as string) ? (e.font as string) : "poppins",
        fontSize: clampInt(e.fontSize, 10, 500, 40),
        fontWeight: clampInt(e.fontWeight, 100, 900, 400),
        color: hex(e.color, "#FFFFFF"),
        align: e.align === "left" || e.align === "right" ? e.align : "center",
        lineHeight: typeof e.lineHeight === "number" ? Math.max(0.8, Math.min(2.5, e.lineHeight)) : 1.2,
        letterSpacing: clampInt(e.letterSpacing, -10, 40, 0),
        italic: !!e.italic,
        uppercase: !!e.uppercase,
      });
    } else if (type === "shape") {
      const shapes = ["rect", "pill", "circle", "triangle", "line"] as const;
      const shape = shapes.includes(e.shape as (typeof shapes)[number]) ? (e.shape as (typeof shapes)[number]) : "rect";
      elements.push({ ...base, type: "shape", shape, fill: hex(e.fill, "#333333") });
    } else {
      const emoji = typeof e.emoji === "string" && e.emoji.trim() ? [...e.emoji.trim()][0] : "✨";
      elements.push({
        ...base, type: "clipart", emoji,
        fontSize: clampInt(e.fontSize, 10, 800, Math.round(Math.min(base.w, base.h))),
      });
    }
  }
  if (elements.length === 0) return null;

  return {
    name: typeof d.name === "string" && d.name.trim() ? d.name.trim().slice(0, 80) : "AI design",
    width: W,
    height: H,
    background: {
      from: hex(bgRaw.from, "#1A1033"),
      to: hex(bgRaw.to, "#4C1D95"),
      angle: clampInt(bgRaw.angle, 0, 360, 135),
      pattern,
    },
    elements,
  };
}

export async function generateVariantsWithLLM(
  prompt: string,
  cfg: LLMConfig,
  sizeHint?: string
): Promise<{ designs: StudioDesign[]; notes: string[] }> {
  const preset = sizeHint ? CANVAS_PRESETS.find((p) => p.id === sizeHint) : undefined;
  const userPrompt = [
    `Design brief: ${prompt}`,
    preset ? `Canvas size: ${preset.w}x${preset.h} px (${preset.name}).` : "Choose an appropriate canvas size for the brief.",
    "Produce the 3 designs now. STRICT JSON only.",
  ].join("\n");

  const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: LLM_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM API ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("LLM returned no content");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    // model sometimes wraps JSON in fences
    const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    parsed = JSON.parse(fence ? fence[1] : content);
  }

  const obj = parsed as Record<string, unknown>;
  const rawDesigns = Array.isArray(obj.designs) ? obj.designs : Array.isArray(obj) ? obj : [obj.design].filter(Boolean);
  const notes = Array.isArray(obj.notes) ? (obj.notes as unknown[]).map(String).slice(0, 3) : [];

  const fallbackSize = preset ? { w: preset.w, h: preset.h } : { w: 1080, h: 1350 };
  const designs = rawDesigns
    .map((rd) => coerceDesign(rd, fallbackSize.w, fallbackSize.h))
    .filter((d): d is StudioDesign => d !== null);

  if (designs.length === 0) throw new Error("LLM designs failed validation");

  return { designs: designs.slice(0, 3), notes };
}
