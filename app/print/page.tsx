"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import {
  Upload, Wand2, Check, ChevronRight, Sparkles, Bot, FileImage,
  ShoppingBag, Download, TrendingUp, Ruler,
  Sticker, Printer, CheckCircle2, RefreshCw,
} from "lucide-react";
import {
  BUSINESS_TYPES, ALL_PRODUCTS, MATERIALS, STYLE_VIBES, FONT_LIBRARY,
  COLOR_PALETTES, OCCASIONS, calculatePrice,
} from "@/lib/data";
import {
  generateDesigns, analyzeArtwork,
  type DesignBrief, type GeneratedDesign, type ArtworkAnalysis,
} from "@/lib/designEngine";
import { DesignPreview } from "@/components/DesignPreview";
import { CanvasEditor } from "@/components/CanvasEditor";
import { BayAvatar } from "@/components/BayAvatar";

type Phase =
  | "greeting" | "business-type" | "occasion" | "artwork-check"
  | "brief" | "generating" | "preview" | "customize" | "bundle" | "checkout";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
}

export default function PrintFlow() {
  const [phase, setPhase] = useState<Phase>("greeting");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", role: "ai", text: "Hey! Welcome to Printa Studio. I'm your AI design companion. What brings you in today? Are you looking for outdoor signage, indoor prints, or something else?" },
  ]);

  const [businessType, setBusinessType] = useState("");
  const [occasion, setOccasion] = useState("");
  const [hasArtwork, setHasArtwork] = useState<boolean | null>(null);
  const [artworkAnalysis, setArtworkAnalysis] = useState<ArtworkAnalysis | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [vibe, setVibe] = useState("");
  const [colors, setColors] = useState<string[]>(["#1A1A2E", "#E94560", "#FFFFFF"]);
  const [brandFontId, setBrandFontId] = useState("inter");
  const [customPrompt, setCustomPrompt] = useState("");
  const [primaryProductId, setPrimaryProductId] = useState("banner");
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState("vinyl-13oz");

  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [primaryDesign, setPrimaryDesign] = useState<GeneratedDesign | null>(null);
  const [editingDesign, setEditingDesign] = useState<GeneratedDesign | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgCounter = useRef(1);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  const addMessage = (role: "ai" | "user", text: string) => {
    msgCounter.current += 1;
    setMessages((prev) => [...prev, { id: `m${msgCounter.current}`, role, text }]);
  };

  const handleBusinessTypeSelect = (id: string) => {
    const bt = BUSINESS_TYPES.find((b) => b.id === id);
    setBusinessType(id);
    if (bt) setColors(bt.colorSuggestions);
    addMessage("user", `I run a ${bt?.label} ${bt?.emoji}`);
    setTimeout(() => {
      addMessage("ai", `Nice! A ${bt?.label} -- great choice. What's the occasion? Is this for a grand opening, a sale, or general branding?`);
      setPhase("occasion");
    }, 600);
  };

  const handleOccasionSelect = (id: string, label: string) => {
    setOccasion(id);
    addMessage("user", `It's for ${label.toLowerCase()}`);
    setTimeout(() => {
      addMessage("ai", `Perfect. Do you already have a design file or logo you'd like me to work with? I can check if it's print-ready, or I can design something fresh from scratch.`);
      setPhase("artwork-check");
    }, 600);
  };

  const handleArtworkResponse = (has: boolean) => {
    setHasArtwork(has);
    if (has) {
      addMessage("user", "Yes, I have a design file I'd like to use");
    } else {
      addMessage("user", "No, I need you to design it from scratch");
      setTimeout(() => {
        addMessage("ai", `No problem! I'll create something from scratch. Let me get a few details about your brand and I'll generate print-ready designs that match your vision.`);
        setPhase("brief");
      }, 600);
    }
  };

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    const img = new Image();
    img.onload = () => {
      const product = ALL_PRODUCTS.find((p) => p.id === primaryProductId) || ALL_PRODUCTS[0];
      const analysis = analyzeArtwork(file, { width: img.naturalWidth, height: img.naturalHeight }, { width_in: product.defaultWidth, height_in: product.defaultHeight, minDPI: product.minDPI });
      setArtworkAnalysis(analysis);
      if (analysis.dpi >= 150) {
        addMessage("ai", `I've analyzed your file -- ${analysis.width}x${analysis.height}px at ${analysis.dpi} DPI. ${analysis.status.description} I can work with this! Let me get a few more details.`);
      } else {
        addMessage("ai", `I've analyzed your file -- it's only ${analysis.dpi} DPI which is too low for print. But I can use it as a reference and create a fresh print-ready design.`);
      }
      setTimeout(() => setPhase("brief"), 800);
    };
    img.src = url;
  };

  const handleLogoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
    addMessage("user", "Here's my logo");
    setTimeout(() => addMessage("ai", "Got it! I'll place your logo on every design. Let me get the last few details."), 400);
  };

  const handleGenerate = () => {
    setPhase("generating");
    const product = ALL_PRODUCTS.find((p) => p.id === primaryProductId) || ALL_PRODUCTS[0];
    const material = MATERIALS.find((m) => m.id === selectedMaterialId) || MATERIALS[0];
    const brief: DesignBrief = {
      businessType, businessName: businessName || "Your Brand", tagline, occasion,
      vibe, colors, primaryProductId, customWidth: customWidth || undefined,
      customHeight: customHeight || undefined, logoUrl: logoUrl || undefined,
      brandFontId, customPrompt,
    };
    const generated = generateDesigns(brief, product, material, "matte", customWidth || undefined, customHeight || undefined);
    setDesigns(generated);
    setPrimaryDesign(generated.find((d) => d.isPrimary) || generated[0]);
    setTimeout(() => {
      addMessage("ai", `Here's what I came up with! I've designed a ${product.name} for your occasion with a ${vibe} vibe. Take a look -- do you like it?`);
      setPhase("preview");
    }, 2800);
  };

  const handleLike = () => {
    addMessage("user", "I like it!");
    setTimeout(() => {
      addMessage("ai", `Fantastic! I've taken your design and applied it across complementary products. Same branding, same vibe, different sizes. Want to see the full collection?`);
      setPhase("bundle");
    }, 600);
  };

  const handleDislike = () => {
    addMessage("user", "Not quite what I had in mind");
    setTimeout(() => {
      addMessage("ai", `No worries! Let me open the design editor and you can tweak it -- change the text, colors, layout, add elements. Want to edit it yourself?`);
      if (primaryDesign) setEditingDesign(primaryDesign);
      setPhase("customize");
    }, 600);
  };

  const handleEditDesign = (design: GeneratedDesign) => {
    setEditingDesign(design);
    setPhase("customize");
  };

  const handleDesignUpdate = (updated: GeneratedDesign) => {
    setDesigns((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setEditingDesign(updated);
    setPrimaryDesign(updated);
  };

  const canGenerate = businessName && vibe && businessType;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/25">P</div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Printa Studio</h1>
              <p className="text-[10px] text-white/40">AI-Powered Print &amp; Signage Design</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/60">
              <Sparkles className="w-3.5 h-3.5" /> AI Design Engine v3
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-semibold">N</div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 md:px-6 py-6">
        {/* Chat */}
        <div className="flex-1 space-y-4 mb-6">
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "ai" ? "" : "flex-row-reverse"}`}>
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold ${msg.role === "ai" ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white" : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"}`}>
                {msg.role === "ai" ? <Bot className="w-5 h-5" /> : "N"}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "ai" ? "bg-white/5 border border-white/10 text-white/90" : "bg-violet-500/15 border border-violet-500/20 text-white"}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <AnimatePresence mode="wait">
          {/* GREETING */}
          {phase === "greeting" && (
            <motion.div key="greeting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-bold mb-1">What do you need today?</h2>
                <p className="text-sm text-white/50 mb-4">Answer a few questions and I&apos;ll have print-ready designs for you in minutes.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: "restaurant", emoji: "\uD83C\uDF5D", label: "Opening a restaurant", sub: "Banners, menus, signage" },
                    { id: "retail", emoji: "\uD83D\uDECD\uFE0F", label: "Running a retail sale", sub: "Sale signs, flyers, shelf tags" },
                    { id: "event", emoji: "\uD83C\uDF89", label: "Planning an event", sub: "Banners, invitations, backdrops" },
                    { id: "real-estate", emoji: "\uD83C\uDFE1", label: "Real estate signage", sub: "Yard signs, flyers, cards" },
                    { id: "salon", emoji: "\uD83D\uDE86", label: "Salon / spa branding", sub: "Service menus, decals, posters" },
                    { id: "gym", emoji: "\uD83D\uDCAA", label: "Gym / fitness", sub: "Wall decals, motivation, promos" },
                  ].map((item) => (
                    <button key={item.id} onClick={() => handleBusinessTypeSelect(item.id)} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-left">
                      <div className="text-2xl mb-2">{item.emoji}</div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{item.sub}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-2">Or browse all business types:</p>
                  <div className="flex flex-wrap gap-2">
                    {BUSINESS_TYPES.filter((bt) => !["restaurant", "retail", "event", "real-estate", "salon", "gym"].includes(bt.id)).map((bt) => (
                      <button key={bt.id} onClick={() => handleBusinessTypeSelect(bt.id)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs flex items-center gap-1.5 transition-colors">
                        {bt.emoji} {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* OCCASION */}
          {phase === "occasion" && (
            <motion.div key="occasion" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h2 className="text-lg font-bold mb-3">What&apos;s the occasion?</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {OCCASIONS.map((occ) => (
                    <button key={occ.id} onClick={() => handleOccasionSelect(occ.id, occ.label)} className={`p-4 rounded-xl border text-left transition-all ${occasion === occ.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <div className="text-xl mb-1">{occ.emoji}</div>
                      <div className="text-sm font-medium">{occ.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ARTWORK CHECK */}
          {phase === "artwork-check" && (
            <motion.div key="artwork" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h2 className="text-lg font-bold mb-3">Do you have an existing design?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <button onClick={() => handleArtworkResponse(true)} className="p-5 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-left">
                    <FileImage className="w-6 h-6 mb-2 text-violet-400" />
                    <div className="text-sm font-medium">Yes, I have a file</div>
                    <div className="text-xs text-white/40 mt-1">I&apos;ll check if it&apos;s print-ready</div>
                  </button>
                  <button onClick={() => handleArtworkResponse(false)} className="p-5 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-left">
                    <Wand2 className="w-6 h-6 mb-2 text-fuchsia-400" />
                    <div className="text-sm font-medium">No, design from scratch</div>
                    <div className="text-xs text-white/40 mt-1">I&apos;ll create print-ready designs</div>
                  </button>
                </div>

                {hasArtwork === true && !uploadedImageUrl && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileUpload(f); }}
                    className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-all"
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                    <Upload className="w-8 h-8 mx-auto text-white/30 mb-2" />
                    <p className="text-sm font-medium">Drop your artwork here</p>
                    <p className="text-xs text-white/40 mt-1">PNG, JPG, WebP -- I&apos;ll check the resolution</p>
                  </div>
                )}

                {uploadedImageUrl && artworkAnalysis && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <img src={uploadedImageUrl} alt="Upload" className="w-24 h-24 object-cover rounded-lg" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{artworkAnalysis.fileName}</div>
                        <div className="text-xs text-white/40 mt-0.5">{artworkAnalysis.width} x {artworkAnalysis.height}px &middot; {artworkAnalysis.fileSizeKB} KB</div>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium" style={{ background: `${artworkAnalysis.status.color}20`, color: artworkAnalysis.status.color }}>
                          {artworkAnalysis.status.icon} {artworkAnalysis.status.label} -- {artworkAnalysis.dpi} DPI
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm font-medium mb-2">Do you have a logo I should include?</p>
                  {logoUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain bg-white/5 rounded-lg p-2" />
                      <button onClick={() => setLogoUrl(null)} className="text-xs text-red-400 hover:text-red-300">Remove logo</button>
                    </div>
                  ) : (
                    <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">
                      <Upload className="w-4 h-4" /> Upload logo (optional)
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* BRIEF */}
          {phase === "brief" && (
            <motion.div key="brief" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-bold mb-1">Tell me about your brand</h2>
                  <p className="text-xs text-white/40">A few details and I&apos;ll generate print-ready designs</p>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Business name</label>
                    <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Spice Route Kitchen" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-violet-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Tagline (optional)</label>
                    <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Authentic flavors, modern twist" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-violet-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-2 block">What&apos;s the vibe?</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {STYLE_VIBES.map((v) => (
                      <button key={v.id} onClick={() => setVibe(v.id)} className={`p-3 rounded-lg border text-left transition-all ${vibe === v.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${v.gradient} mb-2`} />
                        <div className="text-xs font-medium">{v.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-2 block">Brand colors</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COLOR_PALETTES.map((p) => (
                      <button key={p.name} onClick={() => setColors(p.colors)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors">
                        <div className="flex -space-x-0.5">{p.colors.slice(0, 5).map((c) => (<div key={c} className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ background: c }} />))}</div>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
                        <input type="color" value={c} onChange={(e) => { const n = [...colors]; n[i] = e.target.value; setColors(n); }} className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/10" />
                        <span className="text-[10px] font-mono text-white/50">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-2 block">Brand font</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {FONT_LIBRARY.slice(0, 8).map((f) => (
                      <button key={f.id} onClick={() => setBrandFontId(f.id)} className={`p-2.5 rounded-lg border text-left transition-all ${brandFontId === f.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <div className="text-xs font-medium">{f.name}</div>
                        <div className="text-[10px] text-white/40">{f.category}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-2 block">What do you need first?</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                    {ALL_PRODUCTS.slice(0, 8).map((p) => (
                      <button key={p.id} onClick={() => { setPrimaryProductId(p.id); setCustomWidth(null); setCustomHeight(null); }} className={`p-3 rounded-lg border text-left transition-all ${primaryProductId === p.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <div className="text-lg mb-1">{p.emoji}</div>
                        <div className="text-xs font-medium">{p.name}</div>
                        <div className="text-[10px] text-white/40">{p.defaultWidth}&quot; x {p.defaultHeight}&quot;</div>
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const product = ALL_PRODUCTS.find((p) => p.id === primaryProductId);
                    if (product?.allowsCustomSize) {
                      return (
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Ruler className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-xs font-medium">Custom dimensions</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {product.commonSizes.map((s) => (
                              <button key={s.label} onClick={() => { setCustomWidth(s.w); setCustomHeight(s.h); }} className={`px-2.5 py-1 rounded-md text-xs transition-colors ${customWidth === s.w && customHeight === s.h ? "bg-violet-500/20 text-violet-300" : "bg-white/5 hover:bg-white/10 text-white/60"}`}>{s.label}</button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="number" value={customWidth || product.defaultWidth} onChange={(e) => setCustomWidth(Math.max(1, parseInt(e.target.value) || product.defaultWidth))} className="w-20 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs" />
                            <span className="text-white/30 text-xs">x</span>
                            <input type="number" value={customHeight || product.defaultHeight} onChange={(e) => setCustomHeight(Math.max(1, parseInt(e.target.value) || product.defaultHeight))} className="w-20 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs" />
                            <span className="text-white/40 text-xs">inches (max {product.maxSizeInches}&quot;)</span>
                          </div>
                          {customWidth && customHeight && (
                            <div className="mt-2 text-xs text-emerald-400">
                              Price: ${calculatePrice(product, customWidth, customHeight, MATERIALS.find((m) => m.id === selectedMaterialId) || MATERIALS[0], 1).toFixed(2)}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-2 block">Material</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {MATERIALS.map((m) => (
                      <button key={m.id} onClick={() => setSelectedMaterialId(m.id)} className={`p-2.5 rounded-lg border text-left transition-all ${selectedMaterialId === m.id ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <div className="text-xs font-medium">{m.name}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{m.description}</div>
                        <div className="text-[10px] text-violet-400 mt-1">{m.priceMultiplier}x pricing</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1 block">Anything specific? (optional)</label>
                  <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="e.g. Grand opening next Saturday, include 20% off offer..." className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-violet-500 focus:outline-none min-h-16 resize-none" />
                </div>

                <button onClick={handleGenerate} disabled={!canGenerate} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-medium text-sm transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
                  <Sparkles className="w-4 h-4" /> Generate My Designs
                </button>
              </div>
            </motion.div>
          )}

          {/* GENERATING */}
          {phase === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-violet-500/20 pulse-ring absolute inset-0" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center relative">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">Generating your designs...</h3>
              <p className="text-white/50 text-sm mb-6">Composing layouts, matching colors, optimizing for print</p>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {["Analyzing brand brief", "Selecting layout templates", "Matching color palettes", "Placing elements", "Running preflight checks", "Generating cross-sell recommendations"].map((t, i) => (
                  <motion.div key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }} className="flex items-center gap-2 text-xs text-white/60">
                    <Check className="w-3.5 h-3.5 text-violet-400" /> {t}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PREVIEW */}
          {phase === "preview" && primaryDesign && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">Your design is ready!</h2>
                    <p className="text-xs text-white/40 mt-0.5">{primaryDesign.productName} &middot; {primaryDesign.widthIn}&quot; x {primaryDesign.heightIn}&quot; &middot; ${primaryDesign.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => setPhase("generating")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>
                <div className="mb-4">
                  <DesignPreview design={primaryDesign} onEdit={() => handleEditDesign(primaryDesign)} featured />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleLike} className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-medium text-sm transition-all flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> I like it!
                  </button>
                  <button onClick={handleDislike} className="py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-medium text-sm transition-all flex items-center justify-center gap-2">
                    <Wand2 className="w-4 h-4" /> Let me customize
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CUSTOMIZE */}
          {phase === "customize" && editingDesign && (
            <motion.div key="customize" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <CanvasEditor design={editingDesign} onUpdate={handleDesignUpdate} onBack={() => setPhase("preview")} onContinue={() => setPhase("bundle")} />
            </motion.div>
          )}

          {/* BUNDLE */}
          {phase === "bundle" && (
            <motion.div key="bundle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-violet-400" /> Your bundle</h2>
                    <p className="text-xs text-white/40 mt-0.5">Same branding across every product</p>
                  </div>
                  {primaryDesign && <button onClick={() => handleEditDesign(primaryDesign)} className="text-xs text-violet-400 hover:text-violet-300">Edit design</button>}
                </div>
                {primaryDesign && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">Primary</div>
                    <DesignPreview design={primaryDesign} onEdit={() => handleEditDesign(primaryDesign)} featured />
                  </div>
                )}
                {designs.filter((d) => d.isUpsell).length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Cross-sell -- same design, different products</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {designs.filter((d) => d.isUpsell).map((d) => (<DesignPreview key={d.id} design={d} onEdit={() => handleEditDesign(d)} compact />))}
                    </div>
                  </div>
                )}
                <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-violet-400" /> Complete Brand Bundle</div>
                      <div className="text-xs text-white/50 mt-0.5">All {designs.length} designs, consistent branding</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">${designs.reduce((s, d) => s + d.price, 0).toFixed(2)}</div>
                      <div className="text-[10px] text-emerald-400 font-medium">10% bundle discount</div>
                    </div>
                  </div>
                  <button onClick={() => { addMessage("ai", "Excellent! Your bundle is ready for checkout."); setPhase("checkout"); }} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-medium text-sm transition-all">
                    Add All to Cart &amp; Checkout
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CHECKOUT */}
          {phase === "checkout" && (
            <motion.div key="checkout" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Order Summary</h2>
                <div className="space-y-2 mb-4">
                  {designs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{ALL_PRODUCTS.find((p) => p.id === d.productId)?.emoji}</div>
                        <div>
                          <div className="text-sm font-medium">{d.productName}</div>
                          <div className="text-xs text-white/40">{d.widthIn}&quot; x {d.heightIn}&quot; &middot; {MATERIALS.find((m) => m.id === d.materialId)?.name}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-emerald-400">${d.price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <div className="text-sm font-bold">Total ({designs.length} items)</div>
                  <div className="text-xl font-bold text-emerald-400">${designs.reduce((s, d) => s + d.price, 0).toFixed(2)}</div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button className="py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">Save for later</button>
                  <button className="py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <Printer className="w-4 h-4" /> Proceed to print
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BayAvatar phase={phase} />
    </div>
  );
}
