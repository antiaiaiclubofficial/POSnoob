"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2, Save, Shield, Check, Ban } from 'lucide-react';
import { useStore, Role, StaffRole } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface RoleManagementModalProps {
  onClose: () => void;
}

const RoleManagementModal = ({ onClose }: RoleManagementModalProps) => {
  const { roles, addRole, updateRole, deleteRole, storeId, currentUser } = useStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<Omit<Role, 'id' | 'created_at'>>({
    store_id: null,
    name: '',
    description: '',
    permissions: []
  });

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
    // Add other paths as needed, but exclude /superadmin from general role management
  ];

  useEffect(() => {
    if (editingRole) {
      setFormData({
        store_id: editingRole.store_id,
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions
      });
    } else {
      setFormData({
        store_id: storeId && storeId !== 'default-store' ? storeId : null,
        name: '',
        description: '',
        permissions: []
      });
    }
  }, [editingRole, storeId]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        toast.success("Role updated successfully");
      } else {
        await addRole(formData);
        toast.success("New role created successfully");
      }
      setIsCreating(false);
      setEditingRole(null);
      setFormData({
        store_id: storeId && storeId !== 'default-store' ? storeId : null,
        name: '',
        description: '',
        permissions: []
      });
    } catch (error: any) {
      toast.error("Failed to save role: " + error.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the role "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteRole(id);
      toast.success("Role deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete role: " + error.message);
    }
  };

  const togglePermission = (path: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(path)
        ? prev.permissions.filter(p => p !== path)
        : [...prev.permissions, path]
    }));
  };

  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Filter roles to show only global roles (if superadmin) or store-specific roles
  const filteredRoles = roles.filter(role => 
    isSuperAdmin || (role.store_id === null || role.store_id === storeId)
  );

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-3xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">Role Management</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Define Staff Permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          {isCreating || editingRole ? (
            <div className="space-y-6 animate-in slide-in-from-top-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Role Name</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
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
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
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
                        checked={formData.permissions.includes(item.path)}
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
                <button onClick={() => { setIsCreating(false); setEditingRole(null); }} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                <button onClick={handleSave} className="flex-[2] bg-[#1A1F3D] text-white py-4 rounded-2xl font-black shadow-xl">
                  {editingRole ? "Update Role" : "Create Role"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full border-2 border-dashed border-gray-100 rounded-[32px] py-10 flex flex-col items-center justify-center text-gray-300 hover:text-[#1A1F3D] hover:bg-gray-50 transition-all"
              >
                <Plus size={24} className="mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Create New Role</span>
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
                      <button onClick={() => setEditingRole(role)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                      {!(role.name === 'superadmin' || role.name === 'Admin' || role.name === 'Groomer' || role.name === 'Assistant') && (
                        <button onClick={() => handleDelete(role.id, role.name)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredRoles.length === 0 && (
                <div className="py-10 text-center opacity-30 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-xs font-bold uppercase">No roles configured</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagementModal;