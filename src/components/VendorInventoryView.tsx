"use client";

import React, { useState } from 'react';
import { X, Package, DollarSign, TrendingUp, BarChart3, AlertCircle, Plus } from 'lucide-react';
import { useStore, Partner } from '@/store/useStore';
import { cn } from '@/lib/utils';
import InventoryModal from './InventoryModal';

interface VendorInventoryViewProps {
  vendor: Partner;
  onClose: () => void;
}

const VendorInventoryView = ({ vendor, onClose }: VendorInventoryViewProps) => {
  const { inventory, currency } = useStore();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  
  const vendorItems = inventory.filter(i => i.partnerId === vendor.id);

  const stats = vendorItems.reduce((acc, item) => {
    const totalItemRetailValue = item.price * item.stock;
    const profitPerUnit = item.isConsignment 
      ? (item.price * (item.consignmentRate || vendor.gpRate || 0) / 100)
      : (item.price - (item.costPrice || 0));
    
    return {
      totalItems: acc.totalItems + 1,
      totalStock: acc.totalStock + item.stock,
      totalRetailValue: acc.totalRetailValue + totalItemRetailValue,
      totalPotentialProfit: acc.totalPotentialProfit + (profitPerUnit * item.stock)
    };
  }, { totalItems: 0, totalStock: 0, totalRetailValue: 0, totalPotentialProfit: 0 });

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-[#F8F9FD] w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-10 bg-white border-b border-gray-100 flex justify-between items-start shrink-0">
          <div className="flex gap-6">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center">
                <BarChart3 size={32} />
             </div>
             <div>
                <h3 className="text-3xl font-black text-[#1A1F3D] mb-1">{vendor.companyName}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Inventory Performance & Value</p>
                <div className="flex items-center gap-4 mt-4">
                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-500">
                      <Package size={14} /> {stats.totalItems} Products
                   </div>
                   <div className="w-1 h-1 bg-gray-200 rounded-full" />
                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-500">
                      <AlertCircle size={14} /> {stats.totalStock} Units in Stock
                   </div>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsAddProductOpen(true)} 
               className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
             >
                <Plus size={20} /> เพิ่มสินค้าใหม่
             </button>
             <button onClick={onClose} className="p-3 hover:bg-gray-50 rounded-2xl transition-all">
               <X size={24} className="text-gray-400" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><DollarSign size={80} /></div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Total Retail Value (Stock)</p>
                <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{stats.totalRetailValue.toLocaleString()}</h2>
                <p className="text-[10px] text-gray-300 font-bold uppercase mt-4">Calculated at current shelf prices</p>
             </div>
             <div className="bg-[#1A1F3D] p-8 rounded-[40px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-[#D9ED5F]"><TrendingUp size={80} /></div>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Potential Shop Profit</p>
                <h2 className="text-4xl font-black text-[#D9ED5F]">{currency}{stats.totalPotentialProfit.toLocaleString()}</h2>
                <p className="text-[10px] text-white/40 font-bold uppercase mt-4">After subtracting vendor share/costs</p>
             </div>
          </div>

          {/* Table Breakdown */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                <h4 className="text-sm font-black text-[#1A1F3D] uppercase tracking-widest">Product List Breakdown</h4>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-gray-50/50">
                         <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th>
                         <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Qty</th>
                         <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Retail</th>
                         <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">GP/Cost</th>
                         <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Net Profit (Per Unit)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {vendorItems.map(item => {
                         const profit = item.isConsignment 
                            ? (item.price * (item.consignmentRate || vendor.gpRate || 0) / 100)
                            : (item.price - (item.costPrice || 0));
                         
                         return (
                            <tr key={item.id} className="hover:bg-[#F8F9FD] transition-colors">
                               <td className="px-8 py-6">
                                  <p className="text-sm font-black text-[#1A1F3D]">{item.name}</p>
                                  <span className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                    item.isConsignment ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                                  )}>
                                     {item.isConsignment ? `Consignment (${item.consignmentRate || vendor.gpRate || 0}%)` : 'Normal Stock'}
                                  </span>
                               </td>
                               <td className="px-8 py-6 text-center font-bold text-gray-500">{item.stock}</td>
                               <td className="px-8 py-6 text-center font-black text-[#1A1F3D]">{currency}{item.price.toLocaleString()}</td>
                               <td className="px-8 py-6 text-center text-[10px] font-bold text-gray-400">
                                  {item.isConsignment ? `${item.consignmentRate || vendor.gpRate || 0}% GP` : `${currency}${item.costPrice}`}
                               </td>
                               <td className="px-8 py-6 text-right font-black text-green-600">+{currency}{profit.toLocaleString()}</td>
                            </tr>
                         );
                      })}
                      {vendorItems.length === 0 && (
                        <tr><td colSpan={5} className="py-20 text-center opacity-20 font-black">No products assigned to this partner</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
      {isAddProductOpen && (
        <InventoryModal 
          item={null} 
          initialPartnerId={vendor.id} 
          defaultIsConsignment={true}
          onClose={() => setIsAddProductOpen(false)} 
        />
      )}
    </div>
  );
};

export default VendorInventoryView;