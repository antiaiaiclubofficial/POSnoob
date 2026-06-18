"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { 
  User, Phone, Mail, MapPin, Dog, Cat, Sparkles, CheckCircle2, 
  Calendar, Scale, ShieldAlert, Heart, FileText, ArrowRight, MessageSquare 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LiffRegister = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { shopName, shopLogo, currency } = useStore();

  // LINE LIFF Simulation / Detection
  const lineUserId = searchParams.get('userId') || searchParams.get('lineId') || `U_MOCK_${Math.random().toString(36).substr(2, 9)}`;
  const lineDisplayName = searchParams.get('displayName') || 'LINE User';
  const linePictureUrl = searchParams.get('pictureUrl') || '';
  const storeIdParam = searchParams.get('storeId');

  // Form States
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Customer, 2: Pet, 3: Success
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Form State
  const [customerForm, setCustomerForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    houseNo: '',
    villageNo: '',
    soi: '',
    road: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: ''
  });

  // Pet Form State
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    birthday: '',
    weight: '',
    coatType: 'Short',
    color: '',
    temperament: '',
    precautions: '',
    medicalCondition: '',
    notes: '',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
  });

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.firstName || !customerForm.phone) {
      toast.error("กรุณากรอกชื่อและเบอร์โทรศัพท์");
      return;
    }
    setStep(2);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petForm.name || !petForm.birthday || !petForm.weight) {
      toast.error("กรุณากรอกข้อมูลสัตว์เลี้ยงให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. ดึง Store ID ที่ถูกต้อง
      let activeStoreId = storeIdParam;
      if (!activeStoreId) {
        const { data: stores } = await supabase.from('stores').select('id').limit(1);
        if (stores && stores.length > 0) {
          activeStoreId = stores[0].id;
        }
      }

      // 2. บันทึกข้อมูลลูกค้าลงในตาราง customers
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          first_name: customerForm.firstName,
          last_name: customerForm.lastName,
          display_name: `${customerForm.firstName} ${customerForm.lastName}`.trim(),
          phone: customerForm.phone,
          email: customerForm.email || null,
          gender: customerForm.gender,
          age: customerForm.age || null,
          house_no: customerForm.houseNo || null,
          village_no: customerForm.villageNo || null,
          soi: customerForm.soi || null,
          road: customerForm.road || null,
          sub_district: customerForm.subDistrict || null,
          district: customerForm.district || null,
          province: customerForm.province || null,
          postal_code: customerForm.postalCode || null,
          line_user_id: lineUserId,
          avatar_url: linePictureUrl || null
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      if (customerData) {
        // 3. บันทึกความสัมพันธ์ร้านค้าลงใน store_customers
        const { error: storeCustError } = await supabase
          .from('store_customers')
          .insert([{
            store_id: activeStoreId,
            customer_id: customerData.id,
            points: 0,
            tier: 'bronze'
          }]);

        if (storeCustError) throw storeCustError;

        // 4. บันทึกข้อมูลสัตว์เลี้ยงลงในตาราง pets
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .insert([{
            customer_id: customerData.id,
            name: petForm.name,
            type: petForm.species,
            breed: petForm.breed || 'Mixed Breed',
            birth_date: petForm.birthday,
            weight: Number(petForm.weight),
            medical_condition: petForm.medicalCondition || null,
            precautions: petForm.precautions || null,
            fur_length: petForm.coatType,
            image_url: petForm.image,
            custom_preferences: [
              { key: 'color', value: petForm.color || '' },
              { key: 'temperament', value: petForm.temperament || '' },
              { key: 'notes', value: petForm.notes || '' }
            ]
          }])
          .select()
          .single();

        if (petError) throw petError;

        // 5. บันทึกประวัติน้ำหนักเริ่มต้นลงใน pet_weight_history
        if (petData) {
          await supabase
            .from('pet_weight_history')
            .insert([{
              pet_id: petData.id,
              weight: Number(petForm.weight),
              date: new Date().toISOString().split('T')[0]
            }]);
        }

        toast.success("ลงทะเบียนสมาชิกสำเร็จ!");
        setStep(3);
      }
    } catch (error: any) {
      console.error("LIFF Registration Error:", error);
      toast.error("เกิดข้อผิดพลาดในการลงทะเบียน: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Header */}
      <div className="w-full max-w-md text-center mb-8">
        <div className="w-16 h-16 bg-[#1A1F3D] rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl">
          {shopLogo ? (
            <img src={shopLogo} alt="Logo" className="w-full h-full object-cover rounded-[24px]" />
          ) : (
            <MessageSquare className="text-[#D9ED5F] w-8 h-8" />
          )}
        </div>
        <h1 className="text-2xl font-black text-[#1A1F3D]">{shopName}</h1>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">LINE OA CRM Portal</p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-md bg-white rounded-[36px] shadow-xl border border-gray-100 overflow-hidden">
        {/* Step Indicator */}
        {step !== 3 && (
          <div className="bg-gray-50/50 px-8 py-4 border-b border-gray-50 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              ขั้นตอนที่ {step} จาก 2
            </span>
            <div className="flex gap-1.5">
              <div className={cn("w-2 h-2 rounded-full transition-all", step >= 1 ? "bg-[#1A1F3D]" : "bg-gray-200")} />
              <div className={cn("w-2 h-2 rounded-full transition-all", step >= 2 ? "bg-[#1A1F3D]" : "bg-gray-200")} />
            </div>
          </div>
        )}

        {/* Step 1: Customer Registration */}
        {step === 1 && (
          <form onSubmit={handleCustomerSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-black text-[#1A1F3D] flex items-center gap-2">
                <User size={18} className="text-indigo-500" /> ข้อมูลเจ้าของสัตว์เลี้ยง
              </h2>
              <p className="text-xs text-gray-400 font-medium">กรุณากรอกข้อมูลติดต่อเพื่อรับสิทธิประโยชน์และสะสมแต้ม</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">ชื่อจริง</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={customerForm.firstName}
                    onChange={e => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                    placeholder="สมชาย"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">นามสกุล</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={customerForm.lastName}
                    onChange={e => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                    placeholder="ใจดี"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input 
                    type="tel"
                    className="w-full bg-[#F5F6FA] border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold"
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="0812345678"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">อีเมล (ถ้ามี)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input 
                    type="email"
                    className="w-full bg-[#F5F6FA] border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold"
                    value={customerForm.email}
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="somchai@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">เพศ</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold appearance-none"
                    value={customerForm.gender}
                    onChange={e => setCustomerForm({ ...customerForm, gender: e.target.value })}
                  >
                    <option value="Male">ชาย</option>
                    <option value="Female">หญิง</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">อายุ</label>
                  <input 
                    type="number"
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={customerForm.age}
                    onChange={e => setCustomerForm({ ...customerForm, age: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all"
            >
              ถัดไป: ข้อมูลสัตว์เลี้ยง <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Step 2: Pet Registration */}
        {step === 2 && (
          <form onSubmit={handleCompleteRegistration} className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-black text-[#1A1F3D] flex items-center gap-2">
                <Dog size={18} className="text-indigo-500" /> ข้อมูลสัตว์เลี้ยงตัวโปรด
              </h2>
              <p className="text-xs text-gray-400 font-medium">ลงทะเบียนสัตว์เลี้ยงเพื่อรับประวัติการดูแลและแจ้งเตือนวัคซีน</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">ชื่อสัตว์เลี้ยง</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={petForm.name}
                    onChange={e => setPetForm({ ...petForm, name: e.target.value })}
                    placeholder="บัดดี้"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">ประเภทสัตว์</label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">สายพันธุ์</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={petForm.breed}
                    onChange={e => setPetForm({ ...petForm, breed: e.target.value })}
                    placeholder="เช่น โกลเด้น, เปอร์เซีย"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">วันเกิด</label>
                  <input 
                    type="date"
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={petForm.birthday}
                    onChange={e => setPetForm({ ...petForm, birthday: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">น้ำหนัก (กก.)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={petForm.weight}
                    onChange={e => setPetForm({ ...petForm, weight: e.target.value })}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider px-1">ความยาวขน</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold appearance-none"
                    value={petForm.coatType}
                    onChange={e => setPetForm({ ...petForm, coatType: e.target.value })}
                  >
                    <option value="Short">ขนสั้น (Short)</option>
                    <option value="Long">ขนยาว (Long)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-red-500 tracking-wider px-1">ข้อควรระวังพิเศษ (ถ้ามี)</label>
                <textarea 
                  className="w-full bg-red-50/30 border border-red-100 rounded-xl px-4 py-2.5 text-xs font-bold h-16 resize-none"
                  value={petForm.precautions}
                  onChange={e => setPetForm({ ...petForm, precautions: e.target.value })}
                  placeholder="เช่น แพ้แชมพูสูตรเย็น, ดุเวลากล้อนขน"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all"
              >
                ย้อนกลับ
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการลงทะเบียน"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success Screen */}
        {step === 3 && (
          <div className="p-10 text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-[32px] flex items-center justify-center mx-auto shadow-lg shadow-green-500/10">
              <CheckCircle2 size={40} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#1A1F3D]">ลงทะเบียนสำเร็จ!</h2>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                ยินดีต้อนรับเข้าสู่ครอบครัว {shopName} ข้อมูลของคุณและสัตว์เลี้ยงได้รับการบันทึกเข้าสู่ระบบเรียบร้อยแล้ว
              </p>
            </div>

            <div className="bg-[#F5F6FA] p-6 rounded-[28px] border border-gray-100 space-y-4">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">LINE OA Digital Card</p>
              <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-black text-[#1A1F3D]">{customerForm.firstName} {customerForm.lastName}</p>
                  <p className="text-[9px] text-indigo-600 font-black uppercase mt-0.5">Standard Member</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-[#1A1F3D]">0 PTS</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Points</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              * คุณสามารถปิดหน้าต่างนี้และกลับไปยัง LINE OA ได้ทันที
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiffRegister;