// ============================================================
// AI Designer — natural language prompt → StudioDesign
// Rule-based composition engine (deterministic, no API key
// needed for the demo; the interface matches an LLM call so
// it can be swapped for a real model later).
// ============================================================

import type { StudioDesign, StudioElement, PatternKind } from "./studio";
import { uid, CANVAS_PRESETS } from "./studio";

export interface GenerateResult {
  design: StudioDesign;
  notes: string[]; // human-readable explanation of choices
}

interface ParsedBrief {
  occasion: string;
  brandName: string;
  vibe: string;
  offer: string;
  date: string;
  contact: string;
  lightTheme: boolean;
  palette: { from: string; to: string; accent: string; text: string; sub: string };
  displayFont: string;
  bodyFont: string;
}

const OCCASION_RULES: { id: string; words: string[]; emoji: string; headline: string; sub: string; offerDefault: string }[] = [
  { id: "grand-opening", words: ["opening", "launch", "inaugurat", "new store", "new shop"], emoji: "✨", headline: "GRAND OPENING", sub: "Doors open soon", offerDefault: "Opening week specials inside" },
  { id: "sale", words: ["sale", "discount", "off", "clearance", "offer", "deal"], emoji: "🏷️", headline: "MEGA SALE", sub: "Limited time only", offerDefault: "Up to 50% OFF everything" },
  { id: "birthday", words: ["birthday", "bday", "party", "anniversary"], emoji: "🎂", headline: "BIRTHDAY BASH", sub: "You're invited", offerDefault: "Cake, music & fun" },
  { id: "wedding", words: ["wedding", "marriage", "invite", "engagement", "shadi"], emoji: "🌿", headline: "SAVE THE DATE", sub: "Together with their families", offerDefault: "Reception to follow" },
  { id: "food", words: ["restaurant", "cafe", "coffee", "food", "pizza", "bakery", "kitchen", "dosa", "menu"], emoji: "☕", headline: "FRESH & HOT", sub: "Made with love", offerDefault: "Try our chef's special" },
  { id: "fitness", words: ["gym", "fitness", "yoga", "workout", "trainer", "zumba"], emoji: "💪", headline: "GET STRONG", sub: "Train with the best", offerDefault: "First session FREE" },
  { id: "salon", words: ["salon", "spa", "hair", "beauty", "nails", "glow", "facial"], emoji: "💅", headline: "GLOW UP", sub: "Salon & Spa", offerDefault: "Premium packages available" },
  { id: "real-estate", words: ["real estate", "property", "house", "apartment", "flat", "plot"], emoji: "🏡", headline: "FOR SALE", sub: "Prime location", offerDefault: "Schedule a visit today" },
  { id: "event", words: ["event", "concert", "festival", "meetup", "show", "night"], emoji: "🎉", headline: "COMING SOON", sub: "Save the date", offerDefault: "Tickets selling fast" },
  { id: "business", words: ["business", "brand", "startup", "agency", "consult"], emoji: "🚀", headline: "NEW VENTURE", sub: "Excellence delivered", offerDefault: "Let's build together" },
];

const DARK_PALETTES: Record<string, { from: string; to: string; accent: string; text: string; sub: string }> = {
  violet: { from: "#1A1033", to: "#4C1D95", accent: "#F59E0B", text: "#FFFFFF", sub: "#C4B5FD" },
  ocean: { from: "#0B2545", to: "#1D3557", accent: "#FCBF49", text: "#FFFFFF", sub: "#A8DADC" },
  green: { from: "#052E1B", to: "#065F46", accent: "#10B981", text: "#FFFFFF", sub: "#A7F3D0" },
  berry: { from: "#2D1B3D", to: "#7B2D8E", accent: "#E0AFFF", text: "#FFFFFF", sub: "#D8B4FE" },
  red: { from: "#1A0505", to: "#7F1D1D", accent: "#F59E0B", text: "#FFFFFF", sub: "#FCA5A5" },
  tech: { from: "#0F172A", to: "#1E293B", accent: "#38BDF8", text: "#FFFFFF", sub: "#94A3B8" },
};

