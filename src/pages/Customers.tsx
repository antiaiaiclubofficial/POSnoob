import { format } from 'date-fns';
"use client";

import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Plus, User, Edit3, ChevronLeft, MessageSquare, BadgeCheck, Trash2, Package, Clock, Star, Gift, LayoutDashboard } from 'lucide-react';
import { useStore, Customer, Pet, MembershipLevel } from '@/store/useStore';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';
import PetProfileRecord from '@/components/PetProfileRecord';
import CustomerDashboard from '@/components/customers/CustomerDashboard';
import LineBindingModal from '@/components/LineBindingModal';
import PackageModal from '@/components/PackageModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { translations } from '@/utils/translations';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const Customers = () => {
  const isMobile = useIsMobile();
  const { customers, setCustomers, deleteCustomer, currency, language, storeId } = useStore();
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

  // ดึงข้อมูลระดับสมาชิกจากฐานข้อมูลโดยตรงเพื่อนำสีมาใช้
  const { data: membershipTiers } = useQuery({
    queryKey: ['membership_tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('tier_key, name, color_class');
      if (error) return [];
      return data;
    }
  });

  const { isLoading, refetch } = useQuery({
    queryKey: ['customers-list-v2', storeId],
    queryFn: async () => {
      let query = supabase
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
          store_customers!inner (
            points,
            tier,
            store_id
          ),
          pets (
            id,
            name,
            type,
            breed,
            birth_date,
            weight,
            medical_condition,
            image_url,
            created_at,
            pet_weight_history (
              date,
              weight,
              created_at
            )
          )
        `);
      
      if (storeId && storeId !== 'default-store') {
        query = query.eq('store_customers.store_id', storeId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Supabase error:", error);
        toast.error("Failed to fetch customers");
        throw error;
      }

      // ดึงข้อมูลประวัติการใช้บริการ (service_history)
      let serviceHistoryQuery = supabase.from('service_history').select('*');
      if (storeId && storeId !== 'default-store') {
        serviceHistoryQuery = serviceHistoryQuery.eq('store_id', storeId);
      }
      const { data: serviceHistoryData } = await serviceHistoryQuery;
      
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
          createdAt: item.created_at || '',
          creditHistory: [],
          packages: [],
          pets: (item.pets || []).map((p: any) => {
            const wh = p.pet_weight_history || [];
            let weightHistory = wh.map((w: any) => ({
              date: w.date || (w.created_at ? format(new Date(w.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
              value: Number(w.weight)
            })).sort((a: any, b: any) => a.date.localeCompare(b.date));

            if (weightHistory.length === 0 && p.weight) {
               weightHistory = [{ date: p.created_at ? format(new Date(p.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'), value: Number(p.weight) }];
            }

            return {
              id: p.id,
              name: p.name,
              species: (p.type || 'Dog') as 'Dog' | 'Cat' | 'Other',
              breed: p.breed || '-',
              birthday: p.birth_date || '',
              weightHistory,
              serviceHistory: serviceHistoryMap[p.id] || [], // แมปประวัติการใช้บริการจริงจาก Supabase
              notes: p.medical_condition || '',
              image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
            };
          })
        };
      });

      setCustomers(transformed);
      return transformed;
    }
  });


  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (isMobile) setShowDetailOnMobile(true);
  };

  const getTierColorClass = (tier: string) => {
    if (!membershipTiers || membershipTiers.length === 0) {
      // Fallback สีมาตรฐานหากยังโหลดข้อมูลไม่เสร็จ
      switch (tier.toLowerCase()) {
        case 'vip': return 'bg-purple-100 text-purple-700';
        case 'platinum': return 'bg-indigo-100 text-indigo-700';
        case 'gold': return 'bg-amber-100 text-amber-700';
        case 'silver': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-600';
      }
    }
    const found = membershipTiers.find(
      t => t.tier_key.toLowerCase() === tier.toLowerCase() || t.name.toLowerCase() === tier.toLowerCase()
    );
    return found?.color_class || 'bg-gray-100 text-gray-600';
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
          <button
            onClick={() => { setSelectedCustomerId(null); if (isMobile) setShowDetailOnMobile(true); }}
            className={cn(
              "w-full text-left p-4 rounded-2xl mb-4 transition-all flex items-center justify-between group",
              selectedCustomerId === null ? "bg-[#1A1F3D] text-white shadow-lg" : "bg-[#F5F6FA] hover:bg-gray-100 text-[#1A1F3D]"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                selectedCustomerId === null ? "bg-white/10 text-white" : "bg-white text-gray-500 shadow-sm"
              )}>
                <LayoutDashboard size={20} />
              </div>
              <p className="font-bold text-sm">{language === 'th' ? 'ภาพรวม (Dashboard)' : 'Dashboard'}</p>
            </div>
          </button>
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
                      <button onClick={() => { setEditingCustomer(selectedCustomer); setIsCustomerModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]" title={language === 'th' ? 'แก้ไขข้อมูล' : 'Edit Profile'}><Edit3 size={18} /></button>
                      <button 
                        onClick={async () => {
                          const confirmMsg = language === 'th' 
                            ? `คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้า "${selectedCustomer.name}"? ข้อมูลสัตว์เลี้ยงและประวัติทั้งหมดจะถูกลบออกด้วย` 
                            : `Are you sure you want to delete customer "${selectedCustomer.name}"? All registered pets and history will be deleted.`;
                          if (window.confirm(confirmMsg)) {
                            try {
                              await deleteCustomer(selectedCustomer.id);
                              toast.success(language === 'th' ? "ลบข้อมูลลูกค้าเรียบร้อยแล้ว" : "Customer deleted successfully");
                              setSelectedCustomerId(null);
                              refetch();
                            } catch (err: any) {
                              console.error("Error deleting customer:", err); // Log the error for debugging
                              toast.error(err.message || (language === 'th' ? "เกิดข้อผิดพลาดในการลบข้อมูล" : "Failed to delete customer"));
                            }
                          }
                        }} 
                        className="p-2 text-gray-300 hover:text-red-500"
                        title={language === 'th' ? 'ลบลูกค้า' : 'Delete Customer'}
                      >
                        <Trash2 size={18} />
                      </button>
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
              
              {/* Horizontal Layout for Membership, Credit, and Points */}
              <div className="flex flex-wrap items-center gap-6 bg-[#F5F6FA] p-6 rounded-[32px] w-full xl:w-auto">
                <div className="text-center sm:text-left">
                  <span className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block",
                    getTierColorClass(selectedCustomer.membership)
                  )}>
                    {selectedCustomer.membership} MEMBER
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Credit Balance</p>
                  <p className="text-xl font-black text-[#1A1F3D]">{currency}{selectedCustomer.creditBalance.toLocaleString()}</p>
                </div>
                <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">Point Balance</p>
                  <p className="text-xl font-black text-indigo-600">{(selectedCustomer.points || 0).toLocaleString()} <span className="text-xs text-gray-400 font-bold">PTS</span></p>
                </div>
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
          <div className="p-6 lg:p-10">
            <CustomerDashboard />
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