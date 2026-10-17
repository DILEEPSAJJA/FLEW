import React, { useState, useEffect } from 'react';
import { X, Star, Heart, CheckCircle2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';

const STAR_LABELS: { [key: number]: string } = {
  1: 'Needs Improvement 😿',
  2: 'Fair / Average 🐱',
  3: 'Good Cravings 🐾',
  4: 'Super Delicious! 😺✨',
  5: 'Cat-tastic & Heavenly! 🐾🔥',
};

export const WriteReviewModal: React.FC = () => {
  const { 
    isReviewModalOpen, 
    setIsReviewModalOpen, 
    reviewTargetOrder, 
    currentUser, 
    menuItems, 
    addReview 
  } = useStore();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [authorName, setAuthorName] = useState<string>('');
  const [favoriteDish, setFavoriteDish] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Initialize author name and dish from target order or auth user
  useEffect(() => {
    if (isReviewModalOpen) {
      setIsSubmitted(false);
      setRating(5);
      setHoverRating(0);
      setComment('');

      if (reviewTargetOrder) {
        setAuthorName(reviewTargetOrder.customerName || currentUser?.name || '');
        if (reviewTargetOrder.items.length > 0) {
          setFavoriteDish(reviewTargetOrder.items[0].item.name);
        }
      } else if (currentUser) {
        setAuthorName(currentUser.name || '');
        setFavoriteDish(menuItems[0]?.name || 'Signature Flew Cold Coco');
      } else {
        setFavoriteDish(menuItems[0]?.name || 'Signature Flew Cold Coco');
      }
    }
  }, [isReviewModalOpen, reviewTargetOrder, currentUser, menuItems]);

  if (!isReviewModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addReview({
      author: authorName.trim() || currentUser?.name || 'Happy Flew Patron',
      phone: currentUser?.formattedPhone || reviewTargetOrder?.customerPhone,
      rating: rating,
      favoriteItem: favoriteDish || undefined,
      comment: comment.trim() || undefined,
      orderNumber: reviewTargetOrder?.orderNumber,
    });

    // Confetti celebration
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ff2626', '#fbbf24', '#ffffff'],
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsReviewModalOpen(false);
      setIsSubmitted(false);
    }, 1800);
  };

  const activeRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsReviewModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          aria-label="Close review modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-10 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-extrabold text-white font-display">
              Review Published! 🐾
            </h3>
            <p className="text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
              Thank you for sharing your love for FLEW. Your review is now visible on our homepage!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Modal Header */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#ff2626]/20 border border-[#ff2626]/40 flex items-center justify-center mx-auto mb-2 text-2xl">
                🐱
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display">
                Rate Your FLEW Cravings
              </h3>
              <p className="text-xs text-white/60 mt-1">
                {reviewTargetOrder ? (
                  <span className="text-[#ff6666] font-semibold">
                    Reviewing Delivered Order #{reviewTargetOrder.orderNumber}
                  </span>
                ) : (
                  'Share your experience with fellow Hyderabad dessert lovers.'
                )}
              </p>
            </div>

            {/* Star Rating Interactive Selector */}
            <div className="py-3 px-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-2">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                Tap Stars to Rate
              </span>
              
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1.5 focus:outline-none transition-transform hover:scale-125 active:scale-95"
                      aria-label={`${starVal} Star`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="text-xs font-bold text-amber-300 min-h-[20px] transition-all">
                {STAR_LABELS[activeRating] || ''}
              </div>
            </div>

            {/* Reviewer Name */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-[#18181f] border border-white/10 focus:border-[#ff2626] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
              />
            </div>

            {/* Favorite Item Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                What dessert / shake did you enjoy most?
              </label>
              <select
                value={favoriteDish}
                onChange={(e) => setFavoriteDish(e.target.value)}
                className="w-full bg-[#18181f] border border-white/10 focus:border-[#ff2626] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              >
                {reviewTargetOrder ? (
                  <optgroup label="Items from your order">
                    {reviewTargetOrder.items.map((i) => (
                      <option key={i.item.id} value={i.item.name}>
                        {i.item.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                <optgroup label="Signature FLEW Menu">
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} (₹{item.price})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Comment / Feedback */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/70">
                  Your Review / Notes
                </label>
                <span className="text-[10px] text-white/40">Optional</span>
              </div>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the shake thickness, temperature, packaging, or late night delivery? We'd love to know!"
                className="w-full bg-[#18181f] border border-white/10 focus:border-[#ff2626] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none resize-none"
              />
            </div>

            {/* Verified Patron Badge Notice */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Your review will be tagged as <strong>Verified Customer Feedback</strong> on our community board.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#ff2626] to-[#dc2626] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Submit Review & Rate Experience</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
