import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, X, Play, Sparkles } from 'lucide-react';
import { InstagramIcon } from './icons/InstagramIcon';
import { GalleryItem } from '../types';
import { STORE_INFO, GALLERY_ITEMS } from '../data/flewData';

export const GallerySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const categories = [
    { id: 'all', label: 'All Snaps' },
    { id: 'mascot', label: 'The Cat Mascot' },
    { id: 'desserts', label: 'Desserts & Shakes' },
    { id: 'lifestyle', label: 'Hyderabad Vibe' },
  ];

  const filteredGallery = selectedCategory === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <section id="gallery" className="py-24 bg-[#0a0a0c] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Instagram Link */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2626]/10 border border-[#ff2626]/25 text-xs font-bold text-[#ff4444] mb-2">
              <InstagramIcon className="w-3.5 h-3.5" />
              <span>{STORE_INFO.social.instagramHandle}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight">
              Captured Moments & <span className="text-[#ff3333]">Vibes</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl">
              Authentic glimpses of our signature thickshakes, cat mascot drops, and late-night hangs straight from our Instagram feed.
            </p>
          </div>

          {/* Follow on IG CTA */}
          <a
            href={STORE_INFO.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-[#ff2626] to-[#e11d48] hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#ff2626]/25 transition-all self-start md:self-auto"
          >
            <InstagramIcon className="w-4 h-4" />
            <span>Follow @flew.india</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Video Theme Feature Banner (from user's reel reference) */}
        <div className="mb-12 rounded-3xl bg-gradient-to-r from-[#181820] via-[#121216] to-[#1c0f0f] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff2626]/20 text-[#ff4444] text-[11px] font-bold border border-[#ff2626]/30">
              <Sparkles className="w-3 h-3" />
              <span>Official Reel Feature</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
              Watch The FLEW Cat Universe in Motion
            </h3>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl">
              Experience the dark rebellious aesthetic, decadent chocolate pours, and late-night Hyderabad street energy in our viral launch reel.
            </p>
          </div>

          <a
            href="https://www.instagram.com/reel/DZ-nAASSfLM/"
            target="_blank"
            rel="noopener noreferrer"
            className="z-10 flex-shrink-0 flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold text-sm shadow-lg shadow-[#ff2626]/40 transition-all active:scale-95 group"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            </div>
            <span>Watch Instagram Reel</span>
          </a>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border ${
                selectedCategory === c.id
                  ? 'bg-[#ff2626] text-white border-[#ff2626] shadow-md shadow-[#ff2626]/25'
                  : 'bg-[#141418] text-white/70 hover:text-white border-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightboxItem(item)}
              className="group relative rounded-2xl overflow-hidden bg-[#121216] border border-white/10 hover:border-[#ff2626]/50 cursor-pointer aspect-square shadow-lg shadow-black/50 transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              {/* Badges on Top */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                {item.isOfficialInstagram && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Official Instagram Post</span>
                  </span>
                )}
                <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 group-hover:text-white ml-auto border border-white/15">
                  <InstagramIcon className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Caption Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <h4 className="text-base font-bold text-white group-hover:text-[#ff4444] transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-white/70 line-clamp-2 mt-1">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-xl w-full bg-[#121216] border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-[#ff2626] text-white flex items-center justify-center transition-colors"
              aria-label="Close image"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-square sm:aspect-[4/3] bg-black">
              <img
                src={lightboxItem.image}
                alt={lightboxItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white font-display">
                    {lightboxItem.title}
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    {lightboxItem.caption}
                  </p>
                </div>
                {lightboxItem.isOfficialInstagram && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1 flex-shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified FLEW</span>
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/40 font-mono">
                  Gowlidoddy, Hyderabad
                </span>
                <a
                  href={lightboxItem.instagramPostUrl || STORE_INFO.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#ff2626] hover:bg-[#ff3b3b] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>View on Instagram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
