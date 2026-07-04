import React from 'react';
import { useStore } from '@/store/useStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BranchSwitcherProps {
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export const BranchSwitcher: React.FC<BranchSwitcherProps> = ({ className, onOpenChange }) => {
  const { branches, storeId, setStoreId, organizationName, currentUser } = useStore();

  // If there are no branches or the user doesn't have an organization context, don't show the switcher
  if (!branches || branches.length === 0 || !storeId) {
    return null;
  }

  // Find current branch name
  const currentBranch = branches.find((b) => b.id === storeId);

  return (
    <div className={cn('flex flex-col space-y-1', className)}>
      {organizationName && (
        <div className="flex items-center gap-1.5 px-1 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <Building2 size={12} />
          <span className="truncate">{organizationName}</span>
        </div>
      )}
      <Select
        value={storeId}
        onValueChange={(value) => setStoreId(value)}
        onOpenChange={onOpenChange}
      >
        <SelectTrigger className="w-full bg-white border-gray-100 shadow-sm rounded-xl focus:ring-[#1A1F3D] h-10">
          <div className="flex items-center gap-2 truncate">
            <Store size={14} className="text-[#1A1F3D]" />
            <span className="text-xs font-bold text-[#1A1F3D] truncate">
              {currentBranch?.name || 'เลือกสาขา'}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id} className="cursor-pointer rounded-lg text-xs font-medium focus:bg-gray-50 focus:text-[#1A1F3D]">
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
