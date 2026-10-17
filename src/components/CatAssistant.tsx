import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "🐾 Craving late night? We're open till 1:00 AM at Sai Tulasi Enclave, Gowlidoddy!",
    "🍫 Must-try: Roasted Almond Choco Tub churned with roasted almonds & couverture choco!",
    "⚡ 'NORMAL IS BORING... FLEW IS FREEDOM!' Our motto since day 1.",
    "☕ Try our Iced Dalgona Vanilla or Italian Tiramisu Cold Foam for the ultimate caffeine purr!"
  ];

  useEffect(() => {
    // Show after 3 seconds for a subtle welcome
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleCatClick = (e: React.MouseEvent) => {
    // Confetti burst
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 35,
      spread: 55,
      origin: { x, y },
      colors: ['#ff2626', '#ffffff', '#ffd1dc'],
      disableForReducedMotion: true,
    });

    setTipIndex((prev) => (prev + 1) % tips.length);
    setIsOpen(true);
  };

  return (
    <aside className="fixed bottom-6 right-5 z-40 flex flex-col items-end pointer-events-none" aria-label="Cat Assistant">
      {/* Speech Bubble */}
      {isOpen && (
        <div className="pointer-events-auto mb-3 max-w-xs p-3.5 rounded-2xl bg-[#141418]/95 backdrop-blur-md border border-[#ff2626]/40 shadow-2xl text-xs text-white relative animate-fadeIn">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-white/40 hover:text-white"
            aria-label="Dismiss cat tip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#ff4444] mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Flew Cat Whisper</span>
          </div>

          <p className="text-white/80 pr-4 leading-relaxed font-medium">
            {tips[tipIndex]}
          </p>

          <button
            onClick={() => setTipIndex((prev) => (prev + 1) % tips.length)}
            className="mt-2 text-[10px] text-[#ff6666] hover:underline font-semibold block"
          >
            Next tip →
          </button>
        </div>
      )}

      {/* Floating Cat Button */}
      <button
        onClick={handleCatClick}
        className="pointer-events-auto relative group w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#121216] border-2 border-[#ff2626] shadow-xl shadow-[#ff2626]/30 hover:shadow-[#ff2626]/60 p-1 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        aria-label="Interactive FLEW Cat Mascot"
        title="Tap the FLEW Cat for a secret tip!"
      >
        <img
          src="/assets/flew-mascot-badge.png"
          alt="Cat Mascot"
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/cat-mascot.svg';
          }}
        />

        {/* Little Red Cape Pulse Indicator */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2626] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#ff2626] border-2 border-[#0a0a0c]"></span>
        </span>
      </button>
    </aside>
  );
};
