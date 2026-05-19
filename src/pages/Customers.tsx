"use client";

import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Plus, User, Edit3, ChevronLeft, MessageSquare, BadgeCheck, Trash2, Package, Clock, Star, Gift } from 'lucide-react';
import { useStore, Customer, Pet, MembershipLevel } from '@/store/useStore';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';
import PetProfileRecord from '@/components/PetProfileRecord';
import LineBindingModal from '@/components/LineBindingModal';
import PackageModal from '@/components/PackageModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { translations } from '@/utils/translations';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const Customers = () => {
  const isMobile = useIsMobile();
  const { customers, setCustomers, deleteCustomer, currency, language } = useStore();
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

  // Fetch from 'customers' table with joins
  const { isLoading } = useQuery({
    queryKey: ['customers-crm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          pets (*),
          store_customers (*)
        `);
      
      if (error) throw error;

      const transformedCustomers: Customer[] = data.map((item: any) => {
        const storeData = item.store_customers?.[0] || {};
        
        const pets: Pet[] = (item.pets || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          species: (p.type === 'cat' ? 'Cat' : p.type === 'dog' ? 'Dog' : 'Other') as any,
          breed: p.breed || 'Unknown',
          birthday: p.age || '',
          weightHistory: p.weight ? [{ date: new Date().toISOString().split('T')[0], value: p.weight }] : [],
          serviceHistory: [],
          notes: p.medical_condition || p.precautions || '',
          image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
        }));

        const rawTier = storeData.tier?.toLowerCase();
        let membership: MembershipLevel = 'Standard';
        if (rawTier === 'silver') membership = 'Silver';
        if (rawTier === 'gold') membership = 'Gold';
        if (rawTier === 'vip') membership = 'VIP';

        return {
          id: item.id,
          name: item.first_name ? `${item.first_name} ${item.last_name || ''}`.trim() : (item.display_name || 'No Name'),
          phone: item.phone || '-',
          email: item.email || '-',
          membership: membership,
          points: storeData.points || 0,
          pets: pets,
          packages: [], // Local storage will handle state for now as schema might not have it
          totalSpent: storeData.points || 0,
          lineId: item.line_user_id
        };
      });

      setCustomers(transformedCustomers);
      return transformedCustomers;
    }
  });

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

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm("Confirm deletion?")) {
      deleteCustomer(id);
      if (filteredCustomers.length > 1) {
        setSelectedCustomerId(filteredCustomers[0].id === id ? filteredCustomers[1].id : filteredCustomers[0].id);
      } else {
        setSelectedCustomerId(null);
      }
    }
  };

  if (isLoading && customers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FD]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1A1F3D]/10 border-t-[#1A1F3D] rounded-full animate-spin" />
          <p className="text-sm font-black text-[#1A1F3D] uppercase tracking-widest">Fetching Customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Customer List Sidebar */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col border-r border-gray-100 bg-white shrink-0 transition-all duration-300",
        isMobile && showDetailOnMobile ? "-translate-x-full absolute" : "translate-x-0"
      )}>
        <div className="p-6 pt-20 lg:pt-6">
          <h1 className="text-2xl font-black mb-6">{language === 'th' ? 'ลูกค้าสัมพันธ์' : 'CRM'}</h1>
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
                "w-full text-left p-4 rounded-2xl mb-2 transition-all flex items-center justify-between group",
                selectedCustomerId === customer.id ? "bg-[#1A1F3D] text-white shadow-lg" : "hover:bg-gray-50"
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{customer.name}</p>
                  {customer.packages && customer.packages.length > 0 && (
                    <div className="bg-[#D9ED5F] text-[#1A1F3D] text-[7px] font-black px-1.5 rounded-md uppercase tracking-tighter">PKG</div>
                  )}
                </div>
                <p className={cn("text-[10px]", selectedCustomerId === customer.id ? "text-white/60" : "text-gray-400")}>
                  {customer.pets.length} {language === 'th' ? 'ตัว' : 'Pets'} • {customer.membership}
                </p>
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
              <button 
                onClick={() => setShowDetailOnMobile(false)}
                className="flex items-center gap-2 text-gray-400 font-bold text-xs mb-6 pt-14"
              >
                <ChevronLeft size={16} /> {language === 'th' ? 'กลับไปยังรายชื่อ' : 'Back to List'}
              </button>
            )}

            <div className="bg-white p-6 lg:p-8 rounded-[32px] shadow-sm border border-gray-100 mb-8 lg:mb-10 flex flex-col sm:flex-row justify-between items-start gap-6 group">
              <div className="flex gap-4 lg:gap-6">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#1A1F3D] rounded-[24px] flex items-center justify-center text-xl lg:text-2xl font-black text-white shrink-0">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl lg:text-3xl font-black">{selectedCustomer.name}</h2>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingCustomer(selectedCustomer); setIsCustomerModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeleteCustomer(selectedCustomer.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                    <span className="flex items-center gap-1.5 text-[10px] lg:text-xs text-gray-400 font-bold"><Phone size={14}/> {selectedCustomer.phone}</span>
                    <span className="flex items-center gap-1.5 text-[10px] lg:text-xs text-gray-400 font-bold"><Mail size={14}/> {selectedCustomer.email}</span>
                  </div>
                  <div className="pt-2">
                    {selectedCustomer.lineId ? (
                      <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100 w-fit">
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.lineConnected}</span>
                        <BadgeCheck size={14} />
                      </div>
                    ) : (
                      <button onClick={() => setIsLineModalOpen(true)} className="flex items-center gap-2 bg-[#F5F6FA] text-gray-400 hover:text-green-600 border border-transparent px-4 py-2 rounded-xl transition-all w-fit">
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.connectLine}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
                  {selectedCustomer.membership} MEMBER
                </span>
                <p className="text-[10px] text-gray-400 font-black uppercase">{t.totalSpent}: <span className="text-[#1A1F3D]">{currency}{selectedCustomer.totalSpent.toLocaleString()}</span></p>
              </div>
            </div>

            {/* Package Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl lg:text-2xl font-black text-[#1A1F3D]">Active Packages</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Bundle tracking & Freebies</p>
                </div>
                <button 
                  onClick={() => setIsPackageModalOpen(true)}
                  className="bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg shadow-indigo-500/10 transition-all hover:scale-105"
                >
                  <Plus size={16} /> Assign Package
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedCustomer.packages && selectedCustomer.packages.map(pkg => (
                  <div key={pkg.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden relative group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                        <Package size={24} />
                      </div>
                      <div className="text-right">
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          {pkg.remainingSlots} Left
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-black text-[#1A1F3D] mb-4">{pkg.name}</h4>

                    <div className="space-y-3 mb-8">
                       {pkg.recurringFreebie && (
                         <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                           <Star size={14} /> {pkg.recurringFreebie} (Every visit)
                         </div>
                       )}
                       {pkg.oneTimeFreebie && (
                         <div className={cn(
                           "flex items-center gap-2 text-xs font-bold",
                           pkg.oneTimeFreebie.isUsed ? "text-gray-300 line-through" : "text-amber-600"
                         )}>
                           <Gift size={14} /> {pkg.oneTimeFreebie.name} (One-time)
                         </div>
                       )}
                    </div>

                    <div className="w-full bg-[#F5F6FA] h-2 rounded-full overflow-hidden mb-8">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-500" 
                        style={{ width: `${(pkg.usedSlots / pkg.totalSlots) * 100}%` }}
                      />
                    </div>

                    <div className="pt-6 border-t border-gray-50">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Usage History</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                        {pkg.usageHistory.length > 0 ? (
                          pkg.usageHistory.map(usage => (
                            <div key={usage.id} className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                              <span className="flex items-center gap-2"><Clock size={10} /> {usage.date}</span>
                              <span className={usage.isFreebie ? "text-green-500" : ""}>{usage.isFreebie ? "(Freebie Session)" : "Session"}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-gray-300 font-medium italic">No usage recorded yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!selectedCustomer.packages || selectedCustomer.packages.length === 0) && (
                  <div className="col-span-2 py-12 text-center bg-white rounded-[40px] border border-dashed border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No active packages</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl lg:text-2xl font-black text-[#1A1F3D]">{t.petRegistry}</h3>
              <button onClick={() => { setEditingPet(null); setIsPetModalOpen(true); }} className="bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-[#D9ED5F]/20 transition-all hover:scale-105">
                <Plus size={16} /> {t.registerPet}
              </button>
            </div>

            <div className="space-y-8 pb-10">
              {selectedCustomer.pets.map(pet => (
                <PetProfileRecord key={pet.id} pet={pet} onEdit={(p) => { setEditingPet(p); setIsPetModalOpen(true); }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <User size={64} className="mb-4" />
            <p className="font-black text-xl">{language === 'th' ? 'กรุณาเลือกโปรไฟล์ลูกค้า' : 'Select a client profile'}</p>
          </div>
        )}
      </div>

      {isCustomerModalOpen && <CustomerModal customer={editingCustomer} onClose={() => setIsCustomerModalOpen(false)} />}
      {isPetModalOpen && selectedCustomer && <PetModal customerId={selectedCustomer.id} pet={editingPet} onClose={() => setIsPetModalOpen(false)} />}
      {isLineModalOpen && selectedCustomer && <LineBindingModal customer={selectedCustomer} onClose={() => setIsLineModalOpen(false)} />}
      {isPackageModalOpen && selectedCustomer && <PackageModal customerId={selectedCustomer.id} onClose={() => setIsPackageModalOpen(false)} />}
    </div>
  );
};

export default Customers;