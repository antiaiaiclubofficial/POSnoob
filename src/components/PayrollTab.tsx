"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/store/useStore";
import { format, startOfMonth, endOfMonth, parse } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  RefreshCw, 
  FileText, 
  ShieldAlert, 
  Calendar
} from "lucide-react";

interface PayrollTabProps {
  storeId: string | null;
}

export default function PayrollTab({ storeId }: PayrollTabProps) {
  const queryClient = useQueryClient();
  const { currency } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Local state for dynamic inputs
  const [bonuses, setBonuses] = useState<Record<string, number>>({});
  const [deductions, setDeductions] = useState<Record<string, number>>({});

  const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const monthStart = startOfMonth(monthDate).toISOString();
  const monthEnd = endOfMonth(monthDate).toISOString();

  // 1. Fetch active profiles
  const { data: employees = [], isLoading: empLoading } = useQuery({
    queryKey: ['profiles_payroll', storeId],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'Active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId
  });

  // 2. Fetch sales transactions for the selected month
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['sales_transactions_payroll', storeId, selectedMonth],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return [];
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('amount, staff_id, items')
        .eq('store_id', storeId)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);
      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId
  });

  // 3. Fetch approved payroll records for the selected month
  const { data: payrollRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['payroll_records_list', storeId, selectedMonth],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return [];
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('store_id', storeId)
        .eq('month', selectedMonth);
      if (error) {
        console.warn("payroll_records table select failed:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!storeId
  });

  // 4. Mutation for approving payroll (batch or individual)
  const approveMutation = useMutation({
    mutationFn: async (recordsToApprove: any[]) => {
      if (!storeId || storeId === 'default-store') {
        throw new Error("Invalid Store ID");
      }

      const insertData = recordsToApprove.map(r => ({
        store_id: storeId,
        staff_id: r.id,
        month: selectedMonth,
        basic_salary: r.baseSalary,
        commission: r.commission,
        bonus: r.bonus,
        deductions: r.deduction,
        status: 'paid',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('payroll_records')
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_records_list', storeId, selectedMonth] });
      toast.success("อนุมัติและจ่ายเงินเดือนเรียบร้อยแล้ว");
    },
    onError: (err: any) => {
      console.error("Payroll approval failed:", err);
      toast.error("การจ่ายเงินเดือนล้มเหลว: " + err.message);
    }
  });

  // 5. Data Aggregation & Financial Calculations
  const computedPayroll = employees.map(emp => {
    // Basic salary calculation with default fallback
    const baseSalary = Number(emp.base_salary) || Number(emp.salary) || 15000;

    // Commission logic: checks direct transaction staff_id or items array mentions
    const empTransactions = (transactions || []).filter(tx => {
      if (tx.staff_id === emp.id) return true;
      if (Array.isArray(tx.items)) {
        return tx.items.some((item: any) => {
          if (item.staffId === emp.id || item.staff_id === emp.id) return true;
          const itemStr = JSON.stringify(item).toLowerCase();
          return itemStr.includes(emp.id.toLowerCase()) || (emp.full_name && itemStr.includes(emp.full_name.toLowerCase()));
        });
      }
      return false;
    });

    const totalSales = empTransactions.reduce((acc, tx) => {
      if (tx.staff_id === emp.id) {
        return acc + (Number(tx.amount) || 0);
      }
      if (Array.isArray(tx.items)) {
        const empItemsSum = tx.items
          .filter((item: any) => {
            if (item.staffId === emp.id || item.staff_id === emp.id) return true;
            const itemStr = JSON.stringify(item).toLowerCase();
            return itemStr.includes(emp.id.toLowerCase()) || (emp.full_name && itemStr.includes(emp.full_name.toLowerCase()));
          })
          .reduce((sum: number, item: any) => {
            const price = Number(item.price) || Number(item.amount) || 0;
            const qty = Number(item.quantity) || 1;
            return sum + (price * qty);
          }, 0);
        return acc + empItemsSum;
      }
      return acc;
    }, 0);

    const commission = (totalSales * (Number(emp.commission_rate) || 0)) / 100;

    const existingRecord = payrollRecords.find((r: any) => r.staff_id === emp.id);
    const isPaid = !!existingRecord;

    const bonus = isPaid ? (existingRecord.bonus || 0) : (bonuses[emp.id] || 0);
    const deduction = isPaid ? (existingRecord.deductions || 0) : (deductions[emp.id] || 0);

    const netPayout = isPaid
      ? (existingRecord.basic_salary + existingRecord.commission + (existingRecord.bonus || 0) - (existingRecord.deductions || 0))
      : (baseSalary + commission + bonus - deduction);

    return {
      id: emp.id,
      name: emp.full_name || emp.email?.split('@')[0] || "Staff",
      avatarUrl: emp.avatar_url,
      role: emp.role,
      baseSalary,
      commission,
      bonus,
      deduction,
      netPayout,
      isPaid,
      payrollRecordId: existingRecord?.id || null
    };
  });

  // Calculate ERP metrics
  const totalBaseSalaries = computedPayroll.reduce((sum, r) => sum + r.baseSalary, 0);
  const totalCommissions = computedPayroll.reduce((sum, r) => sum + r.commission, 0);
  const totalBonuses = computedPayroll.reduce((sum, r) => sum + r.bonus, 0);
  const totalDeductions = computedPayroll.reduce((sum, r) => sum + r.deduction, 0);
  const totalBudget = computedPayroll.reduce((sum, r) => sum + r.netPayout, 0);

  const pendingPayroll = computedPayroll.filter(r => !r.isPaid);

  const handleRunPayrollBatch = () => {
    if (pendingPayroll.length === 0) {
      toast.info("ไม่มีรายการคำนวณเงินเดือนคงค้างสำหรับเดือนนี้");
      return;
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการอนุมัติจ่ายเงินเดือนพนักงานจำนวน ${pendingPayroll.length} รายการ?`)) {
      approveMutation.mutate(pendingPayroll);
    }
  };

  const handleApproveSingle = (record: any) => {
    if (window.confirm(`ยืนยันการอนุมัติจ่ายเงินเดือนให้คุณ "${record.name}" เป็นจำนวน ${currency}${record.netPayout.toLocaleString()}?`)) {
      approveMutation.mutate([record]);
    }
  };

  const handleBonusChange = (staffId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBonuses(prev => ({ ...prev, [staffId]: num }));
  };

  const handleDeductionChange = (staffId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setDeductions(prev => ({ ...prev, [staffId]: num }));
  };

  if (empLoading || txLoading || recordsLoading) {
    return (
      <div className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">กำลังประมวลผลโมดูลเงินเดือน...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ERP Control Panel & Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] flex items-center gap-6">
          <div className="w-14 h-14 bg-[#18234A]/5 text-[#18234A] rounded-[20px] flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[#45464e] text-xs font-semibold tracking-wider mb-1">ยอดงบประมาณจ่ายสุทธิ</p>
            <h4 className="text-2xl font-black text-[#18234A] tracking-tight">{currency}{totalBudget.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] flex items-center gap-6">
          <div className="w-14 h-14 bg-[#18234A]/5 text-[#18234A] rounded-[20px] flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[#45464e] text-xs font-semibold tracking-wider mb-1">ฐานเงินเดือนพนักงานรวม</p>
            <h4 className="text-2xl font-black text-[#18234A] tracking-tight">{currency}{totalBaseSalaries.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] flex items-center gap-6">
          <div className="w-14 h-14 bg-[#EAFD69] text-[#18234A] rounded-[20px] flex items-center justify-center shrink-0 shadow-sm border border-[#EAFD69]">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[#45464e] text-xs font-semibold tracking-wider mb-1">คอมมิชชันสะสมรวม</p>
            <h4 className="text-2xl font-black text-[#18234A] tracking-tight">{currency}{totalCommissions.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] flex items-center gap-6">
          <div className="w-14 h-14 bg-[#18234A]/5 text-[#18234A] rounded-[20px] flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[#45464e] text-xs font-semibold tracking-wider mb-1">โบนัส / หักสาย สุทธิ</p>
            <h4 className="text-xl font-black text-[#18234A] tracking-tight">
              +{currency}{totalBonuses.toLocaleString()} / -{currency}{totalDeductions.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header / Action controls */}
        <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-50/30 to-white">
          <div>
            <h3 className="text-xl font-black text-[#1A1F3D]">ระบบจ่ายเงินเดือนพนักงาน (Payroll Management)</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              ERP-Grade Financial Ledger
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Month Picker */}
            <div className="relative flex items-center bg-[#F5F6FA] rounded-2xl px-4 py-2 text-sm font-bold border-none text-[#1A1F3D] shrink-0">
              <Calendar size={16} className="text-gray-400 mr-2" />
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setBonuses({});
                  setDeductions({});
                }} 
                className="bg-transparent border-none outline-none text-[#1A1F3D] font-bold text-xs cursor-pointer focus:ring-0 w-28"
              />
            </div>

            <button 
              onClick={handleRunPayrollBatch}
              disabled={pendingPayroll.length === 0 || approveMutation.isPending}
              className="bg-[#1A1F3D] text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 hover:bg-[#2A3152] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <FileText size={14} /> Run Payroll ({pendingPayroll.length})
            </button>
          </div>
        </div>

        {/* Ledger Data Table */}
        <div className="overflow-x-auto flex-1 scrollbar-hide">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400 tracking-wider w-60">พนักงาน</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider">ฐานเงินเดือน</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider">ค่าคอมมิชชัน</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase text-gray-400 tracking-wider w-40">โบนัสพิเศษ (Bonus)</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase text-gray-400 tracking-wider w-40">รายการหัก (Deduction)</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider">จ่ายสุทธิ (Net)</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase text-gray-400 tracking-wider">สถานะ</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider w-44">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {computedPayroll.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center text-gray-400 font-bold text-xs uppercase tracking-widest italic">
                    ไม่พบข้อมูลรายชื่อพนักงานสำหรับออกเงินเดือน
                  </td>
                </tr>
              ) : (
                computedPayroll.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={record.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} 
                          className="w-10 h-10 rounded-xl object-cover shadow-sm border border-white" 
                          alt={record.name} 
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#1A1F3D] truncate">{record.name}</p>
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 text-[8.5px] font-black uppercase text-indigo-600 rounded-md tracking-wider mt-0.5">
                            {record.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right text-xs font-black text-[#1A1F3D]">
                      {currency}{record.baseSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right text-xs font-black text-blue-600">
                      {currency}{record.commission.toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      {record.isPaid ? (
                        <div className="text-center text-xs font-black text-[#1A1F3D]">
                          +{currency}{record.bonus.toLocaleString()}
                        </div>
                      ) : (
                        <input 
                          type="number"
                          min="0"
                          value={bonuses[record.id] !== undefined ? bonuses[record.id] : ""}
                          onChange={(e) => handleBonusChange(record.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#F5F6FA] border-none rounded-xl px-3 py-2 text-center text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                        />
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {record.isPaid ? (
                        <div className="text-center text-xs font-black text-red-500">
                          -{currency}{record.deduction.toLocaleString()}
                        </div>
                      ) : (
                        <input 
                          type="number"
                          min="0"
                          value={deductions[record.id] !== undefined ? deductions[record.id] : ""}
                          onChange={(e) => handleDeductionChange(record.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#F5F6FA] border-none rounded-xl px-3 py-2 text-center text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                        />
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-base font-black text-emerald-600">
                        {currency}{record.netPayout.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {record.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200/50 shadow-sm animate-in fade-in duration-300">
                          <CheckCircle size={10} /> Paid & Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200/50 shadow-sm">
                          <ShieldAlert size={10} /> Unprocessed
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleApproveSingle(record)}
                        disabled={record.isPaid || approveMutation.isPending}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95 disabled:scale-100",
                          record.isPaid 
                            ? "bg-slate-100 text-slate-400 border border-slate-200/40 shadow-none cursor-default"
                            : "bg-[#1A1F3D] text-white hover:bg-[#2A3152] hover:shadow-lg shadow-[#1A1F3D]/10 disabled:opacity-50"
                        )}
                      >
                        {record.isPaid ? "Processed" : "Approve & Lock"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}