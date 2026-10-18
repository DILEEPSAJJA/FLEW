import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, Clock, ChefHat, Package, Check, MessageCircle, Star, RefreshCw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';
import { STORE_INFO } from '../data/flewData';

interface OrderTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackModal: React.FC<OrderTrackModalProps> = ({ isOpen, onClose }) => {
  const { orders, activeOrder, setActiveOrder, syncOrderTracking, reviews, openReviewModal } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const currentOrder = activeOrder || (orders.length > 0 ? orders[0] : null);

  // Poll server for real-time status updates (e.g. when Admin accepts and starts preparing)
  useEffect(() => {
    if (!isOpen || !currentOrder?.orderNumber) return;

    let isSubscribed = true;
    const fetchStatus = async () => {
      if (isSubscribed) {
        await syncOrderTracking(currentOrder.orderNumber);
      }
    };

    fetchStatus(); // immediately check server on open
    const interval = setInterval(fetchStatus, 2000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [isOpen, currentOrder?.orderNumber, syncOrderTracking]);

  if (!isOpen) return null;

  const handleManualRefresh = async () => {
    if (!currentOrder?.orderNumber || isRefreshing) return;
    setIsRefreshing(true);
    await syncOrderTracking(currentOrder.orderNumber);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase().replace(/^#/, '');
    if (!query) return;

    setIsSearching(true);
    setErrorMsg('');

    // 1. Try server direct order lookup first
    const serverOrder = await syncOrderTracking(query);
    if (serverOrder) {
      setActiveOrder(serverOrder);
      setIsSearching(false);
      return;
    }

    // 2. Try matching in existing local orders
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === query ||
        o.orderNumber.toLowerCase().replace(/^#/, '') === query ||
        o.customerPhone.replace(/[^0-9]/g, '').includes(query)
    );
    if (found) {
      setActiveOrder(found);
      await syncOrderTracking(found.orderNumber);
      setIsSearching(false);
      return;
    }

    // 3. Try phone search on server
    if (/^\d{5,10}$/.test(query)) {
      try {
        const phoneRes = await fetch(`/api/orders?phone=${encodeURIComponent(query)}`);
        if (phoneRes.ok) {
          const phoneData = await phoneRes.json();
          if (phoneData && Array.isArray(phoneData.orders) && phoneData.orders.length > 0) {
            setActiveOrder(phoneData.orders[0]);
            setIsSearching(false);
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    setErrorMsg(`No order found matching "${searchQuery}". Please check the order number.`);
    setIsSearching(false);
  };

  const steps: { key: OrderStatus; label: string; desc: string; icon: any }[] = [
    { key: 'placed', label: 'Order Received', desc: 'Waiting for store acceptance. Preparation begins once confirmed.', icon: Clock },
    { key: 'preparing', label: 'In the Kitchen', desc: 'Store accepted! Churning thickshakes & warming DBC brownies.', icon: ChefHat },
    { key: 'ready', label: 'Ready / Out for Delivery', desc: 'Packed and ready for pickup or on the way to you.', icon: Package },
    { key: 'completed', label: 'Completed & Delivered', desc: 'Dessert freedom delivered! Enjoy 🐾', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'completed': return 3;
      case 'cancelled': return -1;
    }
  };

  const currentIndex = currentOrder ? getStepIndex(currentOrder.status) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          aria-label="Close track order modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#ff2626]/20 border border-[#ff2626]/40 flex items-center justify-center mx-auto mb-2.5 text-2xl">
            🐾
          </div>
          <h3 className="text-2xl font-extrabold text-white font-display">
            Live Order Status
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Track your late-night thickshakes & DBC in real time.
          </p>
        </div>

        {/* Search by Order Number */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order # (e.g. 0001) or phone"
                className="w-full bg-[#18181f] border border-white/10 focus:border-[#ff2626] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-[#ff2626] hover:bg-[#ff3b3b] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Track</span>
            </button>
          </div>
          {errorMsg && <p className="text-xs text-[#ff4444] mt-2 text-center">{errorMsg}</p>}
        </form>

        {/* Recent Orders quick selector */}
        {orders.length > 1 && (
          <div className="mb-5 pb-3 border-b border-white/10">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
              Select Recent Order
            </div>
            <div className="flex flex-wrap gap-1.5">
              {orders.slice(0, 6).map((o) => {
                const isSelected = currentOrder?.orderNumber === o.orderNumber;
                return (
                  <button
                    key={o.orderNumber}
                    type="button"
                    onClick={() => {
                      setActiveOrder(o);
                      syncOrderTracking(o.orderNumber);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#ff2626] text-white shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                    }`}
                  >
                    <span className="font-mono font-bold">#{o.orderNumber}</span>
                    <span className="text-[10px] capitalize opacity-80">({o.status})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentOrder ? (
          <div className="space-y-6">
            
            {/* Order Meta Header Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-semibold">Order Reference</span>
                <div className="text-lg font-mono font-extrabold text-[#ff4444]">
                  #{currentOrder.orderNumber}
                </div>
                <div className="text-xs text-white/70">
                  {currentOrder.customerName} • <span className="font-mono">{currentOrder.customerPhone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize inline-block border ${
                    currentOrder.status === 'completed'
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      : currentOrder.status === 'ready'
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                      : currentOrder.status === 'preparing'
                      ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                      : 'bg-[#ff2626]/20 border-[#ff2626]/50 text-[#ff4444]'
                  }`}>
                    ● {currentOrder.status === 'preparing' ? 'Preparing in Kitchen' : currentOrder.status === 'placed' ? 'Order Received' : currentOrder.status === 'ready' ? 'Ready / Out for Delivery' : currentOrder.status}
                  </span>
                  <div className="text-[11px] text-white/50 mt-1">
                    Placed {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
                  title="Refresh order status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#ff4444]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Step Progress Tracker */}
            <div className="space-y-4 px-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Kitchen Progress
              </div>

              <div className="relative pl-6 space-y-6 border-l-2 border-white/10">
                {steps.map((s, idx) => {
                  const isDone = currentIndex >= idx;
                  const isCurrent = currentIndex === idx;
                  const Icon = s.icon;

                  return (
                    <div key={s.key} className="relative">
                      {/* Node Bullet */}
                      <div
                        className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone
                            ? 'bg-[#ff2626] border-[#ff2626] text-white shadow-md shadow-[#ff2626]/40'
                            : 'bg-[#18181f] border-white/20 text-white/30'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isCurrent ? 'text-[#ff4444]' : isDone ? 'text-white' : 'text-white/40'}`}>
                            {s.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#ff2626]/20 text-[#ff4444] border border-[#ff2626]/30 animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Items in this order ({currentOrder.items.length})
              </div>

              <div className="space-y-2">
                {currentOrder.items.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#ff4444]">{entry.quantity}x</span>
                      <span className="text-white/90 font-medium">{entry.item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-white">₹{entry.lineTotal}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="text-lg font-mono text-[#ff3333]">₹{currentOrder.finalTotal}</span>
              </div>
            </div>

            {/* Rate & Review Completed/Delivered Order */}
            {currentOrder.status === 'completed' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#ff2626]/10 to-emerald-500/10 border border-amber-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>Order Delivered! How was your dessert?</span>
                    </div>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      Rate your thickshake and share your experience with other patrons.
                    </p>
                  </div>

                  {reviews.some((r) => r.orderNumber === currentOrder.orderNumber) ? (
                    <span className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      ✓ Review Submitted 🐾
                    </span>
                  ) : (
                    <button
                      onClick={() => openReviewModal(currentOrder)}
                      className="self-start sm:self-auto shrink-0 px-4 py-2 bg-gradient-to-r from-[#ff2626] to-[#dc2626] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      <span>Rate & Add Review</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Store Contact Help */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-white/60">
              <span>Need help with your order?</span>
              <a
                href={`https://wa.me/${STORE_INFO.social.whatsappNumber?.replace('+', '')}?text=${encodeURIComponent(`Hi FLEW, checking status of order #${currentOrder.orderNumber}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff4444] font-bold hover:underline flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Message Kitchen</span>
              </a>
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-white/50 text-xs">
            No active order selected. Enter your Order Number above to track.
          </div>
        )}

      </div>
    </div>
  );
};
