"use client";

import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Plus, User, Edit3, ChevronLeft, MessageSquare, BadgeCheck, Trash2, Package, Clock, Star, Gift, Wallet, Send, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStore, Customer, Pet, MembershipLevel, CreditTransaction } from '@/store/useStore';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';
import PetProfileRecord from '@/components/PetProfileRecord';
import LineBindingModal from '@/components/LineBindingModal';
import PackageModal from '@/components/PackageModal';
import CreditPackageModal from '@/components/CreditPackageModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { translations } from '@/utils/translations';
import { format } from 'date-fns';
import { sendCreditUpdateFlex } from '@/utils/messaging';

const Customers = () => {
  const isMobile = useIsMobile();
  const { customers, deleteCustomer, currency, language } = useStore();
  const t = translations[language];
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (isMobile) setShowDetailOnMobile(true);
  };

  const handleSendFlex = (tx: CreditTransaction) => {
    if (selectedCustomer) {
      sendCreditUpdateFlex(selectedCustomer.name, tx.previousBalance, tx.amount, tx.newBalance);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Customer List Sidebar */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col border-r border-gray-100 bg-white shrink-0 transition-all duration-300",
        isMobile && showDetailOnMobile ? "-translate-x-full absolute" : "translate-x-0"
      )}>
        <div className="p-6 pt-20 lg:pt-6">
          <h1 className="text-2xl font-black mb-6">CRM</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F6FA] pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-[#1A1F3D]/5" 
              placeholder={language === 'th' ? 'ค้นหาลูกค้า...' : 'Search clients...'} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
          {filteredCustomers.map(customer => (
            <button
              key={customer.id}
              onClick={() => handleSelectCustomer(customer.id)}
              className={cn(
                "w-full text-left p-4 rounded-2xl mb-2 transition-all group",
                selectedCustomerId === customer.id ? "bg-[#1A1F3D] text-white shadow-lg" : "hover:bg-gray-50"
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm">{customer.name}</p>
                  <p className={cn("text-[10px]", selectedCustomerId === customer.id ? "text-white/60" : "text-gray-400")}>
                    {customer.pets.length} {language === 'th' ? 'ตัว' : 'Pets'} • {customer.membership}
                  </p>
                </div>
                {customer.creditBalance > 0 && (
                   <div className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-md">
                     {currency}{customer.creditBalance.toLocaleString()}
                   </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-50">
          <button 
            onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}
            className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {language === 'th' ? 'เพิ่มลูกค้าใหม่' : 'Add Client'}
          </button>
        </div>
      </div>

      {/* Customer Detail View */}
      <div className={cn(
        "flex-1 overflow-y-auto bg-[#F8F9FD] scrollbar-hide transition-all duration-300",
        isMobile && !showDetailOnMobile ? "translate-x-full absolute" : "translate-x-0"
      )}>
        {selectedCustomer ? (
          <div className="p-6 lg:p-10 max-w-5xl mx-auto">
            {isMobile && (
              <button onClick={() => setShowDetailOnMobile(false)} className="flex items-center gap-2 text-gray-400 font-bold text-xs mb-6 pt-14"><ChevronLeft size={16} /> Back to List</button>
            )}

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="flex gap-6">
                <div className="w-20 h-20 bg-[#1A1F3D] rounded-[24px] flex items-center justify-center text-2xl font-black text-white shrink-0">{selectedCustomer.name.charAt(0)}</div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-black">{selectedCustomer.name}</h2>
                    <button onClick={() => { setEditingCustomer(selectedCustomer); setIsCustomerModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={18} /></button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Phone size={14}/> {selectedCustomer.phone}</span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Mail size={14}/> {selectedCustomer.email}</span>
                  </div>
                  <div className="pt-2">
                    {selectedCustomer.lineId ? (
                      <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100 w-fit">
                        <MessageSquare size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{t.lineConnected}</span><BadgeCheck size={14} />
                      </div>
                    ) : (
                      <button onClick={() => setIsLineModalOpen(true)} className="flex items-center gap-2 bg-[#F5F6FA] text-gray-400 hover:text-green-600 border border-transparent px-4 py-2 rounded-xl transition-all w-fit">
                        <MessageSquare size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{t.connectLine}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">{selectedCustomer.membership} MEMBER</span>
                <p className="text-[10px] text-gray-400 font-black uppercase">TOTAL SPENT: <span className="text-[#1A1F3D]">{currency}{selectedCustomer.totalSpent.toLocaleString()}</span></p>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden h-full">
                     <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center"><Wallet size={20} /></div>
                           <h3 className="text-lg font-black text-[#1A1F3D]">Wallet</h3>
                        </div>
                        <button onClick={() => setIsCreditModalOpen(true)} className="bg-amber-500 text-white p-2 rounded-xl shadow-lg shadow-amber-500/10 hover:scale-110 transition-all"><Plus size={18} /></button>
                     </div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Credit</p>
                     <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{(selectedCustomer.creditBalance || 0).toLocaleString()}</h2>
                     <div className="mt-8 flex gap-2">
                        <button className="flex-1 py-3 bg-[#F5F6FA] rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100">Withdraw</button>
                        <button className="flex-1 py-3 bg-[#F5F6FA] rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100">Transfer</button>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-[300px]">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><History size={20} /></div>
                        <h3 className="text-lg font-black text-[#1A1F3D]">Credit History</h3>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
                     {selectedCustomer.creditHistory && selectedCustomer.creditHistory.length > 0 ? (
                        selectedCustomer.creditHistory.map(tx => (
                          <div key={tx.id} className="bg-[#F8F9FD] p-4 rounded-2xl flex items-center justify-between group">
                             <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", tx.type === 'Top-up' ? "bg-green-100 text-green-600" : "bg-red-50 text-red-500")}>
                                   {tx.type === 'Top-up' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                </div>
                                <div>
                                   <p className="text-xs font-black text-[#1A1F3D]">{tx.description}</p>
                                   <p className="text-[8px] text-gray-400 font-bold uppercase">{format(new Date(tx.date), 'dd MMM, HH:mm')}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="text-right">
                                   <p className={cn("text-xs font-black", tx.amount > 0 ? "text-green-600" : "text-red-500")}>{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}</p>
                                   <p className="text-[8px] text-gray-300 font-bold uppercase">Bal: {tx.newBalance.toLocaleString()}</p>
                                </div>
                                <button onClick={() => handleSendFlex(tx)} className="p-2 bg-white text-green-500 rounded-lg shadow-sm border border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Send size={14} />
                                </button>
                             </div>
                          </div>
                        ))
                     ) : (
                        <div className="h-full flex items-center justify-center opacity-20"><p className="text-xs font-black uppercase">No transactions</p></div>
                     )}
                  </div>
               </div>
            </div>

            {/* Package & Pets Section continued... */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div><h3 className="text-2xl font-black text-[#1A1F3D]">Service Packages</h3><p className="text-xs text-gray-400 font-bold uppercase mt-1">Bundle tracking</p></div>
                <button onClick={() => setIsPackageModalOpen(true)} className="bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg"><Plus size={16} /> Assign Package</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedCustomer.packages && selectedCustomer.packages.map(pkg => (
                  <div key={pkg.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden relative group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><Package size={24} /></div>
                      <div className="text-right"><span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{pkg.remainingSlots} Left</span></div>
                    </div>
                    <h4 className="text-lg font-black text-[#1A1F3D] mb-4">{pkg.name}</h4>
                    <div className="w-full bg-[#F5F6FA] h-2 rounded-full overflow-hidden mb-8"><div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${(pkg.usedSlots / pkg.totalSlots) * 100}%` }}/></div>
                    <div className="pt-6 border-t border-gray-50">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Usage History</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                        {pkg.usageHistory.length > 0 ? pkg.usageHistory.map(usage => (<div key={usage.id} className="flex justify-between items-center text-[10px] font-bold text-gray-600"><span className="flex items-center gap-2"><Clock size={10} /> {usage.date}</span><span>{usage.isFreebie ? "(Freebie)" : "Session"}</span></div>)) : <p className="text-[10px] text-gray-300 italic">No usage recorded</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-8"><h3 className="text-2xl font-black text-[#1A1F3D]">{t.petRegistry}</h3><button onClick={() => { setEditingPet(null); setIsPetModalOpen(true); }} className="bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-[#D9ED5F]/20"><Plus size={16} /> {t.registerPet}</button></div>
            <div className="space-y-8 pb-10">{selectedCustomer.pets.map(pet => (<PetProfileRecord key={pet.id} pet={pet} onEdit={(p) => { setEditingPet(p); setIsPetModalOpen(true); }} />))}</div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20"><User size={64} className="mb-4" /><p className="font-black text-xl">Select a client profile</p></div>
        )}
      </div>

      {isCustomerModalOpen && <CustomerModal customer={editingCustomer} onClose={() => setIsCustomerModalOpen(false)} />}
      {isPetModalOpen && selectedCustomer && <PetModal customerId={selectedCustomer.id} pet={editingPet} onClose={() => setIsPetModalOpen(false)} />}
      {isLineModalOpen && selectedCustomer && <LineBindingModal customer={selectedCustomer} onClose={() => setIsLineModalOpen(false)} />}
      {isPackageModalOpen && selectedCustomer && <PackageModal customerId={selectedCustomer.id} onClose={() => setIsPackageModalOpen(false)} />}
      {isCreditModalOpen && selectedCustomer && <CreditPackageModal customerId={selectedCustomer.id} onClose={() => setIsCreditModalOpen(false)} />}
    </div>
  );
};

export default Customers;