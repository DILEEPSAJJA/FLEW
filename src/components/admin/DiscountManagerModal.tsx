import React, { useState } from 'react';
import { X, Tag, Percent, Check, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface DiscountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscountManagerModal: React.FC<DiscountManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { menuItems, applyDiscount, removeDiscount } = useStore();

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [promoLabel, setPromoLabel] = useState<string>('Cat Freedom Special 20% OFF');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Items currently on discount
  const activeDiscountedItems = menuItems.filter((i) => (i.discountPercent && i.discountPercent > 0) || i.originalPrice);

  const filteredMenuItems = categoryFilter === 'all'
    ? menuItems
    : menuItems.filter((i) => i.category === categoryFilter);

  const handleToggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredMenuItems.map((i) => i.id);
    const allSelected = ids.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.length === 0) return;
    applyDiscount(selectedItemIds, discountPercent, promoLabel);
    setSelectedItemIds([]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          aria-label="Close discount manager"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff2626]/20 text-[#ff4444] text-xs font-bold border border-[#ff2626]/30 mb-2">
            <Percent className="w-3.5 h-3.5" />
            <span>Promotions & Offers</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white font-display">
            Manage Discounts on Selected Items
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Select items to discount. Customers will see crossed-out prices and live offer badges.
          </p>
        </div>

        {/* Section 1: Active Discounts List */}
        {activeDiscountedItems.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-[#ff2626]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#ff4444]" />
                <span>Currently Active Discounts ({activeDiscountedItems.length})</span>
              </span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
              {activeDiscountedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/40 border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#ff2626] text-[10px] font-bold text-white">
                      {item.discountPercent}% OFF
                    </span>
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="line-through text-white/40">₹{item.originalPrice}</span>
                    <span className="text-emerald-400 font-bold font-mono">₹{item.price}</span>
                  </div>

                  <button
                    onClick={() => removeDiscount(item.id)}
                    className="text-white/40 hover:text-[#ff4444] flex items-center gap-1 p-1 transition-colors"
                    title="Remove discount"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Remove</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Form to Apply New Discount */}
        <form onSubmit={handleApply} className="space-y-5 text-xs">
          
          {/* Discount Percentage Options */}
          <div>
            <label className="block font-semibold text-white/70 mb-2 uppercase tracking-wider">
              1. Choose Discount Rate
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[10, 15, 20, 25, 30].map((rate) => (
                <button
                  type="button"
                  key={rate}
                  onClick={() => {
                    setDiscountPercent(rate);
                    setPromoLabel(`Cat Special ${rate}% OFF`);
                  }}
                  className={`py-2 rounded-xl text-center font-bold font-mono transition-all border ${
                    discountPercent === rate
                      ? 'bg-[#ff2626] border-[#ff2626] text-white shadow-md shadow-[#ff2626]/30'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {rate}% OFF
                </button>
              ))}
            </div>
          </div>

          {/* Promo Label */}
          <div>
            <label className="block font-semibold text-white/70 mb-1 uppercase tracking-wider">
              2. Offer Label Shown to Customers
            </label>
            <input
              type="text"
              value={promoLabel}
              onChange={(e) => setPromoLabel(e.target.value)}
              placeholder="e.g. Midnight Rush 20% OFF"
              className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
            />
          </div>

          {/* Select Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-white/70 uppercase tracking-wider">
                3. Select Items to Apply Offer ({selectedItemIds.length} selected)
              </label>

              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[11px] text-[#ff4444] hover:underline font-bold"
              >
                Toggle All in this category
              </button>
            </div>

            {/* Filter by category */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
              {['all', 'thickshakes', 'brownies', 'cold-coco', 'hot-chocolate', 'cold-coffees'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border ${
                    categoryFilter === cat
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items Checkbox List */}
            <div className="max-h-56 overflow-y-auto no-scrollbar rounded-2xl bg-[#18181f] border border-white/10 p-2 space-y-1">
              {filteredMenuItems.map((item) => {
                const isChecked = selectedItemIds.includes(item.id);
                const original = item.originalPrice || item.price;
                const projectedDiscountPrice = Math.max(1, Math.round(original * (1 - discountPercent / 100)));

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors border ${
                      isChecked
                        ? 'bg-[#ff2626]/15 border-[#ff2626]/50 text-white'
                        : 'bg-transparent border-transparent hover:bg-white/5 text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="w-4 h-4 rounded text-[#ff2626] bg-black border-white/20"
                      />
                      <span className="font-medium text-xs text-white">{item.name}</span>
                    </div>

                    <div className="text-right font-mono text-xs">
                      {isChecked ? (
                        <div>
                          <span className="line-through text-white/40 mr-1.5">₹{original}</span>
                          <span className="text-emerald-400 font-bold">₹{projectedDiscountPrice}</span>
                        </div>
                      ) : (
                        <span className="text-white/60">₹{item.price}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={selectedItemIds.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#ff2626] hover:bg-[#ff3b3b] disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-[#ff2626]/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply {discountPercent}% OFF to {selectedItemIds.length} Items</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
