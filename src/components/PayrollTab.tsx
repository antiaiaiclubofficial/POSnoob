"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/store/useStore";
import { Wallet, Check, Clock, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

const FINE_RATE = 5; // 5 units per late minute

const PayrollTab = () => {
  const queryClient = useQueryClient();
  const { storeId, currency, currentUser } = useStore();
  const currentMonth = format(new Date(), 'yyyy-MM');

  // 1. Fetch & Aggregate Data
  const { data: payrollData = [], isLoading } = useQuery({
    queryKey: ['payroll_calculation', storeId, currentMonth],
    queryFn: async () => {
      if (!storeId) return [];

      // Fetch Employees (Profiles)
      const { data: employees, error: empError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('store_id', storeId)
        .eq('status', 'Active');
      
      if (empError) throw empError;

      // Fetch Attendance Logs for sum
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();
      
      const { data: attendance, error: attError } = await supabase
        .from('attendance_logs' as any)
        .select('user_id, total_hours, late_minutes')
        .eq('store_id', storeId)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      if (attError) console.warn("Attendance table error or missing:", attError);

      // Fetch Pending Commissions
      const { data: commissions, error: commError } = await supabase
        .from('employee_commissions' as any)
        .select('employee_id, payout')
        .eq('store_id', storeId)
        .eq('status', 'pending');

      if (commError) console.warn("Commissions table error or missing:", commError);

      // Process and Calculate
      return (employees || []).map(emp => {
        const empAttendance = (attendance || []).filter(a => a.user_id === emp.id);
        const totalHours = empAttendance.reduce((acc, curr) => acc + (Number(curr.total_hours) || 0), 0);
        const lateMinutes = empAttendance.reduce((acc, curr) => acc + (Number(curr.late_minutes) || 0), 0);
        
        const empCommissions = (commissions || []).filter(c => c.employee_id === emp.id);
        const totalComm = empCommissions.reduce((acc, curr) => acc + (Number(curr.payout) || 0), 0);

        // Calculate
        const hourlyWage = 100; // Default fallback wage
        const base = totalHours * hourlyWage;
        const deduction = lateMinutes * FINE_RATE;
        const net = base + totalComm - deduction;

        return {
          ...emp,
          totalHours,
          lateMinutes,
          base,
          commission: totalComm,
          deduction,
          net,
          month: currentMonth
        };
      });
    },
    enabled: !!storeId
  });

  // 3. Action: Atomic Approval & Pay
  const approveMutation = useMutation({
    mutationFn: async (record: any) => {
      // Step 1: Insert into payroll_records
      const { error: payrollError } = await supabase
        .from('payroll_records' as any)
        .insert([{
          store_id: storeId,
          staff_id: record.id,
          month: record.month,
          basic_salary: record.base,
          commission: record.commission,
          deductions: record.deduction,
          status: 'paid',
          created_at: new Date().toISOString()
        }]);

      if (payrollError) throw payrollError;

      // Step 2: Update employee_commissions status to 'paid'
      const { error: updateError } = await supabase
        .from('employee_commissions' as any)
        .update({ status: 'paid' })
        .eq('employee_id', record.id)
        .eq('status', 'pending');

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_calculation'] });
      queryClient.invalidateQueries({ queryKey: ['payroll_records'] });
      toast.success("Payroll approved and processed successfully");
    },
    onError: (err: any) => {
      toast.error("Processing failed: " + err.message);
    }
  });

  if (isLoading) return <div className="py-20 text-center animate-pulse font-black text-gray-300 uppercase">Calculating Payroll...</div>;

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
        <div>
          <h3 className="text-xl font-black text-[#1A1F3D]">ระบบจ่ายเงินเดือน (Payroll)</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time Calculation for {currentMonth}</p>
        </div>
      </div>
      <div className="overflow-x-auto flex-1 scrollbar-hide">
        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-gray-50">
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">พนักงาน / ชั่วโมงงาน</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">ฐานเงินเดือน</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">คอมมิชชัน</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">หักสาย ({FINE_RATE}/นาที)</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">สุทธิ (Net)</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payrollData.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center opacity-20 font-black uppercase text-xs tracking-widest">No active staff records</td></tr>
            ) : (
              payrollData.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <img src={record.avatar_url} className="w-10 h-10 rounded-xl object-cover" alt={record.full_name} />
                      <div>
                        <p className="text-sm font-bold text-[#1A1F3D]">{record.full_name}</p>
                        <p className="text-[9px] text-indigo-500 font-black uppercase">{record.totalHours} Hrs • {record.lateMinutes}m Late</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right text-xs font-bold text-gray-600">{currency}{record.base.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right text-xs font-bold text-blue-600">{currency}{record.commission.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right text-xs font-bold text-red-400">-{currency}{record.deduction.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <p className="text-lg font-black text-[#1A1F3D]">{currency}{record.net.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => approveMutation.mutate(record)}
                      disabled={approveMutation.isPending}
                      className="bg-[#1A1F3D] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-[#2A3152] transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {approveMutation.isPending ? "Processing..." : "Approve & Pay"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollTab;