import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ExternalLink, ShieldCheck, ShoppingBag, Flame } from 'lucide-react';
import { MenuItem } from '../types';
import { STORE_INFO } from '../data/flewData';

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, notes?: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setQuantity(1);
    setNotes('');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity, notes);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-[#121216] border border-white/15 rounded-3xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-[#ff2626] text-white border border-white/20 flex items-center justify-center transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto no-scrollbar">
          
          {/* Hero Image Container */}
          <div className="relative h-64 sm:h-80 w-full bg-black overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/50 pointer-events-none" />

            {/* Badges Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2 z-10">
              <div className="flex flex-wrap items-center gap-2">
                {item.isAuthenticFlewImage ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-xs font-bold text-emerald-300 flex items-center gap-1.5 shadow-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Official FLEW Store Photo</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-[10px] text-white/70">
                    Representative Photo (Replace in data file)
                  </span>
                )}

                {item.dietary && (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/90 border border-white/15">
                    {item.dietary}
                  </span>
                )}
              </div>

              {item.servingTemp && (
                <span className="px-2.5 py-1 rounded-full bg-[#ff2626]/20 border border-[#ff2626]/40 text-xs font-bold text-[#ff4444]">
                  {item.servingTemp}
                </span>
              )}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Title & Price Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="modal-title" className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    {item.name}
                  </h2>
                  {item.tagline && (
                    <p className="text-sm text-[#ff6666] font-medium mt-0.5 italic">
                      {item.tagline}
                    </p>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#ff3333] font-mono whitespace-nowrap">
                  ₹{item.price}
                </div>
              </div>

              <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Cat Mascot Verdict / Special Highlight */}
            {item.catPick && (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#ff2626]/20 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🐾</span>
                <div>
                  <div className="text-xs font-bold text-[#ff4444] uppercase tracking-wider">
                    Cat Mascot Verdict
                  </div>
                  <div className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                    "{item.catPick} — handcrafted with dense couverture cocoa and zero shortcuts."
                  </div>
                </div>
              </div>
            )}

            {/* Indulgence Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/40 block text-[10px] uppercase font-semibold">Indulgence Level</span>
                <span className="text-white font-bold text-sm mt-0.5 block flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#ff2626]" />
                  {item.indulgenceLevel || 'Extremely Rich'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/40 block text-[10px] uppercase font-semibold">Kitchen Location</span>
                <span className="text-white font-bold text-sm mt-0.5 block">
                  Gowlidoddy Hub
                </span>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Special Instructions (Optional)
              </label>
              <input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Extra thick, less sweet, no straw..."
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#ff2626] focus:outline-none"
              />
            </div>

            {/* Quantity and Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Quantity Counter */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-1.5 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-30"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-mono font-bold text-white text-base">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleAdd}
                  className="flex-1 sm:flex-none px-6 py-3 bg-[#ff2626] hover:bg-[#ff3b3b] active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Tray • ₹{item.price * quantity}</span>
                </button>

                <a
                  href={STORE_INFO.social.swiggyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/15 flex items-center justify-center transition-colors"
                  title="Direct Swiggy Order"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
