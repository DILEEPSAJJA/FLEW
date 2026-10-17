import React from 'react';
import { MapPin, ExternalLink, Heart, Lock } from 'lucide-react';
import { InstagramIcon } from './icons/InstagramIcon';
import { STORE_INFO } from '../data/flewData';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { navigateTo } = useStore();
  return (
    <footer className="bg-[#070709] border-t border-white/10 text-white/70 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/5">
          
          {/* Brand Col */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff2626]">
                <img
                  src="/assets/flew-logo.png"
                  alt="FLEW Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              </div>
              <span className="text-2xl font-black text-white font-display tracking-tight">
                FLEW<span className="text-[#ff2626]">.</span>
              </span>
            </div>

            <p className="text-sm text-white/60 max-w-sm leading-relaxed">
              Hyderabad's premier cat-themed thickshake & dessert destination in Gowlidoddy. Serving uncompromised chocolate indulgence till 1:00 AM.
            </p>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 max-w-sm">
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                {STORE_INFO.brandTagline}
              </p>
              <span className="text-[11px] text-white/50 block mt-0.5">
                {STORE_INFO.brandSecondaryTagline}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#menu" className="hover:text-white transition-colors">Our Menu & Shakes</a>
              </li>
              <li>
                <a href="#specials" className="hover:text-white transition-colors">Featured Specials</a>
              </li>
              <li>
                <a href="#story" className="hover:text-white transition-colors">The FLEW Story</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-white transition-colors">Instagram Gallery</a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-white transition-colors">Customer Reviews</a>
              </li>
              <li>
                <a href="#visitus" className="hover:text-white transition-colors">Find Store & Directions</a>
              </li>
            </ul>
          </div>

          {/* Visit & Connect */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Store Location</h4>
            <div className="text-xs text-white/60 space-y-1 leading-relaxed">
              <p className="text-white font-medium">FLEW — Gowlidoddy</p>
              <p>{STORE_INFO.address.shop}, {STORE_INFO.address.enclave}</p>
              <p>{STORE_INFO.address.area}, Hyderabad - 500032</p>
              <p className="text-[#ff6666] font-mono pt-1">Timings: 1:00 PM – 1:00 AM (Daily)</p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={STORE_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#ff2626]/20 hover:text-[#ff4444] text-white flex items-center justify-center border border-white/10 transition-colors"
                title="Instagram @flew.india"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              <a
                href={STORE_INFO.social.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#ff2626]/20 hover:text-[#ff4444] text-white flex items-center justify-center border border-white/10 transition-colors"
                title="Google Maps Location"
              >
                <MapPin className="w-4 h-4" />
              </a>

              <a
                href={STORE_INFO.social.swiggyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-[#ff2626] hover:bg-[#ff3b3b] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Order on Swiggy</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div className="flex items-center gap-3">
            <p>© {new Date().getFullYear()} FLEW Gowlidoddy, Hyderabad. All rights reserved.</p>
            <button
              onClick={() => navigateTo('admin')}
              className="inline-flex items-center gap-1 text-[10px] text-white/20 hover:text-white/60 transition-colors"
              title="Staff Portal (PIN 1234)"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Staff</span>
            </button>
          </div>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-[#ff2626] fill-[#ff2626]" />
            <span>for late-night dessert lovers in Hyderabad</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
