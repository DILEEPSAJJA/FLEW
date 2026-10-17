import React from 'react';
import { Plus, Eye, Flame, ShieldCheck, Tag } from 'lucide-react';
import { MenuItem } from '../types';
import { useStore } from '../context/StoreContext';

interface FeaturedSpecialsProps {
  onSelectItem: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
}

export const FeaturedSpecials: React.FC<FeaturedSpecialsProps> = ({
  onSelectItem,
  onAddToCart
}) => {
  const { menuItems } = useStore();
  const specialItems = menuItems.filter((item) => item.isSpecial && item.isAvailable !== false);

  return (
    <section id="specials" className="py-20 bg-[#0d0d10] border-y border-white/5 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-[#ff2626]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2626]/15 border border-[#ff2626]/30 text-xs font-bold text-[#ff4444] mb-3">
            <Flame className="w-3.5 h-3.5" />
            <span>Feline Hall of Fame</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight">
            Featured Specials & <span className="text-[#ff3333]">Signatures</span>
          </h2>
          <p className="mt-3 text-base text-white/60">
            Hand-churned, uncompromised thickshakes and warm molten desserts that define FLEW. Made for midnight wanderers and true dessert purists.
          </p>
        </div>

        {/* Specials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {specialItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-3xl bg-[#141418] border border-white/10 hover:border-[#ff2626]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl shadow-black/50 hover:shadow-[#ff2626]/20 hover:-translate-y-1.5"
            >
              {/* Image & Top Badges Container */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-black/60 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2 z-10">
                  {/* Cat Pick Badge */}
                  {item.catPick && (
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#ff2626]/40 text-[11px] font-bold text-[#ff4444] flex items-center gap-1 shadow-md">
                      <span>🐾</span>
                      <span className="truncate max-w-[160px]">{item.catPick}</span>
                    </span>
                  )}

                  {/* Authenticity / Offer Badge */}
                  <div className="flex flex-col items-end gap-1">
                    {item.discountPercent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ff2626] text-white text-[10px] font-bold flex items-center gap-1 shadow-md animate-pulse">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{item.discountPercent}% OFF</span>
                      </span>
                    )}

                    {item.isAuthenticFlewImage ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1 shadow-md">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Official FLEW Photo</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[9px] text-white/60">
                        Representative Image
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick View Button on Hover */}
                <button
                  onClick={() => onSelectItem(item)}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/70 hover:bg-[#ff2626] border border-white/20 hover:border-transparent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 z-10 shadow-lg"
                  aria-label={`View details of ${item.name}`}
                >
                  <Eye className="w-5 h-5" />
                </button>

                {/* Temperature Pill */}
                {item.servingTemp && (
                  <div className="absolute bottom-3 left-3.5 z-10">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-semibold text-white/90 border border-white/15">
                      {item.servingTemp}
                    </span>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#ff4444] transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <div className="text-right whitespace-nowrap">
                      {item.originalPrice && (
                        <span className="line-through text-white/40 text-xs font-mono block">
                          ₹{item.originalPrice}
                        </span>
                      )}
                      <span className="text-xl font-extrabold text-[#ff3333] font-mono">
                        ₹{item.price}
                      </span>
                    </div>
                  </div>

                  {item.tagline && (
                    <p className="text-xs text-[#ff6666]/90 font-medium mb-2 italic">
                      {item.tagline}
                    </p>
                  )}

                  <p className="text-sm text-white/65 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    onClick={() => onSelectItem(item)}
                    className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1 transition-colors py-1.5"
                  >
                    <span>View Ingredients</span>
                    <span className="text-[#ff2626]">→</span>
                  </button>

                  <button
                    onClick={() => onAddToCart(item)}
                    className="px-4 py-2 bg-[#ff2626] hover:bg-[#ff3b3b] active:scale-95 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-[#ff2626]/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Tray</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
