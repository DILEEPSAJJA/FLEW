import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Menu, X, Clock, ExternalLink, ShieldCheck, Compass, Settings } from 'lucide-react';
import { InstagramIcon } from './icons/InstagramIcon';
import { STORE_INFO } from '../data/flewData';
import { getStoreStatus } from '../utils/storeStatus';
import { useStore } from '../context/StoreContext';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrderModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenOrderModal
}) => {
  const { 
    navigateTo, 
    currentUser, 
    setIsAuthModalOpen, 
    setIsOrderTrackModalOpen 
  } = useStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [status, setStatus] = useState(getStoreStatus());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);

    const interval = setInterval(() => {
      setStatus(getStoreStatus());
    }, 60000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { name: 'Menu', href: '#menu' },
    { name: 'Specials', href: '#specials' },
    { name: 'Our Story', href: '#story' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Visit Us', href: '#visitus' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40 py-2.5'
            : 'bg-gradient-to-b from-[#0a0a0c]/90 via-[#0a0a0c]/60 to-transparent py-3 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo and Brand */}
            <a
              href="#"
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-[#ff2626] rounded-xl p-1"
              aria-label="FLEW Home"
            >
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-[#ff2626] shadow-md shadow-[#ff2626]/40 transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
                <img
                  src="/assets/flew-logo.png"
                  alt="FLEW Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-2xl tracking-tighter text-white font-display">
                    FLEW<span className="text-[#ff2626]">.</span>
                  </span>
                  <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#ff2626]/20 text-[#ff4444] border border-[#ff2626]/40 rounded-full">
                    Gowlidoddy
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-white/50 tracking-wider font-medium uppercase hidden xs:block">
                  Paws, Sip, Repeat
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="px-2.5 py-1.5 text-xs sm:text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {link.name}
                </button>
              ))}
            </nav>

            {/* Right Actions: Track Order, Phone/Auth, Admin Switch, Cart, Order Button */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              
              {/* Track Order Pill */}
              <button
                onClick={() => setIsOrderTrackModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
                title="Track your order status"
              >
                <Compass className="w-3.5 h-3.5 text-[#ff4444]" />
                <span>Track Order</span>
              </button>

              {/* Phone Registration / Verified Badge */}
              {currentUser ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
                  title="Verified Customer Phone"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px] truncate max-w-[110px]">{currentUser.formattedPhone}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white transition-colors"
                >
                  <span>Verify Mobile</span>
                </button>
              )}

              {/* Admin Portal Toggle Pill */}
              <button
                onClick={() => navigateTo('admin')}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#ff2626]/10 hover:bg-[#ff2626]/20 border border-[#ff2626]/40 text-[#ff4444] text-xs font-bold transition-all"
                title="Switch to Store Admin Portal"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Admin</span>
              </button>

              {/* Cart Button */}
              <button
                onClick={onOpenCart}
                className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff2626]"
                aria-label={`Open shopping cart with ${cartCount} items`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-[#ff2626] text-white rounded-full border-2 border-[#0a0a0c] shadow-sm animate-bounce-slow font-mono">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Order Now Button */}
              <button
                onClick={onOpenOrderModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-[#ff2626] hover:bg-[#ff3b3b] text-white rounded-full transition-all duration-200 shadow-md shadow-[#ff2626]/30 hover:shadow-[#ff2626]/50 active:scale-95"
              >
                <span>Order</span>
                <ExternalLink className="w-3 h-3 hidden sm:inline" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 text-white/80 hover:text-white border border-white/10"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/90 backdrop-blur-xl xl:hidden pt-20 px-6 pb-8 flex flex-col justify-between animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="space-y-4">
            
            {/* Live Status on Mobile */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${status.badgeColor} animate-pulse`} />
                <div>
                  <div className="text-sm font-bold text-white">{status.statusText}</div>
                  <div className="text-xs text-white/60">{status.nextEventText}</div>
                </div>
              </div>
              <div className="text-xs text-white/50 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#ff2626]" />
                1 PM – 1 AM
              </div>
            </div>

            {/* Quick Actions in Drawer */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsOrderTrackModalOpen(true);
                }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-left"
              >
                <Compass className="w-4 h-4 text-[#ff4444] mb-1" />
                <div className="text-xs font-bold text-white">Track Order</div>
                <div className="text-[10px] text-white/50">Check live status</div>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-left"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-xs font-bold text-white">
                  {currentUser ? 'Mobile Verified' : 'Verify Mobile'}
                </div>
                <div className="text-[10px] text-white/50 truncate font-mono">
                  {currentUser ? currentUser.formattedPhone : 'Register with OTP'}
                </div>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col space-y-1.5 pt-2">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="w-full text-left px-3.5 py-2.5 text-base font-semibold text-white/90 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <span className="text-[#ff2626] font-mono text-sm">→</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            {/* Switch to Admin Portal in Mobile Drawer */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('admin');
              }}
              className="w-full py-3 px-4 bg-[#ff2626]/20 border border-[#ff2626]/50 text-[#ff4444] font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Open Store Admin Portal</span>
            </button>

            <a
              href={STORE_INFO.social.swiggyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#ff2626] text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 text-center text-sm"
            >
              <span>Order on Swiggy</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="flex items-center justify-center gap-4 pt-1">
              <a
                href={STORE_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-[#ff2626]" />
                <span>@flew.india</span>
              </a>
              <span className="text-white/20">•</span>
              <a
                href={STORE_INFO.social.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
              >
                <MapPin className="w-3.5 h-3.5 text-[#ff2626]" />
                <span>Directions</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