const LIGHT_PALETTES: Record<string, { from: string; to: string; accent: string; text: string; sub: string }> = {
  cream: { from: "#FFF8DC", to: "#F4E4C1", accent: "#8B5A2B", text: "#3B2412", sub: "#8B5A2B" },
  sage: { from: "#F5F0E0", to: "#D4E4C4", accent: "#2D5F3F", text: "#2D5F3F", sub: "#4A6B57" },
  blush: { from: "#FDF6F0", to: "#F3D9C9", accent: "#9A7B4F", text: "#4A3222", sub: "#9A7B4F" },
  sky: { from: "#F0F9FF", to: "#DBEAFE", accent: "#1D3557", text: "#0F2A4A", sub: "#3B6EA5" },
};

const DISPLAY_FONTS = ["anton", "bebas-neue", "playfair", "oswald", "poppins", "montserrat"];

// ------------------------------------------------------------
// Parsing helpers
// ------------------------------------------------------------

function detectOccasion(prompt: string): typeof OCCASION_RULES[number] {
  const p = prompt.toLowerCase();
  let best = OCCASION_RULES[OCCASION_RULES.length - 1];
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

function detectLight(prompt: string): boolean {
  return /light|white|cream|soft|pastel|clean|minimal|wedding|elegant|luxur/.test(prompt.toLowerCase());
}

function detectPalette(prompt: string, light: boolean, vibe: string) {
  const p = prompt.toLowerCase();
  if (light) {
    if (/green|sage|nature|yoga|eco|organic/.test(p)) return LIGHT_PALETTES.sage;
    if (/wedding|rose|blush|pink/.test(p)) return LIGHT_PALETTES.blush;
    if (/blue|sky|corporate/.test(p)) return LIGHT_PALETTES.sky;
    return LIGHT_PALETTES.cream;
  }
  if (/green|nature|eco|organic|money/.test(p)) return DARK_PALETTES.green;
  if (/blue|ocean|corporate|trust|tech/.test(p)) return DARK_PALETTES.ocean;
  if (/purple|violet|berry|royal/.test(p)) return DARK_PALETTES.berry;
  if (/red|fire|spice|hot|love/.test(p)) return DARK_PALETTES.red;
  if (/tech|saas|software|startup|code/.test(p)) return DARK_PALETTES.tech;
  if (vibe === "luxury") return DARK_PALETTES.violet;
  if (vibe === "bold") return DARK_PALETTES.red;
  return DARK_PALETTES.violet;
}

function detectSize(prompt: string): { w: number; h: number; name: string } {
  const p = prompt.toLowerCase();
  if (/story|reel|snap|vertical video/.test(p)) return { w: 1080, h: 1920, name: "Story / Reel" };
  if (/square|instagram|ig /.test(p)) return { w: 1080, h: 1080, name: "Social Post" };
  if (/banner|header|web|hero|billboard/.test(p)) return { w: 1500, h: 500, name: "Web Banner" };
  if (/poster/.test(p)) return { w: 1080, h: 1620, name: "Poster" };
  if (/flyer/.test(p)) return { w: 1080, h: 1400, name: "Flyer" };
  if (/card/.test(p)) return { w: 1050, h: 600, name: "Business Card" };
  if (/menu/.test(p)) return { w: 1200, h: 1800, name: "Menu Board" };
  if (/tall|portrait/.test(p)) return { w: 1080, h: 1350, name: "Portrait" };
  return { w: 1080, h: 1350, name: "Portrait" };
}

function detectBrandName(prompt: string): string {
  // "for X", "for X cafe", "X grand opening", quoted names
  const quoted = prompt.match(/["“']([^"”']{2,30})["”']/);
  if (quoted) return quoted[1].trim();
  const forMatch = prompt.match(/\bfor\s+([A-Z][\w&'’\- ]{1,28})/);
  if (forMatch) {
    const name = forMatch[1].trim();
    // strip trailing common words that belong to the occasion, not the name
    const cleaned = name.replace(/\s+(grand opening|sale|poster|flyer|banner|launch|event|story|invite)$/i, "").trim();
    if (cleaned.length >= 2) return cleaned;
  }
  const capWords = prompt.match(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/g);
  if (capWords && capWords.length > 0) {
    const stop = new Set(["I", "The", "A", "An", "My", "Our", "Design", "Make", "Create", "Generate", "Please", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "January", "February", "March", "April", "June", "July", "August", "September", "October", "November", "December"]);
    const cand = capWords.find((w) => !stop.has(w) && w.length > 2);
    if (cand) return cand;
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
  const m = prompt.match(/\b(mon|tues|wednes|thurs|fri|satur|sun)day\b[^.,;]*/i);
  if (m) return m[0].replace(/\b\w/g, (c) => c.toUpperCase());
  const dm = prompt.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?)\b/i);
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

function pickDisplayFont(vibe: string, occasion: string): string {
  if (vibe === "luxury") return "playfair";
  if (vibe === "fun") return "anton";
  if (vibe === "minimal") return "poppins";
  if (vibe === "bold") return "anton";
  if (occasion === "real-estate" || occasion === "business") return "montserrat";
  if (occasion === "food") return "bebas-neue";
  if (occasion === "fitness") return "anton";
  return DISPLAY_FONTS[0];
}

function pickPattern(occasion: string, vibe: string): PatternKind {
  if (vibe === "fun" || occasion === "birthday") return "dots";
  if (occasion === "fitness" || occasion === "tech" || occasion === "business") return "diagonal";
  return "none";
}

// ------------------------------------------------------------
// Main entry — prompt → design
// ------------------------------------------------------------

export function generateFromPrompt(prompt: string, sizeHint?: string): GenerateResult {
  const notes: string[] = [];
  const occasion = detectOccasion(prompt);
  const vibe = detectVibe(prompt);
  const light = detectLight(prompt);
  const palette = detectPalette(prompt, light, vibe);
  const size = sizeHint ? (CANVAS_PRESETS.find((p) => p.id === sizeHint) || detectSize(prompt)) : detectSize(prompt);
  const brandName = detectBrandName(prompt);
  const offer = detectOffer(prompt, occasion.offerDefault);
  const dateStr = detectDate(prompt);
  const contact = detectContact(prompt);
  const displayFont = pickDisplayFont(vibe, occasion.id);
  const bodyFont = vibe === "luxury" || light ? "lora" : "poppins";
  const pattern = pickPattern(occasion.id, vibe);

  notes.push(`Detected occasion: ${occasion.headline.toLowerCase()} (${occasion.id})`);
  notes.push(`Theme: ${light ? "light" : "dark"}, palette ${palette.from} → ${palette.to}, accent ${palette.accent}`);
  notes.push(`Fonts: ${displayFont} (display) + ${bodyFont} (body), size ${size.w}×${size.h} (${size.name})`);
  if (brandName !== "Your Brand") notes.push(`Brand: "${brandName}"`);
  if (offer !== occasion.offerDefault) notes.push(`Offer: "${offer}"`);

  const W = size.w, H = size.h;
  const cx = W / 2;
  const isWide = W > H * 1.4;
  const isTall = H > W * 1.3;
  const titleSize = Math.round(Math.min(W, H) * (isWide ? 0.18 : 0.13));
  const nameSize = Math.round(Math.min(W, H) * (vibe === "luxury" ? 0.11 : 0.145));
  const subSize = Math.round(Math.min(W, H) * 0.036);
  const offerSize = Math.round(Math.min(W, H) * 0.055);

  const base = (over: Partial<StudioElement>): StudioElement => ({
    id: uid("ai"), type: "text", x: 0, y: 0, w: W * 0.8, h: 60, rotation: 0,
    opacity: 1, locked: false, font: bodyFont, fontSize: subSize, fontWeight: 400,
    color: palette.text, align: "center", lineHeight: 1.2, letterSpacing: 0,
    ...over,
  });

  const elements: StudioElement[] = [];

  if (isWide) {
    // ---- wide banner layout (left text, right decor) ----
    elements.push(base({ text: occasion.sub.toUpperCase(), color: palette.sub, font: bodyFont, fontWeight: 600, letterSpacing: 3, align: "left", x: W * 0.08, y: H * 0.2, w: W * 0.5, h: subSize * 1.4 }));
    elements.push(base({ text: brandName.toUpperCase(), font: displayFont, fontSize: titleSize, fontWeight: 700, align: "left", x: W * 0.08, y: H * 0.32, w: W * 0.55, h: titleSize * 1.2, lineHeight: 1.05 }));
    elements.push(base({ text: offer, font: displayFont, fontSize: offerSize, fontWeight: 600, color: palette.accent, align: "left", x: W * 0.08, y: H * 0.62, w: W * 0.55, h: offerSize * 1.2 }));
    if (dateStr) elements.push(base({ text: dateStr, color: palette.sub, align: "left", x: W * 0.08, y: H * 0.8, w: W * 0.5, h: subSize * 1.3 }));
    elements.push({ id: uid("ai"), type: "clipart", emoji: occasion.emoji, x: W * 0.72, y: H * 0.28, w: H * 0.45, h: H * 0.45, rotation: 0, opacity: 0.95, locked: false, fontSize: Math.round(H * 0.42) });
    elements.push({ id: uid("ai"), type: "shape", shape: "circle", fill: palette.accent, x: W * 0.68, y: -H * 0.1, w: H * 0.7, h: H * 0.7, rotation: 0, opacity: 0.12, locked: false });
  } else {
    // ---- portrait / square layout (stacked, centered) ----
    const top = isTall ? H * 0.09 : H * 0.08;
    elements.push({ id: uid("ai"), type: "clipart", emoji: occasion.emoji, x: cx - Math.min(W, H) * 0.09, y: top, w: Math.min(W, H) * 0.18, h: Math.min(W, H) * 0.18, rotation: 0, opacity: 0.95, locked: false, fontSize: Math.round(Math.min(W, H) * 0.17) });
    elements.push(base({ text: occasion.sub, color: palette.sub, italic: light, x: W * 0.15, y: top + Math.min(W, H) * 0.24, w: W * 0.7, h: subSize * 1.4 }));
    elements.push(base({ text: brandName, font: displayFont, fontSize: nameSize, fontWeight: vibe === "luxury" ? 600 : 800, x: W * 0.1, y: top + Math.min(W, H) * 0.30, w: W * 0.8, h: nameSize * 1.6, lineHeight: 1.06 }));
    const lineY = top + Math.min(W, H) * 0.30 + nameSize * 1.7;
    elements.push({ id: uid("ai"), type: "shape", shape: "line", fill: palette.accent, x: cx - W * 0.1, y: lineY, w: W * 0.2, h: 3, rotation: 0, opacity: 0.9, locked: false });
    elements.push(base({ text: occasion.headline, font: displayFont, fontSize: Math.round(titleSize * 0.62), fontWeight: 600, color: palette.accent, letterSpacing: 4, x: W * 0.1, y: lineY + Math.min(W, H) * 0.03, w: W * 0.8, h: titleSize * 0.7 }));
    const offerY = lineY + Math.min(W, H) * 0.17;
    elements.push(base({ text: offer, font: bodyFont, fontSize: offerSize, fontWeight: 700, color: palette.text, x: W * 0.1, y: offerY, w: W * 0.8, h: offerSize * 1.3 }));
    let cursorY = offerY + offerSize * 2.2;
    if (dateStr) {
      elements.push(base({ text: dateStr, color: palette.sub, fontWeight: 500, x: W * 0.15, y: cursorY, w: W * 0.7, h: subSize * 1.4 }));
      cursorY += subSize * 2.2;
    }
    if (contact) {
      elements.push(base({ text: contact, color: palette.sub, font: "jetbrains", fontSize: Math.round(subSize * 0.8), x: W * 0.15, y: cursorY, w: W * 0.7, h: subSize * 1.2 }));
      cursorY += subSize * 1.6;
    }
    // CTA pill near the bottom
    const pillH = Math.min(W, H) * 0.11;
    const pillY = Math.min(H * 0.86, cursorY + Math.min(W, H) * 0.05);
    elements.push({ id: uid("ai"), type: "shape", shape: "pill", fill: palette.accent, x: W * 0.28, y: pillY, w: W * 0.44, h: pillH, rotation: 0, opacity: 1, locked: false });
    elements.push(base({ text: "Learn more →", font: bodyFont, fontSize: Math.round(pillH * 0.34), fontWeight: 700, color: light ? "#FFFFFF" : "#0A0A0A", x: W * 0.28, y: pillY + pillH * 0.28, w: W * 0.44, h: pillH * 0.4 }));
  }

  const design: StudioDesign = {
    name: `${brandName} — ${occasion.headline.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`,
    width: W,
    height: H,
    background: { from: palette.from, to: palette.to, angle: 150, pattern },
    elements,
  };

  return { design, notes };
}
