import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Percent, 
  Search, 
  ChefHat, 
  Clock, 
  Eye, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Phone, 
  Tag, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Download,
  IndianRupee,
  BarChart3,
  Star
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MenuItem, OrderStatus } from '../../types';
import { AddItemModal } from './AddItemModal';
import { DiscountManagerModal } from './DiscountManagerModal';
import { STORE_INFO } from '../../data/flewData';

export const AdminDashboard: React.FC = () => {
  const { 
    navigateTo, 
    menuItems, 
    orders, 
    updateOrderStatus, 
    deleteItem, 
    updateItem,
    removeDiscount,
    resetMenuToDefault,
    reviews,
    deleteReview,
    latestAlert,
    dismissAlert
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'financials' | 'reviews' | 'menu' | 'discounts' | 'settings'>('orders');
  const [financialView, setFinancialView] = useState<'daywise' | 'monthwise'>('daywise');
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // -------------------------------------------------------------
  // FINANCIAL ANALYTICS (Day-wise & Monthly-wise)
  // -------------------------------------------------------------
  const validOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'cancelled');
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + o.finalTotal, 0);
  }, [validOrders]);

  const activeOrdersCount = orders.filter((o) => ['placed', 'preparing', 'ready'].includes(o.status)).length;
  const discountedItemsCount = menuItems.filter((i) => i.discountPercent && i.discountPercent > 0).length;

  const todayDateString = new Date().toISOString().split('T')[0];
  const currentMonthString = new Date().toISOString().slice(0, 7);

  // Today's total
  const todayRevenue = useMemo(() => {
    return validOrders
      .filter((o) => o.createdAt.startsWith(todayDateString))
      .reduce((sum, o) => sum + o.finalTotal, 0);
  }, [validOrders, todayDateString]);

  // Current month's total
  const thisMonthRevenue = useMemo(() => {
    return validOrders
      .filter((o) => o.createdAt.startsWith(currentMonthString))
      .reduce((sum, o) => sum + o.finalTotal, 0);
  }, [validOrders, currentMonthString]);

  // Day-wise grouping
  const dayWiseData = useMemo(() => {
    const groups: { [key: string]: { dateStr: string; ordersCount: number; revenue: number; orders: typeof orders } } = {};

    validOrders.forEach((o) => {
      const d = o.createdAt.split('T')[0];
      if (!groups[d]) {
        groups[d] = { dateStr: d, ordersCount: 0, revenue: 0, orders: [] };
      }
      groups[d].ordersCount += 1;
      groups[d].revenue += o.finalTotal;
      groups[d].orders.push(o);
    });

    return Object.values(groups)
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr))
      .map((entry) => {
        const dObj = new Date(entry.dateStr);
        const formatted = dObj.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const isToday = entry.dateStr === todayDateString;
        const avg = Math.round(entry.revenue / entry.ordersCount);

        return {
          ...entry,
          formattedDate: formatted,
          isToday,
          avgTicket: avg,
        };
      });
  }, [validOrders, todayDateString]);

  // Month-wise grouping
  const monthWiseData = useMemo(() => {
    const groups: { [key: string]: { monthStr: string; ordersCount: number; revenue: number } } = {};

    validOrders.forEach((o) => {
      const m = o.createdAt.slice(0, 7); // YYYY-MM
      if (!groups[m]) {
        groups[m] = { monthStr: m, ordersCount: 0, revenue: 0 };
      }
      groups[m].ordersCount += 1;
      groups[m].revenue += o.finalTotal;
    });

    return Object.values(groups)
      .sort((a, b) => b.monthStr.localeCompare(a.monthStr))
      .map((entry) => {
        const [year, month] = entry.monthStr.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const formattedMonth = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        const avg = Math.round(entry.revenue / entry.ordersCount);
        const isCurrentMonth = entry.monthStr === currentMonthString;

        return {
          ...entry,
          formattedMonth,
          isCurrentMonth,
          avgTicket: avg,
        };
      });
  }, [validOrders, currentMonthString]);

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Type,Period,Orders Count,Total Amount (INR),Avg Ticket (INR)\n';
    
    // Add Day-wise
    csv += '--- DAY-WISE REVENUE BREAKDOWN ---\n';
    dayWiseData.forEach((d) => {
      csv += `Day,"${d.formattedDate}",${d.ordersCount},${d.revenue},${d.avgTicket}\n`;
    });

    // Add Month-wise
    csv += '--- MONTH-WISE REVENUE BREAKDOWN ---\n';
    monthWiseData.forEach((m) => {
      csv += `Month,"${m.formattedMonth}",${m.ordersCount},${m.revenue},${m.avgTicket}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FLEW_Revenue_Report_${todayDateString}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'active' && !['placed', 'preparing', 'ready'].includes(o.status)) {
      return false;
    }
    if (orderFilter === 'completed' && o.status !== 'completed') {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((i) => {
    if (!menuSearchQuery.trim()) return true;
    const q = menuSearchQuery.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
  });

  const handleEditItem = (item: MenuItem) => {
    setItemToEdit(item);
    setIsAddModalOpen(true);
  };

  const handleAddNew = () => {
    setItemToEdit(null);
    setIsAddModalOpen(true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-950/80 text-blue-400 border-blue-500/40';
      case 'preparing':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
      case 'ready':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
      case 'completed':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'cancelled':
        return 'bg-red-950/80 text-red-400 border-red-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans selection:bg-[#ff2626]">
      
      {/* Top Admin Header Bar */}
      <header className="bg-[#0e0e12] border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo & Admin Mode Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#ff2626] overflow-hidden">
              <img
                src="/assets/flew-logo.png"
                alt="FLEW Admin"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight font-display text-white">
                  FLEW<span className="text-[#ff2626]">.</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#ff2626] text-[10px] font-black uppercase tracking-wider text-white">
                  Admin Portal
                </span>
              </div>
              <span className="text-[11px] text-white/50 block">Gowlidoddy Hub Operations</span>
            </div>
          </div>

          {/* Quick Metrics Bar in Header */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-semibold">Today's Revenue</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">₹{todayRevenue}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-semibold">This Month</span>
              <span className="text-amber-400 font-mono font-bold text-sm">₹{thisMonthRevenue}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-semibold">Active Orders</span>
              <span className="text-[#ff4444] font-mono font-bold text-sm">{activeOrdersCount} live</span>
            </div>
          </div>

          {/* Return to Customer Storefront button */}
          <button
            onClick={() => navigateTo('customer')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all shadow-md active:scale-95"
            title="Open customer view"
          >
            <Eye className="w-4 h-4 text-[#ff4444]" />
            <span className="hidden sm:inline">View Customer Storefront</span>
            <span className="sm:hidden">Store</span>
          </button>

        </div>

        {/* Tab Navigation Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar border-t border-white/5">
          {[
            { id: 'orders', label: 'Live Orders', icon: ShoppingBag, count: activeOrdersCount },
            { id: 'financials', label: 'Revenue & Financials', icon: IndianRupee },
            { id: 'reviews', label: 'Customer Reviews', icon: Star, count: reviews.length },
            { id: 'menu', label: 'Menu Inventory', icon: ChefHat, count: menuItems.length },
            { id: 'discounts', label: 'Discounts & Offers', icon: Percent, count: discountedItemsCount },
            { id: 'settings', label: 'Store Operations', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'border-[#ff2626] text-white bg-white/[0.02]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isCurrent ? 'bg-[#ff2626] text-white' : 'bg-white/10 text-white/60'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Admin Tab Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Real-time Order Arrival Banner */}
        {latestAlert && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#ff2626]/20 via-amber-500/20 to-[#ff2626]/20 border border-[#ff2626]/40 flex items-center justify-between gap-4 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ff2626] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-[#ff2626]/50">
                🔔
              </div>
              <div>
                <div className="text-sm font-extrabold text-white">
                  {latestAlert.text}
                </div>
                <div className="text-xs text-white/60">
                  Real-time multi-tab order sync active. Order #{latestAlert.id} received!
                </div>
              </div>
            </div>
            <button
              onClick={dismissAlert}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: LIVE ORDERS */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Orders Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">
                  Live Kitchen Orders
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Update statuses to push real-time updates to customer order trackers.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by Order # or Phone..."
                    className="w-full bg-[#121216] border border-white/10 focus:border-[#ff2626] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none uppercase"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex rounded-xl bg-[#121216] p-1 border border-white/10 text-xs">
                  <button
                    onClick={() => setOrderFilter('active')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      orderFilter === 'active' ? 'bg-[#ff2626] text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      orderFilter === 'all' ? 'bg-[#ff2626] text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    All ({orders.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map((order) => (
                  <div
                    key={order.orderNumber}
                    className="rounded-3xl bg-[#121216] border border-white/10 p-5 flex flex-col justify-between shadow-xl space-y-4 hover:border-white/20 transition-all"
                  >
                    <div>
                      {/* Top Order Row */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                        <div>
                          <span className="font-mono text-lg font-black text-[#ff4444]">
                            #{order.orderNumber}
                          </span>
                          <div className="text-xs font-bold text-white mt-0.5">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{order.customerPhone} (Verified OTP)</span>
                          </div>
                        </div>

                        {/* Status selector */}
                        <div className="text-right">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.orderNumber, e.target.value as OrderStatus)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-xl border focus:outline-none cursor-pointer ${getStatusBadge(order.status)}`}
                          >
                            <option value="placed">● Placed</option>
                            <option value="preparing">● Preparing</option>
                            <option value="ready">● Ready / Out</option>
                            <option value="completed">● Completed</option>
                            <option value="cancelled">● Cancelled</option>
                          </select>
                          <span className="text-[10px] text-white/40 block mt-1">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="pt-3 space-y-1.5 text-xs">
                        {order.items.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between text-white/80">
                            <div>
                              <span className="font-mono text-[#ff4444] font-bold mr-1.5">
                                {entry.quantity}x
                              </span>
                              <span>{entry.item.name}</span>
                              {entry.notes && (
                                <span className="block text-[10px] text-amber-400 italic">
                                  Note: {entry.notes}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-white font-semibold">
                              ₹{entry.lineTotal}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.deliveryAddress && (
                        <div className="mt-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/60">
                          📍 {order.deliveryAddress}
                        </div>
                      )}
                    </div>

                    {/* Bottom Total Row */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-white/50 uppercase font-semibold">Total Amount</span>
                      <span className="text-base font-extrabold text-white font-mono">
                        ₹{order.finalTotal}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center rounded-3xl bg-[#121216] border border-white/10 p-8">
                <div className="text-3xl mb-2">🐾</div>
                <h4 className="text-base font-bold text-white">No orders matching criteria</h4>
                <p className="text-xs text-white/50 mt-1">
                  Place an order from the customer storefront to see it appear here in real-time!
                </p>
              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: REVENUE & FINANCIALS (DAY-WISE & MONTH-WISE) */}
        {/* ============================================================ */}
        {activeTab === 'financials' && (
          <div className="space-y-8">
            
            {/* Header with Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Verified Sales & Earnings</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  Financial Revenue Tracker
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Track day-wise and monthly revenue received from thickshake and dessert orders.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Switcher: Day-Wise vs Monthly-Wise */}
                <div className="flex rounded-2xl bg-[#121216] p-1 border border-white/10 text-xs">
                  <button
                    onClick={() => setFinancialView('daywise')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      financialView === 'daywise'
                        ? 'bg-[#ff2626] text-white shadow-md shadow-[#ff2626]/30'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Day-Wise</span>
                  </button>

                  <button
                    onClick={() => setFinancialView('monthwise')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      financialView === 'monthwise'
                        ? 'bg-[#ff2626] text-white shadow-md shadow-[#ff2626]/30'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Monthly-Wise</span>
                  </button>
                </div>

                {/* Export CSV */}
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 flex items-center gap-1.5 transition-colors"
                  title="Export Day & Month revenue to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>

            {/* Financial KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Today's Revenue */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1c1212] via-[#141418] to-[#121216] border border-[#ff2626]/40 shadow-xl">
                <span className="text-[11px] font-bold text-[#ff4444] uppercase tracking-wider block">
                  Today's Earnings (Day-Wise)
                </span>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  ₹{todayRevenue}
                </div>
                <div className="text-xs text-white/50 mt-1 flex items-center gap-1">
                  <span className="text-emerald-400 font-semibold">● Active Day</span>
                  <span>• {dayWiseData.find(d => d.isToday)?.ordersCount || 0} orders</span>
                </div>
              </div>

              {/* This Month's Revenue */}
              <div className="p-5 rounded-3xl bg-[#121216] border border-white/10 shadow-xl">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  This Month (October 2026)
                </span>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  ₹{thisMonthRevenue}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Month-to-date collected
                </div>
              </div>

              {/* All-Time Gross Revenue */}
              <div className="p-5 rounded-3xl bg-[#121216] border border-white/10 shadow-xl">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  All-Time Revenue
                </span>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  ₹{totalRevenue}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Across {validOrders.length} total orders
                </div>
              </div>

              {/* Average Order Value (AOV) */}
              <div className="p-5 rounded-3xl bg-[#121216] border border-white/10 shadow-xl">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                  Avg Order Value (AOV)
                </span>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  ₹{validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Average spend per customer
                </div>
              </div>

            </div>

            {/* VIEW A: DAY-WISE TRACKING */}
            {financialView === 'daywise' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#ff2626]" />
                    <span>Day-Wise Amount Received</span>
                  </h3>
                  <span className="text-xs text-white/50">
                    Showing past {dayWiseData.length} operating days
                  </span>
                </div>

                <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs text-white/70">
                    <thead className="bg-white/5 text-white/50 uppercase text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3.5 px-5">Date</th>
                        <th className="py-3.5 px-4">Orders Count</th>
                        <th className="py-3.5 px-4">Amount Received</th>
                        <th className="py-3.5 px-4">Avg Ticket</th>
                        <th className="py-3.5 px-5">Daily Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dayWiseData.map((day) => {
                        const percentOfTotal = totalRevenue > 0 ? Math.round((day.revenue / totalRevenue) * 100) : 0;

                        return (
                          <tr key={day.dateStr} className={`hover:bg-white/[0.02] transition-colors ${day.isToday ? 'bg-[#ff2626]/5' : ''}`}>
                            
                            {/* Date */}
                            <td className="py-3.5 px-5 font-medium">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {day.formattedDate}
                                </span>
                                {day.isToday && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#ff2626] text-[10px] font-black text-white uppercase">
                                    Today
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Orders Count */}
                            <td className="py-3.5 px-4 font-mono font-semibold text-white">
                              {day.ordersCount} orders
                            </td>

                            {/* Revenue in ₹ */}
                            <td className="py-3.5 px-4 font-mono font-extrabold text-base text-emerald-400">
                              ₹{day.revenue}
                            </td>

                            {/* Avg ticket */}
                            <td className="py-3.5 px-4 font-mono text-white/80">
                              ₹{day.avgTicket}
                            </td>

                            {/* Visual Bar */}
                            <td className="py-3.5 px-5 w-48">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#ff2626] to-emerald-400 rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(10, percentOfTotal * 3))}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-white/50">{percentOfTotal}%</span>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW B: MONTH-WISE TRACKING */}
            {financialView === 'monthwise' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <span>Monthly-Wise Amount Received</span>
                  </h3>
                  <span className="text-xs text-white/50">
                    Aggregated by calendar month
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {monthWiseData.map((m) => (
                    <div
                      key={m.monthStr}
                      className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 ${
                        m.isCurrentMonth
                          ? 'bg-gradient-to-br from-[#1a1414] to-[#121216] border-[#ff2626]/50'
                          : 'bg-[#121216] border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs text-white/50 uppercase font-semibold block">Month</span>
                          <h4 className="text-xl font-extrabold text-white font-display mt-0.5">
                            {m.formattedMonth}
                          </h4>
                        </div>
                        {m.isCurrentMonth && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#ff2626] text-white text-[10px] font-bold">
                            Current Month
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 py-2 border-y border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">Total Amount Received</span>
                          <span className="font-mono font-extrabold text-lg text-emerald-400">₹{m.revenue}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">Total Orders</span>
                          <span className="font-mono font-bold text-white">{m.ordersCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">Avg Order Value (AOV)</span>
                          <span className="font-mono text-white/80">₹{m.avgTicket}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-white/40 flex items-center justify-between">
                        <span>Gowlidoddy Kitchen</span>
                        <span className="text-emerald-400 font-medium">100% Verified</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Monthly Comparison Table */}
                <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl mt-6">
                  <table className="w-full text-left text-xs text-white/70">
                    <thead className="bg-white/5 text-white/50 uppercase text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3 px-5">Month Period</th>
                        <th className="py-3 px-4">Order Volume</th>
                        <th className="py-3 px-4">Total Revenue</th>
                        <th className="py-3 px-5 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {monthWiseData.map((m) => (
                        <tr key={m.monthStr} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-5 font-bold text-white text-sm">
                            {m.formattedMonth}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {m.ordersCount} orders
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                            ₹{m.revenue}
                          </td>
                          <td className="py-3 px-5 text-right font-mono text-white/60">
                            {totalRevenue > 0 ? Math.round((m.revenue / totalRevenue) * 100) : 0}% of all-time sales
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: CUSTOMER REVIEWS & RATINGS */}
        {/* ============================================================ */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">
                  Patron Reviews & Star Ratings
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Verified customer reviews submitted after orders received/delivered.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>
                    {reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '5.0'} / 5.0 Average
                  </span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                  {reviews.length} Total Feedback
                </span>
              </div>
            </div>

            {/* Rating Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 flex flex-col justify-between">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Overall Rating</span>
                <div className="py-2">
                  <div className="text-4xl font-extrabold text-white font-mono flex items-center gap-2">
                    <span>{reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '5.0'}</span>
                    <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-white/40">100% verified patron submissions</span>
              </div>

              {[5, 4, 3].map((stars) => {
                const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
                const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={stars} className="p-4 rounded-3xl bg-[#121216] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1">
                        <span>{stars} Stars</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </span>
                      <span className="font-mono text-white/60">{count} reviews ({pct}%)</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                      <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-white/40 mt-2 block">
                      {stars === 5 ? 'Exceptional dessert lovers' : stars === 4 ? 'Great cravings' : 'Constructive feedback'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-3xl bg-[#121216] border border-white/10 shadow-lg flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= Math.floor(r.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-white/20'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60">
                          {r.source}
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete review from ${r.author}?`)) {
                              deleteReview(r.id);
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 flex items-center justify-center transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed italic">
                      "{r.comment}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-white truncate">
                        {r.author}
                      </div>
                      <span className="text-[10px] text-white/40">
                        {r.date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      {r.favoriteItem ? (
                        <span className="text-[#ff6666] font-medium truncate max-w-[200px]">
                          Craved: {r.favoriteItem}
                        </span>
                      ) : (
                        <span className="text-white/40">General Cravings</span>
                      )}

                      {r.orderNumber && (
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          #{r.orderNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: MENU INVENTORY */}
        {/* ============================================================ */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">
                  Dessert & Thickshake Inventory
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Add new thickshakes, update prices, or toggle in-stock status.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="w-full bg-[#121216] border border-white/10 focus:border-[#ff2626] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Item</span>
                </button>
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="rounded-3xl bg-[#121216] border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-white/70">
                  <thead className="bg-white/5 text-white/50 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3.5 px-4">Item</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Discount</th>
                      <th className="py-3.5 px-4">Stock Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMenuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        
                        {/* Thumbnail & Title */}
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover bg-black border border-white/10 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-sm">{item.name}</div>
                            <div className="text-[11px] text-white/50 truncate max-w-xs">{item.tagline || item.description}</div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium capitalize">
                            {item.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                          ₹{item.price}
                        </td>

                        {/* Discount Status */}
                        <td className="py-3 px-4">
                          {item.discountPercent ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#ff2626]/20 border border-[#ff2626]/40 text-[#ff4444] text-[10px] font-bold">
                              {item.discountPercent}% OFF
                            </span>
                          ) : (
                            <span className="text-white/30 text-[11px]">Regular</span>
                          )}
                        </td>

                        {/* Stock toggle */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => updateItem(item.id, { isAvailable: item.isAvailable === false ? true : false })}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                              item.isAvailable !== false
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                : 'bg-red-950/80 border-red-500/50 text-red-400'
                            }`}
                          >
                            {item.isAvailable !== false ? '● In Stock' : '✕ Sold Out'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                              title="Edit item"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950 text-white/50 hover:text-[#ff4444] transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: DISCOUNTS & OFFERS */}
        {/* ============================================================ */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">
                  Discount Campaign Manager
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Launch discounts on selected desserts or thickshakes with instant customer strike-through pricing.
                </p>
              </div>

              <button
                onClick={() => setIsDiscountModalOpen(true)}
                className="px-4 py-2.5 bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center gap-1.5 active:scale-95 self-start sm:self-auto"
              >
                <Percent className="w-4 h-4" />
                <span>Launch New Discount</span>
              </button>
            </div>

            {/* Active Discount Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {menuItems
                .filter((item) => item.discountPercent && item.discountPercent > 0)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-[#121216] border border-[#ff2626]/40 shadow-xl flex items-start justify-between gap-3 relative overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ff2626] text-white text-[10px] font-bold font-mono">
                        {item.discountPercent}% OFF
                      </span>
                      <h4 className="text-base font-bold text-white pt-1">{item.name}</h4>
                      <p className="text-xs text-[#ff6666] italic">{item.discountLabel}</p>

                      <div className="flex items-baseline gap-2 pt-1 font-mono">
                        <span className="line-through text-white/40 text-sm">₹{item.originalPrice}</span>
                        <span className="text-emerald-400 font-extrabold text-lg">₹{item.price}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeDiscount(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-[#ff4444] text-xs font-semibold border border-white/10 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
            </div>

            {menuItems.filter((i) => i.discountPercent && i.discountPercent > 0).length === 0 && (
              <div className="py-16 text-center rounded-3xl bg-[#121216] border border-white/10 p-8 space-y-3">
                <Tag className="w-10 h-10 text-white/30 mx-auto" />
                <h4 className="text-base font-bold text-white">No active discounts</h4>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  Click "Launch New Discount" to apply 10%, 20%, or custom discounts to your thickshakes and DBC brownies!
                </p>
                <button
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="px-4 py-2 bg-[#ff2626] hover:bg-[#ff3b3b] text-white text-xs font-bold rounded-xl"
                >
                  Create Discount
                </button>
              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: STORE OPERATIONS & SETTINGS */}
        {/* ============================================================ */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-2xl font-extrabold text-white font-display">
                Store Operations & Configuration
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Manage Gowlidoddy location details, timings, and data resets.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Store Information
              </h3>
              <div className="text-xs text-white/70 space-y-1 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <p><strong>Name:</strong> {STORE_INFO.name}</p>
                <p><strong>Address:</strong> {STORE_INFO.address.fullFormatted}</p>
                <p><strong>Hours:</strong> {STORE_INFO.timings.displayString}</p>
                <p><strong>Instagram:</strong> {STORE_INFO.social.instagramHandle}</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-red-950/20 border border-red-500/30 space-y-3">
              <div className="flex items-center gap-2 text-[#ff4444] font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Reset Menu to Factory Defaults</span>
              </div>
              <p className="text-xs text-white/60">
                Restores the verified FLEW Gowlidoddy items, prices, and photos. Custom additions and temporary discounts will be refreshed.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('Reset all menu items to verified FLEW defaults?')) {
                    resetMenuToDefault();
                  }
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl flex items-center gap-2 border border-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#ff4444]" />
                <span>Reset to Factory Menu</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Add / Edit Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        itemToEdit={itemToEdit}
      />

      {/* Discount Manager Modal */}
      <DiscountManagerModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
      />

    </div>
  );
};
