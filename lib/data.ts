// ============================================================
// PRINTA STUDIO — Data Layer
// Business types, products, materials, vibes, fonts, clipart
// ============================================================

export interface BusinessType {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  products: string[];
  vibeSuggestions: string[];
  colorSuggestions: string[];
  occasionSuggestions: string[];
}

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "restaurant",
    label: "Restaurant / Café",
    emoji: "🍽️",
    blurb: "Food service — menus, window signage, outdoor banners",
    products: ["banner", "flyer", "sticker", "menu-board", "window-decal", "table-tent", "poster", "standee"],
    vibeSuggestions: ["bold", "warm", "premium"],
    colorSuggestions: ["#D4A055", "#8B2D2D", "#2D5F3F", "#F5E6D3", "#1A1A1A"],
    occasionSuggestions: ["grand opening", "new menu launch", "festival special", "daily specials"],
  },
  {
    id: "retail",
    label: "Retail Store",
    emoji: "🛍️",
    blurb: "Shops — sale signage, window displays, shelf tags",
    products: ["banner", "sale-sign", "window-display", "sticker", "standee", "poster", "flyer"],
    vibeSuggestions: ["bold", "playful", "corporate"],
    colorSuggestions: ["#E63946", "#1D3557", "#F1FAEE", "#FCBF49", "#2A9D8F"],
    occasionSuggestions: ["seasonal sale", "new arrival", "clearance", "holiday special"],
  },
  {
    id: "salon",
    label: "Salon / Spa",
    emoji: "💆",
    blurb: "Beauty & wellness — service menus, loyalty cards, signage",
    products: ["banner", "poster", "window-decal", "sticker", "standee", "flyer"],
    vibeSuggestions: ["premium", "minimal", "warm"],
    colorSuggestions: ["#C9B1D9", "#7E5A9B", "#F5F0EB", "#2D2D2D", "#D4A574"],
    occasionSuggestions: ["grand opening", "seasonal promo", "membership drive", "service launch"],
  },
  {
    id: "gym",
    label: "Gym / Fitness",
    emoji: "💪",
    blurb: "Fitness — motivational walls, membership promos, decals",
    products: ["banner", "poster", "wall-decal", "sticker", "standee", "flyer"],
    vibeSuggestions: ["bold", "energetic", "dark"],
    colorSuggestions: ["#FF6B35", "#1B1B1E", "#00CECB", "#FFD166", "#EF476F"],
    occasionSuggestions: ["new year push", "membership drive", "class launch", "challenge event"],
  },
  {
    id: "real-estate",
    label: "Real Estate",
    emoji: "🏡",
    blurb: "Property — yard signs, open house, flyers, business cards",
    products: ["yard-sign", "banner", "flyer", "poster", "business-card", "door-hanger"],
    vibeSuggestions: ["corporate", "clean", "premium"],
    colorSuggestions: ["#003049", "#669BBC", "#FDF0D5", "#C1121F", "#780000"],
    occasionSuggestions: ["open house", "new listing", "just sold", "agent branding"],
  },
  {
    id: "event",
    label: "Event / Wedding",
    emoji: "🎉",
    blurb: "Celebrations — banners, invitations, welcome signs, backdrops",
    products: ["banner", "poster", "sticker", "standee", "flyer", "welcome-sign"],
    vibeSuggestions: ["premium", "playful", "elegant"],
    colorSuggestions: ["#B76E79", "#E8C4C8", "#4A3B47", "#F5E8D4", "#9B2D26"],
    occasionSuggestions: ["wedding", "birthday", "corporate event", "festival"],
  },
  {
    id: "tech",
    label: "Tech / Startup",
    emoji: "💻",
    blurb: "Technology — office signage, event booths, laptop stickers",
    products: ["banner", "standee", "sticker", "poster", "window-decal", "laptop-decal"],
    vibeSuggestions: ["minimal", "modern", "bold"],
    colorSuggestions: ["#0A0A0A", "#10B981", "#3B82F6", "#F59E0B", "#1E293B"],
    occasionSuggestions: ["conference", "product launch", "office branding", "hackathon"],
  },
  {
    id: "auto",
    label: "Auto / Repair",
    emoji: "🚗",
    blurb: "Automotive — service boards, window decals, oil change stickers",
    products: ["banner", "service-board", "window-decal", "sticker", "poster", "standee"],
    vibeSuggestions: ["bold", "industrial", "rugged"],
    colorSuggestions: ["#264653", "#E76F51", "#E9C46A", "#F4A261", "#2A9D8F"],
    occasionSuggestions: ["service special", "seasonal tune-up", "new location", "fleet branding"],
  },
];

