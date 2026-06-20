import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react'; // Removed Key as username is no longer displayed
import StaffModal from '@/components/StaffModal';
import { Staff as StaffType } from '@/store/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog'; // Corrected import path
import { toast } from 'sonner';

const StaffPage: React.FC = () => {
  const { staff, fetchStaff, deleteStaff } = useStore((state) => ({
    staff: state.staff,
    fetchStaff: state.fetchStaff,
    deleteStaff: state.deleteStaff,
  }));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffType | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddStaff = () => {
    setSelectedStaff(undefined);
    setIsModalOpen(true);
  };

  const handleEditStaff = (staffMember: StaffType) => {
    setSelectedStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleDeleteStaff = (id: string) => {
    setStaffToDelete(id);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (staffToDelete) {
      await deleteStaff(staffToDelete);
      toast.success('Staff deleted successfully!');
      setStaffToDelete(null);
      setIsConfirmDialogOpen(false);
    }
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) // Search by email
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Staff Management</h1>

      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Search staff by name, role, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddStaff}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Commission Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    member.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                    member.role === 'Groomer' ? 'bg-green-100 text-green-800' :
                    member.role === 'Assistant' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                </TableCell>
                <TableCell>{member.phone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    member.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {member.status}
                  </span>
                </TableCell>
                <TableCell>{member.commissionRate}%</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEditStaff(member)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteStaff(member.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        staff={selectedStaff}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this staff member? This action cannot be undone."
      />
    </div>
  );
};

export default StaffPage;