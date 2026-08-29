import { format } from 'date-fns';
"use client";

import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Plus, User, Edit3, ChevronLeft, MessageSquare, BadgeCheck, Trash2, Package, Clock, Star, Gift, LayoutDashboard, Send, ShieldAlert } from 'lucide-react';
import { useStore, Customer, Pet, MembershipLevel } from '@/store/useStore';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';
import PetProfileRecord from '@/components/PetProfileRecord';
import CustomerDashboard from '@/components/customers/CustomerDashboard';
import LineOADashboard from '../components/customers/LineOADashboard';
import LineBindingModal from '@/components/LineBindingModal';
import PackageModal from '@/components/PackageModal';
import { fetchLineFollowers } from '@/lib/lineApi';
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
  const [savedSegment, setSavedSegment] = useState<any>(null);
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
    queryKey: ['membership_tiers', storeId],
    queryFn: async () => {
      let query = supabase
        .from('membership_tiers')
        .select('tier_key, name, color_class');
      
      if (storeId && storeId !== 'default-store') {
        query = query.eq('store_id', storeId);
      }
      
      const { data, error } = await query;
      if (error) return [];
      return data;
    }
  });

  const { data: lineValidation, isLoading: isLineValidating } = useQuery({
    queryKey: ['line-validation', selectedCustomerId],
    queryFn: async () => {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (!customer?.lineId || !storeId) return null;
      const data = await fetchLineFollowers(storeId, [customer.lineId]);
      return data?.userStatusMap?.[customer.lineId] ?? false;
    },
    enabled: !!selectedCustomerId && !!storeId && !!customers.find(c => c.id === selectedCustomerId)?.lineId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
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
          credit_balance,
          points,
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
            gender,
            weight,
            medical_condition,
            precautions,
            fur_length,
            custom_preferences,
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
      const { data: serviceHistoryData, error: serviceHistoryError } = await serviceHistoryQuery;
      
      if (serviceHistoryError) {
        console.error("Error fetching service history:", serviceHistoryError);
      }
      
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
              date: sh.created_at ? format(new Date(sh.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
              time: sh.created_at ? format(new Date(sh.created_at), 'HH:mm') : '-',
              price: Number(sh.price || 0)
            });
          }
        });
      }

      // Fetch Intake History
      const { data: intakeHistoryData, error: intakeError } = await supabase
        .from('pet_health_logs')
        .select('*')
        .eq('type', 'intake');

      if (intakeError) {
        console.error("Error fetching intake history:", intakeError);
      }

      const intakeHistoryMap: Record<string, any[]> = {};
      if (intakeHistoryData) {
        intakeHistoryData.forEach(log => {
          if (log.pet_id) {
            if (!intakeHistoryMap[log.pet_id]) {
              intakeHistoryMap[log.pet_id] = [];
            }
            let parsedDetails: Record<string, any> = {};
            if (log.description) {
              try {
                parsedDetails = JSON.parse(log.description);
              } catch (e) {
                console.warn("Failed to parse intake details:", log.description);
              }
            }
            
            intakeHistoryMap[log.pet_id].push({
              id: log.id,
              date: log.date || (log.created_at ? format(new Date(log.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
              time: log.created_at ? format(new Date(log.created_at), 'HH:mm') : '-',
              details: parsedDetails,
              staffName: parsedDetails.staffName || log.staff_name,
              signature: parsedDetails.signature || log.signature_url,
              weight: parsedDetails.weight || log.weight,
              queueItemId: undefined // Map back to original logic if needed
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
          points: item.points || storeCustomer.points || 0,
          totalSpent: 0,
          creditBalance: item.credit_balance || 0,
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
              intakeHistory: intakeHistoryMap[p.id] || [], // แมปประวัติ Intake 
              notes: p.custom_preferences?.notes || '',
              image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop',
              coatType: p.fur_length,
              color: p.custom_preferences?.color,
              gender: p.gender || 'Unknown',
              temperament: p.custom_preferences?.temperament,
              precautions: p.precautions || p.custom_preferences?.precautions || '',
              medicalCondition: p.medical_condition || p.custom_preferences?.medicalCondition || p.custom_preferences?.medical_condition || '',
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

  const handleSelectCustomer = (id: string, segment?: any) => {
    setSelectedCustomerId(id);
    if (segment) {
      setSavedSegment(segment);
    } else {
      setSavedSegment(null);
    }
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
              "w-full text-left p-4 rounded-2xl mb-2 transition-all flex items-center justify-between group",
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
          
          <button
            onClick={() => { setSelectedCustomerId('line-oa'); if (isMobile) setShowDetailOnMobile(true); }}
            className={cn(
              "w-full text-left p-4 rounded-2xl mb-4 transition-all flex items-center justify-between group border border-transparent",
              selectedCustomerId === 'line-oa' ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-green-50/50 hover:bg-green-50 text-green-700 hover:border-green-100"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                selectedCustomerId === 'line-oa' ? "bg-white/20 text-white" : "bg-green-100 text-green-600 shadow-sm"
              )}>
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">{language === 'th' ? 'ข้อมูล LINE OA' : 'LINE OA Insights'}</p>
                <p className={cn("text-[10px] font-semibold tracking-wider uppercase", selectedCustomerId === 'line-oa' ? "text-green-100" : "text-green-500")}>Marketing</p>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-4 mb-4 mt-2 px-2 opacity-50">
            <div className="flex-1 h-px bg-gray-300"></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{language === 'th' ? 'ลูกค้าทั้งหมด' : 'All Customers'}</p>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

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
                    {customer.pets.length} {language === 'th' ? 'ตัว' : 'Pets'}
                    {membershipTiers && membershipTiers.length > 0 && ` • ${customer.membership}`}
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
          <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] 2xl:grid-cols-[1fr_500px] gap-6 lg:gap-10">
              {/* Left Column: Customer Profile & Pets */}
              <div className="flex flex-col min-w-0">
                <button 
                  onClick={() => {
                    setSelectedCustomerId(null);
                    if (isMobile) setShowDetailOnMobile(false);
                  }} 
                  className={cn(
                    "flex items-center gap-2 text-gray-400 font-bold text-xs mb-6 hover:text-[#1A1F3D] transition-colors",
                    isMobile ? "pt-14" : ""
                  )}
                >
                  <ChevronLeft size={16} /> {language === 'th' ? 'ย้อนกลับ' : 'Back'}
                </button>

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
                    isLineValidating ? (
                      <div className="flex items-center gap-2 bg-gray-50 text-gray-400 px-4 py-2 rounded-xl border border-gray-100 w-fit">
                        <Clock size={14} className="animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'th' ? 'กำลังตรวจสอบ...' : 'Verifying...'}</span>
                      </div>
                    ) : lineValidation ? (
                      <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100 w-fit">
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">LINE Connected</span>
                        <BadgeCheck size={14} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-xl border border-red-100 w-fit">
                        <ShieldAlert size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'th' ? 'ไม่ได้เชื่อมต่อ Line' : 'Not Connected'}</span>
                      </div>
                    )
                  ) : (
                    <button onClick={() => setIsLineModalOpen(true)} className="text-[10px] font-black uppercase text-gray-400 hover:text-green-600 flex items-center gap-2 transition-colors">
                      <MessageSquare size={14} /> Connect LINE OA
                    </button>
                  )}
                </div>
              </div>
              
              {/* Horizontal Layout for Membership, Credit, and Points */}
              <div className="flex flex-wrap items-center gap-6 bg-[#F5F6FA] p-6 rounded-[32px] w-full xl:w-auto">
                {membershipTiers && membershipTiers.length > 0 && (
                  <>
                    <div className="text-center sm:text-left">
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block",
                        getTierColorClass(selectedCustomer.membership)
                      )}>
                        {selectedCustomer.membership} MEMBER
                      </span>
                    </div>
                    <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                  </>
                )}
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
              <h3 className="text-xl lg:text-2xl font-black text-[#1A1F3D]">{language === 'th' ? 'ทะเบียนสัตว์เลี้ยง' : 'Pet Registry'}</h3>
              <button onClick={() => { setEditingPet(null); setIsPetModalOpen(true); }} className="bg-[#1A1F3D] text-white px-6 py-3 rounded-xl text-xs font-black shadow-xl shadow-[#1A1F3D]/10 hover:scale-105 transition-all">
                <Plus size={16} className="mr-2 inline" /> {language === 'th' ? 'ลงทะเบียนสัตว์เลี้ยง' : 'Register Pet'}
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
                   <p className="text-xs font-bold uppercase tracking-widest">{language === 'th' ? 'ยังไม่มีสัตว์เลี้ยงลงทะเบียน' : 'No pets registered yet'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: LINE OA Chat Placeholder */}
          <div className="hidden xl:flex flex-col h-[calc(100vh-80px)] sticky top-10">
            <div className="bg-white border border-gray-100 rounded-[40px] shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex flex-col h-full overflow-hidden">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#00B900] to-[#009900] text-white">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md">
                     <MessageSquare size={24} className="text-white" />
                   </div>
                   <div>
                     <h3 className="font-black text-lg">LINE OA Chat</h3>
                     <p className="text-xs font-medium text-green-50 opacity-90">{language === 'th' ? `สนทนากับ ${selectedCustomer.name}` : `Chatting with ${selectedCustomer.name}`}</p>
                   </div>
                 </div>
              </div>
              
              {/* Chat Messages Placeholder */}
              <div className="flex-1 bg-[#F5F6FA] p-6 flex flex-col justify-center items-center overflow-y-auto relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-[#00B900] shadow-[0_8px_32px_rgba(24,35,74,0.08)] mb-6 animate-pulse">
                    <MessageSquare size={40} />
                  </div>
                  <p className="font-black text-lg text-[#1A1F3D] mb-2">{language === 'th' ? 'ระบบแชทกำลังจะมาเร็วๆ นี้...' : 'Chat system coming soon...'}</p>
                  <p className="text-xs font-medium text-gray-400 max-w-[250px] text-center">
                    {language === 'th' ? 'เมื่อลูกค้าส่งข้อความมาผ่าน LINE OA ข้อความจะปรากฏที่นี่แบบ Real-time' : 'When customers send a message via LINE OA, it will appear here in real-time.'}
                  </p>
                </div>
                
                {/* Fake chat bubbles in background */}
                <div className="w-full flex flex-col gap-4 opacity-30 pointer-events-none filter blur-sm">
                  <div className="self-start max-w-[80%] bg-white p-4 rounded-2xl rounded-tl-sm text-sm text-gray-500">
                    สวัสดีค่ะ สอบถามราคาอาบน้ำตัดขนค่ะ
                  </div>
                  <div className="self-end max-w-[80%] bg-[#00B900] text-white p-4 rounded-2xl rounded-tr-sm text-sm">
                    สวัสดีครับ น้องหมาพันธุ์อะไรและน้ำหนักประมาณกี่กิโลกรัมครับ?
                  </div>
                </div>
              </div>
              
              {/* Chat Input Placeholder */}
              <div className="p-4 bg-white border-t border-gray-100 flex gap-3 relative z-20">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0 cursor-not-allowed">
                  <Plus size={20} />
                </div>
                <input 
                  disabled
                  placeholder={language === 'th' ? 'พิมพ์ข้อความตอบกลับ...' : 'Type a reply...'} 
                  className="flex-1 bg-[#F5F6FA] rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none cursor-not-allowed placeholder:text-gray-400"
                />
                <button disabled className="w-12 h-12 bg-[#00B900] rounded-2xl flex items-center justify-center text-white shrink-0 opacity-50 cursor-not-allowed shadow-lg shadow-[#00B900]/20">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
        ) : selectedCustomerId === 'line-oa' ? (
          <LineOADashboard />
        ) : (
          <div className="p-6 lg:p-10">
            <CustomerDashboard onSelectCustomer={handleSelectCustomer} initialSegment={savedSegment} />
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