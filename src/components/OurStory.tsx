import React from 'react';
import { Sparkles } from 'lucide-react';
import { FLEW_STORY } from '../data/flewData';

export const OurStory: React.FC = () => {
  return (
    <section id="story" className="py-24 bg-[#0d0d10] border-t border-white/5 relative overflow-hidden">
      {/* Ambient Red Glow */}
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-[#ff2626]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Visual Collage with Authentic FLEW Photos */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Image 1: Lifestyle / Street Vibe */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-xl group aspect-[4/5]">
                  <img
                    src="/assets/flew-post-lifestyle.png"
                    alt="FLEW Cup and Merch Lifestyle Shot"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                  <div className="text-2xl font-bold font-display text-[#ff3333]">1:00 AM</div>
                  <div className="text-xs text-white/60">Midnight Dessert Haven</div>
                </div>
              </div>

              {/* Image 2: Cup on BMW & Community */}
              <div className="space-y-4 pt-6">
                <div className="p-4 rounded-2xl bg-[#ff2626]/10 border border-[#ff2626]/30 text-center">
                  <span className="text-2xl">🐾</span>
                  <div className="text-xs font-bold text-white mt-1">Cat Freedom</div>
                  <div className="text-[10px] text-white/60">No watered-down shakes</div>
                </div>

                <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-xl group aspect-[4/5]">
                  <img
                    src="/assets/flew-post-cup-bmw.png"
                    alt="FLEW Cup on Car in Hyderabad"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Narrative Content */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ff2626]/15 border border-[#ff2626]/30 text-xs font-bold text-[#ff4444]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Our Origin Story</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
              {FLEW_STORY.headline}
            </h2>

            <div className="p-4 rounded-2xl bg-white/[0.03] border-l-4 border-[#ff2626] border-y border-r border-white/5">
              <p className="text-lg sm:text-xl font-bold font-display text-white italic">
                {FLEW_STORY.quote}
              </p>
              <span className="text-xs text-white/50 block mt-1 uppercase tracking-wider">
                — Official FLEW Manifesto
              </span>
            </div>

            <div className="space-y-4 text-white/70 text-sm sm:text-base leading-relaxed">
              {FLEW_STORY.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Verified Location & Ethos Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
              {FLEW_STORY.stats.map((stat, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-base sm:text-lg font-extrabold text-[#ff4444] font-display">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-white/60 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
