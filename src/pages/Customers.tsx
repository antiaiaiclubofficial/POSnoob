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

  const { isLoading, refetch } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          first_name,
          last_name,
          display_name,
          phone,
          email,
          line_user_id,
          avatar_url,
          gender,
          age,
          house_no,
          village_no,
          soi,
          road,
          sub_district,
          district,
          province,
          postal_code,
          store_customers (
            points,
            tier
          ),
          pets (
            id,
            name,
            type,
            breed,
            birth_date,
            weight,
            medical_condition,
            image_url
          )
        `);
      
      if (error) {
        console.error("Supabase error:", error);
        toast.error("Failed to fetch customers");
        throw error;
      }

      // ดึงข้อมูลประวัติการใช้บริการ (service_history)
      const { data: serviceHistoryData } = await supabase
        .from('service_history')
        .select('*');
      
      const serviceHistoryMap: Record<string, any[]> = {};
      if (serviceHistoryData) {
        serviceHistoryData.forEach(sh => {
          if (sh.pet_id) {
            if (!serviceHistoryMap[sh.pet_id]) {
              serviceHistoryMap[sh.pet_id] = [];
            }
            serviceHistoryMap[sh.pet_id].push({
              id: sh.id,
              serviceName: sh.note || 'บริการ',
              date: sh.created_at.split('T')[0],
              price: Number(sh.price || 0)
            });
          }
        });
      }

      const transformed: Customer[] = data.map((item: any) => {
        const storeCustomer = item.store_customers?.[0] || {};
        return {
          id: item.id,
          name: item.display_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unnamed',
          firstName: item.first_name || '',
          lastName: item.last_name || '',
          phone: item.phone || '-',
          email: item.email || '-',
          lineId: item.line_user_id || '',
          avatarUrl: item.avatar_url || '',
          membership: (storeCustomer.tier || 'Standard') as MembershipLevel,
          points: storeCustomer.points || 0,
          totalSpent: 0,
          creditBalance: 0,
          gender: item.gender || 'Male',
          age: item.age || '',
          houseNo: item.house_no || '',
          villageNo: item.village_no || '',
          soi: item.soi || '',
          road: item.road || '',
          subDistrict: item.sub_district || '',
          district: item.district || '',
          province: item.province || '',
          postalCode: item.postal_code || '',
          creditHistory: [],
          packages: [],
          pets: (item.pets || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            species: (p.type || 'Dog') as 'Dog' | 'Cat' | 'Other',
            breed: p.breed || '-',
            birthday: p.birth_date || '',
            weightHistory: p.weight ? [{ date: new Date().toISOString().split('T')[0], value: Number(p.weight) }] : [],
            serviceHistory: serviceHistoryMap[p.id] || [], // แมปประวัติการใช้บริการจริงจาก Supabase
            notes: p.medical_condition || '',
            image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
          }))
        };
      });

      setCustomers(transformed);
      return transformed;
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

  if (isLoading && customers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FD]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Syncing Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
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
              className="w-full bg-[#F5F6FA] pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-indigo-500/10" 
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
              <div className="flex items-center gap-3">
                {customer.avatarUrl ? (
                  <img src={customer.avatarUrl} alt={customer.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                    selectedCustomerId === customer.id ? "bg-white/10 text-white" : "bg-indigo-50 text-indigo-600"
                  )}>
                    {customer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm">{customer.name}</p>
                  <p className={cn("text-[10px]", selectedCustomerId === customer.id ? "text-white/60" : "text-gray-400")}>
                    {customer.pets.length} {language === 'th' ? 'ตัว' : 'Pets'} • {customer.membership}
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className={cn(selectedCustomerId === customer.id ? "text-white/40" : "text-gray-300")} />
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-50">
          <button 
            onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}
            className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#D9ED5F]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> {language === 'th' ? 'เพิ่มลูกค้าใหม่' : 'Add Client'}
          </button>
        </div>
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto bg-[#F8F9FD] scrollbar-hide transition-all duration-300",
        isMobile && !showDetailOnMobile ? "translate-x-full absolute" : "translate-x-0"
      )}>
        {selectedCustomer ? (
          <div className="p-6 lg:p-10 max-w-5xl mx-auto">
            {isMobile && (
              <button onClick={() => setShowDetailOnMobile(false)} className="flex items-center gap-2 text-gray-400 font-bold text-xs mb-6 pt-14">
                <ChevronLeft size={16} /> {language === 'th' ? 'กลับไปยังรายชื่อ' : 'Back to List'}
              </button>
            )}

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-start gap-6 group">
              <div className="flex gap-6">
                {selectedCustomer.avatarUrl ? (
                  <img src={selectedCustomer.avatarUrl} alt={selectedCustomer.name} className="w-20 h-20 rounded-[28px] object-cover shrink-0 shadow-lg" />
                ) : (
                  <div className="w-20 h-20 bg-indigo-500 rounded-[28px] flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg shadow-indigo-500/20">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">{selectedCustomer.name}</h2>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingCustomer(selectedCustomer); setIsCustomerModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={18} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Phone size={14}/> {selectedCustomer.phone}</span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Mail size={14}/> {selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.lineId ? (
                    <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100 w-fit">
                      <MessageSquare size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">LINE Connected</span>
                      <BadgeCheck size={14} />
                    </div>
                  ) : (
                    <button onClick={() => setIsLineModalOpen(true)} className="text-[10px] font-black uppercase text-gray-400 hover:text-green-600 flex items-center gap-2 transition-colors">
                      <MessageSquare size={14} /> Connect LINE OA
                    </button>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right bg-[#F5F6FA] p-6 rounded-[32px] min-w-[160px]">
                <span className="bg-[#1A1F3D] text-[#D9ED5F] px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block mb-3">
                  {selectedCustomer.membership} MEMBER
                </span>
                <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Credit Balance</p>
                <p className="text-2xl font-black text-[#1A1F3D]">{currency}{selectedCustomer.creditBalance.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl lg:text-2xl font-black text-[#1A1F3D]">Pet Registry</h3>
              <button onClick={() => { setEditingPet(null); setIsPetModalOpen(true); }} className="bg-[#1A1F3D] text-white px-6 py-3 rounded-xl text-xs font-black shadow-xl shadow-[#1A1F3D]/10 hover:scale-105 transition-all">
                <Plus size={16} className="mr-2 inline" /> Register Pet
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 pb-10">
              {selectedCustomer.pets.length > 0 ? (
                selectedCustomer.pets.map(pet => (
                  <PetProfileRecord key={pet.id} pet={pet} onEdit={(p) => { setEditingPet(p); setIsPetModalOpen(true); }} />
                ))
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[40px] py-16 flex flex-col items-center justify-center text-gray-300">
                   <User size={40} className="mb-4 opacity-20" />
                   <p className="text-xs font-bold uppercase tracking-widest">No pets registered yet</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <User size={64} className="mb-4" />
            <p className="font-black text-xl">Select a client profile</p>
          </div>
        )}
      </div>

      {isCustomerModalOpen && <CustomerModal customer={editingCustomer} onClose={() => { setIsCustomerModalOpen(false); refetch(); }} />}
      {isPetModalOpen && selectedCustomer && <PetModal customerId={selectedCustomer.id} pet={editingPet} onClose={() => { setIsPetModalOpen(false); refetch(); }} />}
      {isLineModalOpen && selectedCustomer && <LineBindingModal customer={selectedCustomer} onClose={() => { setIsLineModalOpen(false); refetch(); }} />}
      {isPackageModalOpen && selectedCustomer && <PackageModal customerId={selectedCustomer.id} onClose={() => { setIsPackageModalOpen(false); refetch(); }} />}
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default Customers;