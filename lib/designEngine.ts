import { BUSINESS_TYPES, ALL_PRODUCTS, STYLE_VIBES, FONT_LIBRARY } from "./data";
import type { PrintProduct, PrintMaterial, StyleVibe, FontOption } from "./data";

// ============================================================
// Design Brief — what the customer gives us
// ============================================================

export interface DesignBrief {
  businessType: string;
  businessName: string;
  tagline: string;
  occasion: string;
  vibe: string;
  colors: string[];
  primaryProductId: string;
  customWidth?: number;
  customHeight?: number;
  logoUrl?: string;
  brandFontId?: string;
  customPrompt: string;
}

// ============================================================
// Design Element — things placed on the canvas
// ============================================================

export type ElementType = "text" | "shape" | "image" | "clipart" | "logo";

export interface DesignElement {
  id: string;
  type: ElementType;
  content: string;
  role: "headline" | "subhead" | "tagline" | "cta" | "price" | "decoration" | "logo" | "info" | "occasion" | "border" | "background";
  x: number; // percentage 0-100
  y: number;
  width?: number; // percentage
  height?: number;
  fontSize: number;
  color: string;
  fontWeight: number;
  italic?: boolean;
  fontId?: string;
  locked?: boolean;
  rotation?: number;
  opacity?: number;
  src?: string; // for images/logos
  borderRadius?: number;
}

// ============================================================
// Generated Design — a complete layout for a product
// ============================================================

export interface GeneratedDesign {
  id: string;
  productId: string;
  productName: string;
  widthIn: number;
  heightIn: number;
  materialId: string;
  finishId?: string;
  price: number;
  elements: DesignElement[];
  bgGradient: string;
  bgImageUrl?: string;
  mockupUrl?: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  bgPattern: string;
  fontStyle: "serif" | "sans-serif";
  fontId: string;
  bleedIn: number;
  safeZoneIn: number;
  isPrimary: boolean;
  isUpsell: boolean;
  qty: number;
}

// ============================================================
// Generate designs from a brief
// ============================================================

export function generateDesigns(
  brief: DesignBrief,
  primaryProduct: PrintProduct,
  primaryMaterial: PrintMaterial,
  primaryFinishId?: string,
  customWidth?: number,
  customHeight?: number
): GeneratedDesign[] {
  const vibe = STYLE_VIBES.find((v) => v.id === brief.vibe) || STYLE_VIBES[0];
  const fontId = brief.brandFontId || getDefaultFont(vibe);
  const font = FONT_LIBRARY.find((f) => f.id === fontId) || FONT_LIBRARY[0];
  const colors = brief.colors.length >= 2 ? brief.colors : ["#1A1A2E", "#E94560"];
  const primaryColor = colors[0];
  const accentColor = colors[1] || "#E94560";
  const textColor = colors[2] || "#FFFFFF";

  const w = customWidth || primaryProduct.defaultWidth;
  const h = customHeight || primaryProduct.defaultHeight;
  const bleedIn = 0.25;
  const safeZoneIn = 0.5;

  const designs: GeneratedDesign[] = [];

  // Primary design
  designs.push(
    generateDesign(brief, primaryProduct, primaryMaterial, primaryFinishId, vibe, font, primaryColor, accentColor, textColor, w, h, bleedIn, safeZoneIn, true, false)
  );

  // Cross-sell designs
  const business = BUSINESS_TYPES.find((b) => b.id === brief.businessType);
  if (business) {
    const crossSellProducts = ALL_PRODUCTS.filter(
      (p) => p.id !== primaryProduct.id && business.products.includes(p.id)
    ).slice(0, 4);
    for (const product of crossSellProducts) {
      designs.push(
        generateDesign(brief, product, primaryMaterial, primaryFinishId, vibe, font, primaryColor, accentColor, textColor, product.defaultWidth, product.defaultHeight, bleedIn, safeZoneIn, false, true)
      );
    }
  }

  return designs;
}

