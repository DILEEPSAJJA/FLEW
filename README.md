# 🐾 FLEW — Cat-Themed Dessert & Thickshake Bar (Gowlidoddy, Hyderabad)

> **“NORMAL IS BORING... FLEW IS FREEDOM .....!”**  
> *Paws, Sip, Repeat.*

A complete, responsive, premium dark-themed dual-interface web application crafted for **FLEW**, Hyderabad's viral cat-themed late-night dessert and thickshake spot located in Gowlidoddy (Sai Tulasi Enclave), near the Financial District & Nanakramguda.

---

## 🌟 Dual Interface System

### 1. 🛍️ Customer End-User Storefront (`/`)
- **Brand Experience**: Rebellious dark cat aesthetic (`#0a0a0c`), crimson red glow (`#ff2626`), and interactive superhero cat mascot.
- **Searchable Menu**: Categorized thickshakes, DBC brownies, cold coco, hot chocolates, and cold brews.
- **Promotions & Offers**: Real-time display of discounts applied by Admin with strike-through original prices, live discount badges (e.g., `20% OFF`), and dedicated "Active Discounts Only" filter.
- **Instagram Gallery & Reel**: Authentically curated store snaps and video reel feature.
- **Mobile Registration & OTP Verification**: 
  - Customers register with their 10-digit Indian mobile number.
  - Generates an instant 4-digit OTP with simulated SMS banner, countdown timer, and 1-tap autofill.
- **Order Number & Live Kitchen Tracking**:
  - Placing an order generates a unique reference (e.g. `#FLW-8392`).
  - Customers can track live kitchen progress (*Order Received* ➔ *In Kitchen* ➔ *Ready / Out* ➔ *Completed*).

### 2. ⚡ Store Admin Management Portal (`/#admin` or `/admin`)
Accessible via the **"Admin"** pill in the top header or by navigating to `/#admin`:
- **Live Kitchen Orders Board**:
  - Real-time stream of incoming orders showing customer name, verified phone number, delivery landmark, ordered items, and total in ₹.
  - Dropdown to instantly update order status: `Placed` ➔ `Preparing` ➔ `Ready` ➔ `Completed` ➔ `Cancelled`. Updates sync to customer order trackers in real time.
- **Menu Inventory Manager**:
  - Form to add new desserts/thickshakes with name, price, category, tagline, description, dietary tags, and image URL.
  - Edit existing items, update prices, or toggle "In Stock" / "Sold Out".
- **Discount & Offer Campaign Manager**:
  - Select individual or bulk items (e.g., Roasted Almond Choco, Flew Style DBC).
  - Apply custom percentage discounts (10%, 15%, 20%, 25%, 30%).
  - Set custom promo labels (e.g. *"Cat Midnight Rush 20% OFF"*).
  - 1-click discount removal.
- **Store Operations**:
  - Live revenue metrics, active orders tally, and 1-click menu reset.

---

## 🚀 Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.
- **Customer Storefront**: `http://localhost:5173/`
- **Store Admin Portal**: Click the **Admin** pill in the top navbar or visit `http://localhost:5173/#admin`

### 3. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in the `dist/` directory (~770ms build time with zero errors).

### 4. Preview Production Build
```bash
npm run preview
```

---

## 📁 Project Architecture

```
FLEW/
├── public/
│   ├── assets/
│   │   ├── flew-logo.png               # Official circular red FLEW brand logo
│   │   ├── flew-mascot-badge.png       # Official pre-launch cat mascot badge
│   │   ├── flew-post-supercat.png      # Official hero superhero cat mascot in cape
│   │   ├── flew-post-lifestyle.png     # Official FLEW cup & cap lifestyle photo
│   │   ├── flew-post-cup-bmw.png       # Official FLEW cup on car ("SEE YOU SOON")
│   │   └── flew-post-roasted-almond.png # Official Roasted Almond Choco dessert tub
│   ├── logo.svg                        # Retina SVG vector logo
│   └── cat-mascot.svg                  # Scalable superhero cat mascot vector
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx      # Admin Portal (Orders, Menu, Discounts, Stats)
│   │   │   ├── AddItemModal.tsx        # Add/edit menu item modal
│   │   │   └── DiscountManagerModal.tsx # Manage item discounts modal
│   │   ├── icons/
│   │   │   └── InstagramIcon.tsx       # Reusable SVG Instagram icon
│   │   ├── Navbar.tsx                  # Header with Admin Switch, Order Track & Auth pills
│   │   ├── Hero.tsx                    # Rebellious cat mascot hero with confetti celebration
│   │   ├── FeaturedSpecials.tsx        # Signature thickshakes & DBC with discount support
│   │   ├── MenuSection.tsx             # Searchable, filterable menu with live discounts
│   │   ├── ProductModal.tsx            # Detail modal with indulgence specs & instant add
│   │   ├── OurStory.tsx                # Verified startup story & brand manifesto
│   │   ├── GallerySection.tsx          # Authentic Instagram snaps, lightbox & Reel feature
│   │   ├── ReviewsSection.tsx          # Verified Google / Swiggy patron feedback
│   │   ├── VisitUs.tsx                 # Full Gowlidoddy address, Google Maps & directions
│   │   ├── CartDrawer.tsx              # Slide-over order tray with Order # generation
│   │   ├── PhoneAuthModal.tsx          # Mobile number registration with simulated OTP
│   │   ├── OrderTrackModal.tsx         # Live kitchen order status tracker
│   │   ├── OrderPlatformModal.tsx      # Multi-platform ordering selector
│   │   ├── CatAssistant.tsx            # Floating interactive cat mascot easter egg
│   │   └── Footer.tsx                  # Footer links, brand credits & operating hours
│   ├── context/
│   │   └── StoreContext.tsx            # Synchronized state for menu, orders, auth & routes
│   ├── data/
│   │   └── flewData.ts                 # Verified central store information
│   ├── types/
│   │   └── index.ts                    # TypeScript types
│   ├── utils/
│   │   └── storeStatus.ts              # Real-time IST open/closed calculator (1 PM - 1 AM)
│   ├── App.tsx                         # Multi-interface route coordinator
│   ├── index.css                       # Tailwind layers, paw patterns & red glow effects
│   └── main.tsx                        # React DOM mounting
├── tailwind.config.js                  # Custom palette & animations
├── vite.config.ts                      # Vite configuration
└── package.json
```

---

## 📍 Verified Business Information

* **Store**: FLEW — Gowlidoddy
* **Address**: Shop No. 2, Ground Floor, H No. 5-3/12, Plot No. 12, Sai Tulasi Enclave, Gowlidoddy, Hyderabad, Telangana 500032.
* **Timings**: 1:00 PM – 1:00 AM (Monday to Sunday)
* **Instagram**: [https://www.instagram.com/flew.india/](https://www.instagram.com/flew.india/)
* **Google Maps**: [https://maps.app.goo.gl/B9Ap6ZfBfy5EEfDt9?g_st=ic](https://maps.app.goo.gl/B9Ap6ZfBfy5EEfDt9?g_st=ic)
* **Swiggy Store**: [https://www.swiggy.com/city/hyderabad/flew-nanakramguda-rest1401937](https://www.swiggy.com/city/hyderabad/flew-nanakramguda-rest1401937)
