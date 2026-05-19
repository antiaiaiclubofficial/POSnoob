"use client";

import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Plus, User, Edit3, ChevronLeft, MessageSquare, BadgeCheck, Trash2, Package, Clock, Star, Gift, Gem, ArrowUpRight, ArrowDownRight, Send } from 'lucide-react';
import { useStore, Customer, Pet, CreditTransaction } from '@/store/useStore';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';
import PetProfileRecord from '@/components/PetProfileRecord';
import LineBindingModal from '@/components/LineBindingModal';
import PackageModal from '@/components/PackageModal';
import CreditNotificationModal from '@/components/CreditNotificationModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { translations } from '@/utils/translations';

const Customers = () => {
  const isMobile = useIsMobile();
  const { customers, deleteCustomer, currency, language } = useStore();
  const t = translations[language];
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  
  const [notifTx, setNotifTx] = useState<CreditTransaction | null>(null);

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery));
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (isMobile) setShowDetailOnMobile(true);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative bg-[#F8F9FD]">
      {/* Sidebar logic... */}
      <div className={cn("w-full lg:w-80 flex flex-col border-r border-gray-100 bg-white shrink-0 transition-all", isMobile && showDetailOnMobile ? "-translate-x-full absolute" : "translate-x-0")}>
        <div className="p-6 pt-20 lg:pt-6">
          <h1 className="text-2xl font-black mb-6">CRM / Clients</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#F5F6FA] pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border-none" placeholder="Search clients..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
          {filteredCustomers.map(customer => (
            <button key={customer.id} onClick={() => handleSelectCustomer(customer.id)} className={cn("w-full text-left p-4 rounded-2xl mb-2 transition-all", selectedCustomerId === customer.id ? "bg-[#1A1F3D] text-white shadow-lg" : "hover:bg-gray-50")}>
              <div className="flex justify-between items-start">
                 <div>
                    <p className="font-bold text-sm">{customer.name}</p>
                    <p className={cn("text-[10px]", selectedCustomerId === customer.id ? "text-white/60" : "text-gray-400")}>{customer.membership}</p>
                 </div>
                 <div className={cn("flex items-center gap-1", selectedCustomerId === customer.id ? "text-[#D9ED5F]" : "text-purple-500")}>
                    <Gem size={10}/><span className="text-[10px] font-black">{(customer.creditBalance || 0).toLocaleString()}</span>
                 </div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-gray-50"><button onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }} className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={18} /> Add Client</button></div>
      </div>

      <div className={cn("flex-1 overflow-y-auto scrollbar-hide transition-all", isMobile && !showDetailOnMobile ? "translate-x-full absolute" : "translate-x-0")}>
        {selectedCustomer ? (
          <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-10">
            {isMobile && <button onClick={() => setShowDetailOnMobile(false)} className="flex items-center gap-2 text-gray-400 font-bold text-xs mb-6 pt-14"><ChevronLeft size={16} /> Back to List</button>}
            
            {/* Header Profile */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start gap-8">
               <div className="flex gap-6">
                  <div className="w-24 h-24 bg-[#1A1F3D] rounded-[32px] flex items-center justify-center text-3xl font-black text-white">{selectedCustomer.name.charAt(0)}</div>
                  <div>
                    <h2 className="text-3xl font-black mb-2">{selectedCustomer.name}</h2>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400">
                       <span className="flex items-center gap-2"><Phone size={14}/> {selectedCustomer.phone}</span>
                       <span className="flex items-center gap-2"><Mail size={14}/> {selectedCustomer.email}</span>
                    </div>
                  </div>
               </div>
               <div className="bg-purple-50 p-6 rounded-[32px] border border-purple-100 flex items-center gap-6">
                  <div>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Prepaid Credit Balance</p>
                    <h3 className="text-4xl font-black text-purple-600">{(selectedCustomer.creditBalance || 0).toLocaleString()} <span className="text-lg">PTS</span></h3>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-500 shadow-sm"><Gem size={24}/></div>
               </div>
            </div>

            {/* Credit Transaction History */}
            <div className="space-y-6">
               <div className="flex justify-between items-center px-4">
                  <div>
                    <h3 className="text-xl font-black">Credit Usage & Logs</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Transaction Audit Trail</p>
                  </div>
               </div>
               
               <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-gray-50/50">
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Date / Type</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Previous</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Changed</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Remaining</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Notify</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {selectedCustomer.creditHistory?.slice().reverse().map(tx => (
                          <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-8 py-6">
                                <p className="text-xs font-black">{tx.date}</p>
                                <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", tx.type === 'Top-up' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{tx.type}</span>
                             </td>
                             <td className="px-8 py-6 text-center text-xs font-bold text-gray-400">{tx.previousBalance.toLocaleString()}</td>
                             <td className={cn("px-8 py-6 text-center font-black", tx.type === 'Top-up' ? "text-green-600" : "text-red-500")}>
                                {tx.type === 'Top-up' ? '+' : '-'}{tx.amount.toLocaleString()}
                             </td>
                             <td className="px-8 py-6 text-center font-black text-[#1A1F3D]">{tx.remainingBalance.toLocaleString()}</td>
                             <td className="px-8 py-6 text-right">
                                <button onClick={() => setNotifTx(tx)} className="p-2 bg-[#D9ED5F] text-[#1A1F3D] rounded-xl hover:scale-110 transition-transform"><MessageSquare size={16}/></button>
                             </td>
                          </tr>
                        ))}
                        {(!selectedCustomer.creditHistory || selectedCustomer.creditHistory.length === 0) && (
                          <tr><td colSpan={5} className="py-20 text-center opacity-20 font-black">No credit transactions yet</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Pets & Packages Sections (kept same)... */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl lg:text-2xl font-black text-[#1A1F3D]">{t.petRegistry}</h3>
              <button onClick={() => { setEditingPet(null); setIsPetModalOpen(true); }} className="bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-xl text-xs font-black shadow-lg">Register Pet</button>
            </div>
            <div className="space-y-8 pb-10">
              {selectedCustomer.pets.map(pet => (
                <PetProfileRecord key={pet.id} pet={pet} onEdit={(p) => { setEditingPet(p); setIsPetModalOpen(true); }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20"><User size={64} className="mb-4" /><p className="font-black text-xl">Select a client profile</p></div>
        )}
      </div>

      {isCustomerModalOpen && <CustomerModal customer={editingCustomer} onClose={() => setIsCustomerModalOpen(false)} />}
      {isPetModalOpen && selectedCustomer && <PetModal customerId={selectedCustomer.id} pet={editingPet} onClose={() => setIsPetModalOpen(false)} />}
      {isLineModalOpen && selectedCustomer && <LineBindingModal customer={selectedCustomer} onClose={() => setIsLineModalOpen(false)} />}
      {isPackageModalOpen && selectedCustomer && <PackageModal customerId={selectedCustomer.id} onClose={() => setIsPackageModalOpen(false)} />}
      {notifTx && selectedCustomer && <CreditNotificationModal customer={selectedCustomer} lastTx={notifTx} onClose={() => setNotifTx(null)} />}
    </div>
  );
};

export default Customers;