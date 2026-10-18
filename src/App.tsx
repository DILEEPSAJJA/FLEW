import { useState, useEffect } from 'react';
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
    setIsOrderTrackModalOpen
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
    setIsCartOpen(true);
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
