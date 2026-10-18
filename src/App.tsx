import { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Compass, CheckCircle2 } from 'lucide-react';
import { MenuItem, CartItem } from './types';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedSpecials } from './components/FeaturedSpecials';
import { MenuSection } from './components/MenuSection';
import { ProductModal } from './components/ProductModal';
import { OurStory } from './components/OurStory';
import { GallerySection } from './components/GallerySection';
import { ReviewsSection } from './components/ReviewsSection';
import { VisitUs } from './components/VisitUs';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { OrderPlatformModal } from './components/OrderPlatformModal';
import { PhoneAuthModal } from './components/PhoneAuthModal';
import { OrderTrackModal } from './components/OrderTrackModal';
import { CatAssistant } from './components/CatAssistant';
import { WelcomeAuthGate } from './components/WelcomeAuthGate';
import { WriteReviewModal } from './components/WriteReviewModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminPinLock } from './components/admin/AdminPinLock';

function StorefrontApp() {
  const { 
    currentRoute, 
    currentUser,
    isAdminAuthenticated,
    isAuthModalOpen, 
    setIsAuthModalOpen,
    isOrderTrackModalOpen,
    setIsOrderTrackModalOpen,
    activeOrder
  } = useStore();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('flew_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<{
    name: string;
    price: number;
    quantity: number;
  } | null>(null);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (addedToast) {
      const timer = setTimeout(() => {
        setAddedToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [addedToast]);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('flew_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to sync cart', e);
    }
  }, [cart]);

  const handleAddToCart = (item: MenuItem, quantity = 1, notes?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes,
        };
        return updated;
      }
      return [...prev, { item, quantity, notes }];
    });
    // User stays on menu page! Inform them with toast & floating tray bar
    setAddedToast({
      name: item.name,
      price: item.price * quantity,
      quantity,
    });
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCart((prev) =>
      prev.map((ci) => (ci.item.id === id ? { ...ci, quantity: newQty } : ci))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleExploreMenu = () => {
    const el = document.getElementById('menu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  // 1. If Admin route is active (via /#admin), enforce 6-digit PIN before rendering Admin Dashboard!
  if (currentRoute === 'admin') {
    if (!isAdminAuthenticated) {
      return <AdminPinLock onUnlock={() => {}} />;
    }
    return <AdminDashboard />;
  }

  // 2. For End-Users: At start of website, ask for mobile number & verify OTP before unlocking storefront!
  if (!currentUser) {
    return <WelcomeAuthGate onVerified={() => {}} />;
  }

  // 3. Once verified, render the full Customer End-User Storefront
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col font-sans selection:bg-[#ff2626] selection:text-white">
      {/* Navigation (End-users see brand, menu, cart, order, and verified phone; no admin buttons) */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        <Hero
          onExploreMenu={handleExploreMenu}
          onOpenOrderModal={() => setIsOrderModalOpen(true)}
        />

        <FeaturedSpecials
          onSelectItem={(item) => setSelectedProduct(item)}
          onAddToCart={(item) => handleAddToCart(item, 1)}
        />

        <MenuSection
          onSelectItem={(item) => setSelectedProduct(item)}
          onAddToCart={(item) => handleAddToCart(item, 1)}
        />

        <OurStory />

        <GallerySection />

        <ReviewsSection />

        <VisitUs />
      </main>

      {/* Footer */}
      <Footer />

      {/* Product Details Modal */}
      <ProductModal
        item={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onExploreMenu={handleExploreMenu}
      />

      {/* Order Platform Selector Modal */}
      <OrderPlatformModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Mobile Phone Registration & OTP Verification Modal */}
      <PhoneAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Live Order Status Tracking Modal */}
      <OrderTrackModal
        isOpen={isOrderTrackModalOpen}
        onClose={() => setIsOrderTrackModalOpen(false)}
      />

      {/* Subtle Item Added Toast Notification */}
      {addedToast && (
        <aside 
          aria-label="Item added notification"
          className="fixed top-20 right-3 sm:right-6 z-50 max-w-xs sm:max-w-sm w-[calc(100%-1.5rem)] animate-fadeIn"
        >
          <div className="bg-[#16161d]/95 backdrop-blur-xl border border-emerald-500/40 shadow-2xl shadow-black rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{addedToast.name}</div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  +{addedToast.quantity} added to tray • ₹{addedToast.price}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0 transition-colors cursor-pointer"
            >
              View Tray
            </button>
          </div>
        </aside>
      )}

      {/* Floating View Cart / View Tray Bar */}
      {totalCartCount > 0 && !isCartOpen && (
        <aside 
          aria-label="Shopping tray preview"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-24 sm:bottom-6 z-50 max-w-md w-[calc(100%-1.5rem)] sm:w-auto animate-fadeIn"
        >
          <div className="bg-[#141419]/95 backdrop-blur-2xl border border-white/20 hover:border-[#ff2626]/60 shadow-2xl shadow-black/90 rounded-2xl p-3 sm:px-5 sm:py-3 flex items-center justify-between sm:gap-6 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#ff2626] text-white font-bold shadow-lg shadow-[#ff2626]/40 shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-black border-2 border-[#ff2626] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold">
                  {totalCartCount}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-white/70 font-medium flex items-center gap-1.5">
                  <span>Your Tray</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/50">{totalCartCount} {totalCartCount === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="text-base font-black text-white font-mono">
                  ₹{cartSubtotal}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff2626] hover:bg-[#ff3d3d] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#ff2626]/40 transition-all shrink-0 cursor-pointer"
            >
              <span>View Cart / Tray</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Active Order Live Tracker Bar (Instant 1-tap tracking for customer) */}
      {activeOrder && ['placed', 'preparing', 'ready'].includes(activeOrder.status) && (
        <div 
          className={`fixed z-40 transition-all duration-300 ${
            totalCartCount > 0 && !isCartOpen
              ? 'bottom-20 sm:bottom-24 left-3 right-3 sm:right-auto sm:left-6 max-w-sm'
              : 'bottom-3 sm:bottom-6 left-3 right-3 sm:right-auto sm:left-6 max-w-sm'
          }`}
        >
          <button
            onClick={() => setIsOrderTrackModalOpen(true)}
            className="w-full bg-[#14141a]/95 backdrop-blur-2xl border border-amber-500/40 hover:border-amber-400 shadow-2xl shadow-black/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Compass className="w-5 h-5 animate-spin" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Order #{activeOrder.orderNumber}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {activeOrder.status === 'placed' && '🕒 Order Placed'}
                    {activeOrder.status === 'preparing' && '👨‍🍳 Preparing in Kitchen'}
                    {activeOrder.status === 'ready' && '🎉 Ready for Pickup!'}
                  </span>
                </div>
                <div className="text-[11px] text-white/60 truncate mt-0.5">
                  Tap to track live updates →
                </div>
              </div>
            </div>
            <div className="text-amber-400 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 shrink-0">
              Track
            </div>
          </button>
        </div>
      )}

      {/* Customer Review & Rating Modal */}
      <WriteReviewModal />

      {/* Interactive Cat Assistant Easter Egg */}
      <CatAssistant />
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <StorefrontApp />
    </StoreProvider>
  );
}

export default App;
