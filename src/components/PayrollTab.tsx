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
  Calendar,
  Trash2,
  Edit3
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PayrollTabProps {
  storeId: string | null;
}

export default function PayrollTab({ storeId }: PayrollTabProps) {
  const queryClient = useQueryClient();
  const { currency, staffSettings } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Local state for inline input overrides
  const [editingSalaryStaffId, setEditingSalaryStaffId] = useState<string | null>(null);
  const [editingBonusStaffId, setEditingBonusStaffId] = useState<string | null>(null);
  const [localSalaries, setLocalSalaries] = useState<Record<string, string>>({});
  const [localBonuses, setLocalBonuses] = useState<Record<string, string>>({});

  // Deduction popup states
  const [editingDeductionStaffId, setEditingDeductionStaffId] = useState<string | null>(null);
  const [staffDeductionsList, setStaffDeductionsList] = useState<Record<string, Array<{ id: string, name: string, amount: number }>>>({});
  const [manualDeductionName, setManualDeductionName] = useState('');
  const [manualDeductionAmount, setManualDeductionAmount] = useState('');

  const savePayrollDraft = async (staffId: string, updates: { basicSalary?: number, bonus?: number, deductions?: number }) => {
    if (!storeId || storeId === 'default-store') return;

    const existing = payrollRecords.find((r: any) => r.staff_id === staffId);
    const emp = employees.find(e => e.id === staffId);
    if (!emp) return;

    // Calculate commission
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

    const getPreTaxItemPrice = (item: any, tx: any) => {
      let price = item.finalPrice !== undefined ? item.finalPrice : item.price;
      if (item.finalPrice === undefined && item.discountType && item.discountValue) {
        if (item.discountType === 'percent') {
          price = item.price * (1 - item.discountValue / 100);
        } else {
          price = item.price - item.discountValue;
        }
        price = Math.max(0, Math.round((price + Number.EPSILON) * 100) / 100);
      }
      const vatRateVal = tx.vatRate || tx.vat_rate || 0;
      const vatInclusive = tx.details?.vatInclusive !== undefined ? tx.details.vatInclusive : true;
      const hasVat = vatRateVal > 0 || (tx.vatAmount || tx.vat_amount || 0) > 0;
      if (hasVat && vatInclusive) {
        return price * 100 / (100 + vatRateVal);
      }
      return price;
    };

    const totalSales = empTransactions.reduce((acc, tx: any) => {
      const vatRateVal = tx.vatRate || tx.vat_rate || 0;
      const vatInclusive = tx.details?.vatInclusive !== undefined ? tx.details.vatInclusive : true;
      if (tx.staff_id === emp.id) {
        let baseAmount = tx.subtotal !== undefined ? Number(tx.subtotal) : (Number(tx.amount) || 0);
        if (tx.subtotal === undefined && vatRateVal > 0 && vatInclusive) {
          const taxVal = Number(tx.vatAmount || tx.vat_amount || 0);
          baseAmount = baseAmount - taxVal;
        }
        return acc + baseAmount;
      }
      if (Array.isArray(tx.items)) {
        const empItemsSum = tx.items
          .filter((item: any) => {
            if (item.staffId === emp.id || item.staff_id === emp.id) return true;
            const itemStr = JSON.stringify(item).toLowerCase();
            return itemStr.includes(emp.id.toLowerCase()) || (emp.full_name && itemStr.includes(emp.full_name.toLowerCase()));
          })
          .reduce((sum: number, item: any) => {
            const preTaxPrice = getPreTaxItemPrice(item, tx);
            const qty = Number(item.quantity) || 1;
            return sum + (preTaxPrice * qty);
          }, 0);
        return acc + empItemsSum;
      }
      return acc;
    }, 0);

    const commission = (totalSales * (Number(emp.commission_rate) || 0)) / 100;
    const baseSalary = updates.basicSalary !== undefined ? updates.basicSalary : (existing ? existing.basic_salary : (Number(emp.base_salary) || 15000));
    const bonus = updates.bonus !== undefined ? updates.bonus : (existing ? existing.bonus : 0);
    const deduction = updates.deductions !== undefined ? updates.deductions : (existing ? existing.deductions : 0);

    try {
      if (existing) {
        const { error } = await supabase
          .from('payroll_records')
          .update({
            basic_salary: baseSalary,
            commission,
            bonus,
            deductions: deduction,
            status: existing.status
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payroll_records')
          .insert([{
            store_id: storeId,
            staff_id: staffId,
            month: selectedMonth,
            basic_salary: baseSalary,
            commission,
            bonus,
            deductions: deduction,
            status: 'draft'
          }]);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['payroll_records_list', storeId, selectedMonth] });
    } catch (err: any) {
      console.error("Failed to save payroll draft:", err);
      toast.error("บันทึกข้อมูลล้มเหลว: " + err.message);
    }
  };

  const handleSalaryBlur = async (staffId: string) => {
    const rawVal = localSalaries[staffId];
    setEditingSalaryStaffId(null);
    if (rawVal === undefined) return;

    const num = parseFloat(rawVal) || 0;
    await savePayrollDraft(staffId, { basicSalary: num });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ base_salary: num })
        .eq('id', staffId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profiles_payroll', storeId] });
      toast.success("อัปเดตฐานเงินเดือนพนักงานและบันทึกดราฟต์สำเร็จ");
    } catch (err: any) {
      console.error("Failed to update profile base salary:", err);
      toast.error("อัปเดตฐานเงินเดือนพนักงานในโปรไฟล์ล้มเหลว: " + err.message);
    }

    setLocalSalaries(prev => {
      const copy = { ...prev };
      delete copy[staffId];
      return copy;
    });
  };

  const handleBonusBlur = async (staffId: string) => {
    const rawVal = localBonuses[staffId];
    setEditingBonusStaffId(null);
    if (rawVal === undefined) return;

    const num = parseFloat(rawVal) || 0;
    await savePayrollDraft(staffId, { bonus: num });
    toast.success("บันทึกดราฟต์โบนัสสำเร็จ");

    setLocalBonuses(prev => {
      const copy = { ...prev };
      delete copy[staffId];
      return copy;
    });
  };

  const addDeductionItem = (name: string, amount: number) => {
    if (!name.trim() || amount <= 0) return;
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      amount
    };
    setStaffDeductionsList(prev => {
      const currentList = prev[editingDeductionStaffId || ''] || [];
      return {
        ...prev,
        [editingDeductionStaffId || '']: [...currentList, newItem]
      };
    });
  };

  const removeDeductionItem = (itemId: string) => {
    setStaffDeductionsList(prev => {
      const currentList = prev[editingDeductionStaffId || ''] || [];
      return {
        ...prev,
        [editingDeductionStaffId || '']: currentList.filter(item => item.id !== itemId)
      };
    });
  };

  const handleConfirmDeductions = async (staffId: string) => {
    const list = staffDeductionsList[staffId] || [];
    const total = list.reduce((sum, item) => sum + item.amount, 0);
    await savePayrollDraft(staffId, { deductions: total });
    toast.success("บันทึกรายการหักสำเร็จ");
    setEditingDeductionStaffId(null);
  };

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
        .select('amount, staff_id, items, subtotal, vat_amount, vat_rate, details')
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

      for (const r of recordsToApprove) {
        const existing = payrollRecords.find((rec: any) => rec.staff_id === r.id);
        if (existing) {
          const { error } = await supabase
            .from('payroll_records')
            .update({ status: 'paid' })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('payroll_records')
            .insert([{
              store_id: storeId,
              staff_id: r.id,
              month: selectedMonth,
              basic_salary: r.baseSalary,
              commission: r.commission,
              bonus: r.bonus,
              deductions: r.deduction,
              status: 'paid',
              created_at: new Date().toISOString()
            }]);
          if (error) throw error;
        }
      }
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
          if (!item) return false;
          if (item.staffId === emp.id || item.staff_id === emp.id) return true;
          const itemStr = JSON.stringify(item).toLowerCase();
          return itemStr.includes(emp.id.toLowerCase()) || (emp.full_name && itemStr.includes(emp.full_name.toLowerCase()));
        });
      }
      return false;
    });

    const getPreTaxItemPrice = (item: any, tx: any) => {
      if (!item) return 0;
      let price = Number(item.finalPrice !== undefined ? item.finalPrice : item.price) || 0;
      if (item.finalPrice === undefined && item.discountType && item.discountValue) {
        if (item.discountType === 'percent') {
          price = price * (1 - item.discountValue / 100);
        } else {
          price = price - item.discountValue;
        }
        price = Math.max(0, Math.round((price + Number.EPSILON) * 100) / 100);
      }
      
      const vatRateVal = tx.vatRate || tx.vat_rate || 0;
      const vatInclusive = tx.details?.vatInclusive !== undefined ? tx.details.vatInclusive : true;
      const hasVat = vatRateVal > 0 || (tx.vatAmount || tx.vat_amount || 0) > 0;
      
      if (hasVat && vatInclusive) {
        return price * 100 / (100 + vatRateVal);
      }
      return price;
    };

    const totalSales = empTransactions.reduce((acc, tx: any) => {
      const vatRateVal = tx.vatRate || tx.vat_rate || 0;
      const vatInclusive = tx.details?.vatInclusive !== undefined ? tx.details.vatInclusive : true;

      if (tx.staff_id === emp.id) {
        let baseAmount = tx.subtotal !== undefined ? Number(tx.subtotal) : (Number(tx.amount) || 0);
        if (tx.subtotal === undefined && vatRateVal > 0 && vatInclusive) {
          const taxVal = Number(tx.vatAmount || tx.vat_amount || 0);
          baseAmount = baseAmount - taxVal;
        }
        return acc + baseAmount;
      }
      if (Array.isArray(tx.items)) {
        const empItemsSum = tx.items
          .filter((item: any) => {
            if (!item) return false;
            if (item.staffId === emp.id || item.staff_id === emp.id) return true;
            const itemStr = JSON.stringify(item).toLowerCase();
            return itemStr.includes(emp.id.toLowerCase()) || (emp.full_name && itemStr.includes(emp.full_name.toLowerCase()));
          })
          .reduce((sum: number, item: any) => {
            const preTaxPrice = getPreTaxItemPrice(item, tx);
            const qty = Number(item.quantity) || 1;
            return sum + (preTaxPrice * qty);
          }, 0);
        return acc + empItemsSum;
      }
      return acc;
    }, 0);

    const commission = (totalSales * (Number(emp.commission_rate) || 0)) / 100;

    const existingRecord = payrollRecords.find((r: any) => r.staff_id === emp.id);
    const isPaid = existingRecord?.status === 'paid';
    const isDraft = existingRecord?.status === 'draft';

    const bonus = existingRecord ? (existingRecord.bonus || 0) : 0;
    const deduction = existingRecord ? (existingRecord.deductions || 0) : 0;
    const basicSalary = existingRecord ? (existingRecord.basic_salary || baseSalary) : baseSalary;

    const netPayout = basicSalary + commission + bonus - deduction;

    return {
      id: emp.id,
      name: emp.full_name || emp.email?.split('@')[0] || "Staff",
      avatarUrl: emp.avatar_url,
      role: emp.role,
      baseSalary: basicSalary,
      commission,
      bonus,
      deduction,
      netPayout,
      isPaid,
      isDraft,
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
                    <td className="px-6 py-5 text-right">
                      {editingSalaryStaffId === record.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs text-gray-400 font-bold">{currency}</span>
                          <input 
                            type="number"
                            min="0"
                            autoFocus
                            value={localSalaries[record.id] !== undefined ? localSalaries[record.id] : record.baseSalary}
                            onChange={(e) => setLocalSalaries(prev => ({ ...prev, [record.id]: e.target.value }))}
                            onBlur={() => handleSalaryBlur(record.id)}
                            className="w-24 bg-[#F5F6FA] border-none rounded-xl px-2.5 py-1.5 text-right text-xs font-black focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <span 
                            onClick={() => {
                              setEditingSalaryStaffId(record.id);
                              setLocalSalaries(prev => ({ ...prev, [record.id]: String(record.baseSalary) }));
                            }}
                            className="cursor-pointer hover:underline hover:text-indigo-600 transition-all font-black text-xs text-[#1A1F3D]"
                          >
                            {currency}{record.baseSalary.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setEditingSalaryStaffId(record.id);
                              setLocalSalaries(prev => ({ ...prev, [record.id]: String(record.baseSalary) }));
                            }}
                            className="text-gray-400 hover:text-indigo-600 p-1 rounded transition-colors"
                            title="แก้ไขฐานเงินเดือน"
                          >
                            <Edit3 size={12} className="shrink-0" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right text-xs font-black text-blue-600">
                      {currency}{record.commission.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {record.isPaid ? (
                        <span className="text-xs font-black text-[#1A1F3D]">
                          +{currency}{record.bonus.toLocaleString()}
                        </span>
                      ) : (
                        editingBonusStaffId === record.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs text-gray-400 font-bold">{currency}</span>
                            <input 
                              type="number"
                              min="0"
                              autoFocus
                              value={localBonuses[record.id] !== undefined ? localBonuses[record.id] : record.bonus}
                              onChange={(e) => setLocalBonuses(prev => ({ ...prev, [record.id]: e.target.value }))}
                              onBlur={() => handleBonusBlur(record.id)}
                              className="w-24 bg-[#F5F6FA] border-none rounded-xl px-2.5 py-1.5 text-center text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                            />
                          </div>
                        ) : (
                          <span 
                            onClick={() => {
                              setEditingBonusStaffId(record.id);
                              setLocalBonuses(prev => ({ ...prev, [record.id]: String(record.bonus) }));
                            }}
                            className="cursor-pointer hover:underline hover:text-indigo-600 transition-all font-bold text-xs text-[#1A1F3D]"
                          >
                            +{currency}{record.bonus.toLocaleString()}
                          </span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {record.isPaid ? (
                        <span className="text-xs font-black text-red-500">
                          -{currency}{record.deduction.toLocaleString()}
                        </span>
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingDeductionStaffId(record.id);
                            setManualDeductionName('');
                            setManualDeductionAmount('');
                          }}
                          className="cursor-pointer hover:underline hover:text-red-600 transition-all font-black text-xs text-red-500"
                        >
                          -{currency}{record.deduction.toLocaleString()}
                        </span>
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

      {/* Deduction detailed popup modal */}
      <Dialog open={!!editingDeductionStaffId} onOpenChange={(open) => { if (!open) setEditingDeductionStaffId(null); }}>
        <DialogContent className="rounded-[32px] max-w-lg p-8 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#1A1F3D]">
              รายละเอียดรายการหักเงินเดือน - {employees.find(emp => emp.id === editingDeductionStaffId)?.full_name || "พนักงาน"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Presets template list */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 block">เลือกรายการหักจากพรีเซต (Preset Templates)</label>
              <div className="flex flex-wrap gap-2">
                {(staffSettings?.payroll?.deductionPresets || []).map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => addDeductionItem(preset.name, preset.amount)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black px-3.5 py-2 rounded-xl border border-red-200/40 transition-colors flex items-center gap-1"
                  >
                    + {preset.name} (-{currency}{preset.amount.toLocaleString()})
                  </button>
                ))}
                {(staffSettings?.payroll?.deductionPresets || []).length === 0 && (
                  <p className="text-xs text-gray-400 font-bold italic">ไม่มีพรีเซตรายการหักเงินเดือน (ตั้งค่าได้ที่เมนู "ตั้งค่าระบบพนักงาน" แท็บการเงิน)</p>
                )}
              </div>
            </div>

            {/* Manual entry */}
            <div className="flex gap-3 bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200">
              <div className="flex-1">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-1">ชื่อรายการหัก (ระบุเอง)</label>
                <input 
                  type="text" 
                  placeholder="เช่น หักค่าคีย์ข้อมูลผิด, ยืมเงินล่วงหน้า" 
                  value={manualDeductionName}
                  onChange={e => setManualDeductionName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="w-28">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-1">ยอดหัก (บาท)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={manualDeductionAmount}
                  onChange={e => setManualDeductionAmount(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button 
                type="button" 
                onClick={() => {
                  const amt = parseFloat(manualDeductionAmount) || 0;
                  if (!manualDeductionName.trim()) {
                    toast.error("กรุณากรอกชื่อรายการหัก");
                    return;
                  }
                  if (amt <= 0) {
                    toast.error("กรุณากรอกจำนวนเงินมากกว่า 0");
                    return;
                  }
                  addDeductionItem(manualDeductionName, amt);
                  setManualDeductionName('');
                  setManualDeductionAmount('');
                }}
                className="bg-[#1A1F3D] text-white px-4 rounded-xl text-xs font-black hover:bg-[#2A3152] transition-colors shrink-0 h-9 self-end"
              >
                เพิ่ม
              </button>
            </div>

            {/* Current deduction items list */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">รายการหักในรอบนี้</label>
              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-2">
                {(staffDeductionsList[editingDeductionStaffId || ''] || []).length === 0 ? (
                  <p className="text-xs text-gray-400 font-bold italic py-4 text-center">ยังไม่มีรายการหักเงินเดือน</p>
                ) : (
                  (staffDeductionsList[editingDeductionStaffId || ''] || []).map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2.5">
                      <span className="text-xs font-black text-[#1A1F3D]">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-red-500">-{currency}{item.amount.toLocaleString()}</span>
                        <button 
                          type="button" 
                          onClick={() => removeDeductionItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total and Actions */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-5">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">ยอดหักรวมทั้งหมด</span>
                <h4 className="text-lg font-black text-red-500">
                  -{currency}{(staffDeductionsList[editingDeductionStaffId || ''] || []).reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </h4>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDeductionStaffId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeductions(editingDeductionStaffId || '')}
                  className="bg-[#1A1F3D] text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-[#2A3152] transition-colors"
                >
                  บันทึกรายการ
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}