// ============================================================
// Print Products — with dynamic pricing
// ============================================================

export interface PrintProduct {
  id: string;
  name: string;
  category: string;
  emoji: string;
  defaultWidth: number; // inches
  defaultHeight: number; // inches
  minDPI: number;
  basePricePerSqIn: number; // pricing per square inch
  fixedCost: number; // base cost per item
  description: string;
  allowsCustomSize: boolean;
  maxSizeInches: number; // max dimension
  commonSizes: { label: string; w: number; h: number }[];
}

export const ALL_PRODUCTS: PrintProduct[] = [
  {
    id: "banner",
    name: "Vinyl Banner",
    category: "Banner",
    emoji: "🪧",
    defaultWidth: 36, defaultHeight: 24, minDPI: 150,
    basePricePerSqIn: 0.04, fixedCost: 8,
    description: "Durable vinyl banner, indoor/outdoor, grommeted",
    allowsCustomSize: true, maxSizeInches: 240,
    commonSizes: [
      { label: "Small (2ft × 1.5ft)", w: 24, h: 18 },
      { label: "Standard (3ft × 2ft)", w: 36, h: 24 },
      { label: "Large (6ft × 3ft)", w: 72, h: 36 },
      { label: "XL (8ft × 4ft)", w: 96, h: 48 },
    ],
  },
  {
    id: "flyer",
    name: "Flyer",
    category: "Flyer",
    emoji: "📄",
    defaultWidth: 8.5, defaultHeight: 11, minDPI: 300,
    basePricePerSqIn: 0.08, fixedCost: 0.5,
    description: "Letter-size flyer, single or double-sided",
    allowsCustomSize: false, maxSizeInches: 11,
    commonSizes: [
      { label: "Letter (8.5\" × 11\")", w: 8.5, h: 11 },
      { label: "Half-letter (5.5\" × 8.5\")", w: 5.5, h: 8.5 },
      { label: "A4 (8.27\" × 11.69\")", w: 8.27, h: 11.69 },
    ],
  },
  {
    id: "sticker",
    name: "Sticker",
    category: "Sticker",
    emoji: "🏷️",
    defaultWidth: 3, defaultHeight: 3, minDPI: 300,
    basePricePerSqIn: 0.15, fixedCost: 1,
    description: "Custom die-cut stickers, pack of 50",
    allowsCustomSize: true, maxSizeInches: 12,
    commonSizes: [
      { label: "2\" circle", w: 2, h: 2 },
      { label: "3\" circle", w: 3, h: 3 },
      { label: "4\" square", w: 4, h: 4 },
      { label: "5\" custom", w: 5, h: 5 },
    ],
  },
  {
    id: "standee",
    name: "Roll-up Standee",
    category: "Standee",
    emoji: "🧍",
    defaultWidth: 33, defaultHeight: 78, minDPI: 150,
    basePricePerSqIn: 0.03, fixedCost: 15,
    description: "Roll-up banner stand, portable, with carry bag",
    allowsCustomSize: false, maxSizeInches: 80,
    commonSizes: [
      { label: "Standard (33\" × 78\")", w: 33, h: 78 },
      { label: "Compact (24\" × 63\")", w: 24, h: 63 },
    ],
  },
  {
    id: "poster",
    name: "Poster",
    category: "Poster",
    emoji: "🖼️",
    defaultWidth: 18, defaultHeight: 24, minDPI: 300,
    basePricePerSqIn: 0.06, fixedCost: 2,
    description: "Matte or gloss poster, large format",
    allowsCustomSize: true, maxSizeInches: 48,
    commonSizes: [
      { label: "Small (11\" × 17\")", w: 11, h: 17 },
      { label: "Medium (18\" × 24\")", w: 18, h: 24 },
      { label: "Large (24\" × 36\")", w: 24, h: 36 },
    ],
  },
  {
    id: "window-decal",
    name: "Window Decal",
    category: "Decal",
    emoji: "🪟",
    defaultWidth: 24, defaultHeight: 36, minDPI: 300,
    basePricePerSqIn: 0.07, fixedCost: 3,
    description: "One-way vision or clear, interior/exterior",
    allowsCustomSize: true, maxSizeInches: 96,
    commonSizes: [
      { label: "Small (12\" × 18\")", w: 12, h: 18 },
      { label: "Medium (24\" × 36\")", w: 24, h: 36 },
      { label: "Large (36\" × 48\")", w: 36, h: 48 },
    ],
  },
  {
    id: "yard-sign",
    name: "Yard Sign",
    category: "Sign",
    emoji: "🚏",
    defaultWidth: 18, defaultHeight: 24, minDPI: 150,
    basePricePerSqIn: 0.05, fixedCost: 5,
    description: "Coroplast yard sign with H-stake",
    allowsCustomSize: true, maxSizeInches: 48,
    commonSizes: [
      { label: "Standard (18\" × 24\")", w: 18, h: 24 },
      { label: "Large (24\" × 36\")", w: 24, h: 36 },
    ],
  },
  {
    id: "poster-frame",
    name: "Framed Poster",
    category: "Poster",
    emoji: "🖼️",
    defaultWidth: 18, defaultHeight: 24, minDPI: 300,
    basePricePerSqIn: 0.12, fixedCost: 8,
    description: "Poster with wood/metal frame, ready to hang",
    allowsCustomSize: true, maxSizeInches: 36,
    commonSizes: [
      { label: "Small (11\" × 17\")", w: 11, h: 17 },
      { label: "Medium (18\" × 24\")", w: 18, h: 24 },
    ],
  },
  {
    id: "business-card",
    name: "Business Cards",
    category: "Card",
    emoji: "💳",
    defaultWidth: 3.5, defaultHeight: 2, minDPI: 300,
    basePricePerSqIn: 0.5, fixedCost: 5,
    description: "Premium business cards, pack of 250",
    allowsCustomSize: false, maxSizeInches: 4,
    commonSizes: [
      { label: "Standard (3.5\" × 2\")", w: 3.5, h: 2 },
      { label: "Square (2.5\" × 2.5\")", w: 2.5, h: 2.5 },
    ],
  },
  {
    id: "table-tent",
    name: "Table Tent",
    category: "Tent",
    emoji: "⛺",
    defaultWidth: 5, defaultHeight: 7, minDPI: 300,
    basePricePerSqIn: 0.2, fixedCost: 1,
    description: "Folded table tent card, double-sided",
    allowsCustomSize: false, maxSizeInches: 10,
    commonSizes: [{ label: "Standard (5\" × 7\")", w: 5, h: 7 }],
  },
];

