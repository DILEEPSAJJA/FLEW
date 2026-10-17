import React from 'react';
import { Star, ShieldCheck, MessageSquareQuote } from 'lucide-react';
import { VERIFIED_REVIEWS } from '../data/flewData';

export const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews" className="py-24 bg-[#0d0d10] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Verified Customer Feedback</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight">
            Loved by Night Owls & <span className="text-[#ff3333]">Dessert Purists</span>
          </h2>

          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-white/70">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span className="font-bold text-white font-mono text-base">4.8 / 5.0</span>
            <span className="text-white/40">•</span>
            <span>Based on verified Google & Swiggy patrons in Hyderabad</span>
          </div>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VERIFIED_REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="rounded-3xl bg-[#141418] border border-white/10 p-6 flex flex-col justify-between shadow-xl shadow-black/40 hover:border-[#ff2626]/40 transition-all duration-300"
            >
              <div>
                {/* Rating & Source */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(rev.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : rev.rating % 1 !== 0 && i === Math.floor(rev.rating)
                            ? 'fill-amber-400/50 text-amber-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-white/60">
                    {rev.source}
                  </span>
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author & Dish Tag */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">
                    {rev.author}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>

                {rev.favoriteItem && (
                  <div className="mt-2 inline-block px-2 py-0.5 rounded-md bg-[#ff2626]/10 border border-[#ff2626]/20 text-[10px] font-medium text-[#ff6666]">
                    Ordered: {rev.favoriteItem}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Verification Policy Disclaimer */}
        <div className="mt-12 text-center max-w-xl mx-auto p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white/50">
          <MessageSquareQuote className="w-4 h-4 text-white/30 mx-auto mb-1" />
          <span>
            <strong>Authenticity Commitment:</strong> In accordance with FLEW brand principles, we only present genuine, verified patron feedback. We never fabricate reviews or incentivize ratings.
          </span>
        </div>

      </div>
    </section>
  );
};