function getBackgroundImage(businessType: string): string | undefined {
  const map: Record<string, string> = {
    restaurant: "/bg/restaurant.png",
    "restaurant-flatlay": "/bg/restaurant-flatlay.png",
    retail: "/bg/retail.png",
    gym: "/bg/gym.png",
    salon: "/bg/salon.png",
    "real-estate": "/bg/real-estate.png",
  };
  return map[businessType];
}

function getMockupUrl(productId: string): string | undefined {
  const map: Record<string, string> = {
    banner: "/mockups/banner-storefront.png",
    "yard-sign": "/mockups/yard-sign-lawn.png",
    standee: "/mockups/standee-store.png",
    flyer: "/mockups/flyer-coffee-shop.png",
    sticker: "/mockups/stickers-table.png",
    poster: "/mockups/poster-office-wall.png",
    "poster-frame": "/mockups/poster-office-wall.png",
  };
  return map[productId];
}

function generateDesign(
  brief: DesignBrief,
  product: PrintProduct,
  material: PrintMaterial,
  finishId: string | undefined,
  vibe: StyleVibe,
  font: FontOption,
  primaryColor: string,
  accentColor: string,
  textColor: string,
  widthIn: number,
  heightIn: number,
  bleedIn: number,
  safeZoneIn: number,
  isPrimary: boolean,
  isUpsell: boolean
): GeneratedDesign {
  const aspectRatio = widthIn / heightIn;
  let elements: DesignElement[] = [];
  const bgGradient = createGradient(primaryColor, accentColor, vibe.id);
  const bgImageUrl = getBackgroundImage(brief.businessType);
  const mockupUrl = getMockupUrl(product.id);
  const fontStyle: "serif" | "sans-serif" = font.category === "serif" || font.category === "script" ? "serif" : "sans-serif";
  const headline = brief.businessName || "Your Brand";
  const tagline = brief.tagline || "";
  const occasion = getOccasionLabel(brief.occasion);

  // Layout selection based on aspect ratio
  if (aspectRatio > 1.8) {
    // Wide: banner — stacked horizontally
    elements = [
      { id: "el1", type: "text", content: headline, role: "headline", x: 50, y: 25, fontSize: 48, color: textColor, fontWeight: 800, fontId: font.id, locked: false },
      { id: "el2", type: "text", content: tagline, role: "tagline", x: 50, y: 40, fontSize: 22, color: textColor + "CC", fontWeight: 400, italic: true, fontId: font.id },
      { id: "el3", type: "text", content: occasion, role: "occasion", x: 50, y: 58, fontSize: 28, color: accentColor, fontWeight: 700, fontId: font.id },
      { id: "el4", type: "text", content: "20% OFF FIRST VISIT", role: "cta", x: 50, y: 78, fontSize: 20, color: textColor, fontWeight: 600, fontId: font.id },
    ];
  } else if (aspectRatio < 0.8) {
    // Tall: standee — stacked vertically
    elements = [
      { id: "el1", type: "text", content: headline, role: "headline", x: 50, y: 20, fontSize: 40, color: textColor, fontWeight: 900, fontId: font.id },
      { id: "el2", type: "text", content: tagline, role: "tagline", x: 50, y: 32, fontSize: 18, color: textColor + "BB", fontWeight: 400, fontId: font.id },
      { id: "el3", type: "text", content: "★ " + occasion.toUpperCase() + " ★", role: "occasion", x: 50, y: 48, fontSize: 24, color: accentColor, fontWeight: 700, fontId: font.id },
      { id: "el4", type: "text", content: "GRAND OPENING", role: "cta", x: 50, y: 62, fontSize: 32, color: textColor, fontWeight: 800, fontId: font.id },
      { id: "el5", type: "text", content: "visit us today", role: "info", x: 50, y: 75, fontSize: 16, color: textColor + "99", fontWeight: 400, italic: true, fontId: font.id },
      { id: "el6", type: "text", content: brief.businessName || "", role: "info", x: 50, y: 88, fontSize: 14, color: textColor + "80", fontWeight: 600, fontId: font.id },
    ];
  } else if (aspectRatio > 1.2) {
    // Landscape: split layout
    elements = [
      { id: "el1", type: "text", content: headline, role: "headline", x: 50, y: 28, fontSize: 44, color: textColor, fontWeight: 800, fontId: font.id },
      { id: "el2", type: "text", content: tagline, role: "tagline", x: 50, y: 44, fontSize: 20, color: textColor + "AA", fontWeight: 400, fontId: font.id },
      { id: "el3", type: "text", content: occasion, role: "occasion", x: 50, y: 58, fontSize: 22, color: accentColor, fontWeight: 600, fontId: font.id },
      { id: "el4", type: "text", content: "— NOW OPEN —", role: "cta", x: 50, y: 78, fontSize: 18, color: textColor, fontWeight: 500, italic: true, fontId: font.id },
    ];
  } else {
    // Square-ish: centered
    elements = [
      { id: "el1", type: "text", content: headline, role: "headline", x: 50, y: 30, fontSize: 38, color: textColor, fontWeight: 800, fontId: font.id },
      { id: "el2", type: "text", content: tagline, role: "tagline", x: 50, y: 46, fontSize: 18, color: textColor + "BB", fontWeight: 400, italic: true, fontId: font.id },
      { id: "el3", type: "text", content: occasion, role: "occasion", x: 50, y: 62, fontSize: 24, color: accentColor, fontWeight: 700, fontId: font.id },
      { id: "el4", type: "text", content: "20% OFF", role: "cta", x: 50, y: 80, fontSize: 28, color: textColor, fontWeight: 900, fontId: font.id },
    ];
  }

  // Add logo if provided — positioned per product
  if (brief.logoUrl) {
    elements.push({
      id: "logo",
      type: "logo",
      content: "logo",
      role: "logo",
      x: aspectRatio > 1.5 ? 88 : 50,
      y: aspectRatio > 1.5 ? 12 : 90,
      width: 12,
      height: 12,
      fontSize: 0,
      color: "transparent",
      fontWeight: 0,
      src: brief.logoUrl,
      locked: true,
    });
  }

  // Add decorative line for premium
  if (vibe.id === "premium") {
    elements.push({
      id: "deco1", type: "shape", content: "line", role: "decoration",
      x: 50, y: 68, width: 40, fontSize: 0, color: accentColor, fontWeight: 0, locked: false, opacity: 0.5,
    });
  }

  // Calculate price
  const qty = 1;
  const price = calculatePriceForDesign(product, widthIn, heightIn, material, qty, finishId);

  return {
    id: `design-${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: product.id,
    productName: product.name,
    widthIn, heightIn,
    materialId: material.id,
    finishId,
    price,
    elements,
    bgGradient,
    bgImageUrl,
    mockupUrl,
    primaryColor,
    accentColor,
    textColor,
    bgPattern: vibe.id === "retro" || vibe.id === "warm" ? "dots" : vibe.id === "playful" ? "shapes" : vibe.id === "dark" ? "grid" : "none",
    fontStyle,
    fontId: font.id,
    bleedIn,
    safeZoneIn,
    isPrimary,
    isUpsell,
    qty,
  };
}

function calculatePriceForDesign(
  product: PrintProduct,
  widthIn: number,
  heightIn: number,
  material: PrintMaterial,
  qty: number,
  finishId?: string
): number {
  const area = widthIn * heightIn;
  const finish = material.finishes.find((f) => f.id === finishId);
  const finishAdd = finish ? finish.priceAdd : 0;
  const baseCost = (area * product.basePricePerSqIn + product.fixedCost + finishAdd) * material.priceMultiplier;
  let bulkMultiplier = 1;
  if (qty >= 25) bulkMultiplier = 0.8;
  else if (qty >= 5) bulkMultiplier = 0.9;
  return Math.round(baseCost * qty * bulkMultiplier * 100) / 100;
}

function createGradient(c1: string, c2: string, vibeId: string): string {
  switch (vibeId) {
    case "premium":
      return `linear-gradient(135deg, ${c1} 0%, ${c1} 55%, ${c2} 100%)`;
    case "dark":
      return `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`;
    case "playful":
      return `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`;
    case "minimal":
      return `linear-gradient(180deg, ${c1} 0%, ${c1}ee 50%, ${c1} 100%)`;
    case "warm":
      return `linear-gradient(170deg, ${c1} 0%, ${c2} 100%)`;
    case "industrial":
      return `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`;
    default:
      return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
  }
}

function getDefaultFont(vibe: StyleVibe): string {
  if (vibe.id === "premium" || vibe.id === "elegant") return "playfair";
  if (vibe.id === "bold" || vibe.id === "energetic") return "oswald";
  if (vibe.id === "playful") return "poppins";
  return "inter";
}

function getOccasionLabel(occasion: string): string {
  const labels: Record<string, string> = {
    "grand-opening": "Grand Opening!",
    "sale": "Seasonal Sale",
    "new-launch": "New Arrival",
    "holiday": "Holiday Special",
    "event": "Special Event",
    "branding": "",
    "clearance": "Clearance Sale",
    "announcement": "Announcement",
  };
  return labels[occasion] || "";
}

// ============================================================
// Artwork Analysis
// ============================================================

export interface ArtworkAnalysis {
  fileName: string;
  fileSizeKB: number;
  width: number;
  height: number;
  dpi: number;
  status: ReturnType<typeof getDPIStatusForArtwork>;
  recommendation: string;
}

export function getDPIStatusForArtwork(dpi: number, minDPI: number) {
  if (dpi >= 300) return { label: "Print Ready", color: "#10B981", icon: "✓", description: "Excellent — sharp at any size, suitable for all products", suitableForLargeFormat: true, suitableForSmallFormat: true };
  if (dpi >= minDPI) return { label: "Good Enough", color: "#84CC16", icon: "✓", description: "Meets minimum for this product — looks good at viewing distance", suitableForLargeFormat: true, suitableForSmallFormat: dpi >= 300 };
  if (dpi >= 100) return { label: "Marginal", color: "#F59E0B", icon: "⚠", description: "Only works for large format viewed from far away — will pixelate up close", suitableForLargeFormat: dpi >= 150, suitableForSmallFormat: false };
  return { label: "Too Low", color: "#EF4444", icon: "✕", description: "Not print-ready — will look blurry. Upload a higher resolution version or let us design something fresh", suitableForLargeFormat: false, suitableForSmallFormat: false };
}

export function analyzeArtwork(
  file: File,
  dimensions: { width: number; height: number },
  targetSize: { width_in: number; height_in: number; minDPI: number }
): ArtworkAnalysis {
  const dpi = Math.round(Math.min(dimensions.width / targetSize.width_in, dimensions.height / targetSize.height_in));
  const status = getDPIStatusForArtwork(dpi, targetSize.minDPI);

  return {
    fileName: file.name,
    fileSizeKB: Math.round(file.size / 1024),
    width: dimensions.width,
    height: dimensions.height,
    dpi,
    status,
    recommendation:
      dpi >= 300
        ? "Excellent! This file is print-ready for all products. We can use it directly or build a bundle around it."
        : dpi >= targetSize.minDPI
          ? `This file works for ${targetSize.width_in}" × ${targetSize.height_in}" at ${dpi} DPI. For small-format products (flyers, cards), upload a higher resolution version.`
          : "This file is too low resolution for print. We recommend either uploading a higher resolution version, or letting our AI design tool create a fresh print-ready design for you from scratch.",
  };
}

// ============================================================
// Cross-sell recommendations
// ============================================================

export function getCrossSellRecommendations(businessTypeId: string, primaryProductId: string): PrintProduct[] {
  const business = BUSINESS_TYPES.find((b) => b.id === businessTypeId);
  if (!business) return [];
  return ALL_PRODUCTS.filter(
    (p) => p.id !== primaryProductId && business.products.includes(p.id)
  ).slice(0, 4);
}
