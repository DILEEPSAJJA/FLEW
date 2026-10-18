import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ExternalLink, MessageCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem } from '../types';
import { STORE_INFO } from '../data/flewData';
import { useStore } from '../context/StoreContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onExploreMenu: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onExploreMenu,
}) => {
  const { 
    currentUser, 
    setIsAuthModalOpen, 
    createOrder, 
    setIsOrderTrackModalOpen 
  } = useStore();

  const [orderType, setOrderType] = useState<'takeaway' | 'delivery' | 'dine-in'>('delivery');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [addressError, setAddressError] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);

  // Direct In-Site Order & Order Number Generation
  const handlePlaceOrderWithOrderNumber = () => {
    if (!currentUser) {
      // Require mobile phone verification with OTP
      setIsAuthModalOpen(true);
      return;
    }

    // Determine valid delivery address
    let finalAddress = '';
    if (orderType === 'takeaway') {
      finalAddress = 'Takeaway (Store Pickup)';
    } else if (orderType === 'dine-in') {
      finalAddress = 'Dine-in at FLEW';
    } else {
      finalAddress = (deliveryNote || currentUser.address || '').trim();
      if (!finalAddress) {
        setAddressError('Please enter your delivery address / landmark.');
        return;
      }
    }

    setAddressError('');

    // Create official order with sequential order number
    createOrder({
      customerPhone: currentUser.formattedPhone,
      customerName: currentUser.name || 'Customer',
      deliveryAddress: finalAddress,
      orderType,
      items: items.map((i) => ({
        item: i.item,
        quantity: i.quantity,
        notes: i.notes || deliveryNote,
      })),
    });

    // Confetti celebration
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff2626', '#ffffff', '#10b981'],
    });

    onClearCart();
    onClose();
    // Open live tracker immediately!
    setIsOrderTrackModalOpen(true);
  };

  // WhatsApp order generator
  const handleWhatsAppCheckout = () => {
    let message = `*Hi FLEW Gowlidoddy! I'd like to place an order:* \n\n`;
    items.forEach((ci, idx) => {
      message += `${idx + 1}. *${ci.item.name}* x ${ci.quantity} — ₹${ci.item.price * ci.quantity}\n`;
      if (ci.notes) {
        message += `   _Note: ${ci.notes}_\n`;
      }
    });
    message += `\n*Total Estimated:* ₹${subtotal}\n`;
    message += `*Order Type:* ${orderType.toUpperCase()}\n`;
    if (currentUser) {
      message += `*Customer:* ${currentUser.name} (${currentUser.formattedPhone})\n`;
    }
    const dest = orderType === 'takeaway' ? 'Store Pickup (Takeaway)' : orderType === 'dine-in' ? 'Dine-in at FLEW' : (deliveryNote || currentUser?.address || 'Delivery');
    message += `📍 *Order Destination:* ${dest}\n`;

    const phone = STORE_INFO.social.whatsappNumber?.replace('+', '') || '919999999999';
    const encoded = encodeURI(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-[#121216] border-l border-white/10 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#ff2626]/20 border border-[#ff2626]/40 flex items-center justify-center text-[#ff4444]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Your Dessert Tray</h3>
                <span className="text-xs text-white/50">{items.length} unique cravings</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Verification Status Header Pill */}
          <div className="px-5 sm:px-6 pt-3">
            {currentUser ? (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Ordering as: {currentUser.formattedPhone}</span>
                </div>
                <span className="text-[10px] text-emerald-400/80 font-bold">Verified OTP ✓</span>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full p-2.5 rounded-xl bg-[#ff2626]/10 hover:bg-[#ff2626]/20 border border-[#ff2626]/30 flex items-center justify-between text-xs text-[#ff6666] transition-colors"
              >
                <span>📱 Register phone with OTP for order tracking</span>
                <span className="font-bold underline text-white">Verify Now →</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 no-scrollbar">
            {items.length > 0 ? (
              items.map((cartItem) => (
                <div
                  key={cartItem.item.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-3.5 items-start justify-between"
                >
                  {/* Thumbnail */}
                  <img
                    src={cartItem.item.image}
                    alt={cartItem.item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-black flex-shrink-0 border border-white/10"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {cartItem.item.name}
                    </h4>
                    
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-[#ff3333] font-mono">
                        ₹{cartItem.item.price}
                      </span>
                      {cartItem.item.originalPrice && (
                        <span className="line-through text-white/40 text-[10px] font-mono">
                          ₹{cartItem.item.originalPrice}
                        </span>
                      )}
                      {cartItem.item.discountPercent && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#ff2626] text-white font-bold">
                          {cartItem.item.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {cartItem.notes && (
                      <p className="text-[11px] text-white/50 italic mt-0.5 truncate">
                        "{cartItem.notes}"
                      </p>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold text-white w-4 text-center">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Remove Button & Line Total */}
                  <div className="flex flex-col items-end justify-between h-16">
                    <button
                      onClick={() => onRemoveItem(cartItem.item.id)}
                      className="text-white/30 hover:text-[#ff4444] transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-white font-mono">
                      ₹{cartItem.item.price * cartItem.quantity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              /* Empty State */
              <div className="py-16 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-3xl">
                  🐾
                </div>
                <h4 className="text-base font-bold text-white">Your tray is empty</h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto">
                  Our cat hasn't caught any thickshakes yet. Explore our menu to load up on DBC brownies and shakes!
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onExploreMenu();
                  }}
                  className="px-5 py-2.5 bg-[#ff2626] hover:bg-[#ff3b3b] text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Explore Menu
                </button>
              </div>
            )}
          </div>

          {/* Footer & Order Actions */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-white/10 bg-[#0d0d10] space-y-3.5">
              
              {/* Order Type Toggle */}
              <div>
                <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                  Order Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                  {(['delivery', 'takeaway', 'dine-in'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setOrderType(mode)}
                      className={`py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                        orderType === mode
                          ? 'bg-[#ff2626] text-white shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Landmark or Pickup Info */}
              {orderType === 'delivery' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 mb-1">
                    Delivery Address / Landmark *
                  </label>
                  <input
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => {
                      setDeliveryNote(e.target.value);
                      if (addressError) setAddressError('');
                    }}
                    placeholder="Enter flat / house no., building, landmark..."
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#ff2626] focus:outline-none"
                  />
                  {addressError && (
                    <p className="text-[11px] text-[#ff4444] mt-1 font-medium">{addressError}</p>
                  )}
                </div>
              ) : orderType === 'takeaway' ? (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70">
                  🛍️ <strong className="text-white">Store Pickup:</strong> Ready at FLEW Gowlidoddy counter.
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70">
                  🍽️ <strong className="text-white">Dine-in:</strong> Table seating at FLEW Cat Dessert Cafe.
                </div>
              )}

              {/* Subtotal */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Subtotal</span>
                  <span className="font-mono text-white font-semibold">₹{subtotal}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-white">
                  <span>Total Payable</span>
                  <span className="text-xl font-mono text-[#ff3333]">₹{subtotal}</span>
                </div>
              </div>

              {/* Primary Action: Place Order with Order # */}
              <button
                onClick={handlePlaceOrderWithOrderNumber}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#ff2626] to-[#dc2626] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Place Order & Generate Order #</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary Options: Swiggy or WhatsApp */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={STORE_INFO.social.swiggyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs rounded-xl border border-white/10 transition-colors"
                >
                  <span>Order on Swiggy</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={handleWhatsAppCheckout}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-semibold text-xs rounded-xl border border-emerald-500/40 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Clear Cart link */}
              <div className="text-center pt-1">
                <button
                  onClick={onClearCart}
                  className="text-[11px] text-white/40 hover:text-white transition-colors"
                >
                  Clear all items from tray
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
