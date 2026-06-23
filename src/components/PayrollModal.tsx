"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, DollarSign, CalendarDays, Users, Percent, Plus, Minus, Calculator } from 'lucide-react';
import { useStore, Staff, Transaction } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, getMonth, getYear, setMonth, setYear, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

interface PayrollModalProps {
  payrollRecord?: any | null; // Existing record for editing
  onClose: () => void;
  onSave: (data: any) => void;
}

const PayrollModal = ({ payrollRecord, onClose, onSave }: PayrollModalProps) => {
  const { staff, currency, language, transactions, storeId } = useStore();

  const [staffId, setStaffId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [basicSalary, setBasicSalary] = useState(0);
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (payrollRecord) {
      setStaffId(payrollRecord.staff_id);
      setSelectedMonth(parseISO(`${payrollRecord.month}-01`));
      setBasicSalary(Number(payrollRecord.basic_salary || 0));
      setCalculatedCommission(Number(payrollRecord.commission || 0));
      setBonus(Number(payrollRecord.bonus || 0));
      setDeductions(Number(payrollRecord.deductions || 0));
      setStatus(payrollRecord.status);
    } else {
      // Default to current month for new records
      setSelectedMonth(new Date());
      setStaffId(staff[0]?.id || '');
    }
  }, [payrollRecord, staff]);

  const selectedStaff = useMemo(() => staff.find(s => s.id === staffId), [staff, staffId]);

  const handleCalculateCommission = async () => {
    if (!staffId) {
      toast.error("Please select a staff member first.");
      return;
    }
    setIsCalculating(true);
    try {
      const targetMonth = format(selectedMonth, 'yyyy-MM');
      const staffProfile = staff.find(s => s.id === staffId);
      const commissionRate = staffProfile?.commissionRate || 0;

      // Filter transactions for the selected staff and month
      const staffTransactions = transactions.filter(tx => {
        const txDate = parseISO(tx.date);
        return tx.staffId === staffId && format(txDate, 'yyyy-MM') === targetMonth;
      });

      const totalSalesForMonth = staffTransactions.reduce((acc, tx) => acc + tx.amount, 0);
      const commission = (totalSalesForMonth * commissionRate) / 100;
      setCalculatedCommission(commission);
      toast.success(`Commission calculated: ${currency}${commission.toLocaleString()}`);
    } catch (error) {
      console.error("Error calculating commission:", error);
      toast.error("Failed to calculate commission.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !selectedMonth) {
      toast.error("Please fill in all required fields.");
      return;
    }

    onSave({
      id: payrollRecord?.id,
      staff_id: staffId,
      month: format(selectedMonth, 'yyyy-MM'),
      basic_salary: basicSalary,
      commission: calculatedCommission,
      bonus: bonus,
      deductions: deductions,
      status: status,
    });
    onClose();
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i); // 0-11 for Jan-Dec

  const handleMonthChange = (value: string) => {
    setSelectedMonth(prev => setMonth(prev, Number(value)));
  };

  const handleYearChange = (value: string) => {
    setSelectedMonth(prev => setYear(prev, Number(value)));
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{payrollRecord ? 'Edit Payroll Record' : 'New Payroll Record'}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Monthly Staff Compensation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Staff Member</label>
              <select
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
                required
                disabled={!!payrollRecord} // Disable staff selection when editing
              >
                <option value="">-- Select Staff --</option>
                {staff.filter(s => s.status === 'Active').map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Month</label>
                <select
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                  value={getMonth(selectedMonth)}
                  onChange={e => handleMonthChange(e.target.value)}
                  required
                  disabled={!!payrollRecord}
                >
                  {months.map(m => (
                    <option key={m} value={m}>
                      {format(setMonth(new Date(), m), 'MMMM', { locale: language === 'th' ? th : undefined })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Year</label>
                <select
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                  value={getYear(selectedMonth)}
                  onChange={e => handleYearChange(e.target.value)}
                  required
                  disabled={!!payrollRecord}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Basic Salary</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                <input
                  type="number"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold"
                  value={basicSalary}
                  onChange={e => setBasicSalary(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Commission</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                  <input
                    type="number"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold"
                    value={calculatedCommission}
                    onChange={e => setCalculatedCommission(Number(e.target.value))}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCalculateCommission}
                  disabled={isCalculating || !staffId || !!payrollRecord} // Disable if editing or no staff selected
                  className="bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isCalculating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Calculator size={16} />
                  )}
                  Calculate
                </button>
              </div>
              {payrollRecord && (
                <p className="text-[9px] text-gray-400 font-medium px-1">
                  * Commission is fixed for existing records.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Bonus</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                  <input
                    type="number"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold"
                    value={bonus}
                    onChange={e => setBonus(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Deductions</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                  <input
                    type="number"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold"
                    value={deductions}
                    onChange={e => setDeductions(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Status</label>
              <select
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                value={status}
                onChange={e => setStatus(e.target.value as 'pending' | 'paid')}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] shadow-xl shadow-[#1A1F3D]/20 transition-all active:scale-95"
          >
            <Save size={20} className="inline mr-2" /> {payrollRecord ? 'Save Changes' : 'Create Payroll Record'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PayrollModal;