// ============================================================
// Materials — affect pricing
// ============================================================

export interface PrintMaterial {
  id: string;
  name: string;
  description: string;
  priceMultiplier: number;
  finishes: { id: string; label: string; priceAdd: number }[];
}

export const MATERIALS: PrintMaterial[] = [
  {
    id: "vinyl-13oz",
    name: "13oz Vinyl (Standard)",
    description: "Indoor/outdoor, grommets every 2ft, weatherproof",
    priceMultiplier: 1.0,
    finishes: [
      { id: "matte", label: "Matte", priceAdd: 0 },
      { id: "gloss", label: "Gloss", priceAdd: 2 },
    ],
  },
  {
    id: "vinyl-15oz",
    name: "15oz Vinyl (Heavy Duty)",
    description: "Thicker, more opaque, outdoor rated 5+ years",
    priceMultiplier: 1.4,
    finishes: [
      { id: "matte", label: "Matte", priceAdd: 0 },
      { id: "gloss", label: "Gloss", priceAdd: 3 },
    ],
  },
  {
    id: "mesh",
    name: "Mesh Banner",
    description: "Wind-permeable, ideal for outdoor/fences",
    priceMultiplier: 1.5,
    finishes: [{ id: "standard", label: "Standard", priceAdd: 0 }],
  },
  {
    id: "coroplast",
    name: "Coroplast",
    description: "Corrugated plastic, rigid, for yard signs & A-frames",
    priceMultiplier: 0.9,
    finishes: [{ id: "standard", label: "Standard", priceAdd: 0 }],
  },
  {
    id: "photo-paper",
    name: "Photo Paper",
    description: "High-gloss photo quality, indoor posters",
    priceMultiplier: 0.8,
    finishes: [
      { id: "gloss", label: "Gloss", priceAdd: 0 },
      { id: "matte", label: "Matte", priceAdd: 1 },
    ],
  },
  {
    id: "cardstock",
    name: "Card Stock",
    description: "100lb/14pt card, flyers & cards",
    priceMultiplier: 0.7,
    finishes: [
      { id: "matte", label: "Matte", priceAdd: 0 },
      { id: "gloss", label: "Gloss", priceAdd: 0.5 },
      { id: "silk-lam", label: "Silk Lamination", priceAdd: 2 },
    ],
  },
  {
    id: "static-cling",
    name: "Static Cling",
    description: "No adhesive, repositionable, indoor glass",
    priceMultiplier: 1.3,
    finishes: [{ id: "clear", label: "Clear", priceAdd: 0 }, { id: "white", label: "White", priceAdd: 1 }],
  },
  {
    id: "one-way-vision",
    name: "One-Way Vision",
    description: "Perforated window film, see-through from inside",
    priceMultiplier: 1.6,
    finishes: [{ id: "standard", label: "Standard", priceAdd: 0 }],
  },
];

