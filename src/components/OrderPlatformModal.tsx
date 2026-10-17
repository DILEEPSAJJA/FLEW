import React from 'react';
import { X, ExternalLink, MessageCircle, ShoppingBag, MapPin } from 'lucide-react';
import { STORE_INFO } from '../data/flewData';

interface OrderPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}

export const OrderPlatformModal: React.FC<OrderPlatformModalProps> = ({
  isOpen,
  onClose,
  onOpenCart,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[#ff2626]/20 border border-[#ff2626]/40 flex items-center justify-center mx-auto mb-3 text-2xl">
            🐾
          </div>
          <h3 className="text-2xl font-extrabold text-white font-display">
            Order from <span className="text-[#ff3333]">FLEW</span>
          </h3>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Choose your preferred way to satisfy your thickshake craving.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          
          {/* Swiggy Button */}
          <a
            href={STORE_INFO.social.swiggyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#ff2626] to-[#e11d48] text-white font-bold text-sm shadow-lg shadow-[#ff2626]/30 hover:opacity-95 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-xs">
                ⚡
              </div>
              <div className="text-left">
                <div>Order on Swiggy</div>
                <div className="text-[11px] text-white/80 font-normal">Fastest Doorstep Delivery</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>

          {/* WhatsApp Direct Order */}
          <a
            href={`https://wa.me/${STORE_INFO.social.whatsappNumber?.replace('+', '')}?text=${encodeURIComponent("Hi FLEW Gowlidoddy! I'd like to check today's dessert specials and place an order.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>Chat & Order on WhatsApp</div>
                <div className="text-[11px] text-white/50 font-normal">Pre-orders & custom inquiries</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
          </a>

          {/* Interactive Web Cart */}
          <button
            onClick={() => {
              onClose();
              onOpenCart();
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>Build Order Tray on Website</div>
                <div className="text-[11px] text-white/50 font-normal">Add items and customize quantities</div>
              </div>
            </div>
            <span className="text-xs text-[#ff4444] font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </button>

          {/* Takeaway / Dine-in */}
          <a
            href={STORE_INFO.social.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600/20 text-[#ff4444] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>Takeaway & Dine-in</div>
                <div className="text-[11px] text-white/50 font-normal">Sai Tulasi Enclave, Gowlidoddy (till 1 AM)</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
          </a>

        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-xs text-white/40">
          Open daily from 1:00 PM to 1:00 AM in Gowlidoddy, Hyderabad.
        </div>
      </div>
    </div>
  );
};
