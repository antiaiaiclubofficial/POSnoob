import { format } from 'date-fns';
"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  Calendar,
  Clock,
  Search,
  User,
  CreditCard,
  X,
  ChevronDown,
  ChevronUp,
  ShoppingCart
} from 'lucide-react';
import { useStore, InventoryItem } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Mock/Fallback data for trend and inventory if store is empty
const MOCK_TREND_DATA = [
  { date: '21 มิ.ย.', Inbound: 45, Outbound: 32 },
  { date: '22 มิ.ย.', Inbound: 12, Outbound: 28 },
  { date: '23 มิ.ย.', Inbound: 85, Outbound: 45 },
  { date: '24 มิ.ย.', Inbound: 30, Outbound: 52 },
  { date: '25 มิ.ย.', Inbound: 65, Outbound: 38 },
  { date: '26 มิ.ย.', Inbound: 15, Outbound: 41 },
  { date: '27 มิ.ย.', Inbound: 95, Outbound: 60 }
];

const MOCK_INVENTORY_ITEMS: InventoryItem[] = [
  { id: 'mock-1', name: 'Premium Salmon Kibble (2kg)', stock: 12, minStock: 5, price: 850, costPrice: 550, unit: 'ถุง', category: 'อาหารสัตว์', isConsignment: false },
  { id: 'mock-2', name: 'Organic Catnip Spray', stock: 2, minStock: 5, price: 320, costPrice: 180, unit: 'ขวด', category: 'ของเล่นสัตว์เลี้ยง', isConsignment: true },
  { id: 'mock-3', name: 'Velvet Harness & Lead Set (Blue, M)', stock: 0, minStock: 3, price: 490, costPrice: 280, unit: 'ชุด', category: 'อุปกรณ์ทั่วไป', isConsignment: false },
  { id: 'mock-4', name: 'Sensitive Care Grooming Shampoo', stock: 18, minStock: 4, price: 450, costPrice: 250, unit: 'ขวด', category: 'แชมพู & คอนดิชันเนอร์', isConsignment: false },
  { id: 'mock-5', name: 'Freeze-Dried Chicken Breast (150g)', stock: 3, minStock: 10, price: 290, costPrice: 170, unit: 'ซอง', category: 'ขนมสัตว์เลี้ยง', isConsignment: false },
  { id: 'mock-6', name: 'Dental Care Chew Sticks (10pcs)', stock: 0, minStock: 8, price: 195, costPrice: 110, unit: 'แพ็ค', category: 'ขนมสัตว์เลี้ยง', isConsignment: true }
];

// Color palette from DESIGN.md
const COLORS = {
  primary: '#18234A', // Navy
  tertiary: '#EAFD69', // Lime
  accentRed: '#8E171D', // Deep Red
  accentPeach: '#C5805D', // Peach
  purple: '#B5A2F2', // Custom soft Purple
  bgSurface: '#F9F9F9',
  bgLow: '#F3F3F3',
  bgLowest: '#FFFFFF'
};

const PIE_COLORS = [COLORS.primary, COLORS.purple, COLORS.accentPeach, COLORS.accentRed, '#4F46E5'];

