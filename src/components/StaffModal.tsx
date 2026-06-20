import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Staff, StaffRole } from '@/store/types';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff; // Optional, for editing existing staff
}

const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, staff }) => {
  const addStaff = useStore((state) => state.addStaff);
  const updateStaff = useStore((state) => state.updateStaff);

  const initialState = {
    name: staff?.name || '',
    email: staff?.email || '',
    role: staff?.role || 'Assistant',
    phone: staff?.phone || '',
    status: staff?.status || 'Active',
    avatar: staff?.avatar || '',
    commissionRate: staff?.commissionRate || 0
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        email: staff.email,
        role: staff.role,
        phone: staff.phone,
        status: staff.status,
        avatar: staff.avatar,
        commissionRate: staff.commissionRate || 0
      });
    } else {
      setFormData(initialState);
    }
  }, [staff, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role || !formData.phone) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      if (staff) {
        await updateStaff(staff.id, formData);
        toast.success('Staff updated successfully!');
      } else {
        await addStaff(formData);
        toast.success('Staff added successfully!');
      }
      onClose();
    } catch (error) {
      console.error('Failed to save staff:', error);
      toast.error('Failed to save staff. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{staff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value as StaffRole)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Groomer">Groomer</SelectItem>
                <SelectItem value="Assistant">Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" value={formData.phone} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value as 'Active' | 'Inactive')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avatar" className="text-right">
              Avatar URL
            </Label>
            <Input id="avatar" value={formData.avatar} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="commissionRate" className="text-right">
              Commission Rate (%)
            </Label>
            <Input
              id="commissionRate"
              type="number"
              value={formData.commissionRate}
              onChange={handleChange}
              className="col-span-3"
              min="0"
              max="100"
            />
          </div>
          <DialogFooter>
            <Button type="submit">{staff ? 'Save Changes' : 'Add Staff'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StaffModal;