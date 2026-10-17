# 🐾 FLEW — Cat-Themed Dessert & Thickshake Bar (Gowlidoddy, Hyderabad)

> **“NORMAL IS BORING... FLEW IS FREEDOM .....!”**  
> *Paws, Sip, Repeat.*

A complete, responsive, premium dark-themed web application crafted for **FLEW**, Hyderabad's viral cat-themed late-night dessert and thickshake spot located in Gowlidoddy (Sai Tulasi Enclave), near the Financial District & Nanakramguda.

---

## 🌟 Architecture & Access Controls

### 1. 🛍️ Customer End-User Storefront (`/`)
- **First-Visit Mobile Gate**:
  - When users first arrive, they are greeted by the **Welcome Mobile Gate** before entering the store.
  - Users enter their 10-digit mobile number and receive an instant SMS verification code with auto-fill.
  - Once verified, the full cat universe unlocks for menu browsing, order tray building, and real-time order tracking.
  - Verified credentials persist in `localStorage` so returning visitors seamlessly bypass the gate.
- **Hidden Admin Access**:
  - All admin controls and buttons are completely hidden from customer navigation and mobile menus.
- **Live Menu with Discounts**:
  - Real-time display of discounts applied by Admin with strike-through original prices and live offer badges (e.g. `20% OFF`).
- **Order Generation & Live Kitchen Tracker**:
  - Placing an order generates an official Order Number (e.g. `FLW-8392`).
  - Customers can track live kitchen progress (*Order Received* ➔ *In Kitchen* ➔ *Ready / Out* ➔ *Completed*).

### 2. ⚡ Secure Store Admin Portal (`/#admin` or `/admin`)
- Accessible strictly via direct URL (`/#admin` or `/admin`) with passcode protection (Default PIN: `1234`).
- **Day-Wise & Monthly-Wise Revenue Analytics**:
  - **Day-Wise Amount Received**: Full calendar breakdown of daily revenue, order counts, average ticket size, and percentage share.
  - **Monthly-Wise Amount Received**: Month-to-date and historical monthly earnings, order volume, and peak sales periods.
  - **Export Financial Report**: 1-click CSV report generation for accounting.
- **Live Kitchen Orders Board**:
  - Real-time stream of incoming customer orders showing customer name, verified phone number, delivery address, items breakdown, and status selector (`Placed` ➔ `Preparing` ➔ `Ready` ➔ `Completed` ➔ `Cancelled`).
- **Menu Inventory Manager**:
  - Form to add new desserts/thickshakes with name, price, category, tagline, description, dietary tags, and image URL.
  - Edit existing items, update prices, or toggle in-stock / sold-out status.
- **Discount & Offer Campaign Manager**:
  - Select items individually or in bulk and apply custom percentage discounts (10%, 15%, 20%, 25%, 30%).

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
- **Customer Storefront**: `http://localhost:5173/` (Mobile OTP verification gate on first visit)
- **Store Admin Portal**: `http://localhost:5173/#admin` (PIN: `1234`)

### 3. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in the `dist/` directory.

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
│   │   │   ├── AdminDashboard.tsx      # Admin Portal (Orders, Day/Month Financials, Menu, Discounts)
│   │   │   ├── AddItemModal.tsx        # Add/edit menu item modal
│   │   │   └── DiscountManagerModal.tsx # Manage item discounts modal
│   │   ├── icons/
│   │   │   └── InstagramIcon.tsx       # Reusable SVG Instagram icon
│   │   ├── WelcomeAuthGate.tsx         # Full-screen first-visit Mobile OTP gate
│   │   ├── Navbar.tsx                  # Clean customer header (admin button hidden)
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
│   │   └── StoreContext.tsx            # Synchronized state for menu, orders, financials & auth
│   ├── data/
│   │   └── flewData.ts                 # Verified central store information
│   ├── types/
│   │   └── index.ts                    # TypeScript types
│   ├── utils/
│   │   └── storeStatus.ts              # Real-time IST open/closed calculator (1 PM - 1 AM)
│   ├── App.tsx                         # Multi-interface route coordinator & gatekeeper
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
