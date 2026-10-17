import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Plus, Eye, X, Milk, Cookie, Coffee, Flame, CupSoda, ShieldCheck, Tag } from 'lucide-react';
import { CategoryId, MenuItem } from '../types';
import { MENU_CATEGORIES } from '../data/flewData';
import { useStore } from '../context/StoreContext';

interface MenuSectionProps {
  onSelectItem: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  onSelectItem,
  onAddToCart,
}) => {
  const { menuItems } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBestsellerOnly, setFilterBestsellerOnly] = useState(false);
  const [filterAuthenticOnly, setFilterAuthenticOnly] = useState(false);
  const [filterDiscountsOnly, setFilterDiscountsOnly] = useState(false);

  // Icon mapper helper
  const getCategoryIcon = (id: CategoryId) => {
    switch (id) {
      case 'thickshakes': return <Milk className="w-4 h-4" />;
      case 'brownies': return <Cookie className="w-4 h-4" />;
      case 'cold-coco': return <Coffee className="w-4 h-4" />;
      case 'hot-chocolate': return <Flame className="w-4 h-4" />;
      case 'cold-coffees': return <CupSoda className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesTag = item.tagline?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesTag) {
          return false;
        }
      }
      // Bestseller filter
      if (filterBestsellerOnly && !item.isBestseller) {
        return false;
      }
      // Authentic only filter
      if (filterAuthenticOnly && !item.isAuthenticFlewImage) {
        return false;
      }
      // Discount only filter
      if (filterDiscountsOnly && (!item.discountPercent || item.discountPercent <= 0)) {
        return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, filterBestsellerOnly, filterAuthenticOnly, filterDiscountsOnly]);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setFilterBestsellerOnly(false);
    setFilterAuthenticOnly(false);
    setFilterDiscountsOnly(false);
  };

  return (
    <section id="menu" className="py-20 bg-[#0a0a0c] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2626]/10 border border-[#ff2626]/25 text-xs font-bold text-[#ff4444] mb-2">
              <span>🐾</span>
              <span>Live Store Menu & Active Offers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight">
              Explore Our <span className="text-[#ff3333]">Crafted Menu</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl">
              Authentic dessert & beverage offerings verified from our Gowlidoddy store and official Swiggy kitchen.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thickshakes, DBC, coco..."
              className="w-full bg-[#141418] border border-white/10 focus:border-[#ff2626] rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
          {MENU_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all'
              ? menuItems.length
              : menuItems.filter((i) => i.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                  isSelected
                    ? 'bg-[#ff2626] text-white border-[#ff2626] shadow-md shadow-[#ff2626]/30'
                    : 'bg-[#141418] text-white/70 hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Toggles (Bestseller, Authentic Photos, Offers) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterDiscountsOnly(!filterDiscountsOnly)}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-bold ${
                filterDiscountsOnly
                  ? 'bg-[#ff2626] text-white border-[#ff2626] shadow-sm shadow-[#ff2626]/40'
                  : 'bg-[#ff2626]/10 border-[#ff2626]/30 text-[#ff4444] hover:bg-[#ff2626]/20'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Active Discounts Only</span>
            </button>

            <button
              onClick={() => setFilterBestsellerOnly(!filterBestsellerOnly)}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                filterBestsellerOnly
                  ? 'bg-[#ff2626]/20 border-[#ff2626] text-[#ff4444]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <span>⭐</span>
              <span>Bestsellers</span>
            </button>

            <button
              onClick={() => setFilterAuthenticOnly(!filterAuthenticOnly)}
              className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                filterAuthenticOnly
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Photos</span>
            </button>
          </div>

          <div className="text-white/40">
            Showing <strong className="text-white font-mono">{filteredItems.length}</strong> items
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl bg-[#121216] border border-white/10 hover:border-[#ff2626]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg shadow-black/40 hover:-translate-y-1 relative"
              >
                {/* Product Image */}
                <div className="relative h-48 w-full bg-black overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5 z-10">
                    <div className="flex flex-col gap-1 items-start">
                      {item.discountPercent && (
                        <span className="px-2 py-0.5 rounded-full bg-[#ff2626] text-[10px] font-bold text-white shadow-md animate-pulse flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{item.discountPercent}% OFF</span>
                        </span>
                      )}

                      {item.isBestseller && !item.discountPercent && (
                        <span className="px-2 py-0.5 rounded-full bg-[#ff2626] text-[10px] font-bold text-white shadow-sm">
                          Bestseller
                        </span>
                      )}
                    </div>

                    {item.isAuthenticFlewImage ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-[9px] font-bold text-emerald-300 shadow-sm flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Official FLEW</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white/50 border border-white/10">
                        Placeholder
                      </span>
                    )}
                  </div>

                  {/* Dietary pill */}
                  {item.dietary && (
                    <div className="absolute bottom-2 left-2.5 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-medium text-white/80 border border-white/10">
                        {item.dietary}
                      </span>
                    </div>
                  )}

                  {/* Quick View Button */}
                  <button
                    onClick={() => onSelectItem(item)}
                    className="absolute bottom-2 right-2.5 w-8 h-8 rounded-full bg-black/80 hover:bg-[#ff2626] border border-white/20 hover:border-transparent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label={`View ${item.name}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3
                        onClick={() => onSelectItem(item)}
                        className="text-base font-bold text-white group-hover:text-[#ff4444] transition-colors leading-snug cursor-pointer line-clamp-1"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      
                      <div className="text-right whitespace-nowrap">
                        {item.originalPrice && (
                          <span className="line-through text-white/40 text-[11px] font-mono block">
                            ₹{item.originalPrice}
                          </span>
                        )}
                        <span className="text-base font-bold text-[#ff3333] font-mono">
                          ₹{item.price}
                        </span>
                      </div>
                    </div>

                    {item.tagline && (
                      <p className="text-[11px] text-[#ff6666] font-medium mb-1.5 italic line-clamp-1">
                        {item.tagline}
                      </p>
                    )}

                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Card Bottom: Add & Details */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="text-xs text-white/50 hover:text-white transition-colors"
                    >
                      Details
                    </button>

                    {item.isAvailable !== false ? (
                      <button
                        onClick={() => onAddToCart(item)}
                        className="px-3.5 py-1.5 bg-[#ff2626] hover:bg-[#ff3b3b] active:scale-95 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm shadow-[#ff2626]/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-white/40 font-semibold italic">
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="mt-12 p-12 text-center rounded-3xl bg-[#121216] border border-white/10 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-2xl">
              😿
            </div>
            <h3 className="text-lg font-bold text-white">No desserts found</h3>
            <p className="text-sm text-white/60 mt-1">
              The cat searched all shelves but couldn't find matches. Try resetting filters.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-5 px-5 py-2 bg-[#ff2626] hover:bg-[#ff3b3b] text-white text-xs font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
