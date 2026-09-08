"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export type Phase =
  | "greeting" | "business-type" | "occasion" | "artwork-check"
  | "brief" | "generating" | "preview" | "customize" | "bundle" | "checkout";

interface Props {
  phase: Phase;
  onSkip?: () => void;
}

const BAY_REPLIES: Record<Phase, { text: string; mood: string }> = {
  "greeting": {
    text: "Hi there! I'm Bay, your design wizard 🧙‍♂️ I'll guide you through this — just answer a few questions and I'll conjure up some print-ready magic!",
    mood: "wave",
  },
  "business-type": {
    text: "Tell me about your business! The more I know, the better I can tailor your designs.",
    mood: "curious",
  },
  "occasion": {
    text: "What's the occasion? Grand opening? Big sale? I'll match the energy!",
    mood: "excited",
  },
  "artwork-check": {
    text: "Got an existing design? Upload it and I'll check if it's print-ready. No file? No problem — I'll create one from scratch!",
    mood: "thinking",
  },
  "brief": {
    text: "Almost there! Just a few brand details — your name, colors, the vibe you're going for. I'll handle the rest!",
    mood: "focused",
  },
  "generating": {
    text: "Conjuring your designs now... ✨ This is the fun part! I'm composing layouts, matching your colors, and making everything print-ready!",
    mood: "casting",
  },
  "preview": {
    text: "Ta-da! What do you think? If you love it, we can bundle it across your other products. If not, we can tweak it together!",
    mood: "proud",
  },
  "customize": {
    text: "Let's fine-tune! Click any element to edit it. You can change text, colors, add clipart, upload your logo — make it yours!",
    mood: "helpful",
  },
  "bundle": {
    text: "Look at that — a full brand package! Same design across all your products. Add what you need, and the bundle discount applies automatically!",
    mood: "celebrating",
  },
  "checkout": {
    text: "You're all set! Everything is print-ready with bleed and safe zones. Time to hit print! 🎉",
    mood: "happy",
  },
};

export function BayAvatar({ phase }: Props) {
  const [bouncing, setBouncing] = useState(true);
  const reply = BAY_REPLIES[phase] || BAY_REPLIES.greeting;

  // Reset bounce on phase change — runs after render, not during
  useEffect(() => {
    const t = setTimeout(() => setBouncing(false), 600);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-3 pointer-events-none">
      {/* Speech bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        key={phase}
        className="mb-4 max-w-[280px] bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white/90 shadow-2xl"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-bold text-violet-300">Bay</span>
          <span className="text-[8px] text-white/30">your design wizard</span>
        </div>
        <p className="text-xs leading-relaxed">{reply.text}</p>
      </motion.div>

      {/* Bay character */}
      <motion.div
        animate={bouncing ? { y: [0, -15, 0] } : { y: [0, -3, 0] }}
        transition={bouncing ? { duration: 0.4 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative pointer-events-auto"
      >
        <motion.img
          src="/bay-wizard.png"
          alt="Bay the wizard"
          className="w-24 h-32 object-contain drop-shadow-2xl"
          animate={{ rotate: bouncing ? [0, -5, 5, 0] : [0, 2, -2, 0] }}
          transition={bouncing ? { duration: 0.5 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Sparkle effects */}
        {phase === "generating" && (
          <>
            <motion.div className="absolute -top-2 -left-2 text-amber-400 text-lg" animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -20, -30] }} transition={{ duration: 1.5, repeat: Infinity }}>&#10024;</motion.div>
            <motion.div className="absolute -top-1 right-0 text-violet-400 text-sm" animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0], y: [0, -15, -25] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}>&#10024;</motion.div>
            <motion.div className="absolute top-4 -right-2 text-fuchsia-400 text-xs" animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [0, -10, -20] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}>&#10024;</motion.div>
          </>
        )}
        {phase === "checkout" && (
          <motion.div className="absolute -top-3 left-1 text-2xl" animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>&#127881;</motion.div>
        )}
      </motion.div>
    </div>
  );
}
