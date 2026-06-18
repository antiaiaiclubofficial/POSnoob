"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  QrCode, User, Phone, Mail, MapPin, Plus, Calendar, Award, Sparkles, 
  ShieldAlert, Heart, FileText, Scissors, Bath, Zap, Wind, Brush, 
  Stethoscope, Home, Bone, CheckCircle2, ChevronRight, LogOut, Lock, Cat, Dog, Scale
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore, Customer, Pet, MembershipLevel } from '@/store/useStore';
import { calculateAge } from '@/utils/petData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LiffPortal = () => {
  const { currency, storeId, customers, setCustomers } = useStore();
  
  // Portal States
  const [step, setStep] = useState<'auth' | 'register' | 'dashboard'>('auth');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Registration Form State
  const [regForm, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    age: '',
    phone: '',
    email: '',
    houseNo: '',
    villageNo: '',
    soi: '',
    road: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: ''
  });

  // Pet Registration Form State
  const [showAddPet, setShowAddPet] = useState(false);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    birthday: '',
    weight: '',
    coatType: 'Short',
    notes: ''
  });

  // Sync phone query to registration form if they proceed to register
  useEffect(() => {
    if (step === 'register') {
      setFormData(prev => ({ ...prev, phone: phoneQuery }));
    }
  }, [step, phoneQuery]);

  // Check if customer exists by phone
  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneQuery.trim()) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    setIsSubmitting(true);
    try {
      // Search in local store state first
      const foundLocal = customers.find(c => c.phone.replace(/\D/g, '') === phoneQuery.replace(/\D/g, ''));
      
      if (foundLocal) {
        setActiveCustomer(foundLocal);
        setStep('dashboard');
        toast.success(`ยินดีต้อนรับกลับคุณ ${foundLocal.name}!`);
        setIsSubmitting(false);
        return;
      }

      // Fallback to direct Supabase query
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
            image_url
          )
        `)
        .eq('phone', phoneQuery)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const storeCustomer = data.store_customers?.[0] || {};
        const formatted: Customer = {
          id: data.id,
          name: data.display_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unnamed',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '-',
          email: data.email || '-',
          lineId: data.line_user_id || '',
          avatarUrl: data.avatar_url || '',
          membership: (storeCustomer.tier || 'Standard') as MembershipLevel,
          points: storeCustomer.points || 0,
          totalSpent: 0,
          creditBalance: 0,
          gender: data.gender || 'Male',
          age: data.age || '',
          houseNo: data.house_no || '',
          villageNo: data.village_no || '',
          soi: data.soi || '',
          road: data.road || '',
          subDistrict: data.sub_district || '',
          district: data.district || '',
          province: data.province || '',
          postalCode: data.postal_code || '',
          creditHistory: [],
          packages: [],
          pets: (data.pets || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            species: p.type || 'Dog',
            breed: p.breed || '-',
            birthday: p.birth_date || '',
            weightHistory: p.weight ? [{ date: new Date().toISOString().split('T')[0], value: Number(p.weight) }] : [],
            serviceHistory: [],
            notes: p.medical_condition || '',
            image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
          }))
        };

        // Add to local store list
        setCustomers([...customers, formatted]);
        setActiveCustomer(formatted);
        setStep('dashboard');
        toast.success(`ยินดีต้อนรับกลับคุณ ${formatted.name}!`);
      } else {
        // Not found, proceed to registration
        setStep('register');
        toast.info("ไม่พบข้อมูลสมาชิก กรุณากรอกข้อมูลเพื่อลงทะเบียนใหม่");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Customer Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.firstName || !regForm.phone) {
      toast.error("กรุณากรอกชื่อจริงและเบอร์โทรศัพท์");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Find a valid store ID to associate with
      let targetStoreId = storeId;
      if (!targetStoreId || targetStoreId === 'default-store') {
        const { data: stores } = await supabase.from('stores').select('id').limit(1);
        if (stores && stores.length > 0) {
          targetStoreId = stores[0].id;
        }
      }

      // 2. Insert into customers table
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          first_name: regForm.firstName,
          last_name: regForm.lastName,
          display_name: `${regForm.firstName} ${regForm.lastName}`.trim(),
          phone: regForm.phone,
          email: regForm.email,
          gender: regForm.gender,
          age: regForm.age,
          house_no: regForm.houseNo,
          village_no: regForm.villageNo,
          soi: regForm.soi,
          road: regForm.road,
          sub_district: regForm.subDistrict,
          district: regForm.district,
          province: regForm.province,
          postal_code: regForm.postalCode
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      if (customerData) {
        // 3. Insert into store_customers table
        const { error: storeCustError } = await supabase
          .from('store_customers')
          .insert([{
            customer_id: customerData.id,
            store_id: targetStoreId && targetStoreId !== 'default-store' ? targetStoreId : null,
            points: 0,
            tier: 'bronze'
          }]);

        if (storeCustError) throw storeCustError;

        const newCustomer: Customer = {
          id: customerData.id,
          name: customerData.display_name || `${customerData.first_name} ${customerData.last_name}`,
          firstName: customerData.first_name,
          lastName: customerData.last_name,
          phone: customerData.phone || '',
          email: customerData.email || '',
          membership: 'Standard',
          points: 0,
          totalSpent: 0,
          creditBalance: 0,
          pets: [],
          packages: [],
          creditHistory: []
        };

        setCustomers([...customers, newCustomer]);
        setActiveCustomer(newCustomer);
        setStep('dashboard');
        toast.success("ลงทะเบียนสมาชิกสำเร็จ ยินดีต้อนรับสู่ Tactile Sanctuary!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("ลงทะเบียนไม่สำเร็จ: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Pet Registration from Portal
  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    if (!petForm.name || !petForm.birthday) {
      toast.error("กรุณากรอกชื่อและวันเกิดสัตว์เลี้ยง");
      return;
    }

    setIsSubmitting(true);
    try {
      const initialWeight = Number(petForm.weight || 0);
      const defaultImage = petForm.species === 'Cat' 
        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop'
        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop';

      const { data: petData, error: petError } = await supabase
        .from('pets')
        .insert([{
          customer_id: activeCustomer.id,
          name: petForm.name,
          type: petForm.species,
          breed: petForm.breed || 'Mixed Breed',
          birth_date: petForm.birthday,
          weight: initialWeight,
          fur_length: petForm.coatType,
          medical_condition: petForm.notes,
          image_url: defaultImage
        }])
        .select()
        .single();

      if (petError) throw petError;

      if (petData) {
        // Insert initial weight history
        if (initialWeight > 0) {
          await supabase.from('pet_weight_history').insert([{
            pet_id: petData.id,
            weight: initialWeight,
            date: new Date().toISOString().split('T')[0]
          }]);
        }

        const newPet: Pet = {
          id: petData.id,
          name: petData.name,
          species: petData.type,
          breed: petData.breed || '',
          birthday: petData.birth_date || '',
          notes: petData.medical_condition || '',
          image: petData.image_url || defaultImage,
          weightHistory: initialWeight > 0 ? [{ date: new Date().toISOString().split('T')[0], value: initialWeight }] : [],
          serviceHistory: []
        };

        // Update local state
        const updatedCustomer = {
          ...activeCustomer,
          pets: [...(activeCustomer.pets || []), newPet]
        };

        setCustomers(customers.map(c => c.id === activeCustomer.id ? updatedCustomer : c));
        setActiveCustomer(updatedCustomer);
        setShowAddPet(false);
        setPetForm({
          name: '',
          species: 'Dog',
          breed: '',
          birthday: '',
          weight: '',
          coatType: 'Short',
          notes: ''
        });
        toast.success(`ลงทะเบียน ${newPet.name} เรียบร้อยแล้ว!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("เพิ่มสัตว์เลี้ยงไม่สำเร็จ: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTierColorClass = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'vip': return 'from-purple-600 to-indigo-900 text-white';
      case 'platinum': return 'from-slate-700 to-slate-900 text-white';
      case 'gold': return 'from-amber-500 to-yellow-600 text-white';
      case 'silver': return 'from-blue-400 to-blue-600 text-white';
      default: return 'from-emerald-500 to-teal-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto w-full">
      {/* Header */}
      <div className="w-full max-w-md text-center my-6 shrink-0">
        <div className="w-16 h-16 bg-[#1A1F3D] rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Scissors className="text-[#D9ED5F] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-[#1A1F3D]">Tactile Sanctuary</h1>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">LINE OA Customer Portal</p>
      </div>

      {/* Step 1: Phone Verification */}
      {step === 'auth' && (
        <div className="w-full max-w-md bg-white p-8 rounded-[36px] shadow-sm border border-gray-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-black text-[#1A1F3D]">ตรวจสอบสถานะสมาชิก</h2>
            <p className="text-xs text-gray-400 font-medium">กรอกเบอร์โทรศัพท์ของคุณเพื่อตรวจสอบประวัติหรือลงทะเบียนใหม่</p>
          </div>

          <form onSubmit={handleCheckPhone} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 px-1">เบอร์โทรศัพท์ (Phone Number)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="tel"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                  placeholder="เช่น 0812345678"
                  value={phoneQuery}
                  onChange={e => setPhoneQuery(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "กำลังตรวจสอบ..." : "ตรวจสอบข้อมูล"} <ChevronRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Registration Form */}
      {step === 'register' && (
        <div className="w-full max-w-md bg-white p-8 rounded-[36px] shadow-sm border border-gray-100 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-[#1A1F3D]">ลงทะเบียนสมาชิกใหม่</h2>
              <p className="text-xs text-gray-400 font-medium">กรอกข้อมูลเพื่อรับสิทธิประโยชน์และสะสมแต้ม</p>
            </div>
            <button onClick={() => setStep('auth')} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><X size={18} /></button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase px-1">ชื่อจริง</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                  value={regForm.firstName}
                  onChange={e => setFormData({ ...regForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase px-1">นามสกุล</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                  value={regForm.lastName}
                  onChange={e => setFormData({ ...regForm, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase px-1">เพศ</label>
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold appearance-none"
                  value={regForm.gender}
                  onChange={e => setFormData({ ...regForm, gender: e.target.value })}
                >
                  <option value="Male">ชาย</option>
                  <option value="Female">หญิง</option>
                  <option value="Other">อื่นๆ</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase px-1">อายุ (ปี)</label>
                <input 
                  type="number"
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                  value={regForm.age}
                  onChange={e => setFormData({ ...regForm, age: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase px-1">เบอร์โทรศัพท์</label>
              <input 
                type="tel"
                className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                value={regForm.phone}
                onChange={e => setFormData({ ...regForm, phone: e.target.value })}
                required
                disabled
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase px-1">อีเมล</label>
              <input 
                type="email"
                className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                value={regForm.email}
                onChange={e => setFormData({ ...regForm, email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>

            <div className="border-t border-gray-50 pt-4 space-y-3">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block px-1">ข้อมูลที่อยู่ (Address)</span>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold" placeholder="บ้านเลขที่" value={regForm.houseNo} onChange={e => setFormData({ ...regForm, houseNo: e.target.value })} />
                <input className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold" placeholder="แขวง/ตำบล" value={regForm.subDistrict} onChange={e => setFormData({ ...regForm, subDistrict: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold" placeholder="เขต/อำเภอ" value={regForm.district} onChange={e => setFormData({ ...regForm, district: e.target.value })} />
                <input className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold" placeholder="จังหวัด" value={regForm.province} onChange={e => setFormData({ ...regForm, province: e.target.value })} />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all disabled:opacity-50 pt-2"
            >
              {isSubmitting ? "กำลังลงทะเบียน..." : "ยืนยันการลงทะเบียน"}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Customer Dashboard */}
      {step === 'dashboard' && activeCustomer && (
        <div className="w-full max-w-md space-y-6 animate-in fade-in duration-300">
          
          {/* Digital Member Card */}
          <div className={cn(
            "p-6 rounded-[32px] shadow-xl relative overflow-hidden bg-gradient-to-br",
            getTierColorClass(activeCustomer.membership)
          )}>
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Tactile Sanctuary</span>
                <h3 className="text-xl font-black mt-1">{activeCustomer.name}</h3>
              </div>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                {activeCustomer.membership}
              </span>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black uppercase opacity-60 mb-1">Member ID</p>
                <p className="text-xs font-mono tracking-wider">#{activeCustomer.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="p-2 bg-white rounded-xl shadow-md">
                <QrCode size={40} className="text-[#1A1F3D]" />
              </div>
            </div>
          </div>

          {/* Balances Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-center">
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-1">คะแนนสะสม (Points)</p>
              <p className="text-2xl font-black text-indigo-600">{(activeCustomer.points || 0).toLocaleString()} <span className="text-xs text-gray-400 font-bold">PTS</span></p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-center">
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-1">เครดิตคงเหลือ (Wallet)</p>
              <p className="text-2xl font-black text-[#1A1F3D]">{currency}{(activeCustomer.creditBalance || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* My Pets Section */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-[#1A1F3D] uppercase tracking-wider">สัตว์เลี้ยงของฉัน (My Pets)</h3>
              <button 
                onClick={() => setShowAddPet(true)}
                className="text-[10px] font-black text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> เพิ่มสัตว์เลี้ยง
              </button>
            </div>

            <div className="space-y-3">
              {activeCustomer.pets && activeCustomer.pets.length > 0 ? (
                activeCustomer.pets.map(pet => (
                  <div key={pet.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <img src={pet.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt={pet.name} />
                    <div>
                      <h4 className="text-xs font-black text-[#1A1F3D]">{pet.name}</h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{pet.species} • {pet.breed}</p>
                      <p className="text-[8px] text-indigo-500 font-bold mt-0.5">อายุ: {calculateAge(pet.birthday)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 font-bold text-center py-4 italic">ยังไม่มีสัตว์เลี้ยงลงทะเบียน</p>
              )}
            </div>
          </div>

          {/* Logout / Switch Account */}
          <button 
            onClick={() => {
              setActiveCustomer(null);
              setStep('auth');
            }}
            className="w-full py-4 text-xs font-black text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> ออกจากระบบ / สลับบัญชี
          </button>
        </div>
      )}

      {/* Pet Registration Modal inside LIFF */}
      {showAddPet && activeCustomer && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[36px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A1F3D] rounded-xl flex items-center justify-center text-white">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1A1F3D]">ลงทะเบียนสัตว์เลี้ยงใหม่</h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Add New Pet</p>
                </div>
              </div>
              <button onClick={() => setShowAddPet(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddPet} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase px-1">ชื่อสัตว์เลี้ยง</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                  value={petForm.name}
                  onChange={e => setPetForm({ ...petForm, name: e.target.value })}
                  placeholder="เช่น บัดดี้, มิมี่"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase px-1">ประเภทสัตว์</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold appearance-none"
                    value={petForm.species}
                    onChange={e => setPetForm({ ...petForm, species: e.target.value })}
                  >
                    <option value="Dog">สุนัข (Dog)</option>
                    <option value="Cat">แมว (Cat)</option>
                    <option value="Rabbit">กระต่าย (Rabbit)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase px-1">สายพันธุ์</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={petForm.breed}
                    onChange={e => setPetForm({ ...petForm, breed: e.target.value })}
                    placeholder="เช่น โกลเด้น, เปอร์เซีย"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase px-1">วันเกิด</label>
                  <input 
                    type="date"
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={petForm.birthday}
                    onChange={e => setPetForm({ ...petForm, birthday: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase px-1">น้ำหนักเริ่มต้น (กก.)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={petForm.weight}
                    onChange={e => setPetForm({ ...petForm, weight: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase px-1">ความยาวขน</label>
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold appearance-none"
                  value={petForm.coatType}
                  onChange={e => setPetForm({ ...petForm, coatType: e.target.value })}
                >
                  <option value="Short">ขนสั้น (Short)</option>
                  <option value="Long">ขนยาว (Long)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase px-1">ข้อควรระวัง / โรคประจำตัว</label>
                <textarea 
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold h-16 resize-none"
                  value={petForm.notes}
                  onChange={e => setPetForm({ ...petForm, notes: e.target.value })}
                  placeholder="เช่น แพ้แชมพูสูตรเย็น..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all disabled:opacity-50 pt-2"
              >
                {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการลงทะเบียนสัตว์เลี้ยง"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiffPortal;