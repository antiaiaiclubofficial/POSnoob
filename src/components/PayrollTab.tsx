"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/store/useStore";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

const FINE_RATE = 5; 

const PayrollTab = () => {
  const queryClient = useQueryClient();
  const { storeId, currency } = useStore();
  const currentMonth = format(new Date(), 'yyyy-MM');

  const { data: payrollData = [], isLoading } = useQuery({
    queryKey: ['payroll_calculation', storeId, currentMonth],
    queryFn: async () => {
      if (!storeId) return [];

      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();

      // 1. Fetch Employees with their specific commission_rate
      const { data: employees, error: empError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, commission_rate')
        .eq('store_id', storeId)
        .eq('status', 'Active');
      
      if (empError) throw empError;

      // 2. Fetch Sales Transactions for commission calculation
      const { data: transactions, error: txError } = await supabase
        .from('sales_transactions')
        .select('amount, staff_id')
        .eq('store_id', storeId)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      if (txError) throw txError;

      // 3. Fetch Attendance Logs
      const { data: attendance, error: attError } = await supabase
        .from('attendance_logs' as any)
        .select('user_id, total_hours, late_minutes')
        .eq('store_id', storeId)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      if (attError) console.warn("Attendance table missing");

      return (employees || []).map(emp => {
        // Attendance stats
        const empAttendance = (attendance || []).filter(a => a.user_id === emp.id);
        const totalHours = empAttendance.reduce((acc, curr) => acc + (Number(curr.total_hours) || 0), 0);
        const lateMinutes = empAttendance.reduce((acc, curr) => acc + (Number(curr.late_minutes) || 0), 0);
        
        // Commission calculation using commission_rate from Profile
        const empTransactions = (transactions || []).filter(tx => tx.staff_id === emp.id);
        const totalSales = empTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const commission = (totalSales * (Number(emp.commission_rate) || 0)) / 100;

        // Base & Net
        const hourlyWage = 100; 
        const base = totalHours * hourlyWage;
        const deduction = lateMinutes * FINE_RATE;
        const net = base + commission - deduction;

        return {
          ...emp,
          totalHours,
          lateMinutes,
          base,
          commission,
          deduction,
          net,
          month: currentMonth
        };
      });
    },
    enabled: !!storeId
  });

  const approveMutation = useMutation({
    mutationFn: async (record: any) => {
      const { error: payrollError } = await supabase
        .from('payroll_records')
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

      // Mark commissions as paid (if tracking via separate table)
      const { error: updateError } = await supabase
        .from('employee_commissions' as any)
        .update({ status: 'paid' })
        .eq('employee_id', record.id)
        .eq('status', 'pending');

      if (updateError) console.warn("employee_commissions table update skipped");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_calculation'] });
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
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Calculating for {currentMonth}</p>
        </div>
      </div>
      <div className="overflow-x-auto flex-1 scrollbar-hide">
        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-gray-100">
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">พนักงาน</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">ฐานเงินเดือน</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">คอมมิชชัน ({payrollData[0]?.commission_rate || 0}%)</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">หักสาย</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">สุทธิ (Net)</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payrollData.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center opacity-20 font-black uppercase text-xs">No active staff records</td></tr>
            ) : (
              payrollData.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <img src={record.avatar_url} className="w-10 h-10 rounded-xl object-cover" alt={record.full_name} />
                      <div>
                        <p className="text-sm font-bold text-[#1A1F3D]">{record.full_name}</p>
                        <p className="text-[9px] text-indigo-500 font-black uppercase">{record.totalHours} Hrs Work</p>
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