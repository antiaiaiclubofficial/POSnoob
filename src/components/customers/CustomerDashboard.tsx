import React, { useMemo, useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { translations } from '@/utils/translations';
import { motion } from 'framer-motion';
import { Users, Cat, Star, TrendingUp, Trophy, Award, Filter, ChevronDown, Search, ShoppingBag, Calendar, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateRangeDropdown, DateRange } from '@/components/ui/date-range-dropdown';

interface CustomerDashboardProps {
  onSelectCustomer?: (id: string, segment?: any) => void;
  initialSegment?: {
    mode: 'loyalty' | 'tier';
    id: string;
    label: string;
    color: string;
  } | null;
  hideTitle?: boolean;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onSelectCustomer, initialSegment = null, hideTitle = false }) => {
  const { customers, transactions, language, currency, tierRules, storeId } = useStore();
  const t = translations[language];

  // Fetch actual DB tiers if available
  const { data: dbTiers } = useQuery({
    queryKey: ['membership_tiers_dashboard', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('store_id', storeId)
        .order('min_points', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId,
  });

  // State for toggling ratio mode
  const [ratioMode, setRatioMode] = useState<'loyalty' | 'tier'>('loyalty');
  const [selectedSegment, setSelectedSegment] = useState<{
    mode: 'loyalty' | 'tier';
    id: string;
    label: string;
    color: string;
  } | null>(initialSegment);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const isDragging = useRef(false);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!dateRange?.from) return transactions;
    
    return transactions.filter(tx => {
      const txTime = new Date(tx.createdAt || tx.date).getTime();
      const fromTime = dateRange.from!.getTime();
      const toTime = dateRange.to ? dateRange.to.getTime() : new Date().getTime();
      return txTime >= fromTime && txTime <= toTime;
    });
  }, [transactions, dateRange]);

  // Calculations
  const stats = useMemo(() => {
    let totalPets = 0;
    let totalPoints = 0;

    // Create maps from transactions for accurate stats matching the main Dashboard
    const visitMap: Record<string, number> = {};
    const spendMap: Record<string, number> = {};
    const lastVisitMap: Record<string, number> = {};
    const firstVisitMap: Record<string, number> = {};

    let walkInCustomers = 0;

    if (filteredTransactions) {
      filteredTransactions.forEach(tx => {
        if (!tx.customerId || tx.customerId === 'walk-in' || tx.customerId === 'walk-id') {
          walkInCustomers++;
        } else if (tx.customerId) {
          visitMap[tx.customerId] = (visitMap[tx.customerId] || 0) + 1;
          spendMap[tx.customerId] = (spendMap[tx.customerId] || 0) + (tx.amount || 0);

          const txTime = new Date(tx.createdAt || tx.date).getTime();
          if (!isNaN(txTime)) {
            const currentLast = lastVisitMap[tx.customerId] || 0;
            if (txTime > currentLast) lastVisitMap[tx.customerId] = txTime;

            const currentFirst = firstVisitMap[tx.customerId] || Infinity;
            if (txTime < currentFirst) firstVisitMap[tx.customerId] = txTime;
          }
        }
      });
    }

    const todayTime = new Date().setHours(0, 0, 0, 0);
    const twoMonthsAgoTime = todayTime - 60 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoTime = oneMonthAgo.getTime();

    const customerStats = customers.map(customer => {
      customer.pets?.forEach(pet => {
        totalPets++;
      });

      totalPoints += (customer.points || 0);

      const visits = visitMap[customer.id] || 0;
      let spent = spendMap[customer.id] || 0;

      // fallback totalSpent to store value if calculation is 0
      if (spent === 0 && customer.totalSpent > 0) {
        spent = customer.totalSpent;
      }

      return {
        ...customer,
        visits,
        spent,
        lastVisitTime: lastVisitMap[customer.id] || 0,
        firstVisitTime: firstVisitMap[customer.id] || Infinity,
      };
    });

    let noVisits = 0; // Churned
    let oneTime = 0;  // New
    let regularCustomers = 0; // Regular
    let loyalCustomers = 0; // Loyal

    // Determine actual tiers to use (from DB or fallback to store)
    let actualTiers: any[] = [];
    if (dbTiers && dbTiers.length > 0) {
      actualTiers = dbTiers.map((t: any) => ({
        level: t.name,
        label: t.name,
        minSpent: t.min_points,
        colorClass: t.color_class
      }));
    } else if (tierRules) {
      actualTiers = tierRules;
    }

    const tierCounts: Record<string, number> = {};
    if (actualTiers) {
      actualTiers.forEach(r => tierCounts[r.level] = 0);
    }

    customerStats.forEach(c => {
      const regTime = c.createdAt ? new Date(c.createdAt).getTime() : c.firstVisitTime;
      const registrationDate = new Date(regTime !== Infinity ? regTime : 0);
      registrationDate.setHours(0, 0, 0, 0);
      const isNewToday = regTime !== Infinity && registrationDate.getTime() === todayTime;

      const isChurned = c.visits > 0 && c.lastVisitTime > 0 && c.lastVisitTime < twoMonthsAgoTime;

      if (isChurned) {
        noVisits++;
      } else if (c.visits === 0) {
        // Walk-in treated as no visits
      } else if (c.visits === 1) {
        oneTime++;
      } else if (c.visits >= 2 && c.visits <= 4) {
        regularCustomers++;
      } else if (c.visits >= 5) {
        loyalCustomers++;
      }

      if (actualTiers && actualTiers.length > 0) {
        if (c.membership) {
          const memLower = String(c.membership).toLowerCase().trim();
          const matchedRule = actualTiers.find(t => {
            const levelLower = String(t.level || '').toLowerCase().trim();
            const labelLower = String(t.label || '').toLowerCase().trim();
            return levelLower === memLower ||
              labelLower === memLower ||
              memLower.includes(labelLower) ||
              memLower.includes(levelLower) ||
              labelLower.includes(memLower) ||
              levelLower.includes(memLower);
          });
          if (matchedRule) tierCounts[matchedRule.level]++;
        }
      }
    });

    const loyaltyDataArray: any[] = [
      { id: 'churned', count: noVisits, color: '#767777', label: language === 'th' ? 'ไม่กลับมาใช้' : 'Churned', labelFull: language === 'th' ? 'ไม่กลับมาใช้ (>2m)' : 'Churned (>2m)', tooltip: 'ไม่ได้มาใช้บริการนานกว่า 2 เดือน', percent: 0 },
      { id: 'walkin', count: walkInCustomers, color: '#EAFD69', label: language === 'th' ? 'ทั่วไป' : 'Walk-in', labelFull: language === 'th' ? 'ขาจร' : 'Walk-in', tooltip: 'ลูกค้าทั่วไป หรือไม่ได้ระบุตัวตน', percent: 0 },
      { id: 'onetime', count: oneTime, color: '#C5C3EA', label: language === 'th' ? 'ใหม่' : 'New', labelFull: language === 'th' ? 'หน้าใหม่ (1 ครั้ง)' : 'One-time', tooltip: 'เพิ่งมาใช้บริการ 1 ครั้ง', percent: 0 },
      { id: 'regular', count: regularCustomers, color: '#4FD1C5', label: language === 'th' ? 'ประจำ' : 'Regular', labelFull: language === 'th' ? 'ขาประจำ (2-4 ครั้ง)' : 'Regular (2-4)', tooltip: 'มาใช้บริการ 2-4 ครั้ง', percent: 0 },
      { id: 'loyal', count: loyalCustomers, color: '#FF7E67', label: language === 'th' ? 'มาบ่อย' : 'Frequent', labelFull: language === 'th' ? 'มาบ่อย (5+ ครั้ง)' : 'Frequent (5+)', tooltip: 'มาใช้บริการ 5 ครั้งขึ้นไป', percent: 0 },
    ];

    const totalLoyalty = loyaltyDataArray.reduce((acc, curr) => acc + curr.count, 0);
    loyaltyDataArray.forEach(item => {
      item.percent = totalLoyalty > 0 ? Math.round((item.count / totalLoyalty) * 100) : 0;
    });

    const tierDataArray: any[] = [];
    tierDataArray.push({ id: 'walkin', count: walkInCustomers, color: '#EAFD69', label: language === 'th' ? 'ทั่วไป' : 'Walk-in', labelFull: language === 'th' ? 'ขาจร' : 'Walk-in', tooltip: 'ลูกค้าทั่วไป' });

    if (actualTiers) {
      actualTiers.forEach((rule) => {
        let hexColor = '#EAFD69';

        // Map DB color_class to a nice hex color for gradients
        if (rule.colorClass) {
          if (rule.colorClass.includes('gray')) hexColor = '#9CA3AF';
          else if (rule.colorClass.includes('blue')) hexColor = '#60A5FA';
          else if (rule.colorClass.includes('amber')) hexColor = '#FBBF24';
          else if (rule.colorClass.includes('purple')) hexColor = '#A78BFA';
          else if (rule.colorClass.includes('indigo')) hexColor = '#818CF8';
          else if (rule.colorClass.includes('rose')) hexColor = '#FB7185';
        } else {
          // Fallback based on name if no colorClass
          const nameLower = (rule.label || rule.level).toLowerCase();
          if (nameLower.includes('silver')) hexColor = '#9CA3AF';
          if (nameLower.includes('gold')) hexColor = '#FBBF24';
          if (nameLower.includes('vip') || nameLower.includes('platinum')) hexColor = '#818CF8';
          if (nameLower.includes('bronze')) hexColor = '#EAFD69';
        }

        tierDataArray.push({
          id: rule.level,
          count: tierCounts[rule.level] || 0,
          color: hexColor,
          label: rule.label || rule.level,
          labelFull: `${rule.label || rule.level} Tier`,
          tooltip: `เงื่อนไข: ยอดใช้จ่ายสะสมขั้นต่ำ ${rule.minSpent.toLocaleString()} บาท`
        });
      });
    }

    const totalTier = tierDataArray.reduce((acc, curr) => acc + curr.count, 0);
    tierDataArray.forEach(item => {
      item.percent = totalTier > 0 ? Math.round((item.count / totalTier) * 100) : 0;
    });

    // newCustomers is just mapped for the top stats compatibility
    const newCustomers = oneTime;

    const totalWithVisits = customerStats.filter(c => c.visits > 0).length;
    const retentionRate = totalWithVisits > 0 ? (regularCustomers + loyalCustomers) / totalWithVisits * 100 : 0;

    const frequentCustomers = [...customerStats].sort((a, b) => b.visits - a.visits).slice(0, 5);
    const topSpenders = [...customerStats].sort((a, b) => b.spent - a.spent).slice(0, 5);

    const funnelStages = [
      { id: 'awareness', label: language === 'th' ? 'ลูกค้าทั้งหมดในระบบ' : 'Total Customers', count: 0 },
      { id: 'activation', label: language === 'th' ? 'มีสัตว์เลี้ยง' : 'With Pets', count: 0 },
      { id: 'conversion', label: language === 'th' ? 'เคยมาใช้บริการแล้ว' : 'First Visit', count: 0 },
      { id: 'retention', label: language === 'th' ? 'กลับมาใช้ซ้ำ (Retention)' : 'Retained', count: 0 },
      { id: 'loyalty', label: language === 'th' ? 'ลูกค้า Loyalty' : 'Loyalty Customers', count: 0 },
    ];

    let awareness = customerStats.length;
    let activation = customerStats.filter(c => c.pets && c.pets.length > 0).length;
    let conversion = customerStats.filter(c => c.visits >= 1).length;
    let retention = customerStats.filter(c => c.visits >= 2).length;
    let loyalty = customerStats.filter(c => c.membership !== 'Standard' || c.visits >= 5).length;

    funnelStages[0].count = awareness;
    funnelStages[1].count = activation;
    funnelStages[2].count = conversion;
    funnelStages[3].count = retention;
    funnelStages[4].count = loyalty;

    return {
      totalCustomers: customers.length,
      totalPets,
      totalPoints,
      newCustomers,
      regularCustomers,
      retentionRate,
      frequentCustomers,
      topSpenders,
      funnelStages,
      loyaltyDataArray,
      tierDataArray,
      customerStats,
    };
  }, [customers, language, filteredTransactions, tierRules, dbTiers]);

  const getFilteredItems = () => {
    if (!selectedSegment) return [];
    
    const todayTime = new Date().setHours(0, 0, 0, 0);
    const twoMonthsAgoTime = todayTime - 60 * 24 * 60 * 60 * 1000;

    if (selectedSegment.mode === 'loyalty') {
      if (selectedSegment.id === 'walkin') {
        const walkInTx = filteredTransactions ? filteredTransactions.filter(tx => !tx.customerId || tx.customerId === 'walk-in' || tx.customerId === 'walk-id') : [];
        return [...walkInTx].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      }

      return stats.customerStats.filter(c => {
        const isChurned = c.visits > 0 && c.lastVisitTime > 0 && c.lastVisitTime < twoMonthsAgoTime;
        if (selectedSegment.id === 'churned') return isChurned;
        if (isChurned) return false;
        
        if (selectedSegment.id === 'onetime') return c.visits === 1;
        if (selectedSegment.id === 'regular') return c.visits >= 2 && c.visits <= 4;
        if (selectedSegment.id === 'loyal') return c.visits >= 5;
        return false;
      });
    } else {
      if (selectedSegment.id === 'walkin') {
        const walkInTx = filteredTransactions ? filteredTransactions.filter(tx => !tx.customerId || tx.customerId === 'walk-in' || tx.customerId === 'walk-id') : [];
        return [...walkInTx].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      }

      return stats.customerStats.filter(c => {
        if (!c.membership) return false;
        const memLower = String(c.membership).toLowerCase().trim();
        const levelLower = String(selectedSegment.id).toLowerCase().trim();
        return memLower === levelLower ||
          levelLower.includes(memLower) ||
          memLower.includes(levelLower);
      });
    }
  };

  const filteredItems = useMemo(() => {
    const items = getFilteredItems();
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase().trim();

    if (selectedSegment?.id === 'walkin') {
      return (items as any[]).filter(tx => 
        (tx.id && tx.id.toLowerCase().includes(query)) ||
        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(query)) ||
        (tx.amount && String(tx.amount).includes(query)) ||
        (tx.staffName && tx.staffName.toLowerCase().includes(query))
      );
    }

    return (items as any[]).filter(c => 
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.membership && c.membership.toLowerCase().includes(query))
    );
  }, [selectedSegment, searchQuery, stats.customerStats, filteredTransactions]);

  const formatDate = (time: number | string | undefined) => {
    if (!time || time === Infinity || time === 0) return language === 'th' ? 'ไม่มีข้อมูล' : 'N/A';
    const date = new Date(time);
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, isPrimary = false }: any) => (
    <div className={cn(
      "p-6 rounded-[32px] flex items-center justify-between transition-all",
      isPrimary ? "bg-gradient-to-br from-[#18234A] to-[#020D35] text-white shadow-xl shadow-indigo-900/20 rounded-[3rem]" : "bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(24,35,74,0.04)] rounded-[3rem]"
    )}>
      <div>
        <p className={cn("text-xs font-black uppercase tracking-widest mb-2", isPrimary ? "text-[#EAFD69]" : "text-gray-400")}>
          {title}
        </p>
        <p className="text-3xl font-black mb-1">{value}</p>
        {subtitle && (
          <p className={cn("text-[10px] font-bold", isPrimary ? "text-white/60" : "text-gray-400")}>{subtitle}</p>
        )}
      </div>
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
        isPrimary ? "bg-white/10" : "bg-[#F5F6FA] text-[#18234A]"
      )}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className={cn("mb-8 flex flex-col md:flex-row md:items-center gap-4", hideTitle ? "justify-end" : "justify-between")}>
        {!hideTitle && (
          <div>
            <h2 className="text-3xl font-black text-[#1A1F3D]">
              {language === 'th' ? 'ภาพรวมลูกค้าสัมพันธ์' : 'Customer Overview'}
            </h2>
            <p className="text-gray-400 text-sm font-medium mt-2">
              {language === 'th' ? 'ข้อมูลสถิติและการวิเคราะห์ลูกค้า' : 'Analytics and insights for your customers'}
            </p>
          </div>
        )}
        <DateRangeDropdown 
          language={language}
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={language === 'th' ? 'ลูกค้าที่กลับมาใช้บริการซ้ำ' : 'Retention Rate'}
          value={`${stats.retentionRate.toFixed(1)}%`}
          subtitle={language === 'th' ? 'จากลูกค้าที่เคยมาใช้บริการ' : 'Of all visiting customers'}
          icon={TrendingUp}
          isPrimary={true}
        />
        <StatCard
          title={language === 'th' ? 'ลูกค้าทั้งหมด' : 'Total Customers'}
          value={stats.totalCustomers.toLocaleString()}
          icon={Users}
        />
        <StatCard
          title={language === 'th' ? 'จำนวนสัตว์ทั้งหมด' : 'Total Pets'}
          value={stats.totalPets.toLocaleString()}
          icon={Cat}
        />
        <StatCard
          title={language === 'th' ? 'คะแนนที่ออกไปแล้ว' : 'Points Issued'}
          value={stats.totalPoints.toLocaleString()}
          subtitle="PTS"
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 mb-8">
        {/* Ratio Chart (Glassmorphic & Gradient UI) */}
        <div className="w-full lg:col-span-6 bg-white/80 backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-white/40 flex flex-col relative overflow-hidden font-sans">

          {/* Decorative Background Glows for the card */}
          <div className="absolute -top-20 -left-20 w-[200px] h-[200px] bg-[#4299E1]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-[250px] h-[250px] bg-[#EAFD69]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
            <h3 className="text-xl font-black text-slate-800 drop-shadow-sm">
              {language === 'th' ? 'สัดส่วนลูกค้า' : 'Customer Ratio'}
            </h3>

            {/* Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
              <button
                onClick={() => setRatioMode('loyalty')}
                className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", ratioMode === 'loyalty' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
              >
                {language === 'th' ? 'ประเภท' : 'Type'}
              </button>
              <button
                onClick={() => setRatioMode('tier')}
                className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", ratioMode === 'tier' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
              >
                {language === 'th' ? 'ระดับสมาชิก' : 'Tier'}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[260px] relative flex items-center justify-center">
            {[...(ratioMode === 'loyalty' ? stats.loyaltyDataArray : stats.tierDataArray)]
              .sort((a, b) => b.count - a.count)
              .map((item, index) => {
                // Fixed layout positions for up to 7 spheres
                const positions = [
                  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30", // center (biggest)
                  "right-0 lg:-right-4 xl:right-4 top-2 z-20", // top right
                  "left-0 lg:-left-2 xl:left-4 bottom-6 z-20", // bottom left
                  "left-8 lg:left-4 xl:left-12 top-6 z-10", // top left
                  "right-8 lg:right-4 xl:right-12 bottom-6 z-10", // bottom right
                  "left-1/2 top-4 -translate-x-1/2 z-10", // top center
                  "left-1/2 bottom-0 -translate-x-1/2 z-10", // bottom center
                ];
                const pos = positions[index % positions.length];
                const isZero = item.percent === 0;
                const minSize = isZero ? 24 : Math.max(50, 90 - (index * 10)); // 90, 80, 70...
                const scaleMultiplier = index === 0 && !isZero ? 1.2 : 1.1;
                const isLightColor = item.color === '#EAFD69' || item.color === '#C5C3EA';

                return (
                  <motion.div
                    key={item.id}
                    drag
                    dragConstraints={{ left: -200, right: 200, top: -100, bottom: 150 }}
                    dragElastic={0.1}
                    whileHover={{ scale: 1.05 }}
                    whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                    onDragStart={() => {
                      isDragging.current = true;
                    }}
                    onDragEnd={() => {
                      setTimeout(() => {
                        isDragging.current = false;
                      }, 150);
                    }}
                    onClick={() => {
                      if (isDragging.current) return;
                      setSelectedSegment({
                        mode: ratioMode,
                        id: item.id,
                        label: item.labelFull || item.label,
                        color: item.color
                      });
                      setSearchQuery('');
                    }}
                    initial={{ width: minSize, height: minSize, opacity: 0, scale: 0.5 }}
                    animate={{
                      width: minSize + (isZero ? 0 : item.percent * scaleMultiplier),
                      height: minSize + (isZero ? 0 : item.percent * scaleMultiplier),
                      opacity: isZero ? 0.6 : 1,
                      scale: 1,
                      y: [0, -6 - (index * 1), 0],
                      x: [0, index % 2 === 0 ? 5 + (index * 0.5) : -5 - (index * 0.5), 0]
                    }}
                    transition={{
                      width: { type: "spring", stiffness: 100, damping: 15, delay: 0.1 + (index * 0.2) },
                      height: { type: "spring", stiffness: 100, damping: 15, delay: 0.1 + (index * 0.2) },
                      opacity: { duration: 0.5 },
                      scale: { type: "spring", stiffness: 100, damping: 15, delay: 0.1 + (index * 0.2) },
                      y: { duration: 12 + index * 2, repeat: Infinity, ease: "easeInOut" },
                      x: { duration: 14 + index * 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className={cn("group absolute rounded-full backdrop-blur-xl flex items-center justify-center shadow-[inset_0_0_30px_rgba(255,255,255,0.6),0_15px_30px_rgba(0,0,0,0.1)] cursor-pointer active:cursor-grabbing", pos)}
                    style={{
                      background: `linear-gradient(135deg, ${item.color}E6, ${item.color}80)`,
                      borderColor: `${item.color}CC`,
                      borderWidth: '1px'
                    }}
                  >
                    <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-max max-w-[200px] px-3 py-2 bg-slate-800/95 backdrop-blur-sm text-white text-xs font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none shadow-xl border border-white/10 text-center">
                        <span className="font-black text-sm block mb-1 drop-shadow-sm" style={{ color: item.color }}>{item.labelFull}</span>
                        <span className="text-white/80 leading-relaxed whitespace-pre-wrap">{item.tooltip}</span>
                      </div>
                      
                    {!isZero && (
                      <span className={cn("font-black tracking-tighter drop-shadow-sm", isLightColor ? 'text-slate-800' : 'text-white')} style={{ fontSize: `${Math.max(1, 1 + item.percent * 0.03)}rem` }}>
                        {item.percent}<span style={{ fontSize: '0.4em' }}>%</span>
                      </span>
                    )}
                  </motion.div>
                );
              })}
          </div>

          {/* Bottom Stats */}
          <div className="flex flex-row flex-nowrap overflow-x-auto gap-6 md:gap-10 lg:justify-between mt-8 relative z-30 pb-2 scrollbar-hide">
            {(ratioMode === 'loyalty' ? stats.loyaltyDataArray : stats.tierDataArray)
              .map(item => (
                <div 
                  key={item.id} 
                  className="text-left shrink-0 cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-all duration-200 active:scale-95 border border-transparent hover:border-slate-100/50"
                  onClick={() => {
                    setSelectedSegment({
                      mode: ratioMode,
                      id: item.id,
                      label: item.labelFull || item.label,
                      color: item.color
                    });
                    setSearchQuery('');
                  }}
                >
                  <p className="text-2xl font-black text-slate-800">{item.count}</p>
                  <p className="text-[10px] md:text-[11px] text-slate-500 flex items-center gap-1.5 mt-1 font-bold uppercase tracking-wider truncate">
                    <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></span>
                    {item.label}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Customer Journey Funnel */}
        <div className="w-full lg:col-span-5 bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[3rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-white/40 relative overflow-hidden font-sans">
          {/* Exact Image Grid Background */}
          <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'linear-gradient(#F1F5F9 1px, transparent 1px), linear-gradient(90deg, #F1F5F9 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center' }} />

          {/* Soft light radial gradient in top left like the image */}
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-br from-white/80 to-transparent pointer-events-none" />

          <div className="relative z-10 mb-8 pl-2 md:pl-4">
            <h3 className="text-2xl font-black text-[#1A202C] tracking-tight">
              {language === 'th' ? 'พฤติกรรมลูกค้า (Customer Funnel)' : 'Customer Funnel'}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {language === 'th' ? 'วิเคราะห์อัตราการเปลี่ยนผ่านของลูกค้าในแต่ละระดับ' : 'Customer behavior dataset, live analytics'}
            </p>
          </div>

          <div className="relative z-10 w-full flex flex-col md:flex-row gap-0 md:gap-4">

            {/* Left Step Indicators (Hidden on mobile) */}
            <div className="hidden md:flex w-16 shrink-0 relative flex-col gap-3 py-4">
              {/* Exactly reproduced inward sloping thin grey line */}
              <svg className="absolute inset-0 w-full h-full z-0" pointerEvents="none">
                <path d="M 40,32 L 45,108 L 50,184 L 55,260 L 60,336" stroke="#E2E8F0" strokeWidth="1" fill="none" />
              </svg>

              {stats.funnelStages.map((_, idx) => (
                <div key={`step-${idx}`} className="h-16 flex items-center relative z-10" style={{ paddingLeft: `${idx * 5}px` }}>
                  <span className="text-[10px] font-bold text-gray-500 bg-white px-1 rounded whitespace-nowrap">Step {idx + 1}</span>
                </div>
              ))}
            </div>

            {/* Center Funnel Trapezoids */}
            <div className="flex-1 flex flex-col gap-3 py-4 relative">
              {stats.funnelStages.map((stage, idx) => {
                const maxCount = stats.funnelStages[0].count || 1;
                const prevCount = idx === 0 ? maxCount : stats.funnelStages[idx - 1].count;
                const conversionRate = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0;

                // Widths that progressively shrink to form a rounded funnel
                const visualWidths = [100, 85, 70, 55, 45];
                const w = visualWidths[idx] || visualWidths[4];

                const styles = [
                  { bg: 'bg-gradient-to-b from-[#7084FF]/70 to-[#5C6BF0]/50 backdrop-blur-2xl border border-white/30', shadow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_10px_30px_rgba(112,132,255,0.15)]', text: 'text-white', num: 'text-white' },
                  { bg: 'bg-gradient-to-b from-[#4299E1]/65 to-[#3182CE]/45 backdrop-blur-2xl border border-white/40', shadow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.7),0_10px_30px_rgba(66,153,225,0.12)]', text: 'text-white', num: 'text-white' },
                  { bg: 'bg-gradient-to-b from-[#38B2AC]/60 to-[#319795]/40 backdrop-blur-2xl border border-white/50', shadow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_10px_30px_rgba(56,178,172,0.1)]', text: 'text-white', num: 'text-white' },
                  { bg: 'bg-gradient-to-b from-white/80 to-white/50 backdrop-blur-2xl border border-white/70', shadow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,1),0_10px_30px_rgba(0,0,0,0.05)]', text: 'text-[#4A5568]', num: 'text-[#1A202C]' },
                  { bg: 'bg-gradient-to-b from-[#5AD89B]/80 to-[#4ECB8D]/60 backdrop-blur-2xl border border-white/60', shadow: 'shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_10px_30px_rgba(90,216,155,0.2)]', text: 'text-white', num: 'text-white' },
                ];
                const style = styles[idx] || styles[0];

                return (
                  <div key={stage.id} className="w-full flex justify-center relative">
                    <div
                      className={cn(
                        "h-16 flex flex-col items-center justify-center relative transition-all duration-1000 rounded-3xl",
                        style.bg,
                        style.shadow
                      )}
                      style={{ width: `${w}%` }}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/[0.2] pointer-events-none" />
                      <div className="flex items-baseline gap-2">
                        <span className={cn("text-[11px] md:text-xs font-semibold tracking-wide", style.text)}>{stage.label}</span>
                        <span className={cn("text-xl md:text-2xl font-black tracking-tight leading-none", style.num)}>{stage.count.toLocaleString()}</span>
                        {idx > 0 && <span className={cn("text-[9px] md:text-[10px] font-semibold", style.text)}>({conversionRate}.0%)</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Frequent Customers */}
        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-white/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h3 className="text-xl font-black text-[#1A1F3D]">
              {language === 'th' ? 'ลูกค้าที่มาบ่อยที่สุด' : 'Most Frequent'}
            </h3>
          </div>
          <div className="space-y-4">
            {stats.frequentCustomers.map((customer, idx) => (
              <div key={customer.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500 overflow-hidden shrink-0">
                    {customer.avatarUrl ? <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full object-cover" /> : customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1A1F3D]">{customer.name}</p>
                    <p className="text-[10px] text-gray-400">{customer.pets.length} Pets</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-indigo-600">{customer.visits}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">{language === 'th' ? 'ครั้ง' : 'Visits'}</p>
                </div>
              </div>
            ))}
            {stats.frequentCustomers.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm font-medium">No data available</div>
            )}
          </div>
        </div>

        {/* Highest Paying Customers */}
        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-white/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <h3 className="text-xl font-black text-[#1A1F3D]">
              {language === 'th' ? 'ยอดชำระสูงสุด' : 'Top Spenders'}
            </h3>
          </div>
          <div className="space-y-4">
            {stats.topSpenders.map((customer, idx) => (
              <div key={customer.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500 overflow-hidden shrink-0">
                    {customer.avatarUrl ? <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full object-cover" /> : customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1A1F3D]">{customer.name}</p>
                    <p className="text-[10px] text-gray-400">{customer.membership}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-600">{currency}{customer.spent.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Spent</p>
                </div>
              </div>
            ))}
            {stats.topSpenders.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm font-medium">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog for displaying segment customer list / transactions */}
      <Dialog open={!!selectedSegment} onOpenChange={(open) => !open && setSelectedSegment(null)}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl p-6 sm:p-8 font-sans overflow-hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black text-[#1A1F3D]">
              <span className="w-4 h-4 rounded-full inline-block shadow-lg shrink-0" style={{ backgroundColor: selectedSegment?.color || '#3B82F6', boxShadow: `0 0 12px ${selectedSegment?.color || '#3B82F6'}` }}></span>
              <span>{selectedSegment?.label}</span>
              <span className="text-sm font-bold bg-[#F5F6FA] text-slate-500 px-3 py-1 rounded-full border border-slate-100/50">
                {filteredItems.length} {language === 'th' ? 'รายการ' : 'records'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={
                selectedSegment?.id === 'walkin'
                  ? (language === 'th' ? 'ค้นหารหัสชำระเงิน หรือช่องทาง...' : 'Search Transaction ID or payment method...')
                  : (language === 'th' ? 'ค้นหาชื่อ, เบอร์โทรศัพท์ หรือระดับสมาชิก...' : 'Search name, phone, or tier...')
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium text-sm text-slate-800"
            />
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {selectedSegment?.id === 'walkin' ? (
              // Display walkin transactions
              (filteredItems as any[]).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-[#F8FAFC]/55 hover:bg-[#F1F5F9]/60 border border-slate-100 rounded-2xl transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 truncate max-w-[200px] sm:max-w-[300px]">
                        TXID: {tx.id.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar size={12} />
                        {new Date(tx.createdAt || tx.date).toLocaleString(language === 'th' ? 'th-TH' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#1A1F3D] text-base">
                      {currency}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {tx.paymentMethod}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              // Display registered customers
              (filteredItems as any[]).map((customer) => (
                <div 
                  key={customer.id} 
                  className={cn(
                    "flex items-center justify-between p-4 bg-[#F8FAFC]/55 hover:bg-[#F1F5F9]/60 border border-slate-100 rounded-2xl transition-all duration-200",
                    onSelectCustomer && "cursor-pointer active:scale-[0.98]"
                  )}
                  onClick={() => {
                    if (onSelectCustomer) {
                      onSelectCustomer(customer.id, selectedSegment);
                      setSelectedSegment(null);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 overflow-hidden shrink-0 border border-white shadow-sm">
                      {customer.avatarUrl ? (
                        <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full object-cover" />
                      ) : (
                        customer.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#1A1F3D] truncate">{customer.name}</p>
                        {customer.membership && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100/50">
                            {customer.membership}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} />
                        {customer.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-[#1A1F3D] text-base">
                      {currency}{customer.spent.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {customer.visits} {language === 'th' ? 'ครั้ง' : 'Visits'} • ล่าสุด: {formatDate(customer.lastVisitTime)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 bg-[#F8FAFC]/30 rounded-2xl border border-dashed border-slate-200">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 font-bold text-sm">
                  {language === 'th' ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข' : 'No matching records found'}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;