// ============================================================
// Vibes
// ============================================================

export interface StyleVibe {
  id: string;
  label: string;
  blurb: string;
  gradient: string;
  keywords: string[];
}

export const STYLE_VIBES: StyleVibe[] = [
  { id: "bold", label: "Bold & Punchy", blurb: "High contrast, big type, impossible to miss", gradient: "from-orange-500 to-red-500", keywords: ["bold", "high-contrast", "eye-catching"] },
  { id: "warm", label: "Warm & Cozy", blurb: "Inviting, earthy tones, comfortable feel", gradient: "from-amber-600 to-orange-700", keywords: ["warm", "inviting", "earthy"] },
  { id: "premium", label: "Premium & Luxe", blurb: "Gold accents, serif type, dark backgrounds", gradient: "from-amber-600 to-purple-800", keywords: ["luxury", "elegant", "refined"] },
  { id: "playful", label: "Playful & Fun", blurb: "Rounded shapes, bright colors, casual tone", gradient: "from-pink-400 to-cyan-400", keywords: ["fun", "vibrant", "casual"] },
  { id: "corporate", label: "Corporate & Clean", blurb: "Structured, blue tones, professional grid", gradient: "from-blue-600 to-indigo-700", keywords: ["professional", "clean", "trustworthy"] },
  { id: "minimal", label: "Minimal & Modern", blurb: "Lots of whitespace, subtle accents, refined", gradient: "from-slate-400 to-slate-600", keywords: ["minimal", "clean", "modern"] },
  { id: "energetic", label: "Energetic & Sporty", blurb: "Dynamic, high-impact, motivational", gradient: "from-lime-400 to-emerald-500", keywords: ["energetic", "dynamic", "motivational"] },
  { id: "elegant", label: "Elegant & Soft", blurb: "Muted palette, refined, sophisticated", gradient: "from-rose-300 to-purple-400", keywords: ["elegant", "soft", "sophisticated"] },
  { id: "dark", label: "Dark & Moody", blurb: "Black backgrounds, neon accents, nightlife", gradient: "from-gray-800 to-purple-900", keywords: ["dark", "moody", "neon"] },
  { id: "industrial", label: "Industrial & Rugged", blurb: "Bold, weathered, heavy-duty feel", gradient: "from-amber-700 to-gray-700", keywords: ["industrial", "rugged", "bold"] },
];

