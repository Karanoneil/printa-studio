// ============================================================
// Printa Studio — shared design document model
// ============================================================

export type ShapeKind = "rect" | "pill" | "circle" | "triangle" | "line";
export type PatternKind = "none" | "dots" | "grid" | "diagonal";

export interface StudioElement {
  id: string;
  type: "text" | "shape" | "image" | "clipart";
  /** top-left corner, canvas px */
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number; // degrees
  opacity: number; // 0-1
  locked: boolean;

  // text
  text?: string;
  font?: string; // FontOption.id (see lib/data.ts FONT_LIBRARY)
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  align?: "left" | "center" | "right";
  italic?: boolean;
  lineHeight?: number; // multiplier
  letterSpacing?: number; // px
  uppercase?: boolean;

  // shape
  shape?: ShapeKind;
  fill?: string;

  // image
  src?: string;

  // clipart
  emoji?: string;
}

export interface StudioDesign {
  name: string;
  width: number;
  height: number;
  background: {
    from: string;
    to: string;
    angle: number; // deg, 0 = vertical, 135 = diagonal
    pattern: PatternKind;
    image?: string; // data URL, drawn under gradient overlay
    overlayOpacity?: number; // 0-1 gradient overlay strength when image set
  };
  elements: StudioElement[];
}

// ------------------------------------------------------------
// Canvas presets
// ------------------------------------------------------------

export interface CanvasPreset {
  id: string;
  name: string;
  w: number;
  h: number;
  category: string;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: "instagram", name: "Instagram Post", w: 1080, h: 1080, category: "Social" },
  { id: "story", name: "Story / Reel", w: 1080, h: 1920, category: "Social" },
  { id: "post", name: "Facebook Post", w: 1200, h: 900, category: "Social" },
  { id: "banner", name: "Web Banner", w: 1500, h: 500, category: "Web" },
  { id: "presentation", name: "Presentation", w: 1280, h: 720, category: "Web" },
  { id: "poster", name: "Poster", w: 1080, h: 1620, category: "Print" },
  { id: "flyer", name: "Flyer", w: 1080, h: 1400, category: "Print" },
  { id: "portrait", name: "Portrait 4:5", w: 1080, h: 1350, category: "Social" },
  { id: "card", name: "Business Card", w: 1050, h: 600, category: "Print" },
  { id: "menu", name: "Menu Board", w: 1200, h: 1800, category: "Print" },
];

// ------------------------------------------------------------
// Background palettes (from/to pairs)
// ------------------------------------------------------------

export const GRADIENT_PRESETS: { name: string; from: string; to: string }[] = [
  { name: "Midnight Violet", from: "#1A1033", to: "#4C1D95" },
  { name: "Sunset", from: "#FF6B35", to: "#FDCB35" },
  { name: "Ocean", from: "#0353A4", to: "#0496FF" },
  { name: "Forest", from: "#1A2F1A", to: "#2D5F3F" },
  { name: "Blush", from: "#FADDE1", to: "#E8A4BF" },
  { name: "Berry", from: "#2D1B3D", to: "#7B2D8E" },
  { name: "Ember", from: "#3B0D0D", to: "#E63946" },
  { name: "Slate Tech", from: "#0F172A", to: "#1E293B" },
  { name: "Mint Fresh", from: "#064E3B", to: "#10B981" },
  { name: "Golden Hour", from: "#1A1A2E", to: "#D4AF37" },
  { name: "Clean Light", from: "#FAFAFA", to: "#E5E7EB" },
  { name: "Ink", from: "#0A0A0A", to: "#1A1A1A" },
];

export const SOLID_SWATCHES = [
  "#FFFFFF", "#FAFAFA", "#E5E7EB", "#94A3B8", "#0A0A0A",
  "#1A1A2E", "#4C1D95", "#7B2D8E", "#E63946", "#F59E0B",
  "#FDCB35", "#10B981", "#0496FF", "#0EA5E9", "#EC4899",
  "#2D5F3F", "#D2691E", "#8B4513", "#F5F0E0", "#FFF8DC",
];

// ------------------------------------------------------------
// Factory helpers
// ------------------------------------------------------------

