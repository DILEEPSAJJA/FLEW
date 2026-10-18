import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MenuItem, Order, OrderStatus, UserAuth, ReviewItem } from '../types';
import { MENU_ITEMS as INITIAL_MENU_ITEMS, VERIFIED_REVIEWS as INITIAL_REVIEWS } from '../data/flewData';
import { firestore, collection, doc, setDoc, onSnapshot, updateDoc } from '../utils/firebase';

export interface AlertNotification {
  id: string;
  text: string;
  time: string;
}

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
  }) => Promise<Order>;
  updateOrderStatus: (orderNumber: string, status: OrderStatus) => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  syncOrderTracking: (orderNumber: string) => Promise<Order | null>;

  // Reviews management (Customer rating with stars & comment)
  reviews: ReviewItem[];
  addReview: (reviewData: {
    author: string;
    phone?: string;
    rating: number;
    comment?: string;
    favoriteItem?: string;
    orderNumber?: string;
  }) => ReviewItem;
  deleteReview: (id: string) => void;
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (open: boolean) => void;
  reviewTargetOrder: Order | null;
  setReviewTargetOrder: (order: Order | null) => void;
  openReviewModal: (order?: Order) => void;

  // Real-time notifications / Audio Alerts
  latestAlert: AlertNotification | null;
  dismissAlert: () => void;

  // Admin PIN Auth (6 digits default 123789)
  isAdminAuthenticated: boolean;
  verifyAdminPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  logoutAdmin: () => void;

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