export default function InventoryDashboard() {
  const { inventory, currency, adjustStock, stockLogs, language, transactions, partners, addPurchaseRequest } = useStore();
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [kpiDateRange, setKpiDateRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('all');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [selectedSalesDate, setSelectedSalesDate] = useState<string | null>(null);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showGPHistory, setShowGPHistory] = useState(false);

  // Fallback to mock inventory if store has no products
  const activeInventory = useMemo(() => {
    return inventory.length > 0 ? inventory : MOCK_INVENTORY_ITEMS;
  }, [inventory]);

  // Compute Inbound vs Outbound Trend Data from stock logs
  const trendData = useMemo(() => {
    const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = language === 'th' ? TH_MONTHS : EN_MONTHS;

    const days = [];
    const now = new Date();
    const dateMap: Record<string, { Inbound: number, Outbound: number }> = {};

    let daysToGenerate = 7;
    if (kpiDateRange === 'today') {
      daysToGenerate = 1;
    } else if (kpiDateRange === 'yesterday') {
      daysToGenerate = 2;
    } else if (kpiDateRange === '30days') {
      daysToGenerate = 30;
    } else if (kpiDateRange === 'all') {
      // Find oldest stock log timestamp
      let oldestDate = new Date();
      oldestDate.setDate(oldestDate.getDate() - 30); // Default fallback
      if (stockLogs.length > 0) {
        stockLogs.forEach(log => {
          if (log.timestamp) {
            const d = new Date(log.timestamp);
            if (d < oldestDate) oldestDate = d;
          }
        });
      }
      const diffTime = Math.abs(now.getTime() - oldestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysToGenerate = Math.min(365, Math.max(7, diffDays + 1)); // Cap at 365 days
    }

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = `${d.getDate()} ${months[d.getMonth()]}`;
      days.push({ key: dateKey, label });
      dateMap[dateKey] = { Inbound: 0, Outbound: 0 };
    }

    stockLogs.forEach(log => {
      if (!log.timestamp) return;
      const logDate = new Date(log.timestamp);
      const dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;

      if (dateMap[dateKey]) {
        const qtyDiff = log.newQty - log.oldQty;
        if (qtyDiff > 0) {
          dateMap[dateKey].Inbound += qtyDiff;
        } else if (qtyDiff < 0) {
          dateMap[dateKey].Outbound += Math.abs(qtyDiff);
        }
      }
    });

    const realTrendData = days.map(day => ({
      date: day.label,
      Inbound: dateMap[day.key].Inbound,
      Outbound: dateMap[day.key].Outbound
    }));

    if (inventory.length === 0) {
      if (kpiDateRange === '7days' || kpiDateRange === 'all') return MOCK_TREND_DATA;

      const mockData = [];
      for (let i = daysToGenerate - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = `${d.getDate()} ${months[d.getMonth()]}`;

        const inboundVal = Math.round(30 + Math.sin(i * 0.5) * 20 + (i % 3 === 0 ? 30 : 0));
        const outboundVal = Math.round(25 + Math.cos(i * 0.4) * 15 + (i % 2 === 0 ? 15 : 0));

        mockData.push({
          date: label,
          Inbound: inboundVal,
          Outbound: outboundVal
        });
      }
      return mockData;
    }

    return realTrendData;
  }, [stockLogs, inventory, language, kpiDateRange]);

  // Compute WMS KPI Statistics
  const stats = useMemo(() => {
    const totalSKUs = activeInventory.length;
    const totalValue = activeInventory.reduce((acc, item) => acc + (item.stock * item.costPrice), 0);
    const potentialRevenue = activeInventory.reduce((acc, item) => acc + (item.stock * item.price), 0);

    const lowStockAlerts = activeInventory.filter(item => item.stock > 0 && item.stock <= item.minStock);
    const outOfStock = activeInventory.filter(item => item.stock === 0);
    const deadStockItems = activeInventory.filter(item => {
      if (item.stock === 0) return false;
      const hasOutbound = stockLogs.some(log => log.productId === item.id && log.newQty < log.oldQty);
      return !hasOutbound;
    });

    const lowIds = new Set(lowStockAlerts.map(i => i.id));
    const outIds = new Set(outOfStock.map(i => i.id));
    const deadIds = new Set(deadStockItems.map(i => i.id));

    const normalItems = activeInventory.filter(item =>
      !lowIds.has(item.id) && !outIds.has(item.id) && !deadIds.has(item.id)
    );

    return {
      totalSKUs, totalValue, potentialRevenue,
      lowStockAlerts, outOfStock, deadStockItems, normalItems
    };
  }, [activeInventory, stockLogs]);

  // Processed transactions to filter only products (exclude services),
  // and set price to negative for products deleted from activeInventory.
  const processedTransactions = useMemo(() => {
    return transactions.map(t => {
      const productItems = (t.items || [])
        .filter((item: any) => item.type === 'Product')
        .map((item: any) => {
          const exists = activeInventory.some((inv: any) => inv.id === item.id);
          const price = item.finalPrice !== undefined ? item.finalPrice : item.price;
          // If deleted, price/finalPrice should be negative
          const adjustedPrice = exists ? price : -Math.abs(price);
          return {
            ...item,
            price: adjustedPrice,
            finalPrice: adjustedPrice
          };
        });

      // Recalculate amount as sum of adjusted product items
      const newAmount = productItems.reduce((sum, item) => {
        const qty = item.quantity || 1;
        return sum + (item.finalPrice * qty);
      }, 0);

      return {
        ...t,
        items: productItems,
        amount: newAmount
      };
    }).filter(t => t.items.length > 0);
  }, [transactions, activeInventory]);

  // Filtered transactions for the top sales widgets group based on selected time period
  const kpiFilteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    return processedTransactions.filter(t => {
      if (!t.date) return false;
      let txDate: Date;
      if (t.date.includes('T')) {
        txDate = new Date(t.date);
      } else {
        const parts = t.date.split('-');
        if (parts.length === 3) {
          txDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          txDate = new Date(t.date);
        }
      }

      if (isNaN(txDate.getTime())) return true;

      switch (kpiDateRange) {
        case 'today':
          return txDate >= startOfToday && txDate < startOfTomorrow;
        case 'yesterday':
          return txDate >= startOfYesterday && txDate < startOfToday;
        case '7days':
          return txDate >= sevenDaysAgo;
        case '30days':
          return txDate >= thirtyDaysAgo;
        case 'all':
        default:
          return true;
      }
    });
  }, [processedTransactions, kpiDateRange]);

  const bestSellers = useMemo(() => {
    const counts: Record<string, { id: string; title: string; quantity: number; totalRevenue: number }> = {};
    kpiFilteredTransactions.forEach(tx => {
      tx.items.forEach(item => {
        if (!counts[item.id]) {
          counts[item.id] = { id: item.id, title: item.title || 'Unknown Product', quantity: 0, totalRevenue: 0 };
        }
        const qty = item.quantity || 1;
        counts[item.id].quantity += qty;
        counts[item.id].totalRevenue += (item.finalPrice || item.price || 0) * qty;
      });
    });
    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity || b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }, [kpiFilteredTransactions]);

  // Actual sales revenue from transactions
  const salesRevenue = useMemo(() => {
    return kpiFilteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [kpiFilteredTransactions]);

  // Sales Revenue Growth calculated from the previous day/period
  const salesRevenueGrowth = useMemo(() => {
    const getRevenue = (txs: typeof processedTransactions) => {
      return txs.reduce((sum, t) => sum + t.amount, 0);
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    let prevRevenue = 0;
    let currentRevenueForTrend = salesRevenue;

    if (kpiDateRange === 'today') {
      const todayTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startOfToday;
      });
      currentRevenueForTrend = getRevenue(todayTxs);

      const yesterdayTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startOfYesterday && txDate < startOfToday;
      });
      prevRevenue = getRevenue(yesterdayTxs);
    } else if (kpiDateRange === 'yesterday') {
      const dayBeforeYesterday = new Date(startOfYesterday.getTime() - 24 * 60 * 60 * 1000);
      const dayBeforeTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= dayBeforeYesterday && txDate < startOfYesterday;
      });
      prevRevenue = getRevenue(dayBeforeTxs);
    } else if (kpiDateRange === '7days') {
      const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000);
      const prevPeriodTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= fourteenDaysAgo && txDate < sevenDaysAgo;
      });
      prevRevenue = getRevenue(prevPeriodTxs);
    } else if (kpiDateRange === '30days' || kpiDateRange === 'all') {
      const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(startOfToday.getTime() - 60 * 24 * 60 * 60 * 1000);

      const currentPeriodTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= thirtyDaysAgo;
      });
      currentRevenueForTrend = getRevenue(currentPeriodTxs);

      const prevPeriodTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= sixtyDaysAgo && txDate < thirtyDaysAgo;
      });
      prevRevenue = getRevenue(prevPeriodTxs);
    }

    let growth = 0;
    if (prevRevenue > 0) {
      growth = Math.round(((currentRevenueForTrend - prevRevenue) / prevRevenue) * 100);
    } else if (currentRevenueForTrend > 0) {
      growth = 100;
    } else if (currentRevenueForTrend === 0 && prevRevenue === 0) {
      growth = 0;
    } else if (currentRevenueForTrend === 0 && prevRevenue > 0) {
      growth = -100;
    }

    return growth;
  }, [kpiDateRange, processedTransactions, salesRevenue]);

  // Sales History daily breakdown for the last 7 days (timezone-safe)
  const salesHistory = useMemo(() => {
    const history = [];
    const now = new Date();
    const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = language === 'th' ? TH_MONTHS : EN_MONTHS;

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1, 0, 0, 0, 0);

      const dayTransactions = processedTransactions.filter(t => {
        if (!t.date) return false;
        let txDate: Date;
        if (t.date.includes('T')) {
          txDate = new Date(t.date);
        } else {
          const parts = t.date.split('-');
          if (parts.length === 3) {
            txDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else {
            txDate = new Date(t.date);
          }
        }
        return txDate >= dayStart && txDate < dayEnd;
      });
      const totalAmount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = i === 0
        ? (language === 'th' ? 'วันนี้' : 'Today')
        : i === 1
          ? (language === 'th' ? 'เมื่อวาน' : 'Yesterday')
          : `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;

      history.push({
        dateStr: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`,
        label,
        amount: totalAmount
      });
    }
    return history;
  }, [processedTransactions, language]);

  // Date range label for the sales widget
  const dateRangeLabel = useMemo(() => {
    const formatDate = (date: Date) => {
      const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const months = language === 'th' ? TH_MONTHS : EN_MONTHS;
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear() + (language === 'th' ? 543 : 0);
      return `${day} ${month} ${year}`;
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);

    switch (kpiDateRange) {
      case 'today':
        return formatDate(today);
      case 'yesterday':
        return formatDate(yesterday);
      case '7days':
        return `${formatDate(sevenDaysAgo)} - ${formatDate(today)}`;
      case '30days':
        return `${formatDate(thirtyDaysAgo)} - ${formatDate(today)}`;
      case 'all':
      default:
        if (processedTransactions.length > 0) {
          const dates = processedTransactions.map(t => {
            if (!t.date) return null;
            let txDate: Date;
            if (t.date.includes('T')) {
              txDate = new Date(t.date);
            } else {
              const parts = t.date.split('-');
              if (parts.length === 3) {
                txDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              } else {
                txDate = new Date(t.date);
              }
            }
            return txDate;
          }).filter((d): d is Date => d !== null && !isNaN(d.getTime()));

          if (dates.length > 0) {
            const oldest = new Date(Math.min(...dates.map(d => d.getTime())));
            return `${formatDate(oldest)} - ${formatDate(today)}`;
          }
        }
        return language === 'th' ? 'ทั้งหมด' : 'All time';
    }
  }, [kpiDateRange, language, processedTransactions]);

  // Consignment GP income (Shop Profit share)
  const consignmentGP = useMemo(() => {
    let totalGP = 0;
    kpiFilteredTransactions.forEach(t => {
      (t.items || []).forEach(item => {
        if (item.isConsignment && item.partnerId) {
          const actualPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
          const qty = item.quantity || 1;
          const lineTotal = actualPrice * qty;

          const partner = partners.find(p => p.id === item.partnerId);
          const rate = item.consignmentRate || (partner ? partner.gpRate : 0);

          // GP income (Shop profit) = lineTotal * (GP rate / 100)
          totalGP += (lineTotal * rate) / 100;
        }
      });
    });
    return totalGP;
  }, [kpiFilteredTransactions, partners]);

  // Consignment GP Growth calculated from the previous day/period
  const consignmentGPGrowth = useMemo(() => {
    const getGP = (txs: typeof processedTransactions) => {
      let totalGP = 0;
      txs.forEach(t => {
        (t.items || []).forEach(item => {
          if (item.isConsignment && item.partnerId) {
            const actualPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
            const qty = item.quantity || 1;
            const lineTotal = actualPrice * qty;
            const partner = partners.find(p => p.id === item.partnerId);
            const rate = item.consignmentRate || (partner ? partner.gpRate : 0);
            totalGP += (lineTotal * rate) / 100;
          }
        });
      });
      return totalGP;
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    let prevGP = 0;
    let currentGPForTrend = consignmentGP;

    if (kpiDateRange === 'today') {
      const todayTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startOfToday;
      });
      currentGPForTrend = getGP(todayTxs);

      const yesterdayTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startOfYesterday && txDate < startOfToday;
      });
      prevGP = getGP(yesterdayTxs);
    } else if (kpiDateRange === 'yesterday') {
      const dayBeforeYesterday = new Date(startOfYesterday.getTime() - 24 * 60 * 60 * 1000);
      const dayBeforeTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= dayBeforeYesterday && txDate < startOfYesterday;
      });
      prevGP = getGP(dayBeforeTxs);
    } else if (kpiDateRange === '7days') {
      const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000);
      const prevPeriodTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= fourteenDaysAgo && txDate < sevenDaysAgo;
      });
      prevGP = getGP(prevPeriodTxs);
    } else if (kpiDateRange === '30days' || kpiDateRange === 'all') {
      const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(startOfToday.getTime() - 60 * 24 * 60 * 60 * 1000);

      const currentPeriodTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= thirtyDaysAgo;
      });
      currentGPForTrend = getGP(currentPeriodTxs);

      const prevPeriodTxs = processedTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= sixtyDaysAgo && txDate < thirtyDaysAgo;
      });
      prevGP = getGP(prevPeriodTxs);
    }

    let growth = 0;
    if (prevGP > 0) {
      growth = Math.round(((currentGPForTrend - prevGP) / prevGP) * 100);
    } else if (currentGPForTrend > 0) {
      growth = 100;
    } else if (currentGPForTrend === 0 && prevGP === 0) {
      growth = 0;
    } else if (currentGPForTrend === 0 && prevGP > 0) {
      growth = -100;
    }

    return growth;
  }, [kpiDateRange, processedTransactions, consignmentGP, partners]);

  // Consignment GP history daily breakdown for the last 7 days (timezone-safe)
  const gpHistory = useMemo(() => {
    const history = [];
    const now = new Date();
    const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = language === 'th' ? TH_MONTHS : EN_MONTHS;

    const getGP = (txs: typeof processedTransactions) => {
      let totalGP = 0;
      txs.forEach(tx => {
        if (tx.items) {
          tx.items.forEach(item => {
            const partner = partners.find(p => p.id === item.partnerId);
            if (partner || item.consignmentRate) {
              const lineTotal = item.price * (item.quantity || 1);
              const rate = item.consignmentRate || (partner ? partner.gpRate : 0);
              totalGP += (lineTotal * rate) / 100;
            }
          });
        }
      });
      return totalGP;
    };

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1, 0, 0, 0, 0);

      const dayTransactions = processedTransactions.filter(t => {
        if (!t.date) return false;
        let txDate: Date;
        if (t.date.includes('T')) {
          txDate = new Date(t.date);
        } else {
          const parts = t.date.split('-');
          if (parts.length === 3) {
            txDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else {
            txDate = new Date(t.date);
          }
        }
        return txDate >= dayStart && txDate < dayEnd;
      });

      const dayGP = getGP(dayTransactions);

      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = i === 0
        ? (language === 'th' ? 'วันนี้' : 'Today')
        : i === 1
          ? (language === 'th' ? 'เมื่อวาน' : 'Yesterday')
          : `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;

      history.push({
        dateStr: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`,
        label,
        amount: dayGP
      });
    }
    return history;
  }, [processedTransactions, partners, language]);

  // Filtered transactions (including both Products and Services) for the top sales widgets group based on selected time period
  const allKpiFilteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter(t => {
      if (!t.date) return false;
      let txDate: Date;
      if (t.date.includes('T')) {
        txDate = new Date(t.date);
      } else {
        const parts = t.date.split('-');
        if (parts.length === 3) {
          txDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          txDate = new Date(t.date);
        }
      }

      if (isNaN(txDate.getTime())) return true;

      switch (kpiDateRange) {
        case 'today':
          return txDate >= startOfToday && txDate < startOfTomorrow;
        case 'yesterday':
          return txDate >= startOfYesterday && txDate < startOfToday;
        case '7days':
          return txDate >= sevenDaysAgo;
        case '30days':
          return txDate >= thirtyDaysAgo;
        case 'all':
        default:
          return true;
      }
    });
  }, [transactions, kpiDateRange]);

  // Dynamic comparison label based on selected period
  const trendPeriodLabel = useMemo(() => {
    switch (kpiDateRange) {
      case 'today':
      case 'yesterday':
        return language === 'th' ? 'เทียบกับวันก่อนหน้า' : 'vs yesterday';
      case '7days':
        return language === 'th' ? 'เทียบกับ 7 วันก่อนหน้า' : 'vs last 7 days';
      case '30days':
      case 'all':
      default:
        return language === 'th' ? 'เทียบกับ 30 วันก่อนหน้า' : 'vs last 30 days';
    }
  }, [kpiDateRange, language]);

  // Metrics for Order Received (Smartwatch card) and Total Sales chart
  const { totalOrders, orderGrowthPercent, totalOrdersThisWeek, weeklySalesTrend, trendLabels } = useMemo(() => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const total = allKpiFilteredTransactions.length;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(startOfToday.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Calculate Growth dynamically based on the selected period
    let growth = 0;
    let currentCount = total;
    let prevCount = 0;

    if (kpiDateRange === 'today') {
      currentCount = transactions.filter(t => {
        if (!t.date) return false;
        const txDate = new Date(t.date);
        return txDate >= startOfToday;
      }).length;
      prevCount = transactions.filter(t => {
        if (!t.date) return false;
        const txDate = new Date(t.date);
        return txDate >= startOfYesterday && txDate < startOfToday;
      }).length;
    } else if (kpiDateRange === 'yesterday') {
      currentCount = total;
      const dayBeforeYesterday = new Date(startOfYesterday.getTime() - 24 * 60 * 60 * 1000);
      prevCount = transactions.filter(t => {
        if (!t.date) return false;
        const txDate = new Date(t.date);
        return txDate >= dayBeforeYesterday && txDate < startOfYesterday;
      }).length;
    } else if (kpiDateRange === '7days') {
      currentCount = total;
      const sevenDaysAgoDate = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgoDate = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000);
      prevCount = transactions.filter(t => {
        if (!t.date) return false;
        const txDate = new Date(t.date);
        return txDate >= fourteenDaysAgoDate && txDate < sevenDaysAgoDate;
      }).length;
    } else if (kpiDateRange === '30days' || kpiDateRange === 'all') {
      currentCount = transactions.filter(t => {
        if (!t.date) return false;
        const txDate = new Date(t.date);
        return txDate >= thirtyDaysAgo;
      }).length;
      prevCount = transactions.filter(t => {
        if (!t.date) return false;
        const txDate = new Date(t.date);
        return txDate >= sixtyDaysAgo && txDate < thirtyDaysAgo;
      }).length;
    }

    if (prevCount > 0) {
      growth = Math.round(((currentCount - prevCount) / prevCount) * 100);
    } else if (currentCount > 0) {
      growth = 100;
    } else if (currentCount === 0 && prevCount === 0) {
      growth = 0;
    } else if (currentCount === 0 && prevCount > 0) {
      growth = -100;
    }

    const trend = [];
    let labels: string[] = [];
    const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = language === 'th' ? TH_MONTHS : EN_MONTHS;

    if (kpiDateRange === 'today' || kpiDateRange === 'yesterday') {
      const targetDay = kpiDateRange === 'today' ? new Date() : new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const targetDayStr = targetDay.toISOString().split('T')[0];

      for (let h = 8; h <= 19; h++) {
        const hourStr = h.toString().padStart(2, '0');
        const nextHourStr = (h + 1).toString().padStart(2, '0');
        const hourTx = allKpiFilteredTransactions.filter(t => {
          if (!t.date) return false;
          const d = new Date(t.date);
          const localHour = d.getHours();
          const localDateStr = d.toISOString().split('T')[0];
          return localDateStr === targetDayStr && localHour === h;
        });

        const count = hourTx.length;
        const amount = hourTx.reduce((sum, t) => sum + t.amount, 0);

        trend.push({
          date: `${hourStr}:00 - ${nextHourStr}:00`,
          count,
          amount,
          rawDate: targetDayStr
        });
      }
      labels = ["08:00", "11:00", "14:00", "17:00", "19:00"];
    } else if (kpiDateRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now.getTime() - i * oneDay);
        const dateStr = targetDate.toISOString().split('T')[0];
        const dayTransactions = allKpiFilteredTransactions.filter(t => t.date === dateStr || t.date?.startsWith(dateStr));
        const count = dayTransactions.length;
        const amount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        const label = `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;

        trend.push({
          date: label,
          count,
          amount,
          rawDate: dateStr
        });
      }
      labels = trend.map(t => t.date);
    } else if (kpiDateRange === '30days') {
      for (let i = 29; i >= 0; i--) {
        const targetDate = new Date(now.getTime() - i * oneDay);
        const dateStr = targetDate.toISOString().split('T')[0];
        const dayTransactions = allKpiFilteredTransactions.filter(t => t.date === dateStr || t.date?.startsWith(dateStr));
        const count = dayTransactions.length;
        const amount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        const label = `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;

        trend.push({
          date: label,
          count,
          amount,
          rawDate: dateStr
        });
      }
      labels = ["W1", "W2", "W3", "W4", "W5"];
    } else {
      const trendDays = 15;
      for (let i = 0; i < trendDays; i++) {
        const targetDate = new Date(now.getTime() - (trendDays - 1 - i) * oneDay);
        const dateStr = targetDate.toISOString().split('T')[0];
        const dayTransactions = allKpiFilteredTransactions.filter(t => t.date === dateStr || t.date?.startsWith(dateStr));
        const count = dayTransactions.length;
        const amount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        const label = `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;

        trend.push({
          date: label,
          count,
          amount,
          rawDate: dateStr
        });
      }
      labels = ["W1", "W2", "W3", "W4", "W5"];
    }

    return {
      totalOrders: total,
      orderGrowthPercent: growth,
      totalOrdersThisWeek: total,
      weeklySalesTrend: trend,
      trendLabels: labels
    };
  }, [allKpiFilteredTransactions, transactions, language, kpiDateRange]);

  const orderHistory = useMemo(() => {
    const history = [];
    const now = new Date();
    const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = language === 'th' ? TH_MONTHS : EN_MONTHS;

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1, 0, 0, 0, 0);

      const count = transactions.filter(t => {
        if (!t.date) return false;
        let txDate: Date;
        if (t.date.includes('T')) {
          txDate = new Date(t.date);
        } else {
          const parts = t.date.split('-');
          if (parts.length === 3) {
            txDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else {
            txDate = new Date(t.date);
          }
        }
        return txDate >= dayStart && txDate < dayEnd;
      }).length;

      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = i === 0
        ? (language === 'th' ? 'วันนี้' : 'Today')
        : i === 1
          ? (language === 'th' ? 'เมื่อวาน' : 'Yesterday')
          : `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;

      history.push({
        dateStr: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`,
        label,
        count
      });
    }
    return history;
  }, [transactions, language]);

  // Trace actual historical Inventory Valuation trend based on stockLogs and activeInventory
  const valuationTrend = useMemo(() => {
    // Generate historical valuation for the last 15 days to match sparkline density
    const daysToGenerate = 15;
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    const productCostMap: Record<string, number> = {};
    activeInventory.forEach(item => {
      productCostMap[item.id] = item.costPrice || 0;
    });

    const runningStocks: Record<string, number> = {};
    activeInventory.forEach(item => {
      runningStocks[item.id] = item.stock;
    });

    const sortedLogs = [...stockLogs]
      .filter(log => log.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const days = [];
    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(now.getTime() - i * oneDay);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push(dateKey);
    }

    const dailyValuations: Record<string, number> = {};
    let logIndex = 0;

    const getValuation = () => {
      return Object.entries(runningStocks).reduce((acc, [pid, qty]) => {
        return acc + (qty * (productCostMap[pid] || 0));
      }, 0);
    };

    for (const dateKey of days) {
      while (logIndex < sortedLogs.length) {
        const log = sortedLogs[logIndex];
        const logDateStr = new Date(log.timestamp).toISOString().split('T')[0];

        if (logDateStr > dateKey) {
          const diff = log.newQty - log.oldQty;
          runningStocks[log.productId] = (runningStocks[log.productId] || 0) - diff;
          logIndex++;
        } else {
          break;
        }
      }
      dailyValuations[dateKey] = getValuation();
    }

    return days.map(dateKey => dailyValuations[dateKey]).reverse();
  }, [activeInventory, stockLogs]);

  // Sparkline SVG Path generator for Inventory Valuation blue card using actual historical trend
  const sparklinePath = useMemo(() => {
    if (valuationTrend.length < 2) {
      return "M 5,15 L 115,15";
    }
    const max = Math.max(...valuationTrend);
    const min = Math.min(...valuationTrend);
    const range = max - min || 1;

    const points = valuationTrend.map((val, index) => {
      const x = 5 + (index / (valuationTrend.length - 1)) * 110;
      // Map height nicely (between y=5 at top and y=25 at bottom of the 30px viewBox)
      const y = 25 - ((val - min) / range) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    let path = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i]}`;
    }
    return path;
  }, [valuationTrend]);

  // Calculate Value by Category for Pie Chart
  const categoryChartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    activeInventory.forEach(item => {
      const val = item.stock * item.costPrice;
      if (val > 0) {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + val;
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [activeInventory]);

  // Filter products that require attention (Out of stock first, then Low stock)
  const alertProducts = useMemo(() => {
    return activeInventory
      .filter(item => item.stock <= item.minStock)
      .sort((a, b) => {
        if (a.stock === 0 && b.stock > 0) return -1;
        if (a.stock > 0 && b.stock === 0) return 1;
        // Or sort by stock ratio (stock / minStock)
        const ratioA = a.minStock > 0 ? a.stock / a.minStock : 0;
        const ratioB = b.minStock > 0 ? b.stock / b.minStock : 0;
        return ratioA - ratioB;
      })
      .slice(0, 10);
  }, [activeInventory]);

  // Handler for Reordering Action with micro-animation
  const handleReorder = async (productId: string, name: string) => {
    setReorderingId(productId);
    // Simulate API request to order stock
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const item = inventory.find(i => i.id === productId);
    const orderQty = item?.reorderQuantity || 20;

    if (item) {
      // Instead of adding PO directly, create a pending PR
      addPurchaseRequest({
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        partnerId: item.partnerId || '', // Auto select vendor if available
        items: [{
          productId: item.id,
          productName: item.name,
          quantity: orderQty,
          unitPrice: item.costPrice || 0,
          total: (item.costPrice || 0) * orderQty,
        }],
        status: 'Pending',
        totalAmount: (item.costPrice || 0) * orderQty,
        createdBy: 'ระบบสั่งซื้ออัตโนมัติ (Reorder)'
      });
    }

    setReorderingId(null);
    toast.success(`สร้างใบขอสั่งซื้อ (PR) ${name} จำนวน ${orderQty} ชิ้นเรียบร้อยแล้ว!`, {
      description: 'สามารถตรวจสอบและอนุมัติ PR ได้ที่หน้า Inventory > เอกสาร',
      icon: <CheckCircle2 className="text-[#EAFD69] w-5 h-5" />,
      style: {
        background: COLORS.primary,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '20px'
      }
    });
  };

  // Filter transactions for the modal based on selected sales date
  const modalTransactions = useMemo(() => {
    if (!selectedSalesDate) return processedTransactions;
    return processedTransactions.filter(t => t.date === selectedSalesDate || t.date?.startsWith(selectedSalesDate));
  }, [processedTransactions, selectedSalesDate]);

  // Filter transactions for the modal based on the search query
  const filteredModalTransactions = useMemo(() => {
    return modalTransactions.filter(t => {
      const q = modalSearchQuery.toLowerCase();
      const matchId = t.id.toLowerCase().includes(q);
      const matchCustomer = t.customerName?.toLowerCase().includes(q) || t.customerId?.toLowerCase().includes(q);
      const matchStaff = t.staffName?.toLowerCase().includes(q);
      const matchItemName = t.items?.some((item: any) => (item.title || item.name)?.toLowerCase().includes(q));
      return matchId || matchCustomer || matchStaff || matchItemName;
    });
  }, [modalTransactions, modalSearchQuery]);

  // Format selected sales date for the header
  const formattedModalDate = useMemo(() => {
    if (!selectedSalesDate) return '';
    try {
      const d = new Date(selectedSalesDate);
      if (isNaN(d.getTime())) return selectedSalesDate;
      const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
      const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const months = language === 'th' ? TH_MONTHS : EN_MONTHS;
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + (language === 'th' ? 543 : 0)}`;
    } catch (e) {
      return selectedSalesDate;
    }
  }, [selectedSalesDate, language]);

  // Helper to summarize transaction items into a friendly display name
  const getTransactionItemNamesLabel = (items: any[]) => {
    if (!items || items.length === 0) return language === 'th' ? 'ไม่มีสินค้า' : 'No items';
    const firstItemName = items[0].title || items[0].name || (language === 'th' ? 'สินค้าทั่วไป' : 'General Item');
    if (items.length === 1) {
      return firstItemName;
    }
    const remainingCount = items.length - 1;
    return language === 'th'
      ? `${firstItemName} และอีก ${remainingCount} รายการ`
      : `${firstItemName} + ${remainingCount} more item(s)`;
  };

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.02
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 14
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const subtlePulse = {
    animate: {
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* 1. Top Redesigned KPI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: 4 widgets (Sales, GP, Smartwatch, Total Sales) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header row with Title and Filter pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <span className="text-sm font-black text-[#18234A] uppercase tracking-wider">
              {language === 'th' ? 'ภาพรวมการขายและผลประกอบการ' : 'Sales & Revenue Overview'}
            </span>

            {/* KPI Period Filter Pills */}
            <div className="flex bg-[#F3F3F3] p-1 rounded-[16px] border border-gray-50 shadow-inner w-fit">
              {(['today', 'yesterday', '7days', '30days', 'all'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setKpiDateRange(r)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap",
                    kpiDateRange === r
                      ? "bg-white text-[#18234A] shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {r === 'today'
                    ? (language === 'th' ? 'วันนี้' : 'Today')
                    : r === 'yesterday'
                      ? (language === 'th' ? 'เมื่อวาน' : 'Yesterday')
                      : r === '7days'
                        ? (language === 'th' ? '7 วัน' : '7 Days')
                        : r === '30days'
                          ? (language === 'th' ? '30 วัน' : '30 Days')
                          : (language === 'th' ? 'ทั้งหมด' : 'All')
                  }
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Sub-column: Sales Revenue on top, Smartwatch + GP below */}
            <div className="w-full md:w-[424px] flex flex-col gap-6 shrink-0">
              {/* Widget 1: ยอดขายสินค้า */}
              <motion.div
                variants={cardVariants}
                className="bg-white p-6 rounded-[32px] shadow-[0_20px_40px_rgba(24,35,74,0.02)] flex flex-col justify-between relative overflow-hidden group transition-shadow duration-300 hover:shadow-[0_30px_60px_rgba(24,35,74,0.06)] border border-gray-50 h-[200px]"
              >
                <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-blue-500/5 blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                <AnimatePresence>
                  {showSalesHistory && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute inset-0 bg-white/98 backdrop-blur-md rounded-[32px] p-5 flex flex-col z-20 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                          {language === 'th' ? 'ประวัติยอดขาย' : 'Sales History'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSalesHistory(false);
                          }}
                          className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          <svg className="w-2.5 h-2.5 rotate-180 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[120px] scrollbar-thin scrollbar-thumb-gray-200">
                        {salesHistory.map((item) => (
                          <div key={item.dateStr} className="flex justify-between items-center text-[10px] py-1 border-b border-gray-100 last:border-0">
                            <span className="text-gray-600 font-medium">{item.label}</span>
                            <span className="font-black text-blue-600">
                              {item.amount < 0 ? `-${currency}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `${currency}${item.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="z-10">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-[3px] h-5 bg-[#2563EB] rounded-full" />
                      <h3 className="text-sm font-extrabold text-[#18234A] tracking-wider uppercase">
                        {language === 'th' ? 'ยอดขายสินค้า' : 'Sales Revenue'}
                      </h3>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                      {dateRangeLabel}
                    </span>
                  </div>
                  <div className={cn("text-3xl font-black font-sans tracking-tight", salesRevenue < 0 ? "text-red-500" : "text-[#18234A]")}>
                    {salesRevenue < 0 ? `-${currency}${Math.abs(salesRevenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `${currency}${salesRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  </div>
                </div>

                <div className="z-10 flex justify-between items-center mt-auto w-full">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0",
                      salesRevenueGrowth >= 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    )}>
                      {salesRevenueGrowth >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("text-[10px] font-black uppercase tracking-wider leading-none", salesRevenueGrowth >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {salesRevenueGrowth >= 0 ? '+' : ''}{salesRevenueGrowth}%
                      </span>
                      <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider leading-none">
                        {trendPeriodLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <DollarSign size={14} />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSalesHistory(true);
                      }}
                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Row 2: Order Received & GP ฝากขาย */}
              <div className="flex gap-6">
                {/* Widget 3: Smartwatch Card */}
                <div className="flex items-center justify-center z-10 w-full md:w-[200px] h-[200px] shrink-0">
                  <div className="bg-[#0B1527] text-white p-5 rounded-[32px] w-full h-full flex flex-col justify-between shadow-[0_20px_40px_rgba(11,21,39,0.2)] relative border border-[#1E293B] group/watch hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                    <AnimatePresence>
                      {showOrderHistory && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          className="absolute inset-0 bg-[#0B1527]/98 backdrop-blur-md rounded-[32px] p-5 flex flex-col z-20 border border-[#1E293B]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                              {language === 'th' ? 'ประวัติออเดอร์' : 'Order History'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowOrderHistory(false);
                              }}
                              className="w-5 h-5 rounded-full bg-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 rotate-180 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[120px] scrollbar-thin scrollbar-thumb-gray-800">
                            {orderHistory.map((item) => (
                              <div key={item.dateStr} className="flex justify-between items-center text-[10px] py-1 border-b border-gray-800/40 last:border-0">
                                <span className="text-gray-300 font-medium">{item.label}</span>
                                <span className="font-black text-blue-400">{item.count} {language === 'th' ? 'ออเดอร์' : 'orders'}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-gray-300">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                      <div className="flex flex-col leading-none">
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Order</span>
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Received</span>
                      </div>
                    </div>

                    <div className="my-1">
                      <span className="text-5xl font-black tracking-tight font-sans">{totalOrders.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0",
                          orderGrowthPercent >= 0
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        )}>
                          {orderGrowthPercent >= 0 ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className={cn("text-[10px] font-black uppercase tracking-wider leading-none", orderGrowthPercent >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {orderGrowthPercent >= 0 ? '+' : ''}{orderGrowthPercent}%
                          </span>
                          <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider leading-none">
                            {trendPeriodLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowOrderHistory(true);
                          }}
                          className="w-7 h-7 rounded-full bg-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition-colors"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  variants={cardVariants}
                  className="bg-white p-6 rounded-[32px] shadow-[0_20px_40px_rgba(24,35,74,0.02)] flex flex-col justify-between relative overflow-hidden group transition-shadow duration-300 hover:shadow-[0_30px_60px_rgba(24,35,74,0.06)] border border-gray-50 w-full md:w-[200px] h-[200px] shrink-0"
                >
                  <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-purple-500/5 blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                  <AnimatePresence>
                    {showGPHistory && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute inset-0 bg-white/98 backdrop-blur-md rounded-[32px] p-5 flex flex-col z-20 border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                            {language === 'th' ? 'ประวัติรายได้ GP' : 'GP History'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowGPHistory(false);
                            }}
                            className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5 rotate-180 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[120px] scrollbar-thin scrollbar-thumb-gray-200">
                          {gpHistory.map((item) => (
                            <div key={item.dateStr} className="flex justify-between items-center text-[10px] py-1 border-b border-gray-100 last:border-0">
                              <span className="text-gray-600 font-medium">{item.label}</span>
                              <span className="font-black text-purple-600">
                                {item.amount < 0 ? `-${currency}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `${currency}${item.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[3px] h-5 bg-[#8B5CF6] rounded-full" />
                      <h3 className="text-xs font-extrabold text-[#18234A] tracking-wider uppercase">
                        {language === 'th' ? 'รายได้ GP (ฝากขาย)' : 'Consignment GP'}
                      </h3>
                    </div>
                    <div className={cn("text-3xl font-black font-sans tracking-tight", consignmentGP < 0 ? "text-red-500" : "text-[#18234A]")}>
                      {consignmentGP < 0 ? `-${currency}${Math.abs(consignmentGP).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `${currency}${consignmentGP.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    </div>
                  </div>
                  <div className="z-10 flex justify-between items-center mt-auto w-full">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0",
                        consignmentGPGrowth >= 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      )}>
                        {consignmentGPGrowth >= 0 ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className={cn("text-[10px] font-black uppercase tracking-wider leading-none", consignmentGPGrowth >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {consignmentGPGrowth >= 0 ? '+' : ''}{consignmentGPGrowth}%
                        </span>
                        <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider leading-none">
                          {trendPeriodLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowGPHistory(true);
                        }}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Sub-column: Total Sales spanning full height */}
            <div className="flex-1 flex">
              {/* Widget 4: จำนวนรายการขาย & Waveform */}
              <motion.div
                variants={cardVariants}
                className="bg-white p-6 rounded-[32px] shadow-[0_20px_40px_rgba(24,35,74,0.02)] flex flex-col justify-between relative overflow-hidden group transition-shadow duration-300 hover:shadow-[0_30px_60px_rgba(24,35,74,0.06)] border border-gray-50 flex-1 min-h-[424px]"
              >
                <div className="z-10 flex justify-between items-start w-full">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-[3px] h-5 bg-[#2563EB] rounded-full" />
                      <h3 className="text-base font-black text-[#18234A] tracking-wide uppercase">
                        {language === 'th' ? 'รายการขาย' : 'Total Sales'}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-1">
                        {dateRangeLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSalesDate(null);
                      setIsSalesModalOpen(true);
                    }}
                    className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {language === 'th' ? 'ดูทั้งหมด' : 'View all'}
                  </button>
                </div>

                {/* Waveform Bar Chart & Week Labels */}
                <div className="flex-1 flex flex-col justify-between mt-2 z-10">
                  <div className="flex-1 min-h-[160px] my-6 flex items-end justify-between gap-0.5 px-0.5 relative">
                    {weeklySalesTrend.map((val, idx) => {
                      const maxVal = Math.max(...weeklySalesTrend.map(t => t.count), 1);
                      const heightPercent = Math.max(15, (val.count / maxVal) * 100);
                      const isHighlighted = hoveredBarIndex === idx || (hoveredBarIndex === null && idx === weeklySalesTrend.length - 1);

                      return (
                        <div
                          key={idx}
                          className="relative flex-1 flex items-end justify-center h-full group"
                          onMouseEnter={() => setHoveredBarIndex(idx)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                          onClick={() => {
                            setSelectedSalesDate(val.rawDate);
                            setIsSalesModalOpen(true);
                          }}
                        >
                          <div
                            className={cn(
                              "rounded-full transition-all duration-300 cursor-pointer relative",
                              isHighlighted
                                ? "w-2.5 bg-[#2563EB] shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                                : "w-1 bg-gray-100 hover:bg-gray-200 hover:w-2"
                            )}
                            style={{ height: `${heightPercent}%` }}
                          >
                            {/* Floating Tooltip */}
                            <AnimatePresence>
                              {hoveredBarIndex === idx && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] pointer-events-none">
                                  <motion.div
                                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1.05 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="bg-[#0B1527] text-white text-[10px] px-2.5 py-2 rounded-2xl shadow-xl border border-[#1E293B] whitespace-nowrap flex flex-col items-center gap-0.5 relative"
                                  >
                                    <span className="font-extrabold text-[9px] text-gray-300">{val.date}</span>
                                    <span className="text-blue-400 font-black">{val.count} {language === 'th' ? 'รายการ' : 'sales'}</span>
                                    <span className={cn("font-black text-[10px]", val.amount < 0 ? "text-red-400" : "text-emerald-400")}>
                                      {val.amount < 0 ? `-${currency}${Math.abs(val.amount).toLocaleString()}` : `${currency}${val.amount.toLocaleString()}`}
                                    </span>
                                    <div className="w-1.5 h-1.5 bg-[#0B1527] border-r border-b border-[#1E293B] rotate-45 absolute -bottom-[4px] left-1/2 -translate-x-1/2" />
                                  </motion.div>
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Trend Labels */}
                  <div className="flex justify-between items-center text-[7px] font-black text-gray-400 uppercase tracking-widest mt-2 px-0.5 w-full">
                    {trendLabels.map((lbl, idx) => (
                      <span key={idx}>{lbl}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Column: Valuation + Potential Revenue on top, Stock Capsules below */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
          {/* Row 1: Valuation and Potential Revenue side-by-side (Reduced size, h-[95px]) */}
          <div className="grid grid-cols-2 gap-6">
            {/* Widget 5: Inventory Valuation Card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-[#EAFD69] text-[#18234A] p-5 rounded-[24px] shadow-[0_10px_25px_rgba(234,253,105,0.06)] relative overflow-hidden flex flex-col justify-between group/val h-[105px]"
            >
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-[#18234A]/5 blur-xl group-hover/val:scale-125 transition-transform duration-500 pointer-events-none" />
              <div className="z-10">
                <span className="text-[10px] font-black text-[#18234A]/60 uppercase tracking-widest block mb-1">
                  {language === 'th' ? 'มูลค่าสินค้าคงคลัง' : 'Inventory Value'}
                </span>
                <span className="text-xl font-black font-sans block tracking-tight leading-none">
                  {currency}{stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="w-full h-8 z-10 flex items-end justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30" fill="none">
                  <path
                    d={sparklinePath}
                    stroke="#18234A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Widget 6: Potential Revenue Card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-[#E2DFFF] text-[#18234A] p-5 rounded-[24px] shadow-[0_10px_25px_rgba(226,223,255,0.4)] relative overflow-hidden flex flex-col justify-between group/rev h-[105px]"
            >
              <div className="absolute left-0 bottom-0 w-24 h-24 rounded-full bg-white/40 blur-xl group-hover/rev:scale-125 transition-transform duration-500 pointer-events-none" />
              <div className="z-10">
                <span className="text-[10px] font-black text-[#18234A]/60 uppercase tracking-widest block mb-1">
                  {language === 'th' ? 'มูลค่าเมื่อขายหมด' : 'Total Sell Value'}
                </span>
                <span className="text-xl font-black font-sans block tracking-tight text-[#18234A] leading-none">
                  {currency}{stats.potentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="z-10 flex items-center gap-2 mt-auto pt-2">
                <div className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center shadow-sm shrink-0">
                  {stats.totalValue > 0 && ((stats.potentialRevenue - stats.totalValue) / stats.totalValue) * 100 >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-rose-600" />
                  )}
                </div>
                {stats.potentialRevenue > 0 && (
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
                    stats.totalValue > 0 && ((stats.potentialRevenue - stats.totalValue) / stats.totalValue) * 100 >= 0 
                      ? "text-emerald-600" 
                      : "text-rose-600"
                  )}>
                    {stats.totalValue > 0 ? Math.abs(Math.round(((stats.potentialRevenue - stats.totalValue) / stats.totalValue) * 100)) : 100}% {language === 'th' ? 'กำไรจากทุน' : 'Margin'}
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Widget 7: Status Capsules */}
          <motion.div 
            variants={cardVariants}
            className="bg-white p-6 rounded-[32px] shadow-[0_20px_40px_rgba(24,35,74,0.02)] border border-gray-50 flex flex-col justify-between flex-1 min-h-[250px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[3px] h-5 bg-[#10B981] rounded-full" />
              <h3 className="text-xs font-extrabold text-[#18234A] tracking-wider uppercase">
                {language === 'th' ? 'สถานะสินค้าในคลัง' : 'Inventory Stock Status'}
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-3 flex-1 items-stretch mt-2">
              {(() => {
                const totalVolume = stats.totalSKUs || 1;
                const normalCount = stats.normalItems.length;

                const capsules = [
                  {
                    value: normalCount,
                    label: language === 'th' ? 'ปกติ' : 'In Stock',
                    textColor: 'text-[#10B981]',
                    pillBg: 'bg-gradient-to-t from-[#10B981] to-[#34D399]/40',
                    volumePercent: Math.round((normalCount / totalVolume) * 100),
                    items: stats.normalItems
                  },
                  {
                    value: stats.lowStockAlerts.length,
                    label: language === 'th' ? 'ใกล้หมด' : 'Low Stock',
                    textColor: 'text-[#D97706]',
                    pillBg: 'bg-gradient-to-t from-[#F59E0B] to-[#FBBF24]/50',
                    volumePercent: Math.round((stats.lowStockAlerts.length / totalVolume) * 100),
                    items: stats.lowStockAlerts
                  },
                  {
                    value: stats.outOfStock.length,
                    label: language === 'th' ? 'หมดเกลี้ยง' : 'Out of Stock',
                    textColor: 'text-[#EF4444]',
                    pillBg: 'bg-gradient-to-t from-[#EF4444] to-[#F87171]/40',
                    volumePercent: Math.round((stats.outOfStock.length / totalVolume) * 100),
                    items: stats.outOfStock
                  },
                  {
                    value: stats.deadStockItems.length,
                    label: language === 'th' ? 'ยังขายไม่ได้' : 'Dead Stock',
                    textColor: 'text-[#6B7280]',
                    pillBg: 'bg-gradient-to-t from-[#6B7280] to-[#9CA3AF]/40',
                    volumePercent: Math.round((stats.deadStockItems.length / totalVolume) * 100),
                    items: stats.deadStockItems
                  }
                ];

                return capsules.map((cap, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.1, duration: 0.4, type: "spring", stiffness: 100 }}
                    className="bg-gray-50/50 rounded-[20px] p-3 flex flex-col justify-between items-center text-center relative group hover:shadow-md transition-all duration-300"
                  >
                    <div className="z-10 mt-1">
                      <motion.span 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 + idx * 0.1, type: "spring", stiffness: 200, damping: 12 }}
                        className={cn("text-2xl font-black block tracking-tight font-sans", cap.textColor)}
                      >
                        {cap.value}
                      </motion.span>
                      <span className="text-[10px] font-bold text-gray-400 block mt-1.5 leading-tight whitespace-nowrap">
                        {cap.label}
                      </span>
                    </div>

                    {/* Capsule Glass Shape at Bottom */}
                    <div className="w-full h-[55%] flex items-end justify-center px-1 mb-1 rounded-[20px] absolute bottom-0 left-0 pointer-events-none">
                      <motion.div
                        initial={{ height: "0%" }}
                        animate={{ height: `${cap.value > 0 ? Math.max(15, cap.volumePercent) : 0}%` }}
                        transition={{ delay: 0.3 + idx * 0.1, duration: 0.8, type: "spring", bounce: 0.4 }}
                        className={cn("w-[80%] mx-auto rounded-t-[20px] rounded-b-[4px] opacity-90 group-hover:scale-105 transition-transform duration-500 relative", cap.pillBg)}
                      >
                        {/* Tooltip for items */}
                        {cap.items.length > 0 && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+8px)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 bg-gray-900 text-white text-[10px] rounded-lg p-2.5 shadow-xl whitespace-nowrap w-max max-w-[200px]">
                            <div className="font-bold mb-1.5 border-b border-gray-700 pb-1.5 text-center text-gray-100">{cap.label} ({cap.value})</div>
                            <ul className="text-left flex flex-col gap-1">
                              {cap.items.slice(0, 5).map(item => (
                                <li key={item.id} className="truncate text-gray-300">• {item.name}</li>
                              ))}
                              {cap.items.length > 5 && (
                                <li className="text-gray-400 italic text-center mt-1">... {language === 'th' ? `และอีก ${cap.items.length - 5} รายการ` : `and ${cap.items.length - 5} more`}</li>
                              )}
                            </ul>
                            {/* Triangle pointing down */}
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900" />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2. Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Chart 1: Inbound vs Outbound Trend (Line/Area Chart) */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-4 bg-white p-8 rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] flex flex-col justify-between relative"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-indigo-500 w-5 h-5" />
                <h3 className="text-xl font-bold text-[#18234A]">Inbound vs Outbound Trend</h3>
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                {kpiDateRange === 'today'
                  ? (language === 'th' ? 'การเคลื่อนไหวของสินค้าวันนี้' : 'Product movement today')
                  : kpiDateRange === 'yesterday'
                    ? (language === 'th' ? 'การเคลื่อนไหวของสินค้าเมื่อวาน' : 'Product movement yesterday')
                    : kpiDateRange === '7days'
                      ? (language === 'th' ? 'การเคลื่อนไหวของสินค้า 7 วันย้อนหลัง' : 'Product movement (last 7 days)')
                      : kpiDateRange === '30days'
                        ? (language === 'th' ? 'การเคลื่อนไหวของสินค้า 30 วันย้อนหลัง' : 'Product movement (last 30 days)')
                        : (language === 'th' ? 'การเคลื่อนไหวของสินค้าทั้งหมด' : 'All-time product movement')
                }
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Legends */}
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#18234A]" />
                  <span className="text-gray-500 text-[11px]">{language === 'th' ? 'นำเข้าสินค้า' : 'Inbound'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#EAFD69]" />
                  <span className="text-gray-500 text-[11px]">{language === 'th' ? 'จำหน่ายออก' : 'Outbound'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.tertiary} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={COLORS.tertiary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ stroke: '#18234A', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: '0 20px 40px rgba(24,35,74,0.08)',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: '#FFFFFF',
                    color: COLORS.primary
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Inbound"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorInbound)"
                />
                <Area
                  type="monotone"
                  dataKey="Outbound"
                  stroke={COLORS.tertiary}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorOutbound)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Best-Selling Products Ranking Card */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-4 bg-white p-8 rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xl font-bold text-[#18234A]">
              {language === 'th' ? 'ลำดับสินค้าขายดี' : 'Best-Selling Products'}
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              {language === 'th' ? '5 อันดับสินค้าขายดีตามเวลาที่เลือก' : 'Top 5 products by sales volume'}
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-start space-y-3.5 my-4">
            {bestSellers.length === 0 ? (
              <div className="text-center py-10 opacity-25">
                <Package size={36} className="mx-auto mb-3 text-[#18234A]" />
                <p className="font-bold text-xs">{language === 'th' ? 'ไม่มีข้อมูลการขายสินค้า' : 'No product sales recorded'}</p>
              </div>
            ) : (
              bestSellers.map((item, index) => {
                const rankColors = [
                  'bg-amber-50 text-amber-600 border-amber-100', // 1st
                  'bg-slate-50 text-slate-600 border-slate-100', // 2nd
                  'bg-orange-50 text-orange-600 border-orange-100', // 3rd
                  'bg-gray-50 text-gray-500 border-gray-100', // 4th
                  'bg-gray-50 text-gray-500 border-gray-100', // 5th
                ];

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50/50 hover:border-gray-100 hover:bg-[#F8F9FD]/50 transition-all group"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center font-black border text-xs shrink-0",
                      rankColors[index]
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[#18234A] text-xs truncate group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">
                        {language === 'th' ? 'ยอดขาย' : 'Revenue'}: {currency}{item.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-indigo-50 text-indigo-700 font-black text-[10px] px-2.5 py-1 rounded-full">
                        {item.quantity} {language === 'th' ? 'ชิ้น' : 'Units'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Chart 2: Inventory Value by Category (Pie Chart) */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-4 bg-white p-8 rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xl font-bold text-[#18234A]">Value by Category</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 mb-4">
              สัดส่วนมูลค่าสต็อกตามหมวดหมู่
            </p>
          </div>

          <div className="h-[210px] w-full flex items-center justify-center relative">
            {categoryChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center metric */}
                <div className="absolute flex flex-col items-center justify-center">
                  <motion.span
                    variants={subtlePulse}
                    animate="animate"
                    className="text-lg font-black text-[#18234A]"
                  >
                    {currency}{stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </motion.span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Value</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center opacity-30 text-xs font-bold uppercase">
                ไม่มีข้อมูลหมวดหมู่
              </div>
            )}
          </div>

          <div className="space-y-2 mt-4 max-h-[140px] overflow-y-auto scrollbar-hide">
            {categoryChartData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span className="font-bold text-gray-500 truncate max-w-[120px]">{entry.name}</span>
                </div>
                <span className="font-black text-[#18234A]">
                  {currency}{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 3. Data Table: Products that need attention */}
      <motion.div
        variants={cardVariants}
        className="bg-white rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] overflow-hidden"
      >
        <div className="p-8 pb-5 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-bold text-[#18234A] flex items-center gap-2">
              <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
              สินค้าต้องสั่งซื้อเร่งด่วน (Low / Out of Stock)
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              รายการสินค้าที่มีสต็อกน้อยกว่าหรือเท่ากับระดับที่ตั้งไว้ และสินค้าหมด
            </p>
          </div>
          <span className="bg-red-50 text-red-600 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider">
            {alertProducts.length} รายการเตือนภัย
          </span>
        </div>

        {/* Custom Data Table with No-Line design paradigm */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9F9F9] border-none text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">ชื่อสินค้า</th>
                <th className="px-6 py-5">หมวดหมู่</th>
                <th className="px-6 py-5 text-center">คงเหลือ / ขั้นต่ำ</th>
                <th className="px-6 py-5 text-right">ราคาต้นทุน</th>
                <th className="px-6 py-5 text-center">ประเภทสินค้า</th>
                <th className="px-8 py-5 text-center">จัดการ WMS</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {alertProducts.map((item) => {
                  const isOut = item.stock === 0;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-[#F9F9F9]/50 transition-colors duration-200"
                    >
                      {/* Name & Barcode */}
                      <td className="px-8 py-5 max-w-[280px]">
                        <div className="font-bold text-sm text-[#18234A] truncate">{item.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                          Barcode: {item.barcode || 'ไม่มีบาร์โค้ด'}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-gray-500 bg-[#F3F3F3] px-2.5 py-1 rounded-xl">
                          {item.category}
                        </span>
                      </td>

                      {/* Stock Info */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={cn(
                            "font-extrabold text-sm",
                            isOut ? "text-[#8E171D]" : "text-amber-600"
                          )}>
                            {item.stock}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">/</span>
                          <span className="text-xs font-bold text-gray-400">{item.minStock} {item.unit}</span>
                        </div>

                        {/* Progress Bar (Visual representation of stock level) */}
                        <div className="w-20 bg-gray-100 h-1.5 rounded-full mx-auto mt-2 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", isOut ? "bg-[#8E171D]" : "bg-amber-500")}
                            style={{ width: `${Math.min(100, Math.max(5, (item.stock / item.minStock) * 100))}%` }}
                          />
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="px-6 py-5 text-right font-bold text-[#18234A] text-sm">
                        {currency}{item.costPrice.toLocaleString()}
                      </td>

                      {/* Consignment Status */}
                      <td className="px-6 py-5 text-center">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full",
                          item.isConsignment
                            ? "bg-[#D9D6FE] text-[#4F46E5]"
                            : "bg-emerald-50 text-emerald-600"
                        )}>
                          {item.isConsignment ? 'สินค้าฝากขาย' : 'สินค้าปกติ'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5 text-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReorder(item.id, item.name)}
                          disabled={reorderingId === item.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all",
                            reorderingId === item.id
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                              : "bg-[#18234A] text-white hover:bg-[#020d35] hover:shadow-[0_10px_20px_rgba(24,35,74,0.15)]"
                          )}
                        >
                          {reorderingId === item.id ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" />
                              Ordering...
                            </>
                          ) : (
                            <>
                              <Zap size={11} className="text-[#EAFD69]" />
                              Reorder
                            </>
                          )}
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}

                {alertProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                        <span>ทุกสินค้ามีระดับสต็อกปลอดภัยดี! ไม่พบสินค้าสต็อกต่ำ</span>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Sales Transactions Details Modal */}
      <AnimatePresence>
        {isSalesModalOpen && (
          <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            {/* Backdrop click handler */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsSalesModalOpen(false)} />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 border border-gray-100"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#F9F9F9]">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">
                    {selectedSalesDate
                      ? (language === 'th' ? `รายการขายวันที่ ${formattedModalDate}` : `Sales for ${formattedModalDate}`)
                      : (language === 'th' ? 'รายการขายทั้งหมด' : 'All Sales Transactions')
                    }
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {language === 'th'
                      ? `พบทั้งหมด ${modalTransactions.length} รายการ`
                      : `Found ${modalTransactions.length} transactions`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setIsSalesModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filters / Search inside modal */}
              <div className="px-8 py-4 border-b border-gray-50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3 text-xs font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                    placeholder={language === 'th' ? 'ค้นหาลูกค้า, พนักงาน หรือ ชื่อสินค้า...' : 'Search customer, staff or item...'}
                    value={modalSearchQuery}
                    onChange={e => setModalSearchQuery(e.target.value)}
                  />
                </div>
                {selectedSalesDate && (
                  <button
                    onClick={() => setSelectedSalesDate(null)}
                    className="px-4 py-2 text-[10px] font-black uppercase text-[#2563EB] bg-[#2563EB]/10 rounded-full hover:bg-[#2563EB]/15 transition-all flex items-center gap-1.5"
                  >
                    <Calendar size={12} />
                    {language === 'th' ? 'แสดงทั้งหมดทุกวันที่' : 'Show All Dates'}
                  </button>
                )}
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-[#F9F9F9]/50 min-h-[300px]">
                {filteredModalTransactions.length > 0 ? (
                  filteredModalTransactions.map((tx) => {
                    const isExpanded = expandedTxId === tx.id;

                    // Format time if createdAt exists
                    let timeStr = '';
                    if (tx.createdAt) {
                      try {
                        const dateObj = new Date(tx.createdAt);
                        timeStr = dateObj.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        }) + (language === 'th' ? ' น.' : '');
                      } catch (e) {
                        timeStr = '';
                      }
                    }

                    return (
                      <div
                        key={tx.id}
                        className="bg-white rounded-[32px] border border-gray-100/80 shadow-[0_4px_20px_rgba(24,35,74,0.02)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(24,35,74,0.04)]"
                      >
                        {/* Transaction Card Header Summary */}
                        <div
                          className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none"
                          onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                              <ShoppingCart size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-[#18234A]">{getTransactionItemNamesLabel(tx.items)}</span>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                                  tx.paymentMethod === 'Cash'
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : tx.paymentMethod === 'Transfer'
                                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                                      : "bg-purple-50 text-purple-600 border border-purple-100"
                                )}>
                                  {tx.paymentMethod}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 font-bold">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} className="text-gray-300" />
                                  {tx.date} {timeStr && `• ${timeStr}`}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User size={12} className="text-gray-300" />
                                  {tx.customerName || 'Walk-in Customer'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-gray-50 pt-3 md:pt-0">
                            <div className="text-left md:text-right">
                              <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider leading-none mb-1">Total Amount</span>
                              <span className={cn("text-lg font-black font-sans", tx.amount < 0 ? "text-red-500" : "text-[#18234A]")}>
                                {tx.amount < 0 ? `-${currency}${Math.abs(tx.amount).toLocaleString()}` : `${currency}${tx.amount.toLocaleString()}`}
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Transaction Card Body Details (Expandable) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-gray-50 bg-[#F9F9F9]/30 overflow-hidden"
                            >
                              <div className="p-6 space-y-4">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
                                  {language === 'th' ? 'รายการสินค้าที่ขาย' : 'Items Ordered'}
                                </div>

                                <div className="space-y-2">
                                  {tx.items?.map((item: any, idx: number) => {
                                    const qty = item.quantity || 1;
                                    const price = item.finalPrice !== undefined ? item.finalPrice : item.price;
                                    return (
                                      <div key={idx} className="flex justify-between items-center text-xs text-gray-600 bg-white p-3 rounded-2xl border border-gray-50">
                                        <div className="flex flex-col">
                                          <span className="font-extrabold text-[#18234A]">{item.title || item.name}</span>
                                          {item.isConsignment && (
                                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider mt-0.5">สินค้าฝากขาย (Consignment)</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-6">
                                          <span className="font-bold text-gray-400">x{qty}</span>
                                          <span className={cn("font-black min-w-[70px] text-right", price * qty < 0 ? "text-red-500" : "text-[#18234A]")}>
                                            {price * qty < 0 ? `-${currency}${Math.abs(price * qty).toLocaleString()}` : `${currency}${(price * qty).toLocaleString()}`}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Financial breakdown summary */}
                                <div className="pt-2 flex flex-col items-end space-y-1.5 text-xs border-t border-gray-50">
                                  {tx.discountAmount > 0 && (
                                    <div className="flex justify-between w-60 text-gray-400">
                                      <span className="font-bold">{language === 'th' ? 'ส่วนลด:' : 'Discount:'}</span>
                                      <span className="font-bold text-red-500">-{currency}{tx.discountAmount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {tx.vatAmount !== undefined && tx.vatAmount > 0 && (
                                    <div className="flex justify-between w-60 text-gray-400">
                                      <span className="font-bold">VAT ({tx.vatRate || 0}%):</span>
                                      <span className="font-bold">{currency}{tx.vatAmount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between w-60 text-base font-black border-t border-gray-50 pt-2 text-[#18234A]">
                                    <span>{language === 'th' ? 'ยอดสุทธิ:' : 'Grand Total:'}</span>
                                    <span className={cn("font-sans font-black", tx.amount < 0 ? "text-red-500" : "text-[#18234A]")}>
                                      {tx.amount < 0 ? `-${currency}${Math.abs(tx.amount).toLocaleString()}` : `${currency}${tx.amount.toLocaleString()}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider pt-2 border-t border-gray-50">
                                  <span>ID: {tx.id}</span>
                                  <span>{language === 'th' ? `พนักงานขาย: ${tx.staffName}` : `Sold by: ${tx.staffName}`}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center opacity-30 flex flex-col items-center justify-center">
                    <ShoppingCart size={48} className="text-gray-400 mb-3" />
                    <p className="font-black text-sm">
                      {language === 'th' ? 'ไม่พบรายการที่ค้นหา' : 'No matching transactions found'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
