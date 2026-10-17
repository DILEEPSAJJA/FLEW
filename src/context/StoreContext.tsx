import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, Order, OrderStatus, UserAuth } from '../types';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from '../data/flewData';

interface StoreContextType {
  currentRoute: 'customer' | 'admin';
  navigateTo: (route: 'customer' | 'admin') => void;
  
  // Menu items & discount management
  menuItems: MenuItem[];
  addNewItem: (itemData: Omit<MenuItem, 'id'>) => MenuItem;
  updateItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteItem: (id: string) => void;
  applyDiscount: (itemIds: string[], percent: number, label: string) => void;
  removeDiscount: (itemId: string) => void;
  resetMenuToDefault: () => void;

  // Order management
  orders: Order[];
  createOrder: (orderData: {
    customerPhone: string;
    customerName: string;
    deliveryAddress?: string;
    orderType: 'takeaway' | 'delivery' | 'dine-in';
    items: { item: MenuItem; quantity: number; notes?: string }[];
  }) => Order;
  updateOrderStatus: (orderNumber: string, status: OrderStatus) => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;

  // User Auth & Phone Verification
  currentUser: UserAuth | null;
  verifyUserWithPhone: (phoneNumber: string, name: string, address?: string) => UserAuth;
  logoutUser: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isOrderTrackModalOpen: boolean;
  setIsOrderTrackModalOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Initial mock orders so Admin has immediately testable data
const nowMs = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

const SAMPLE_INITIAL_ORDERS: Order[] = [
  // Today's orders (Oct 17)
  {
    orderNumber: 'FLW-8392',
    customerPhone: '+91 98765 43210',
    customerName: 'Aarav Sharma',
    deliveryAddress: 'Flat 402, Aditya Sunshine, Gowlidoddy',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[0], quantity: 2, unitPrice: 199, lineTotal: 398, notes: 'Extra thick' },
      { item: INITIAL_MENU_ITEMS[5], quantity: 1, unitPrice: 189, lineTotal: 189 }
    ],
    subtotal: 587,
    discountTotal: 0,
    finalTotal: 587,
    status: 'preparing',
    createdAt: new Date(nowMs - 25 * 60000).toISOString(),
    estimatedMinutes: 25
  },
  {
    orderNumber: 'FLW-8391',
    customerPhone: '+91 91234 56789',
    customerName: 'Pooja Reddy',
    deliveryAddress: 'Sai Tulasi Enclave, Gowlidoddy',
    orderType: 'takeaway',
    items: [
      { item: INITIAL_MENU_ITEMS[10], quantity: 2, unitPrice: 149, lineTotal: 298 }
    ],
    subtotal: 298,
    discountTotal: 0,
    finalTotal: 298,
    status: 'ready',
    createdAt: new Date(nowMs - 55 * 60000).toISOString(),
    estimatedMinutes: 15
  },
  {
    orderNumber: 'FLW-8390',
    customerPhone: '+91 99887 76655',
    customerName: 'Vikram Joshi',
    deliveryAddress: 'Cybercity Rainbow Vistas, Hitec City',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[1], quantity: 1, unitPrice: 199, lineTotal: 199 },
      { item: INITIAL_MENU_ITEMS[6], quantity: 2, unitPrice: 139, lineTotal: 278 }
    ],
    subtotal: 477,
    discountTotal: 0,
    finalTotal: 477,
    status: 'completed',
    createdAt: new Date(nowMs - 3 * 3600000).toISOString(),
    estimatedMinutes: 30
  },
  {
    orderNumber: 'FLW-8389',
    customerPhone: '+91 98450 12345',
    customerName: 'Sneha Patel',
    deliveryAddress: 'Financial District, Nanakramguda',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[0], quantity: 3, unitPrice: 199, lineTotal: 597 },
      { item: INITIAL_MENU_ITEMS[11], quantity: 1, unitPrice: 169, lineTotal: 169 }
    ],
    subtotal: 766,
    discountTotal: 0,
    finalTotal: 766,
    status: 'completed',
    createdAt: new Date(nowMs - 6 * 3600000).toISOString(),
    estimatedMinutes: 35
  },

  // Yesterday's orders (Oct 16)
  {
    orderNumber: 'FLW-8382',
    customerPhone: '+91 97000 88990',
    customerName: 'Rohan Verma',
    deliveryAddress: 'Waverock Building, Financial District',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[5], quantity: 2, unitPrice: 189, lineTotal: 378 },
      { item: INITIAL_MENU_ITEMS[10], quantity: 2, unitPrice: 149, lineTotal: 298 }
    ],
    subtotal: 676,
    discountTotal: 0,
    finalTotal: 676,
    status: 'completed',
    createdAt: new Date(nowMs - dayMs - 2 * 3600000).toISOString(),
    estimatedMinutes: 20
  },
  {
    orderNumber: 'FLW-8380',
    customerPhone: '+91 94401 22334',
    customerName: 'Ananya Rao',
    deliveryAddress: 'Gowlidoddy Village Road',
    orderType: 'takeaway',
    items: [
      { item: INITIAL_MENU_ITEMS[0], quantity: 2, unitPrice: 199, lineTotal: 398 },
      { item: INITIAL_MENU_ITEMS[7], quantity: 2, unitPrice: 139, lineTotal: 278 }
    ],
    subtotal: 676,
    discountTotal: 0,
    finalTotal: 676,
    status: 'completed',
    createdAt: new Date(nowMs - dayMs - 5 * 3600000).toISOString(),
    estimatedMinutes: 20
  },
  {
    orderNumber: 'FLW-8378',
    customerPhone: '+91 96180 55443',
    customerName: 'Deepak Mehta',
    deliveryAddress: 'DLF Cyber City, Gachibowli',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[1], quantity: 2, unitPrice: 199, lineTotal: 398 },
      { item: INITIAL_MENU_ITEMS[13], quantity: 2, unitPrice: 179, lineTotal: 358 }
    ],
    subtotal: 756,
    discountTotal: 0,
    finalTotal: 756,
    status: 'completed',
    createdAt: new Date(nowMs - dayMs - 8 * 3600000).toISOString(),
    estimatedMinutes: 25
  },

  // 2 days ago (Oct 15)
  {
    orderNumber: 'FLW-8365',
    customerPhone: '+91 98855 44332',
    customerName: 'Karthik Raja',
    deliveryAddress: 'Sai Tulasi Enclave, Gowlidoddy',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[0], quantity: 4, unitPrice: 199, lineTotal: 796 }
    ],
    subtotal: 796,
    discountTotal: 0,
    finalTotal: 796,
    status: 'completed',
    createdAt: new Date(nowMs - 2 * dayMs - 4 * 3600000).toISOString(),
    estimatedMinutes: 25
  },
  {
    orderNumber: 'FLW-8360',
    customerPhone: '+91 90001 99887',
    customerName: 'Megha Reddy',
    deliveryAddress: 'Nanakramguda Circle',
    orderType: 'dine-in',
    items: [
      { item: INITIAL_MENU_ITEMS[5], quantity: 2, unitPrice: 189, lineTotal: 378 },
      { item: INITIAL_MENU_ITEMS[8], quantity: 2, unitPrice: 139, lineTotal: 278 }
    ],
    subtotal: 656,
    discountTotal: 0,
    finalTotal: 656,
    status: 'completed',
    createdAt: new Date(nowMs - 2 * dayMs - 7 * 3600000).toISOString(),
    estimatedMinutes: 15
  },

  // 3 days ago (Oct 14)
  {
    orderNumber: 'FLW-8350',
    customerPhone: '+91 93910 66778',
    customerName: 'Sanjay Kumar',
    deliveryAddress: 'One West, Nanakramguda',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[0], quantity: 2, unitPrice: 199, lineTotal: 398 },
      { item: INITIAL_MENU_ITEMS[10], quantity: 3, unitPrice: 149, lineTotal: 447 }
    ],
    subtotal: 845,
    discountTotal: 0,
    finalTotal: 845,
    status: 'completed',
    createdAt: new Date(nowMs - 3 * dayMs - 3 * 3600000).toISOString(),
    estimatedMinutes: 25
  },

  // Previous month orders (September 2026)
  {
    orderNumber: 'FLW-7980',
    customerPhone: '+91 98765 11223',
    customerName: 'Preeti Deshmukh',
    deliveryAddress: 'Gachibowli Stadium Road',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[0], quantity: 3, unitPrice: 199, lineTotal: 597 },
      { item: INITIAL_MENU_ITEMS[5], quantity: 2, unitPrice: 189, lineTotal: 378 }
    ],
    subtotal: 975,
    discountTotal: 0,
    finalTotal: 975,
    status: 'completed',
    createdAt: new Date(nowMs - 22 * dayMs).toISOString(),
    estimatedMinutes: 30
  },
  {
    orderNumber: 'FLW-7950',
    customerPhone: '+91 91234 99881',
    customerName: 'Arjun Das',
    deliveryAddress: 'My Home Bhooja, Silpa Gram',
    orderType: 'delivery',
    items: [
      { item: INITIAL_MENU_ITEMS[1], quantity: 2, unitPrice: 199, lineTotal: 398 },
      { item: INITIAL_MENU_ITEMS[10], quantity: 4, unitPrice: 149, lineTotal: 596 }
    ],
    subtotal: 994,
    discountTotal: 0,
    finalTotal: 994,
    status: 'completed',
    createdAt: new Date(nowMs - 28 * dayMs).toISOString(),
    estimatedMinutes: 35
  },

  // 2 months ago (August 2026)
  {
    orderNumber: 'FLW-7500',
    customerPhone: '+91 98450 77665',
    customerName: 'Suresh Babu',
    deliveryAddress: 'Gowlidoddy Main Road',
    orderType: 'takeaway',
    items: [
      { item: INITIAL_MENU_ITEMS[0], quantity: 2, unitPrice: 199, lineTotal: 398 },
      { item: INITIAL_MENU_ITEMS[5], quantity: 2, unitPrice: 189, lineTotal: 378 }
    ],
    subtotal: 776,
    discountTotal: 0,
    finalTotal: 776,
    status: 'completed',
    createdAt: new Date(nowMs - 55 * dayMs).toISOString(),
    estimatedMinutes: 20
  }
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation: check hash #admin or path /admin
  const [currentRoute, setCurrentRoute] = useState<'customer' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
        return 'admin';
      }
    }
    return 'customer';
  });

  const navigateTo = (route: 'customer' | 'admin') => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      if (route === 'admin') {
        window.location.hash = 'admin';
      } else {
        window.location.hash = '';
        if (window.location.pathname.startsWith('/admin')) {
          window.history.pushState({}, '', '/');
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.pathname.startsWith('/admin')) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('customer');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Menu items state with local storage persistence
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('flew_custom_menu');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_MENU_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('flew_custom_menu', JSON.stringify(menuItems));
    } catch (e) {
      console.error('Failed to save menu items', e);
    }
  }, [menuItems]);

  // Orders state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('flew_store_orders');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return SAMPLE_INITIAL_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('flew_store_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }, [orders]);

  // Current active tracking order (e.g. most recently placed or searched)
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    return orders[0] || null;
  });

  // User auth state
  const [currentUser, setCurrentUser] = useState<UserAuth | null>(() => {
    try {
      const saved = localStorage.getItem('flew_customer_auth');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('flew_customer_auth', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('flew_customer_auth');
      }
    } catch (e) {
      console.error('Failed to save user auth', e);
    }
  }, [currentUser]);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderTrackModalOpen, setIsOrderTrackModalOpen] = useState(false);

  // --- Menu Management Actions ---
  const addNewItem = (itemData: Omit<MenuItem, 'id'>): MenuItem => {
    const newItem: MenuItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isAvailable: true,
    };
    setMenuItems((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const applyDiscount = (itemIds: string[], percent: number, label: string) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (itemIds.includes(item.id)) {
          const original = item.originalPrice || item.price;
          const discountedPrice = Math.max(1, Math.round(original * (1 - percent / 100)));
          return {
            ...item,
            originalPrice: original,
            price: discountedPrice,
            discountPercent: percent,
            discountLabel: label || `${percent}% OFF`,
          };
        }
        return item;
      })
    );
  };

  const removeDiscount = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.originalPrice) {
          return {
            ...item,
            price: item.originalPrice,
            originalPrice: undefined,
            discountPercent: undefined,
            discountLabel: undefined,
          };
        }
        return item;
      })
    );
  };

  const resetMenuToDefault = () => {
    setMenuItems(INITIAL_MENU_ITEMS);
  };

  // --- Order Actions ---
  const createOrder = (orderData: {
    customerPhone: string;
    customerName: string;
    deliveryAddress?: string;
    orderType: 'takeaway' | 'delivery' | 'dine-in';
    items: { item: MenuItem; quantity: number; notes?: string }[];
  }): Order => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `FLW-${randomSuffix}`;

    const processedItems = orderData.items.map((entry) => ({
      item: entry.item,
      quantity: entry.quantity,
      unitPrice: entry.item.price,
      lineTotal: entry.item.price * entry.quantity,
      notes: entry.notes,
    }));

    const subtotal = processedItems.reduce((sum, i) => sum + i.lineTotal, 0);

    const newOrder: Order = {
      orderNumber,
      customerPhone: orderData.customerPhone,
      customerName: orderData.customerName || 'Valued Patron',
      deliveryAddress: orderData.deliveryAddress,
      orderType: orderData.orderType,
      items: processedItems,
      subtotal,
      discountTotal: 0,
      finalTotal: subtotal,
      status: 'placed',
      createdAt: new Date().toISOString(),
      estimatedMinutes: 20,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    return newOrder;
  };

  const updateOrderStatus = (orderNumber: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.orderNumber === orderNumber) {
          const updated = { ...order, status };
          if (activeOrder?.orderNumber === orderNumber) {
            setActiveOrder(updated);
          }
          return updated;
        }
        return order;
      })
    );
  };

  // --- Auth Actions ---
  const verifyUserWithPhone = (phoneNumber: string, name: string, address?: string): UserAuth => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const formatted = cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : phoneNumber;
    
    const user: UserAuth = {
      phoneNumber: cleanPhone,
      formattedPhone: formatted,
      name: name.trim() || 'Flew Patron',
      address: address?.trim(),
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };

    setCurrentUser(user);
    return user;
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  return (
    <StoreContext.Provider
      value={{
        currentRoute,
        navigateTo,
        menuItems,
        addNewItem,
        updateItem,
        deleteItem,
        applyDiscount,
        removeDiscount,
        resetMenuToDefault,
        orders,
        createOrder,
        updateOrderStatus,
        activeOrder,
        setActiveOrder,
        currentUser,
        verifyUserWithPhone,
        logoutUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOrderTrackModalOpen,
        setIsOrderTrackModalOpen,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