// ============================================================
// Font Library
// ============================================================

export interface FontOption {
  id: string;
  name: string;
  category: "serif" | "sans-serif" | "display" | "script" | "mono";
  googleFont: string;
  weights: number[];
  preview: string;
}

export const FONT_LIBRARY: FontOption[] = [
  { id: "inter", name: "Inter", category: "sans-serif", googleFont: "Inter", weights: [300, 400, 600, 700, 800, 900], preview: "The quick brown fox" },
  { id: "poppins", name: "Poppins", category: "sans-serif", googleFont: "Poppins", weights: [300, 400, 600, 700, 800], preview: "The quick brown fox" },
  { id: "montserrat", name: "Montserrat", category: "sans-serif", googleFont: "Montserrat", weights: [300, 400, 600, 700, 800, 900], preview: "The quick brown fox" },
  { id: "playfair", name: "Playfair Display", category: "serif", googleFont: "Playfair Display", weights: [400, 600, 700, 800, 900], preview: "The quick brown fox" },
  { id: "lora", name: "Lora", category: "serif", googleFont: "Lora", weights: [400, 500, 600, 700], preview: "The quick brown fox" },
  { id: "oswald", name: "Oswald", category: "display", googleFont: "Oswald", weights: [300, 400, 500, 600, 700], preview: "THE QUICK BROWN FOX" },
  { id: "bebas-neue", name: "Bebas Neue", category: "display", googleFont: "Bebas Neue", weights: [400], preview: "THE QUICK BROWN FOX" },
  { id: "anton", name: "Anton", category: "display", googleFont: "Anton", weights: [400], preview: "THE QUICK BROWN FOX" },
  { id: "pacifico", name: "Pacifico", category: "script", googleFont: "Pacifico", weights: [400], preview: "The quick brown fox" },
  { id: "dancing-script", name: "Dancing Script", category: "script", googleFont: "Dancing Script", weights: [400, 600, 700], preview: "The quick brown fox" },
  { id: "caveat", name: "Caveat", category: "script", googleFont: "Caveat", weights: [400, 500, 600, 700], preview: "The quick brown fox" },
  { id: "jetbrains", name: "JetBrains Mono", category: "mono", googleFont: "JetBrains Mono", weights: [400, 500, 700], preview: "The quick brown fox" },
];

// ============================================================
// Clipart & Shapes
// ============================================================

export interface ClipartItem {
  id: string;
  label: string;
  emoji: string;
  category: string;
}