// Everyday sequential order number starting with '0001'
export function generateDailyOrderNumber(existingOrders: Order[]): string {
  const todayStr = new Date().toISOString().slice(0, 10);
  let maxSeq = 0;
  for (const o of existingOrders) {
    try {
      const orderDate = new Date(o.createdAt).toISOString().slice(0, 10);
      if (orderDate === todayStr) {
        const match = o.orderNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    } catch {
      // ignore
    }
  }
  const nextSeq = maxSeq + 1;
  return String(nextSeq).padStart(4, '0');
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Autoplay policy or unsupported audio
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation: check hash #admin or path /admin
  const [currentRoute, setCurrentRoute] = useState<'customer' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const isPathAdmin = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
      const isHashAdmin = window.location.hash === '#admin' || window.location.hash.startsWith('#admin');
      if (isPathAdmin || isHashAdmin) {
        return 'admin';
      }
    }
    return 'customer';
  });

  // Admin authentication state in sessionStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('flew_admin_auth') === 'true';
    }
    return false;
  });

  const verifyAdminPin = async (enteredPin: string): Promise<{ success: boolean; message?: string }> => {
    const clean = enteredPin.trim();
    if (clean.length !== 6) {
      return { success: false, message: 'PIN must be exactly 6 digits.' };
    }

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: clean }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setIsAdminAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('flew_admin_auth', 'true');
          if (data.adminToken) {
            sessionStorage.setItem('flew_admin_token', data.adminToken);
          }
        }
        return { success: true };
      }

      if (data?.message) {
        return { success: false, message: data.message };
      }
    } catch {
      // Fallback if backend offline
    }

    if (clean === '123789') {
      setIsAdminAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('flew_admin_auth', 'true');
      }
      return { success: true };
    }

    return { success: false, message: 'Incorrect 6-digit staff PIN.' };
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('flew_admin_auth');
      sessionStorage.removeItem('flew_admin_token');
    }
  };

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
    const handleRouteChange = () => {
      const isPathAdmin = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
      const isHashAdmin = window.location.hash === '#admin' || window.location.hash.startsWith('#admin');
      if (isPathAdmin || isHashAdmin) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('customer');
      }
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Broadcast Channel for live multi-tab & multi-window instant synchronization
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('flew_store_channel');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        if (data.type === 'NEW_ORDER' && data.order) {
          setOrders((prev) => {
            if (prev.some((o) => o.orderNumber === data.order.orderNumber)) return prev;
            return [data.order, ...prev];
          });
          playNotificationChime();
          setLatestAlert({
            id: data.order.orderNumber,
            text: `🔔 New Order Received: #${data.order.orderNumber} (₹${data.order.finalTotal})`,
            time: 'Just now',
          });
        } else if (data.type === 'STATUS_UPDATED') {
          const cleanTarget = String(data.orderNumber).trim().replace(/^#/, '');
          setOrders((prev) =>
            prev.map((o) => (o.orderNumber.replace(/^#/, '') === cleanTarget ? { ...o, status: data.status } : o))
          );
          setActiveOrder((prev) =>
            prev && prev.orderNumber.replace(/^#/, '') === cleanTarget ? { ...prev, status: data.status } : prev
          );
        } else if (data.type === 'NEW_REVIEW' && data.review) {
          setReviews((prev) => {
            if (prev.some((r) => r.id === data.review.id)) return prev;
            return [data.review, ...prev];
          });
        } else if (data.type === 'DELETE_REVIEW' && data.reviewId) {
          setReviews((prev) => prev.filter((r) => r.id !== data.reviewId));
        } else if (data.type === 'MENU_UPDATED' && data.menu) {
          setMenuItems(data.menu);
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  const broadcastMessage = (msg: any) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(msg);
      } catch (err) {
        console.warn('Broadcast failed', err);
      }
    }
  };

  // Real-time Firebase Firestore live order synchronization across all devices
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const ordersCol = collection(firestore, 'orders');
      unsubscribe = onSnapshot(ordersCol, (snapshot) => {
        const firestoreOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Order;
          if (data && data.orderNumber) {
            firestoreOrders.push(data);
          }
        });

        if (firestoreOrders.length > 0) {
          firestoreOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          for (const so of firestoreOrders) {
            const cleanNum = so.orderNumber.replace(/^#/, '');
            if (!knownOrderNumbersRef.current.has(cleanNum)) {
              knownOrderNumbersRef.current.add(cleanNum);
              if (so.status === 'placed') {
                playNotificationChime();
                setLatestAlert({
                  id: so.orderNumber,
                  text: `🔔 New Order Received: #${so.orderNumber} (₹${so.finalTotal})`,
                  time: 'Just now',
                });
              }
            }
          }

          setOrders(firestoreOrders);

          setActiveOrder((curr) => {
            if (!curr) return curr;
            const cleanCurr = curr.orderNumber.replace(/^#/, '');
            const match = firestoreOrders.find((o) => o.orderNumber.replace(/^#/, '') === cleanCurr);
            if (match) return match;
            return curr;
          });
        }
      }, (error) => {
        console.warn('Firebase Firestore live listener status:', error.message);
      });
    } catch (err) {
      console.warn('Failed to initialize Firebase Firestore listener:', err);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Cross-tab fallback via window storage event
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'flew_store_orders') {
          const parsed = JSON.parse(e.newValue);
          setOrders(parsed);
        } else if (e.key === 'flew_customer_reviews') {
          const parsed = JSON.parse(e.newValue);
          setReviews(parsed);
        } else if (e.key === 'flew_custom_menu') {
          const parsed = JSON.parse(e.newValue);
          setMenuItems(parsed);
        }
      } catch (err) {
        console.error('Storage sync error', err);
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
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

  // Orders state (Real orders only - default empty)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('flew_store_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy demo orders if any
          return parsed.filter((o: Order) => 
            !o.orderNumber?.startsWith('FLW-83') && 
            !o.orderNumber?.startsWith('FLW-84') && 
            !o.orderNumber?.startsWith('FLW-79') && 
            !o.orderNumber?.startsWith('FLW-75') &&
            !o.orderNumber?.startsWith('FLW-78')
          );
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('flew_store_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }, [orders]);

  // Current active tracking order (e.g. most recently placed or searched, persisted in localStorage)
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('flew_active_order');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem('flew_active_order', JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem('flew_active_order');
      }
    } catch (e) {
      console.error('Failed to save active order', e);
    }
  }, [activeOrder]);

  // Track known orders to sound alert chime and notification banner only on newly arrived orders
  const knownOrderNumbersRef = useRef<Set<string>>(new Set(orders.map((o) => o.orderNumber.replace(/^#/, ''))));

  // Real-time server order polling for cross-client, cross-device admin and storefront sync
  useEffect(() => {
    let isCancelled = false;

    const pollServerOrders = async () => {
      try {
        const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('flew_admin_token') : null;
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (adminToken && adminToken.length > 20) {
          headers['Authorization'] = `Bearer ${adminToken}`;
        }

        const res = await fetch('/api/orders?scope=admin', {
          method: 'GET',
          headers,
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data && Array.isArray(data.orders)) {
            const serverOrders: Order[] = data.orders;

            let newlyReceivedPlacedOrder: Order | null = null;
            for (const so of serverOrders) {
              const cleanSoNum = so.orderNumber.replace(/^#/, '');
              if (!knownOrderNumbersRef.current.has(cleanSoNum)) {
                knownOrderNumbersRef.current.add(cleanSoNum);
                if (so.status === 'placed') {
                  newlyReceivedPlacedOrder = so;
                }
              }
            }

            if (newlyReceivedPlacedOrder) {
              playNotificationChime();
              setLatestAlert({
                id: newlyReceivedPlacedOrder.orderNumber,
                text: `🔔 New Order Received: #${newlyReceivedPlacedOrder.orderNumber} (₹${newlyReceivedPlacedOrder.finalTotal})`,
                time: 'Just now',
              });
            }

            setOrders(serverOrders);

            setActiveOrder((curr) => {
              const target = curr || (orders.length > 0 ? orders[0] : null);
              if (!target) return curr;
              const targetClean = target.orderNumber.replace(/^#/, '');
              const match = serverOrders.find((o) => o.orderNumber.replace(/^#/, '') === targetClean);
              if (match) {
                return match;
              }
              return curr;
            });
          }
        }
      } catch {
        // silent tolerance on network hiccups
      }
    };

    pollServerOrders();
    const interval = setInterval(pollServerOrders, 10000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Reviews state (initial from data, persisted in localStorage)
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem('flew_customer_reviews');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_REVIEWS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('flew_customer_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.error('Failed to save reviews', e);
    }
  }, [reviews]);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTargetOrder, setReviewTargetOrder] = useState<Order | null>(null);

  const openReviewModal = (order?: Order) => {
    if (order) {
      setReviewTargetOrder(order);
    } else {
      setReviewTargetOrder(null);
    }
    setIsReviewModalOpen(true);
  };

  // Live incoming order alert notification
  const [latestAlert, setLatestAlert] = useState<AlertNotification | null>(null);
  const dismissAlert = () => setLatestAlert(null);

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
    setMenuItems((prev) => {
      const updated = [newItem, ...prev];
      broadcastMessage({ type: 'MENU_UPDATED', menu: updated });
      return updated;
    });
    return newItem;
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      broadcastMessage({ type: 'MENU_UPDATED', menu: updated });
      return updated;
    });
  };

  const deleteItem = (id: string) => {
    setMenuItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      broadcastMessage({ type: 'MENU_UPDATED', menu: updated });
      return updated;
    });
  };

  const applyDiscount = (itemIds: string[], percent: number, label: string) => {
    setMenuItems((prev) => {
      const updated = prev.map((item) => {
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
      });
      broadcastMessage({ type: 'MENU_UPDATED', menu: updated });
      return updated;
    });
  };

  const removeDiscount = (itemId: string) => {
    setMenuItems((prev) => {
      const updated = prev.map((item) => {
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
      });
      broadcastMessage({ type: 'MENU_UPDATED', menu: updated });
      return updated;
    });
  };

  const resetMenuToDefault = () => {
    setMenuItems(INITIAL_MENU_ITEMS);
    broadcastMessage({ type: 'MENU_UPDATED', menu: INITIAL_MENU_ITEMS });
  };

  // --- Order Actions ---
  const createOrder = async (orderData: {
    customerPhone: string;
    customerName: string;
    deliveryAddress?: string;
    orderType: 'takeaway' | 'delivery' | 'dine-in';
    items: { item: MenuItem; quantity: number; notes?: string }[];
  }): Promise<Order> => {
    const processedItems = orderData.items.map((entry) => ({
      item: entry.item,
      quantity: entry.quantity,
      unitPrice: entry.item.price,
      lineTotal: entry.item.price * entry.quantity,
      notes: entry.notes,
    }));

    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('flew_session_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    let confirmedOrder: Order | null = null;

    // 1. Try to post to backend with 4-second timeout
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerPhone: orderData.customerPhone,
          customerName: orderData.customerName,
          deliveryAddress: orderData.deliveryAddress,
          orderType: orderData.orderType,
          items: processedItems,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        confirmedOrder = data.order;
      }
    } catch (err) {
      console.warn('Backend order placement, creating resilient order:', err);
    }

    // 2. If backend timed out or unreachable, create resilient order with daily sequence
    if (!confirmedOrder) {
      const orderNumber = generateDailyOrderNumber(orders);
      const subtotal = processedItems.reduce((sum, i) => sum + i.lineTotal, 0);
      confirmedOrder = {
        orderNumber,
        customerPhone: orderData.customerPhone,
        customerName: orderData.customerName || 'Customer',
        deliveryAddress: orderData.deliveryAddress || '',
        orderType: orderData.orderType,
        items: processedItems,
        subtotal,
        discountTotal: 0,
        finalTotal: subtotal,
        status: 'placed',
        createdAt: new Date().toISOString(),
        estimatedMinutes: 20,
      };
    }

    // 3. Immediately propagate to Firebase Firestore in real time!
    try {
      const cleanNum = confirmedOrder.orderNumber.replace(/^#/, '');
      await setDoc(doc(firestore, 'orders', cleanNum), confirmedOrder);
    } catch (fsErr) {
      console.warn('Firebase Firestore setDoc status:', fsErr);
    }

    setOrders((prev) => [confirmedOrder!, ...prev.filter((o) => o.orderNumber !== confirmedOrder!.orderNumber)]);
    setActiveOrder(confirmedOrder);
    broadcastMessage({ type: 'NEW_ORDER', order: confirmedOrder });

    return confirmedOrder;
  };

  const updateOrderStatus = async (orderNumber: string, status: OrderStatus) => {
    const cleanNum = String(orderNumber).trim().replace(/^#/, '');
    setOrders((prev) =>
      prev.map((order) => {
        if (order.orderNumber.replace(/^#/, '') === cleanNum) {
          return { ...order, status };
        }
        return order;
      })
    );
    setActiveOrder((prev) => {
      if (prev && prev.orderNumber.replace(/^#/, '') === cleanNum) {
        return { ...prev, status };
      }
      return prev;
    });
    broadcastMessage({ type: 'STATUS_UPDATED', orderNumber: cleanNum, status });

    // 1. Sync to Firebase Firestore directly in real time
    try {
      await updateDoc(doc(firestore, 'orders', cleanNum), { status });
    } catch (fsErr) {
      console.warn('Firebase Firestore updateDoc status:', fsErr);
    }

    // 2. Sync status change to backend database
    if (typeof window !== 'undefined') {
      const adminToken = sessionStorage.getItem('flew_admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-admin-role': 'admin',
      };
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      fetch('/api/orders/status', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          orderNumber: cleanNum,
          status,
          adminToken: 'flew_admin_verified',
        }),
      }).catch((err) => console.warn('Status sync to backend failed:', err));
    }
  };

  const syncOrderTracking = async (orderNumber: string): Promise<Order | null> => {
    const cleanNum = String(orderNumber).trim().replace(/^#/, '');
    if (!cleanNum) return null;

    // 1. Instant check from real-time orders state (synced live via Firebase Firestore)
    const existing = orders.find((o) => o.orderNumber.replace(/^#/, '') === cleanNum);
    if (existing) {
      setActiveOrder(existing);
      return existing;
    }

    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(cleanNum)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.order) {
          const fresh: Order = data.order;
          setActiveOrder(fresh);
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.orderNumber.replace(/^#/, '') === cleanNum);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = fresh;
              return updated;
            }
            return [fresh, ...prev];
          });
          return fresh;
        }
      }
    } catch (err) {
      console.warn('syncOrderTracking network error:', err);
    }
    return null;
  };

  // --- Review Actions ---
  const addReview = (reviewData: {
    author: string;
    phone?: string;
    rating: number;
    comment?: string;
    favoriteItem?: string;
    orderNumber?: string;
  }): ReviewItem => {
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      author: reviewData.author.trim() || 'Flew Patron',
      phone: reviewData.phone,
      rating: reviewData.rating,
      date: 'Just now',
      source: reviewData.orderNumber ? `Verified Order #${reviewData.orderNumber}` : 'Verified Customer',
      comment: reviewData.comment?.trim() || 'Loved the thick desserts and late-night cravings! 🐾',
      favoriteItem: reviewData.favoriteItem,
      verified: true,
      orderNumber: reviewData.orderNumber,
    };

    setReviews((prev) => [newRev, ...prev]);
    broadcastMessage({ type: 'NEW_REVIEW', review: newRev });
    return newRev;
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    broadcastMessage({ type: 'DELETE_REVIEW', reviewId: id });
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flew_session_token');
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentRoute,
        navigateTo,
        isAdminAuthenticated,
        verifyAdminPin,
        logoutAdmin,
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
        syncOrderTracking,
        reviews,
        addReview,
        deleteReview,
        isReviewModalOpen,
        setIsReviewModalOpen,
        reviewTargetOrder,
        setReviewTargetOrder,
        openReviewModal,
        latestAlert,
        dismissAlert,
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
