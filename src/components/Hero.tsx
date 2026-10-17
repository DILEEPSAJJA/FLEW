import React, { useState } from 'react';
import { ArrowRight, MapPin, Sparkles, ExternalLink, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HeroProps {
  onExploreMenu: () => void;
  onOpenOrderModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu, onOpenOrderModal }) => {
  const [mascotMood, setMascotMood] = useState<'normal' | 'happy' | 'purr'>('normal');

  const triggerCatCelebration = (e: React.MouseEvent) => {
    setMascotMood('purr');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { x, y },
      colors: ['#ff2626', '#ffffff', '#ffd1dc', '#381d11'],
      disableForReducedMotion: true,
    });

    setTimeout(() => setMascotMood('normal'), 2000);
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-paw-pattern">
      {/* Ambient Red & Dark Chocolate Glow Spheres */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#ff2626]/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-96 h-96 bg-[#ff2626]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/20 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Rebellious Brand Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md shadow-inner text-xs sm:text-sm text-white/90">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2626] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff2626]"></span>
              </span>
              <span className="font-bold tracking-wide text-[#ff4444]">NORMAL IS BORING</span>
              <span className="text-white/40">/</span>
              <span className="text-white/80 font-medium">FLEW IS FREEDOM</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight font-display text-white leading-[1.08]">
              Paws, Sip, <br className="hidden sm:inline" />
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#ff3333] via-[#ff6666] to-[#ffffff]">
                  Repeat.
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-[#ff2626]/25 -rotate-1 rounded-sm -z-0"></span>
              </span>
            </h1>

            {/* Subtitle / Value Proposition */}
            <p className="text-base sm:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Hyderabad’s rebellious cat-themed haven for <strong className="text-white font-semibold">impossibly thick shakes</strong>, <strong className="text-white font-semibold">molten DBC brownies</strong>, authentic <strong className="text-white font-semibold">Gujarat-style Cold Coco</strong>, and late-night cravings in Gowlidoddy.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 hover:shadow-[#ff2626]/50 transition-all duration-200 flex items-center justify-center gap-2 group active:scale-95"
              >
                <span>Explore Menu</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onOpenOrderModal}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/15 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Order Now</span>
                <ExternalLink className="w-4 h-4 text-[#ff4444]" />
              </button>

              <a
                href="#visitus"
                className="w-full sm:w-auto px-5 py-3.5 text-white/70 hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#ff2626]" />
                <span>Find Us</span>
              </a>
            </div>

            {/* Quick Location & Timings Proof */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[11px] text-white/50 uppercase font-semibold tracking-wider">Spot</div>
                <div className="text-xs sm:text-sm font-bold text-white truncate">Gowlidoddy, Hyd</div>
                <div className="text-[10px] text-white/40">Sai Tulasi Enclave</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[11px] text-white/50 uppercase font-semibold tracking-wider">Late Night Hours</div>
                <div className="text-xs sm:text-sm font-bold text-[#ff4444] font-mono">1:00 PM – 1:00 AM</div>
                <div className="text-[10px] text-white/40">Open 7 days a week</div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[11px] text-white/50 uppercase font-semibold tracking-wider">Couverture Standard</div>
                <div className="text-xs sm:text-sm font-bold text-white">Zero Compromise</div>
                <div className="text-[10px] text-white/40">Real dark chocolate</div>
              </div>
            </div>

          </div>

          {/* Right Hero Mascot & Signature Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-full max-w-md">
              
              {/* Glowing Mascot Stage Card */}
              <div className="relative rounded-3xl bg-gradient-to-b from-[#18181e] via-[#121216] to-[#0d0d10] p-6 border border-white/10 shadow-2xl shadow-black/80 overflow-hidden">
                
                {/* Background ambient lighting inside card */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff2626]/20 rounded-full blur-3xl pointer-events-none" />

                {/* Top Badge on Mascot Card */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2626]/20 border border-[#ff2626]/40 text-xs font-bold text-[#ff4444]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cat Commander Mascot</span>
                  </div>
                  <span className="text-[11px] text-white/50 font-mono tracking-wider">@flew.india</span>
                </div>

                {/* Interactive Mascot Visual */}
                <div
                  onClick={triggerCatCelebration}
                  className="relative group cursor-pointer rounded-2xl overflow-hidden bg-black/60 border border-white/10 p-4 transition-all duration-300 hover:border-[#ff2626]/60 text-center"
                  title="Click to interact with the FLEW cat!"
                >
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
                    {/* Official hero cat mascot image or SVG */}
                    <img
                      src="/assets/flew-post-supercat.png"
                      alt="FLEW Superhero Cat Mascot in Cape"
                      className="w-full h-full object-cover rounded-xl shadow-lg shadow-red-950/50 transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/cat-mascot.svg';
                      }}
                    />
                    
                    {/* Click me hint pill */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#ff2626]/50 text-[10px] text-white/90 font-medium opacity-90 group-hover:opacity-100 flex items-center gap-1.5 shadow-md">
                      <span>🐾</span>
                      <span>{mascotMood === 'purr' ? 'Purrr! 💥' : 'Tap for Cat Magic'}</span>
                    </div>
                  </div>

                  {/* Mascot bio badge */}
                  <div className="mt-3.5 text-center">
                    <div className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                      <span>The Cape Cat</span>
                      <span className="text-[#ff2626]">•</span>
                      <span className="text-xs text-white/60">Guardian of Thickshakes</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1 italic">
                      “Normal shakes are a snooze. We serve unfiltered dessert freedom.”
                    </p>
                  </div>
                </div>

                {/* Viral Signature Preview Bar */}
                <div className="mt-4 p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
                    <img
                      src="/assets/flew-post-roasted-almond.png"
                      alt="Roasted Almond Choco"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#ff2626]" />
                      <span className="text-xs font-bold text-white truncate">Roasted Almond Choco</span>
                    </div>
                    <span className="text-[11px] text-white/60 block truncate">Official FLEW Signature Tub</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#ff4444] font-mono">₹199</div>
                    <span className="text-[9px] text-white/40 uppercase">Top Seller</span>
                  </div>
                </div>

              </div>

              {/* Decorative Floating Badges */}
              <div className="absolute -bottom-4 -left-4 px-3.5 py-2 rounded-xl bg-[#0a0a0c]/95 border border-[#ff2626]/40 shadow-xl shadow-black backdrop-blur-md hidden sm:flex items-center gap-2 text-xs">
                <span className="text-[#ff2626] font-bold">1:00 AM</span>
                <span className="text-white/60">Late Night Cravings</span>
              </div>

              <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-xl bg-[#0a0a0c]/95 border border-white/10 shadow-xl shadow-black backdrop-blur-md hidden sm:flex items-center gap-2 text-xs text-white/80">
                <span>🐈</span>
                <span className="font-semibold">Cat-Themed Vibe</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