export const CLIPART: ClipartItem[] = [
  // Food & drink
  { id: "coffee", label: "Coffee Cup", emoji: "☕", category: "Food & Drink" },
  { id: "pizza", label: "Pizza", emoji: "🍕", category: "Food & Drink" },
  { id: "burger", label: "Burger", emoji: "🍔", category: "Food & Drink" },
  { id: "cake", label: "Cake", emoji: "🍰", category: "Food & Drink" },
  { id: "wine", label: "Wine Glass", emoji: "🍷", category: "Food & Drink" },
  { id: "icecream", label: "Ice Cream", emoji: "🍦", category: "Food & Drink" },
  // Shapes
  { id: "circle", label: "Circle", emoji: "⭕", category: "Shapes" },
  { id: "square", label: "Square", emoji: "⬜", category: "Shapes" },
  { id: "triangle", label: "Triangle", emoji: "🔺", category: "Shapes" },
  { id: "star", label: "Star", emoji: "⭐", category: "Shapes" },
  { id: "heart", label: "Heart", emoji: "❤️", category: "Shapes" },
  { id: "diamond", label: "Diamond", emoji: "💎", category: "Shapes" },
  // Nature
  { id: "leaf", label: "Leaf", emoji: "🍃", category: "Nature" },
  { id: "sun", label: "Sun", emoji: "☀️", category: "Nature" },
  { id: "moon", label: "Moon", emoji: "🌙", category: "Nature" },
  { id: "tree", label: "Tree", emoji: "🌳", category: "Nature" },
  { id: "flower", label: "Flower", emoji: "🌸", category: "Nature" },
  // Business
  { id: "chart", label: "Chart", emoji: "📊", category: "Business" },
  { id: "briefcase", label: "Briefcase", emoji: "💼", category: "Business" },
  { id: "target", label: "Target", emoji: "🎯", category: "Business" },
  { id: "trophy", label: "Trophy", emoji: "🏆", category: "Business" },
  // Symbols
  { id: "crown", label: "Crown", emoji: "👑", category: "Symbols" },
  { id: "fire", label: "Fire", emoji: "🔥", category: "Symbols" },
  { id: "lightbulb", label: "Idea", emoji: "💡", category: "Symbols" },
  { id: "rocket", label: "Rocket", emoji: "🚀", category: "Symbols" },
  { id: "bolt", label: "Lightning", emoji: "⚡", category: "Symbols" },
];

// ============================================================
// Borders & Frames
// ============================================================

export interface BorderStyle {
  id: string;
  name: string;
  cssBorder: string;
  preview: string;
}

export const BORDERS: BorderStyle[] = [
  { id: "none", name: "No Border", cssBorder: "none", preview: "None" },
  { id: "solid", name: "Solid Line", cssBorder: "3px solid var(--border-color)", preview: "━━━━━" },
  { id: "double", name: "Double Line", cssBorder: "5px double var(--border-color)", preview: "═════" },
  { id: "dashed", name: "Dashed", cssBorder: "3px dashed var(--border-color)", preview: "─ ─ ─" },
  { id: "dotted", name: "Dotted", cssBorder: "4px dotted var(--border-color)", preview: "• • •" },
  { id: "rounded", name: "Rounded", cssBorder: "3px solid var(--border-color)", preview: "╭───╮" },
  { id: "thick-frame", name: "Thick Frame", cssBorder: "12px solid var(--border-color)", preview: "█████" },
  { id: "inset", name: "Inset Shadow", cssBorder: "6px inset var(--border-color)", preview: "▓▓▓▓▓" },
];

// ============================================================
// Color Palettes
// ============================================================

export interface ColorPalette {
  name: string;
  colors: string[];
}

