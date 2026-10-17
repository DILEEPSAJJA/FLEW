export type CategoryId = 'all' | 'thickshakes' | 'brownies' | 'cold-coco' | 'hot-chocolate' | 'cold-coffees';

export interface MenuItem {
  id: string;
  name: string;
  tagline?: string;
  category: CategoryId;
  price: number;
  originalPrice?: number; // Pre-discount price
  discountPercent?: number; // e.g. 20 for 20%
  discountLabel?: string; // e.g. "Cat Midnight 20% OFF"
  description: string;
  image: string;
  isAuthenticFlewImage?: boolean;
  isSpecial?: boolean;
  isBestseller?: boolean;
  isAvailable?: boolean; // In-stock status
  catPick?: string; // e.g. "Cat Captain's Obsession"
  indulgenceLevel?: 'High' | 'Extremely Rich' | 'Pure Velvet';
  servingTemp?: 'Ice Cold' | 'Steaming Hot' | 'Warm & Gooey';
  dietary?: 'Vegetarian' | 'Contains Nuts' | 'Eggless';
  swiggyUrl?: string;
  createdAt?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'store' | 'desserts' | 'mascot' | 'lifestyle';
  image: string;
  caption: string;
  isOfficialInstagram?: boolean;
  instagramPostUrl?: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  phone?: string;
  rating: number; // 1 to 5
  date: string;
  source: string; // e.g. 'Verified Order #FLW-8392' | 'Google Reviews' | 'Swiggy Verified'
  comment: string;
  favoriteItem?: string;
  verified: boolean;
  orderNumber?: string;
}

export interface StoreInfo {
  name: string;
  brandTagline: string;
  brandSecondaryTagline: string;
  address: {
    shop: string;
    floor: string;
    building: string;
    plot: string;
    enclave: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    fullFormatted: string;
  };
  timings: {
    openTime: string;
    closeTime: string;
    displayString: string;
    days: string;
  };
  social: {
    instagram: string;
    instagramHandle: string;
    instagramFollowers: string;
    googleMapsUrl: string;
    googleMapsEmbedUrl: string;
    swiggyUrl: string;
    zomatoUrl?: string;
    whatsappNumber?: string;
    phone?: string;
  };
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export interface UserAuth {
  phoneNumber: string; // e.g. "9876543210"
  formattedPhone: string; // e.g. "+91 98765 43210"
  name: string;
  address?: string;
  isVerified: boolean;
  verifiedAt: string;
}

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  orderNumber: string; // e.g. "FLW-8392"
  customerPhone: string;
  customerName: string;
  deliveryAddress?: string;
  orderType: 'takeaway' | 'delivery' | 'dine-in';
  items: {
    item: MenuItem;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    notes?: string;
  }[];
  subtotal: number;
  discountTotal: number;
  finalTotal: number;
  status: OrderStatus;
  createdAt: string;
  estimatedMinutes: number;
}
