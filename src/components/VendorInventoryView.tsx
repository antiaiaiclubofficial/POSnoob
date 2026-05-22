"use client";

import React from 'react';
import { Partner } from '@/store/useStore';
import { X } from 'lucide-react';

export interface VendorInventoryViewProps {
  vendor: Partner;
  onClose: () => void;
}

const VendorInventoryView = ({ vendor, onClose }: VendorInventoryViewProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{vendor.companyName} - Stock</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-gray-500">Inventory management for this partner will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default VendorInventoryView;