export const COLOR_PALETTES: ColorPalette[] = [
  { name: "Sunset", colors: ["#FF6B35", "#F7931E", "#FDCB35", "#1A1A2E", "#FFFFFF"] },
  { name: "Ocean", colors: ["#006BA6", "#0496FF", "#FFBC42", "#0353A4", "#FFFFFF"] },
  { name: "Forest", colors: ["#2D5F3F", "#8FBC8F", "#D4A055", "#1A2F1A", "#F5F0E0"] },
  { name: "Bold", colors: ["#E63946", "#1D3557", "#F1FAEE", "#FCBF49", "#0A0A0A"] },
  { name: "Mono", colors: ["#1A1A1A", "#4A4A4A", "#8B8B8B", "#E0E0E0", "#FFFFFF"] },
  { name: "Berry", colors: ["#7B2D8E", "#C77DFF", "#E0AFFF", "#2D1B3D", "#FFFFFF"] },
  { name: "Earth", colors: ["#8B4513", "#D2691E", "#F4A460", "#DEB887", "#FFF8DC"] },
  { name: "Neon", colors: ["#0A0A0A", "#10B981", "#3B82F6", "#F59E0B", "#EF4444"] },
  { name: "Gold", colors: ["#1A1A2E", "#D4AF37", "#C5A028", "#F5F5DC", "#0A0A0A"] },
  { name: "Tropical", colors: ["#06A77D", "#D5C67A", "#F1A208", "#6E0D25", "#FFFFFF"] },
];

// ============================================================
// Occasions
// ============================================================

export const OCCASIONS = [
  { id: "grand-opening", label: "Grand Opening", emoji: "🎊" },
  { id: "sale", label: "Seasonal Sale", emoji: "🏷️" },
  { id: "new-launch", label: "New Product/Menu", emoji: "🆕" },
  { id: "holiday", label: "Holiday Special", emoji: "🎄" },
  { id: "event", label: "Event/Convention", emoji: "🎪" },
  { id: "branding", label: "General Branding", emoji: "✨" },
  { id: "clearance", label: "Clearance", emoji: "🧹" },
  { id: "announcement", label: "Announcement", emoji: "📢" },
];

// ============================================================
// Pricing Engine
// ============================================================

export function calculatePrice(
  product: PrintProduct,
  widthIn: number,
  heightIn: number,
  material: PrintMaterial,
  quantity: number = 1,
  finishId?: string
): number {
  const area = widthIn * heightIn;
  const finish = material.finishes.find((f) => f.id === finishId);
  const finishAdd = finish ? finish.priceAdd : 0;
  const baseCost = (area * product.basePricePerSqIn + product.fixedCost + finishAdd) * material.priceMultiplier;
  // Bulk discount: 1-4 = full, 5-24 = 10% off, 25+ = 20% off
  let bulkMultiplier = 1;
  if (quantity >= 25) bulkMultiplier = 0.8;
  else if (quantity >= 5) bulkMultiplier = 0.9;
  const total = baseCost * quantity * bulkMultiplier;
  return Math.round(total * 100) / 100;
}

export function calculateDPI(imageWidth: number, imageHeight: number, printWidthIn: number, printHeightIn: number): number {
  return Math.round(Math.min(imageWidth / printWidthIn, imageHeight / printHeightIn));
}

export interface DPIStatus {
  label: string;
  color: string;
  icon: string;
  description: string;
  suitableForLargeFormat: boolean;
  suitableForSmallFormat: boolean;
}

export function getDPIStatus(dpi: number, minDPI: number): DPIStatus {
  if (dpi >= 300) return { label: "Print Ready", color: "#10B981", icon: "✓", description: "Excellent — sharp at any size, suitable for all products", suitableForLargeFormat: true, suitableForSmallFormat: true };
  if (dpi >= minDPI) return { label: "Good Enough", color: "#84CC16", icon: "✓", description: "Meets minimum for this product — looks good at viewing distance", suitableForLargeFormat: true, suitableForSmallFormat: dpi >= 300 };
  if (dpi >= 100) return { label: "Marginal", color: "#F59E0B", icon: "⚠", description: "Only works for large format viewed from far away — will pixelate up close", suitableForLargeFormat: dpi >= 150, suitableForSmallFormat: false };
  return { label: "Too Low", color: "#EF4444", icon: "✕", description: "Not print-ready — will look blurry. Upload a higher resolution version or let us design something fresh", suitableForLargeFormat: false, suitableForSmallFormat: false };
}
