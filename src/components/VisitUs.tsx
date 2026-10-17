import React, { useState } from 'react';
import { MapPin, Clock, Navigation, ExternalLink, Copy, Check } from 'lucide-react';
import { InstagramIcon } from './icons/InstagramIcon';
import { STORE_INFO } from '../data/flewData';
import { getStoreStatus } from '../utils/storeStatus';

export const VisitUs: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const status = getStoreStatus();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(STORE_INFO.address.fullFormatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="visitus" className="py-24 bg-[#0a0a0c] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2626]/10 border border-[#ff2626]/25 text-xs font-bold text-[#ff4444] mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Store Location & Hours</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight">
            Visit Us at <span className="text-[#ff3333]">Gowlidoddy</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/60">
            Come chill at our cat-themed dessert shop in Sai Tulasi Enclave, Gowlidoddy. Serving thickshakes, cold coco, and warm brownies till 1:00 AM.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Details Cards */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Timing Card */}
            <div className="p-6 rounded-3xl bg-[#141418] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#ff2626]" />
                  <h3 className="text-lg font-bold text-white font-display">Store Hours</h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                  <span className={`w-2 h-2 rounded-full ${status.badgeColor} animate-pulse`} />
                  <span className="font-bold text-white">{status.statusText}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                  <span className="text-white/70 font-medium">Monday – Sunday</span>
                  <span className="font-mono font-bold text-white text-base">1:00 PM – 1:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/50 pt-1">
                  <span>Current Schedule:</span>
                  <span className="text-[#ff6666] font-medium">{status.nextEventText}</span>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="p-6 rounded-3xl bg-[#141418] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#ff2626]" />
                  <h3 className="text-lg font-bold text-white font-display">Store Address</h3>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white flex items-center gap-1.5 border border-white/10 transition-colors"
                  title="Copy full address to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-sm text-white/80 leading-relaxed font-normal bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <strong className="text-white font-bold block text-base mb-1">FLEW — Gowlidoddy</strong>
                <p>{STORE_INFO.address.shop}</p>
                <p>{STORE_INFO.address.building}, {STORE_INFO.address.plot}</p>
                <p>{STORE_INFO.address.enclave}</p>
                <p>{STORE_INFO.address.area}</p>
                <p>{STORE_INFO.address.city}, {STORE_INFO.address.state} — {STORE_INFO.address.pincode}</p>
              </div>

              {/* Action Buttons: Directions & IG */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={STORE_INFO.social.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#ff2626]/20 transition-all active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>

                <a
                  href={STORE_INFO.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/15 flex items-center justify-center gap-2 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-[#ff4444]" />
                  <span>@flew.india</span>
                </a>
              </div>
            </div>

            {/* Quick Order Buttons Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1c1212] to-[#141418] border border-[#ff2626]/30 shadow-xl flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#ff4444] uppercase tracking-wider">
                  Swiggy Delivery
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Order to your doorstep in Hyderabad
                </div>
              </div>
              <a
                href={STORE_INFO.social.swiggyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Order Swiggy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

          {/* Right Column: Google Maps Embed */}
          <div className="lg:col-span-7 h-full min-h-[460px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-[#121216]">
            <iframe
              title="FLEW Gowlidoddy Location Map"
              src="https://maps.google.com/maps?q=Sai+Tulasi+Enclave+Gowlidoddy+Hyderabad&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              className="w-full h-full min-h-[460px] border-0 filter invert-[90%] hue-rotate-180 contrast-125 opacity-90 hover:opacity-100 transition-opacity"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            {/* Interactive Overlay Badge */}
            <div className="absolute top-4 left-4 p-3 rounded-2xl bg-[#0a0a0c]/90 backdrop-blur-md border border-white/15 shadow-xl max-w-xs pointer-events-none">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff2626]" />
                <span>FLEW Store Location</span>
              </div>
              <p className="text-[11px] text-white/60 mt-1">
                Plot 12, Sai Tulasi Enclave, Gowlidoddy, Hyderabad
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