let elCounter = 0;
export function uid(prefix = "el"): string {
  elCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${elCounter.toString(36)}`;
}

export function emptyDesign(preset: CanvasPreset, name?: string): StudioDesign {
  return {
    name: name || preset.name,
    width: preset.w,
    height: preset.h,
    background: { from: "#1A1033", to: "#4C1D95", angle: 135, pattern: "none" },
    elements: [],
  };
}

export function textDefaults(design: StudioDesign): StudioElement {
  return {
    id: uid(),
    type: "text",
    x: Math.round(design.width * 0.1),
    y: Math.round(design.height * 0.4),
    w: Math.round(design.width * 0.8),
    h: Math.round(design.height * 0.1),
    rotation: 0,
    opacity: 1,
    locked: false,
    text: "Your text here",
    font: "poppins",
    fontSize: Math.round(Math.min(design.width, design.height) * 0.08),
    fontWeight: 600,
    color: "#FFFFFF",
    align: "center",
    italic: false,
    lineHeight: 1.15,
    letterSpacing: 0,
    uppercase: false,
  };
}

// ------------------------------------------------------------
// Templates — hand-designed starting points
// ------------------------------------------------------------

export interface Template {
  id: string;
  name: string;
  category: string;
  design: StudioDesign;
}

const T = (
  id: string, name: string, category: string, design: StudioDesign
): Template => ({ id, name, category, design });

export const TEMPLATES: Template[] = [
  T("opening-poster", "Grand Opening Poster", "Poster", {
    name: "Grand Opening Poster",
    width: 1080, height: 1620,
    background: { from: "#1A1033", to: "#4C1D95", angle: 135, pattern: "dots" },
    elements: [
      { id: "t1", type: "clipart", emoji: "✨", x: 500, y: 120, w: 80, h: 80, rotation: 0, opacity: 0.9, locked: false, fontSize: 80 },
      { id: "t2", type: "shape", shape: "pill", fill: "#F59E0B", x: 390, y: 250, w: 300, h: 88, rotation: 0, opacity: 1, locked: false },
      { id: "t3", type: "text", text: "Grand Opening", font: "anton", fontSize: 38, fontWeight: 400, color: "#1A1033", align: "center", x: 390, y: 272, w: 300, h: 46, rotation: 0, opacity: 1, locked: false, uppercase: true, lineHeight: 1.15, letterSpacing: 2 },
      { id: "t4", type: "text", text: "Bloom\n& Brew", font: "playfair", fontSize: 150, fontWeight: 900, color: "#FFFFFF", align: "center", x: 90, y: 430, w: 900, h: 360, rotation: 0, opacity: 1, locked: false, lineHeight: 1.05, letterSpacing: 0 },
      { id: "t5", type: "shape", shape: "line", fill: "#F59E0B", x: 440, y: 840, w: 200, h: 4, rotation: 0, opacity: 1, locked: false },
      { id: "t6", type: "text", text: "Artisan café · Fresh brews · Good vibes", font: "inter", fontSize: 34, fontWeight: 400, color: "#C4B5FD", align: "center", x: 140, y: 890, w: 800, h: 44, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "t7", type: "text", text: "Opens Saturday\nJune 14 · 9 AM", font: "poppins", fontSize: 52, fontWeight: 700, color: "#FDE68A", align: "center", x: 240, y: 1060, w: 600, h: 130, rotation: 0, opacity: 1, locked: false, lineHeight: 1.25 },
      { id: "t8", type: "shape", shape: "pill", fill: "#F59E0B", x: 290, y: 1300, w: 500, h: 110, rotation: 0, opacity: 1, locked: false },
      { id: "t9", type: "text", text: "First 50 coffees FREE", font: "poppins", fontSize: 34, fontWeight: 700, color: "#1A1033", align: "center", x: 290, y: 1335, w: 500, h: 44, rotation: 0, opacity: 1, locked: false, lineHeight: 1.15 },
    ],
  }),
  T("coffee-ig", "Coffee Shop Social", "Social", {
    name: "Coffee Shop Social",
    width: 1080, height: 1080,
    background: { from: "#FFF8DC", to: "#F4E4C1", angle: 135, pattern: "none" },
    elements: [
      { id: "c1", type: "clipart", emoji: "☕", x: 470, y: 130, w: 140, h: 140, rotation: 0, opacity: 1, locked: false, fontSize: 140 },
      { id: "c2", type: "text", text: "Roast & Toast", font: "playfair", fontSize: 96, fontWeight: 800, color: "#3B2412", align: "center", x: 90, y: 330, w: 900, h: 110, rotation: 0, opacity: 1, locked: false, lineHeight: 1.1 },
      { id: "c3", type: "text", text: "Single-origin, roasted daily", font: "lora", fontSize: 38, fontWeight: 400, italic: true, color: "#8B5A2B", align: "center", x: 190, y: 470, w: 700, h: 48, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "c4", type: "shape", shape: "line", fill: "#8B5A2B", x: 440, y: 560, w: 200, h: 3, rotation: 0, opacity: 0.6, locked: false },
      { id: "c5", type: "text", text: "BUY 2 GET 1\nEVERY MONDAY", font: "oswald", fontSize: 58, fontWeight: 600, color: "#3B2412", align: "center", x: 240, y: 630, w: 600, h: 140, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2, letterSpacing: 3 },
      { id: "c6", type: "text", text: "@roastandtoast", font: "caveat", fontSize: 48, fontWeight: 600, color: "#A0522D", align: "center", x: 340, y: 880, w: 400, h: 60, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
  T("fitness-story", "Fitness Promo Story", "Social", {
    name: "Fitness Promo Story",
    width: 1080, height: 1920,
    background: { from: "#0A0A0A", to: "#065F46", angle: 160, pattern: "diagonal" },
    elements: [
      { id: "f1", type: "clipart", emoji: "💪", x: 460, y: 240, w: 160, h: 160, rotation: 0, opacity: 1, locked: false, fontSize: 160 },
      { id: "f2", type: "text", text: "NO EXCUSES", font: "anton", fontSize: 140, fontWeight: 400, color: "#10B981", align: "center", x: 90, y: 470, w: 900, h: 160, rotation: 0, opacity: 1, locked: false, lineHeight: 1.05, letterSpacing: 4 },
      { id: "f3", type: "text", text: "ONLY RESULTS", font: "anton", fontSize: 140, fontWeight: 400, color: "#FFFFFF", align: "center", x: 90, y: 640, w: 900, h: 160, rotation: 0, opacity: 1, locked: false, lineHeight: 1.05, letterSpacing: 4 },
      { id: "f4", type: "text", text: "12-week transformation program\nStarts Monday", font: "poppins", fontSize: 44, fontWeight: 500, color: "#D1D5DB", align: "center", x: 190, y: 880, w: 700, h: 110, rotation: 0, opacity: 1, locked: false, lineHeight: 1.35 },
      { id: "f5", type: "shape", shape: "pill", fill: "#10B981", x: 315, y: 1080, w: 450, h: 120, rotation: 0, opacity: 1, locked: false },
      { id: "f6", type: "text", text: "JOIN NOW · 30% OFF", font: "poppins", fontSize: 36, fontWeight: 800, color: "#0A0A0A", align: "center", x: 315, y: 1120, w: 450, h: 44, rotation: 0, opacity: 1, locked: false, letterSpacing: 1 },
      { id: "f7", type: "text", text: "ironhouse.fit", font: "montserrat", fontSize: 34, fontWeight: 600, color: "#6B7280", align: "center", x: 340, y: 1700, w: 400, h: 44, rotation: 0, opacity: 1, locked: false },
    ],
  }),
  T("wedding-invite", "Wedding Invitation", "Print", {
    name: "Wedding Invitation",
    width: 1080, height: 1350,
    background: { from: "#FDF6F0", to: "#F3D9C9", angle: 145, pattern: "none" },
    elements: [
      { id: "w1", type: "clipart", emoji: "🌿", x: 470, y: 150, w: 120, h: 120, rotation: 0, opacity: 0.8, locked: false, fontSize: 120 },
      { id: "w2", type: "text", text: "Together with their families", font: "lora", fontSize: 32, fontWeight: 400, italic: true, color: "#9A7B4F", align: "center", x: 290, y: 320, w: 500, h: 42, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "w3", type: "text", text: "Aisha\n&\nRohan", font: "playfair", fontSize: 120, fontWeight: 600, color: "#4A3222", align: "center", x: 240, y: 400, w: 600, h: 430, rotation: 0, opacity: 1, locked: false, lineHeight: 1.1 },
      { id: "w4", type: "shape", shape: "line", fill: "#9A7B4F", x: 440, y: 880, w: 200, h: 2, rotation: 0, opacity: 0.7, locked: false },
      { id: "w5", type: "text", text: "SATURDAY, 14 NOVEMBER 2026\n6 O'CLOCK IN THE EVENING\nThe Rose Garden, New Delhi", font: "lora", fontSize: 30, fontWeight: 500, color: "#6B5539", align: "center", x: 190, y: 930, w: 700, h: 130, rotation: 0, opacity: 1, locked: false, lineHeight: 1.5 },
      { id: "w6", type: "text", text: "Kindly RSVP by 20 October", font: "dancing-script", fontSize: 52, fontWeight: 600, color: "#9A7B4F", align: "center", x: 290, y: 1140, w: 500, h: 70, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
  T("restaurant-flyer", "Restaurant Flyer", "Print", {
    name: "Restaurant Flyer",
    width: 1080, height: 1400,
    background: { from: "#1A0505", to: "#4C0F0F", angle: 135, pattern: "none" },
    elements: [
      { id: "r1", type: "text", text: "SPICE ROUTE", font: "bebas-neue", fontSize: 110, fontWeight: 400, color: "#F59E0B", align: "center", x: 90, y: 100, w: 900, h: 130, rotation: 0, opacity: 1, locked: false, lineHeight: 1.05, letterSpacing: 6 },
      { id: "r2", type: "text", text: "Authentic Indian Kitchen", font: "lora", fontSize: 36, fontWeight: 400, italic: true, color: "#FCA5A5", align: "center", x: 240, y: 260, w: 600, h: 46, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "r3", type: "clipart", emoji: "🍛", x: 450, y: 350, w: 180, h: 180, rotation: 0, opacity: 1, locked: false, fontSize: 180 },
      { id: "r4", type: "shape", shape: "rect", fill: "#F59E0B", x: 140, y: 600, w: 800, h: 400, rotation: 0, opacity: 0.1, locked: false },
      { id: "r5", type: "text", text: "LUNCH BUFFET\n$12.99", font: "oswald", fontSize: 72, fontWeight: 600, color: "#FFFFFF", align: "center", x: 240, y: 650, w: 600, h: 180, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2, letterSpacing: 2 },
      { id: "r6", type: "text", text: "Every day · 12 PM – 3 PM\nDine-in only", font: "poppins", fontSize: 32, fontWeight: 400, color: "#FDE68A", align: "center", x: 240, y: 870, w: 600, h: 84, rotation: 0, opacity: 1, locked: false, lineHeight: 1.4 },
      { id: "r7", type: "text", text: "Call 555-0123 to book a table", font: "poppins", fontSize: 34, fontWeight: 600, color: "#F59E0B", align: "center", x: 240, y: 1100, w: 600, h: 46, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "r8", type: "text", text: "42 Curry Lane · spice-route.com", font: "inter", fontSize: 26, fontWeight: 400, color: "#9A7B7B", align: "center", x: 240, y: 1280, w: 600, h: 36, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
  T("real-estate", "Real Estate Sign", "Print", {
    name: "Real Estate Sign",
    width: 1080, height: 1350,
    background: { from: "#0B2545", to: "#1D3557", angle: 135, pattern: "grid" },
    elements: [
      { id: "e1", type: "clipart", emoji: "🏡", x: 440, y: 140, w: 200, h: 200, rotation: 0, opacity: 1, locked: false, fontSize: 200 },
      { id: "e2", type: "text", text: "FOR SALE", font: "anton", fontSize: 120, fontWeight: 400, color: "#FFFFFF", align: "center", x: 90, y: 420, w: 900, h: 140, rotation: 0, opacity: 1, locked: false, lineHeight: 1.05, letterSpacing: 5 },
      { id: "e3", type: "text", text: "4 Bed · 3 Bath · 2,400 sq ft", font: "montserrat", fontSize: 44, fontWeight: 600, color: "#A8DADC", align: "center", x: 190, y: 620, w: 700, h: 56, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "e4", type: "shape", shape: "pill", fill: "#FCBF49", x: 290, y: 740, w: 500, h: 130, rotation: 0, opacity: 1, locked: false },
      { id: "e5", type: "text", text: "$749,000", font: "poppins", fontSize: 64, fontWeight: 800, color: "#0B2545", align: "center", x: 290, y: 770, w: 500, h: 80, rotation: 0, opacity: 1, locked: false, lineHeight: 1.15 },
      { id: "e6", type: "text", text: "Open House\nSunday 1–4 PM", font: "montserrat", fontSize: 40, fontWeight: 500, color: "#FFFFFF", align: "center", x: 290, y: 950, w: 500, h: 100, rotation: 0, opacity: 1, locked: false, lineHeight: 1.35 },
      { id: "e7", type: "text", text: "HomeFinders Realty · 555-0199", font: "inter", fontSize: 30, fontWeight: 400, color: "#8DA9C4", align: "center", x: 240, y: 1150, w: 600, h: 40, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
  T("birthday-story", "Birthday Bash Story", "Social", {
    name: "Birthday Bash Story",
    width: 1080, height: 1920,
    background: { from: "#2D1B69", to: "#EC4899", angle: 150, pattern: "dots" },
    elements: [
      { id: "b1", type: "clipart", emoji: "🎉", x: 150, y: 220, w: 120, h: 120, rotation: -15, opacity: 1, locked: false, fontSize: 120 },
      { id: "b2", type: "clipart", emoji: "🎈", x: 810, y: 300, w: 110, h: 110, rotation: 12, opacity: 1, locked: false, fontSize: 110 },
      { id: "b3", type: "text", text: "IT'S MY", font: "poppins", fontSize: 70, fontWeight: 500, color: "#FDE68A", align: "center", x: 240, y: 560, w: 600, h: 84, rotation: 0, opacity: 1, locked: false, lineHeight: 1.15, letterSpacing: 8 },
      { id: "b4", type: "text", text: "BIRTHDAY", font: "anton", fontSize: 170, fontWeight: 400, color: "#FFFFFF", align: "center", x: 60, y: 680, w: 960, h: 190, rotation: 0, opacity: 1, locked: false, lineHeight: 1.05 },
      { id: "b5", type: "clipart", emoji: "🎂", x: 460, y: 950, w: 160, h: 160, rotation: 0, opacity: 1, locked: false, fontSize: 160 },
      { id: "b6", type: "text", text: "SATURDAY · 8 PM\nSkyline Rooftop Lounge", font: "poppins", fontSize: 44, fontWeight: 600, color: "#FFFFFF", align: "center", x: 190, y: 1180, w: 700, h: 110, rotation: 0, opacity: 1, locked: false, lineHeight: 1.35 },
      { id: "b7", type: "shape", shape: "pill", fill: "#FFFFFF", x: 340, y: 1360, w: 400, h: 110, rotation: 0, opacity: 0.18, locked: false },
      { id: "b8", type: "text", text: "DM for invites 💌", font: "dancing-script", fontSize: 56, fontWeight: 700, color: "#FFFFFF", align: "center", x: 340, y: 1385, w: 400, h: 74, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
  T("business-card", "Minimal Business Card", "Print", {
    name: "Minimal Business Card",
    width: 1050, height: 600,
    background: { from: "#FAFAFA", to: "#F1F1F1", angle: 135, pattern: "none" },
    elements: [
      { id: "k1", type: "shape", shape: "rect", fill: "#1A1A2E", x: 0, y: 0, w: 26, h: 600, rotation: 0, opacity: 1, locked: false },
      { id: "k2", type: "text", text: "Aisha Kapoor", font: "playfair", fontSize: 74, fontWeight: 700, color: "#1A1A2E", align: "left", x: 100, y: 190, w: 620, h: 88, rotation: 0, opacity: 1, locked: false, lineHeight: 1.1 },
      { id: "k3", type: "text", text: "Brand & Packaging Designer", font: "inter", fontSize: 30, fontWeight: 400, color: "#6B7280", align: "left", x: 102, y: 300, w: 620, h: 40, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "k4", type: "shape", shape: "line", fill: "#D4AF37", x: 102, y: 380, w: 120, h: 3, rotation: 0, opacity: 1, locked: false },
      { id: "k5", type: "text", text: "hello@aishakapoor.com", font: "jetbrains", fontSize: 24, fontWeight: 400, color: "#374151", align: "left", x: 102, y: 420, w: 620, h: 32, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "k6", type: "text", text: "+91 98765 43210 · aishakapoor.com", font: "jetbrains", fontSize: 24, fontWeight: 400, color: "#374151", align: "left", x: 102, y: 470, w: 620, h: 32, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
  T("salon-poster", "Salon & Spa Poster", "Poster", {
    name: "Salon & Spa Poster",
    width: 1080, height: 1440,
    background: { from: "#2D1B3D", to: "#C77DFF", angle: 160, pattern: "none" },
    elements: [
      { id: "s1", type: "text", text: "Glow Up", font: "dancing-script", fontSize: 160, fontWeight: 700, color: "#FFFFFF", align: "center", x: 140, y: 220, w: 800, h: 200, rotation: 0, opacity: 1, locked: false, lineHeight: 1.1 },
      { id: "s2", type: "text", text: "SALON & SPA", font: "montserrat", fontSize: 40, fontWeight: 600, color: "#E0AFFF", align: "center", x: 290, y: 460, w: 500, h: 50, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2, letterSpacing: 10 },
      { id: "s3", type: "clipart", emoji: "💅", x: 450, y: 580, w: 180, h: 180, rotation: 0, opacity: 1, locked: false, fontSize: 180 },
      { id: "s4", type: "text", text: "Monsoon Package", font: "playfair", fontSize: 56, fontWeight: 700, color: "#FFFFFF", align: "center", x: 190, y: 830, w: 700, h: 70, rotation: 0, opacity: 1, locked: false, lineHeight: 1.15 },
      { id: "s5", type: "text", text: "Facial · Mani-Pedi · Head Massage\n₹1,999 only", font: "poppins", fontSize: 38, fontWeight: 400, color: "#F3E8FF", align: "center", x: 190, y: 930, w: 700, h: 100, rotation: 0, opacity: 1, locked: false, lineHeight: 1.4 },
      { id: "s6", type: "shape", shape: "pill", fill: "#FFFFFF", x: 330, y: 1120, w: 420, h: 110, rotation: 0, opacity: 1, locked: false },
      { id: "s7", type: "text", text: "BOOK: 555-0177", font: "montserrat", fontSize: 34, fontWeight: 700, color: "#2D1B3D", align: "center", x: 330, y: 1152, w: 420, h: 44, rotation: 0, opacity: 1, locked: false, letterSpacing: 2 },
    ],
  }),
  T("tech-banner", "Tech Web Banner", "Web", {
    name: "Tech Web Banner",
    width: 1500, height: 500,
    background: { from: "#0F172A", to: "#1E293B", angle: 120, pattern: "grid" },
    elements: [
      { id: "x1", type: "text", text: "Ship faster", font: "poppins", fontSize: 96, fontWeight: 800, color: "#FFFFFF", align: "left", x: 120, y: 140, w: 700, h: 110, rotation: 0, opacity: 1, locked: false, lineHeight: 1.1 },
      { id: "x2", type: "text", text: "with less code", font: "poppins", fontSize: 96, fontWeight: 300, color: "#38BDF8", align: "left", x: 120, y: 260, w: 700, h: 110, rotation: 0, opacity: 1, locked: false, lineHeight: 1.1 },
      { id: "x3", type: "text", text: "Deployment pipelines · Zero-config · Free tier", font: "inter", fontSize: 30, fontWeight: 400, color: "#94A3B8", align: "left", x: 124, y: 400, w: 700, h: 40, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "x4", type: "shape", shape: "circle", fill: "#38BDF8", x: 1150, y: 90, w: 320, h: 320, rotation: 0, opacity: 0.15, locked: false },
      { id: "x5", type: "shape", shape: "circle", fill: "#818CF8", x: 1250, y: 190, w: 240, h: 240, rotation: 0, opacity: 0.15, locked: false },
      { id: "x6", type: "text", text: "deploy.dev", font: "jetbrains", fontSize: 34, fontWeight: 500, color: "#38BDF8", align: "right", x: 1150, y: 230, w: 300, h: 44, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
  T("yoga-flyer", "Yoga Studio Flyer", "Print", {
    name: "Yoga Studio Flyer",
    width: 1080, height: 1400,
    background: { from: "#F5F0E0", to: "#D4E4C4", angle: 145, pattern: "none" },
    elements: [
      { id: "y1", type: "clipart", emoji: "🧘", x: 410, y: 160, w: 260, h: 260, rotation: 0, opacity: 1, locked: false, fontSize: 260 },
      { id: "y2", type: "text", text: "Breathe\nInward", font: "playfair", fontSize: 120, fontWeight: 600, color: "#2D5F3F", align: "center", x: 190, y: 480, w: 700, h: 280, rotation: 0, opacity: 1, locked: false, lineHeight: 1.08 },
      { id: "y3", type: "shape", shape: "line", fill: "#8FBC8F", x: 440, y: 800, w: 200, h: 3, rotation: 0, opacity: 0.8, locked: false },
      { id: "y4", type: "text", text: "Morning Hatha · Evening Vinyasa\nMon to Sat", font: "lora", fontSize: 36, fontWeight: 400, color: "#4A6B57", align: "center", x: 190, y: 860, w: 700, h: 96, rotation: 0, opacity: 1, locked: false, lineHeight: 1.4 },
      { id: "y5", type: "text", text: "First class FREE", font: "caveat", fontSize: 84, fontWeight: 700, color: "#2D5F3F", align: "center", x: 240, y: 1030, w: 600, h: 110, rotation: 0, opacity: 1, locked: false, lineHeight: 1.15 },
      { id: "y6", type: "text", text: "inward.yoga · 555-0142", font: "inter", fontSize: 28, fontWeight: 400, color: "#7A9B87", align: "center", x: 290, y: 1230, w: 500, h: 38, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
  T("menu-board", "Menu Board", "Print", {
    name: "Menu Board",
    width: 1200, height: 1800,
    background: { from: "#FFF8DC", to: "#F4E4C1", angle: 135, pattern: "none" },
    elements: [
      { id: "m1", type: "text", text: "MENU", font: "bebas-neue", fontSize: 170, fontWeight: 400, color: "#3B2412", align: "center", x: 300, y: 120, w: 600, h: 180, rotation: 0, opacity: 1, locked: false, lineHeight: 1.05, letterSpacing: 8 },
      { id: "m2", type: "shape", shape: "line", fill: "#3B2412", x: 500, y: 340, w: 200, h: 4, rotation: 0, opacity: 1, locked: false },
      { id: "m3", type: "text", text: "Espresso .......... $3", font: "lora", fontSize: 44, fontWeight: 500, color: "#3B2412", align: "left", x: 200, y: 440, w: 800, h: 58, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "m4", type: "text", text: "Cappuccino .......... $4", font: "lora", fontSize: 44, fontWeight: 500, color: "#3B2412", align: "left", x: 200, y: 540, w: 800, h: 58, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "m5", type: "text", text: "Latte .......... $4.5", font: "lora", fontSize: 44, fontWeight: 500, color: "#3B2412", align: "left", x: 200, y: 640, w: 800, h: 58, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "m6", type: "text", text: "Mocha .......... $5", font: "lora", fontSize: 44, fontWeight: 500, color: "#3B2412", align: "left", x: 200, y: 740, w: 800, h: 58, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "m7", type: "text", text: "Cold Brew .......... $4.5", font: "lora", fontSize: 44, fontWeight: 500, color: "#3B2412", align: "left", x: 200, y: 840, w: 800, h: 58, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
      { id: "m8", type: "clipart", emoji: "☕", x: 490, y: 1050, w: 220, h: 220, rotation: 0, opacity: 0.9, locked: false, fontSize: 220 },
      { id: "m9", type: "text", text: "Ask about our pastry of the day!", font: "caveat", fontSize: 56, fontWeight: 600, color: "#A0522D", align: "center", x: 200, y: 1340, w: 800, h: 76, rotation: 0, opacity: 1, locked: false, lineHeight: 1.2 },
    ],
  }),
];

export const TEMPLATE_CATEGORIES = ["All", "Social", "Print", "Poster", "Web"];
