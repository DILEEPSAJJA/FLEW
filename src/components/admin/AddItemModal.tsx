import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { CategoryId, MenuItem } from '../../types';
import { useStore } from '../../context/StoreContext';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: MenuItem | null;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
}) => {
  const { addNewItem, updateItem } = useStore();

  const [name, setName] = useState(itemToEdit?.name || '');
  const [tagline, setTagline] = useState(itemToEdit?.tagline || '');
  const [category, setCategory] = useState<CategoryId>(itemToEdit?.category || 'thickshakes');
  const [price, setPrice] = useState(itemToEdit?.price?.toString() || '199');
  const [description, setDescription] = useState(itemToEdit?.description || '');
  const [image, setImage] = useState(itemToEdit?.image || '');
  const [catPick, setCatPick] = useState(itemToEdit?.catPick || '');
  const [dietary, setDietary] = useState<'Vegetarian' | 'Eggless' | 'Contains Nuts'>(itemToEdit?.dietary || 'Vegetarian');
  const [servingTemp, setServingTemp] = useState<'Ice Cold' | 'Warm & Gooey' | 'Steaming Hot'>(itemToEdit?.servingTemp || 'Ice Cold');
  const [indulgenceLevel, setIndulgenceLevel] = useState<'High' | 'Extremely Rich' | 'Pure Velvet'>(itemToEdit?.indulgenceLevel || 'Extremely Rich');
  const [isSpecial, setIsSpecial] = useState(itemToEdit?.isSpecial || false);
  const [isBestseller, setIsBestseller] = useState(itemToEdit?.isBestseller || false);

  if (!isOpen) return null;

  // Preset image quick-picks
  const PRESET_IMAGES = [
    { label: 'Authentic Almond Tub', url: '/assets/flew-post-roasted-almond.png' },
    { label: 'Rich Nutella Shake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80' },
    { label: 'Fudge Brownie DBC', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80' },
    { label: 'European Hot Choco', url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&auto=format&fit=crop&q=80' },
    { label: 'Whipped Iced Coffee', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numericPrice = parseFloat(price) || 149;
    const finalImage = image.trim() || PRESET_IMAGES[0].url;

    if (itemToEdit) {
      updateItem(itemToEdit.id, {
        name,
        tagline,
        category,
        price: numericPrice,
        description,
        image: finalImage,
        catPick,
        dietary,
        servingTemp,
        indulgenceLevel,
        isSpecial,
        isBestseller,
      });
    } else {
      addNewItem({
        name,
        tagline,
        category,
        price: numericPrice,
        description,
        image: finalImage,
        catPick: catPick || "Cat Commander's New Drop",
        dietary,
        servingTemp,
        indulgenceLevel,
        isSpecial,
        isBestseller,
        isAvailable: true,
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          aria-label="Close add item modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff2626]/20 text-[#ff4444] text-xs font-bold border border-[#ff2626]/30 mb-2">
            <Plus className="w-3.5 h-3.5" />
            <span>Admin Kitchen Controls</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white font-display">
            {itemToEdit ? 'Edit Dessert / Beverage' : 'Add New Menu Item'}
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Items added here immediately reflect on the customer storefront.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Item Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-white/70 mb-1 uppercase tracking-wider">
                Item Name <span className="text-[#ff2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lotus Biscoff Overload"
                className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1 uppercase tracking-wider">
                Category <span className="text-[#ff2626]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="thickshakes">Thickshakes</option>
                <option value="brownies">Brownie Desserts</option>
                <option value="cold-coco">Cold Coco</option>
                <option value="hot-chocolate">Hot Chocolate</option>
                <option value="cold-coffees">Cold Coffees & Foams</option>
              </select>
            </div>
          </div>

          {/* Price & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-white/70 mb-1 uppercase tracking-wider">
                Price (in ₹) <span className="text-[#ff2626]">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="199"
                className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1 uppercase tracking-wider">
                Tagline / Pitch
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Golden Crunchy Speculoos Bliss"
                className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-white/70 mb-1 uppercase tracking-wider">
              Description <span className="text-[#ff2626]">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the ingredients, textures, and cocoa notes..."
              className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Image URL & Presets */}
          <div>
            <label className="block font-semibold text-white/70 mb-1 uppercase tracking-wider">
              Product Image URL
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://... or /assets/flew-post-roasted-almond.png"
              className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
            />

            {/* Quick Pick Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[10px] text-white/40">Quick presets:</span>
              {PRESET_IMAGES.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setImage(preset.url)}
                  className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary, Temp & Indulgence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-white/70 mb-1 uppercase">Dietary</label>
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value as any)}
                className="w-full rounded-xl bg-[#18181f] border border-white/10 px-3 py-2 text-white text-xs"
              >
                <option value="Vegetarian">Vegetarian</option>
                <option value="Eggless">Eggless</option>
                <option value="Contains Nuts">Contains Nuts</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1 uppercase">Serving Temp</label>
              <select
                value={servingTemp}
                onChange={(e) => setServingTemp(e.target.value as any)}
                className="w-full rounded-xl bg-[#18181f] border border-white/10 px-3 py-2 text-white text-xs"
              >
                <option value="Ice Cold">Ice Cold</option>
                <option value="Warm & Gooey">Warm & Gooey</option>
                <option value="Steaming Hot">Steaming Hot</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1 uppercase">Indulgence</label>
              <select
                value={indulgenceLevel}
                onChange={(e) => setIndulgenceLevel(e.target.value as any)}
                className="w-full rounded-xl bg-[#18181f] border border-white/10 px-3 py-2 text-white text-xs"
              >
                <option value="Extremely Rich">Extremely Rich</option>
                <option value="Pure Velvet">Pure Velvet</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Cat Pick Quote */}
          <div>
            <label className="block font-semibold text-white/70 mb-1 uppercase tracking-wider">
              Cat Mascot Tag / Badge
            </label>
            <input
              type="text"
              value={catPick}
              onChange={(e) => setCatPick(e.target.value)}
              placeholder="e.g. Midnight Whisker Favorite"
              className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
            />
          </div>

          {/* Special & Bestseller Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={isSpecial}
                onChange={(e) => setIsSpecial(e.target.checked)}
                className="w-4 h-4 rounded text-[#ff2626] bg-[#18181f] border-white/20 focus:ring-[#ff2626]"
              />
              <span className="font-semibold">Featured Special (Hero display)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 rounded text-[#ff2626] bg-[#18181f] border-white/20 focus:ring-[#ff2626]"
              />
              <span className="font-semibold">Bestseller Badge</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold transition-all shadow-md shadow-[#ff2626]/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{itemToEdit ? 'Save Changes' : 'Publish Item to Store'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
