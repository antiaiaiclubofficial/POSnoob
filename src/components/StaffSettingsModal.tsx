"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2, Shield, Settings2, Clock, CalendarDays, Wallet, Check, Save } from 'lucide-react';
import { useStore, Role, StaffRole } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface StaffSettingsModalProps {
  onClose: () => void;
}

const StaffSettingsModal = ({ onClose }: StaffSettingsModalProps) => {
  const { roles, addRole, updateRole, deleteRole, storeId, currentUser, staffSettings, updateStaffSettings } = useStore();
  
  const [activeTab, setActiveTab] = useState<'roles' | 'attendance' | 'schedule' | 'payroll'>('roles');

  // Role management local states
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState<Omit<Role, 'id' | 'created_at'>>({
    store_id: null,
    name: '',
    description: '',
    permissions: []
  });

  // Settings local states
  const [requireGps, setRequireGps] = useState(false);
  const [lateBufferMinutes, setLateBufferMinutes] = useState(15);
  const [autoCheckoutTime, setAutoCheckoutTime] = useState('18:00');

  const [allowShiftSwapping, setAllowShiftSwapping] = useState(false);
  const [minHoursBetweenShifts, setMinHoursBetweenShifts] = useState(8);
  const [releaseNoticeDays, setReleaseNoticeDays] = useState(7);

  const [payFrequency, setPayFrequency] = useState<'monthly' | 'semi-monthly' | 'weekly'>('monthly');
  const [payDayOfMonth, setPayDayOfMonth] = useState(25);
  const [overtimeRate, setOvertimeRate] = useState(1.5);
  const [socialSecurityRate, setSocialSecurityRate] = useState(5);

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Initialize setting states
  useEffect(() => {
    if (staffSettings) {
      setRequireGps(staffSettings.attendance?.requireGps ?? false);
      setLateBufferMinutes(staffSettings.attendance?.lateBufferMinutes ?? 15);
      setAutoCheckoutTime(staffSettings.attendance?.autoCheckoutTime ?? '18:00');

      setAllowShiftSwapping(staffSettings.schedule?.allowShiftSwapping ?? false);
      setMinHoursBetweenShifts(staffSettings.schedule?.minHoursBetweenShifts ?? 8);
      setReleaseNoticeDays(staffSettings.schedule?.releaseNoticeDays ?? 7);

      setPayFrequency(staffSettings.payroll?.payFrequency ?? 'monthly');
      setPayDayOfMonth(staffSettings.payroll?.payDayOfMonth ?? 25);
      setOvertimeRate(staffSettings.payroll?.overtimeRate ?? 1.5);
      setSocialSecurityRate(staffSettings.payroll?.socialSecurityRate ?? 5);
    }
  }, [staffSettings]);

  // Sync role edit form
  useEffect(() => {
    if (editingRole) {
      setRoleFormData({
        store_id: editingRole.store_id,
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions
      });
    } else {
      setRoleFormData({
        store_id: storeId && storeId !== 'default-store' ? storeId : null,
        name: '',
        description: '',
        permissions: []
      });
    }
  }, [editingRole, storeId]);

  const allAvailablePaths = [
    { path: '/', label: 'Dashboard' },
    { path: '/pos', label: 'POS System' },
    { path: '/queue', label: 'Operations / Queue' },
    { path: '/customers', label: 'CRM / Clients' },
    { path: '/inventory', label: 'Inventory & Stock' },
    { path: '/marketing', label: 'Marketing & Rewards' },
    { path: '/staff', label: 'Team Management' },
    { path: '/staff/performance', label: 'Staff Analytics' },
    { path: '/logs', label: 'Activity Logs' },
    { path: '/reports', label: 'Business Insights' },
    { path: '/settings', label: 'Settings' },
  ];

  const handleSaveRole = async () => {
    if (!roleFormData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.id, roleFormData);
        toast.success("Role updated successfully");
      } else {
        await addRole(roleFormData);
        toast.success("New role created successfully");
      }
      setIsCreatingRole(false);
      setEditingRole(null);
    } catch (error: any) {
      toast.error("Failed to save role: " + error.message);
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the role "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteRole(id);
      toast.success("Role deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete role: " + error.message);
    }
  };

  const togglePermission = (path: string) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(path)
        ? prev.permissions.filter(p => p !== path)
        : [...prev.permissions, path]
    }));
  };

  const handleSaveAllSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateStaffSettings({
        attendance: {
          requireGps,
          lateBufferMinutes: Number(lateBufferMinutes),
          autoCheckoutTime,
        },
        schedule: {
          allowShiftSwapping,
          minHoursBetweenShifts: Number(minHoursBetweenShifts),
          releaseNoticeDays: Number(releaseNoticeDays),
        },
        payroll: {
          payFrequency,
          payDayOfMonth: Number(payDayOfMonth),
          overtimeRate: Number(overtimeRate),
          socialSecurityRate: Number(socialSecurityRate),
        }
      });
      toast.success("บันทึกการตั้งค่าระบบพนักงานเรียบร้อยแล้ว!");
    } catch (error: any) {
      toast.error("บันทึกการตั้งค่าล้มเหลว: " + error.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const filteredRoles = roles.filter(role => 
    isSuperAdmin || (role.store_id === null || role.store_id === storeId)
  );

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl h-[680px] max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Settings2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">ตั้งค่าระบบพนักงาน</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Staff & System configurations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs and Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-gray-50 bg-[#F5F6FA]/30 p-6 flex flex-col gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => setActiveTab('roles')} 
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all text-left",
                activeTab === 'roles' ? "bg-[#1A1F3D] text-white shadow-lg shadow-[#1A1F3D]/10" : "text-gray-500 hover:bg-gray-100/50"
              )}
            >
              <Shield size={16} /> บทบาท & สิทธิ์
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('attendance')} 
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all text-left",
                activeTab === 'attendance' ? "bg-[#1A1F3D] text-white shadow-lg shadow-[#1A1F3D]/10" : "text-gray-500 hover:bg-gray-100/50"
              )}
            >
              <Clock size={16} /> การลงเวลา (Attendance)
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('schedule')} 
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all text-left",
                activeTab === 'schedule' ? "bg-[#1A1F3D] text-white shadow-lg shadow-[#1A1F3D]/10" : "text-gray-500 hover:bg-gray-100/50"
              )}
            >
              <CalendarDays size={16} /> จัดการกะ/ตารางงาน
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('payroll')} 
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all text-left",
                activeTab === 'payroll' ? "bg-[#1A1F3D] text-white shadow-lg shadow-[#1A1F3D]/10" : "text-gray-500 hover:bg-gray-100/50"
              )}
            >
              <Wallet size={16} /> การเงิน & Payroll
            </button>

            {activeTab !== 'roles' && (
              <button 
                type="button"
                onClick={handleSaveAllSettings}
                disabled={isSavingSettings}
                className="mt-auto bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Save size={16} /> บันทึกการตั้งค่า
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
            {activeTab === 'roles' && (
              <div className="space-y-6">
                {isCreatingRole || editingRole ? (
                  <div className="space-y-6 animate-in slide-in-from-top-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Role Name</label>
                      <input 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={roleFormData.name}
                        onChange={e => setRoleFormData({...roleFormData, name: e.target.value})}
                        placeholder="e.g. Manager, Senior Groomer"
                        required
                        disabled={editingRole?.name === 'superadmin' || editingRole?.name === 'Admin' || editingRole?.name === 'Groomer' || editingRole?.name === 'Assistant'}
                      />
                      {(editingRole?.name === 'superadmin' || editingRole?.name === 'Admin' || editingRole?.name === 'Groomer' || editingRole?.name === 'Assistant') && (
                        <p className="text-[9px] text-red-500 font-bold px-1 mt-1">Cannot edit name of default system roles.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Description</label>
                      <textarea 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-24 resize-none"
                        value={roleFormData.description}
                        onChange={e => setRoleFormData({...roleFormData, description: e.target.value})}
                        placeholder="Brief description of this role's responsibilities."
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Permissions (Allowed Pages)</label>
                      <div className="grid grid-cols-2 gap-4 bg-[#F5F6FA] p-6 rounded-3xl border border-gray-100">
                        {allAvailablePaths.map(item => (
                          <div key={item.path} className="flex items-center space-x-3">
                            <Checkbox
                              id={`perm-${item.path}`}
                              checked={roleFormData.permissions.includes(item.path)}
                              onCheckedChange={() => togglePermission(item.path)}
                              className="data-[state=checked]:bg-[#1A1F3D] data-[state=checked]:text-white"
                            />
                            <label
                              htmlFor={`perm-${item.path}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {item.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onClick={() => { setIsCreatingRole(false); setEditingRole(null); }} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                      <button type="button" onClick={handleSaveRole} className="flex-[2] bg-[#1A1F3D] text-white py-4 rounded-2xl font-black shadow-xl">
                        {editingRole ? "Update Role" : "Create Role"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingRole(true)}
                      className="w-full border-2 border-dashed border-gray-100 rounded-[32px] py-10 flex flex-col items-center justify-center text-gray-300 hover:text-[#1A1F3D] hover:bg-gray-50 transition-all"
                    >
                      <Plus size={24} className="mb-2" />
                      <span className="text-xs font-black uppercase tracking-widest">สร้างบทบาทใหม่</span>
                    </button>

                    {filteredRoles.map(role => (
                      <div key={role.id} className="bg-white border border-gray-100 p-6 rounded-[32px] flex items-center justify-between group hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                            <Shield size={20} />
                          </div>
                          <div>
                            <h4 className="font-black text-[#1A1F3D]">{role.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{role.description || 'No description'}</p>
                            {role.store_id === null && (
                              <span className="text-[8px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-black uppercase mt-1">Global Role</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => setEditingRole(role)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                            {!(role.name === 'superadmin' || role.name === 'Admin' || role.name === 'Groomer' || role.name === 'Assistant') && (
                              <button type="button" onClick={() => handleDeleteRole(role.id, role.name)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <h4 className="text-lg font-black text-[#1A1F3D] mb-4">การตั้งค่าการลงเวลาทำงาน (Attendance)</h4>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-[#F5F6FA] p-6 rounded-3xl border border-gray-100">
                    <div>
                      <h5 className="text-sm font-black text-[#1A1F3D]">ตรวจสอบตำแหน่ง GPS (Require GPS Check-in)</h5>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">บังคับให้พนักงานบันทึกเวลาทำงานผ่านพิกัด GPS ของร้านเท่านั้น</p>
                    </div>
                    <Checkbox 
                      id="require-gps"
                      checked={requireGps} 
                      onCheckedChange={(checked) => setRequireGps(!!checked)}
                      className="w-6 h-6 rounded-lg data-[state=checked]:bg-[#1A1F3D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="late-buffer" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">เวลาผ่อนผันการเข้าสาย (นาที)</Label>
                      <input 
                        id="late-buffer"
                        type="number"
                        min="0"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={lateBufferMinutes}
                        onChange={e => setLateBufferMinutes(Number(e.target.value))}
                        placeholder="15"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="auto-checkout" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">เวลาออกงานอัตโนมัติ (Auto Check-out)</Label>
                      <input 
                        id="auto-checkout"
                        type="time"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={autoCheckoutTime}
                        onChange={e => setAutoCheckoutTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h4 className="text-lg font-black text-[#1A1F3D] mb-4">การตั้งค่ากะและตารางงาน (Shift & Schedule)</h4>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-[#F5F6FA] p-6 rounded-3xl border border-gray-100">
                    <div>
                      <h5 className="text-sm font-black text-[#1A1F3D]">อนุญาตให้สลับกะ (Allow Shift Swapping)</h5>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">ให้สิทธิ์พนักงานในการส่งคำขอสลับกะหรือแลกเปลี่ยนกะกันเองได้</p>
                    </div>
                    <Checkbox 
                      id="allow-swap"
                      checked={allowShiftSwapping} 
                      onCheckedChange={(checked) => setAllowShiftSwapping(!!checked)}
                      className="w-6 h-6 rounded-lg data-[state=checked]:bg-[#1A1F3D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="min-hours" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ระยะเวลาพักขั้นต่ำระหว่างกะ (ชั่วโมง)</Label>
                      <input 
                        id="min-hours"
                        type="number"
                        min="0"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={minHoursBetweenShifts}
                        onChange={e => setMinHoursBetweenShifts(Number(e.target.value))}
                        placeholder="8"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="release-notice" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ระยะเวลาแจ้งเตือนล่วงหน้า (วัน)</Label>
                      <input 
                        id="release-notice"
                        type="number"
                        min="0"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={releaseNoticeDays}
                        onChange={e => setReleaseNoticeDays(Number(e.target.value))}
                        placeholder="7"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payroll' && (
              <div className="space-y-6">
                <h4 className="text-lg font-black text-[#1A1F3D] mb-4">การตั้งค่าการเงิน & Payroll</h4>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pay-freq" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">รอบการจ่ายเงินเดือน (Pay Frequency)</Label>
                      <Select value={payFrequency} onValueChange={(value: any) => setPayFrequency(value)}>
                        <SelectTrigger id="pay-freq" className="border-none bg-[#F5F6FA] rounded-2xl h-12 focus:ring-4 focus:ring-[#1A1F3D]/5 font-bold text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                          <SelectItem value="monthly" className="text-xs font-bold py-3">รายเดือน (Monthly)</SelectItem>
                          <SelectItem value="semi-monthly" className="text-xs font-bold py-3">รายปักษ์ (Semi-monthly)</SelectItem>
                          <SelectItem value="weekly" className="text-xs font-bold py-3">รายสัปดาห์ (Weekly)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pay-day" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">วันจ่ายเงินเดือนของแต่ละเดือน</Label>
                      <input 
                        id="pay-day"
                        type="number"
                        min="1"
                        max="31"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={payDayOfMonth}
                        onChange={e => setPayDayOfMonth(Number(e.target.value))}
                        placeholder="25"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ot-multiplier" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ตัวคูณอัตราค่าล่วงเวลา (OT multiplier)</Label>
                      <input 
                        id="ot-multiplier"
                        type="number"
                        step="0.1"
                        min="1"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={overtimeRate}
                        onChange={e => setOvertimeRate(Number(e.target.value))}
                        placeholder="1.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="social-sec" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">อัตราหักประกันสังคม (%)</Label>
                      <input 
                        id="social-sec"
                        type="number"
                        min="0"
                        max="100"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={socialSecurityRate}
                        onChange={e => setSocialSecurityRate(Number(e.target.value))}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSettingsModal;
