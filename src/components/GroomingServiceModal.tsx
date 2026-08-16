import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Save, Dog, Scissors, AlertCircle, User, Info, Check, Pencil, Scale, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, QueueItem } from '@/store/useStore';
import { toast } from 'sonner';

interface GroomingServiceModalProps {
  item: QueueItem;
  onClose: () => void;
  readOnly?: boolean;
  intakeData?: any;
}

const GroomingServiceModal = ({ item, onClose, readOnly = false, intakeData }: GroomingServiceModalProps) => {
  const { language, currentUser, updateQueueStatus, customers, saveIntakeRecord, updatePetWeight } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  // Form State
  const [weight, setWeight] = useState('');
  
  // Safely initialize form data
  const defaultForm = {
    spayed: 'No',
    sex: 'Male',
    basicGrooming: [] as string[],
    addOns: [] as string[],
    bathProduct: 'Use Facilities',
    hairTrimLength: '',
    styleFocus: '',
    shaveShortIfMatted: 'Call owner',
    dislikes: '',
    additionalConcerns: '',
    itemBrought: '',
    pickupTime: '',
    groomerAssigned: '',
  };

  const initialDetails = intakeData?.details;
  const initialFormData = typeof initialDetails === 'string' 
    ? { ...defaultForm, ...(JSON.parse(initialDetails) || {}) } 
    : { ...defaultForm, ...(initialDetails || {}) };

  const [formData, setFormData] = useState({
    ...initialFormData,
    basicGrooming: Array.isArray(initialFormData.basicGrooming) ? initialFormData.basicGrooming : [],
    addOns: Array.isArray(initialFormData.addOns) ? initialFormData.addOns : [],
  });

  useEffect(() => {
    if (intakeData?.weight) {
      setWeight(intakeData.weight.toString());
    }
  }, [intakeData]);

  const basicServices = [
    'อาบน้ำ', 'ตัดเล็บ', 'บีบต่อมก้น', 'เช็ดตา', 
    'เช็ดหู', 'ทำความสะอาดบางส่วน', 'ตัดขนอุ้งเท้า', 'ไถขนหน้าท้อง', 
    'ทาโลชั่น', 'ถอนขนหู', 'ไถขนสุขอนามัย', 'ฉีดน้ำหอม'
  ];

  // Signature Pad Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1A1F3D';
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const clearSignature = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const toggleBasic = (service: string) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      basicGrooming: prev.basicGrooming.includes(service)
        ? prev.basicGrooming.filter(s => s !== service)
        : [...prev.basicGrooming, service]
    }));
  };

  const handleSave = async () => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    const signature = canvas?.toDataURL();
    
    // Find customer for this pet
    const owner = customers.find(c => c.pets.some(p => p.id === item.petId));
    if (!owner) {
      toast.error("Error: Customer or pet not found for this record.");
      return;
    }

    try {
      // 1. Save Form Record
        await saveIntakeRecord(owner.id, item.petId, {
          queueItemId: item.id,
          staffName: currentUser?.name || 'Admin',
          details: formData,
          weight: weight ? Number(weight) : undefined,
          signature
        });

        // 2. Update actual pet weight history if provided
        if (weight) {
          updatePetWeight(owner.id, item.petId, Number(weight));
        }
      } catch (err: any) {
        toast.error("Failed: " + (err.message || JSON.stringify(err)));
        console.error("Intake Form Save Error:", err);
        return;
      }

    updateQueueStatus(item.id, 'In Progress');
    toast.success("บันทึกข้อมูลและเช็คอินสำเร็จ!");
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 lg:p-10 overflow-y-auto">
      <div className="bg-[#f3f3f3] w-full max-w-4xl rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] overflow-hidden flex flex-col my-auto max-h-[95vh] border border-white/40">
        
        {/* Header */}
        <div className="bg-white/40 backdrop-blur-2xl p-8 flex justify-between items-center shrink-0 border-b border-white/20 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#18234a] rounded-[16px] flex items-center justify-center text-white shadow-inner">
              <Scissors size={24} />
            </div>
            <div>
              <h1 className="text-[32px] font-semibold text-[#020d35] uppercase tracking-tight leading-none font-['IBM_Plex_Sans_Thai'] mt-1">
                {readOnly ? "แบบฟอร์มบริการที่เสร็จสมบูรณ์" : "แบบฟอร์มรับบริการและเช็คอิน"}
              </h1>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/60 hover:bg-white rounded-2xl transition-all text-[#18234a] shadow-sm"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 scrollbar-hide bg-transparent">
          
          {/* Section 1: Info & Weight */}
          <section className="bg-white rounded-[32px] p-8 shadow-[0_8px_24px_rgba(24,35,74,0.02)]">
            <h2 className="text-[20px] font-medium text-[#18234a] mb-6 font-['IBM_Plex_Sans_Thai']">ข้อมูลสัตว์เลี้ยงและเจ้าของ</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1">
                <label className="text-[14px] font-medium text-[#45464e] font-['IBM_Plex_Sans_Thai']">ชื่อสัตว์เลี้ยง</label>
                <div className="w-full mt-1 bg-[#f9f9f9] border-none rounded-xl px-4 py-2.5 text-[16px] text-[#1a1c1c] font-medium font-['IBM_Plex_Sans_Thai']">
                  {item.petName}
                </div>
              </div>
              <div>
                <label className="text-[14px] font-medium text-[#45464e] font-['IBM_Plex_Sans_Thai']">เจ้าของ</label>
                <div className="w-full mt-1 bg-[#f9f9f9] border-none rounded-xl px-4 py-2.5 text-[16px] text-[#1a1c1c] font-['IBM_Plex_Sans_Thai']">
                  {item.ownerName}
                </div>
              </div>
              <div className="lg:col-span-1">
                <label className="text-[14px] font-medium text-[#45464e] font-['IBM_Plex_Sans_Thai']">บริการ</label>
                <div className="w-full mt-1 bg-[#f9f9f9] border-none rounded-xl px-4 py-2.5 text-[16px] text-[#1a1c1c] font-['IBM_Plex_Sans_Thai']">
                  {item.serviceName}
                </div>
              </div>
              <div>
                <label className="text-[14px] font-medium text-[#45464e] font-['IBM_Plex_Sans_Thai']">เวลา</label>
                <div className="w-full mt-1 bg-[#f9f9f9] border-none rounded-xl px-4 py-2.5 text-[16px] text-[#1a1c1c] font-['IBM_Plex_Sans_Thai']">
                  {item.time}
                </div>
              </div>
              {/* Weight Input Added Here */}
              <div className="col-span-2 lg:col-span-1">
                <label className="text-[14px] font-medium text-[#45464e] flex items-center gap-1 font-['IBM_Plex_Sans_Thai']">
                  <Scale size={16} className="text-[#5c5b7d]"/> น้ำหนัก (กก.)
                </label>
                <input 
                  type="number" 
                  disabled={readOnly}
                  className="w-full mt-1 bg-[#f9f9f9] border-none rounded-xl px-4 py-2.5 text-[16px] text-[#1a1c1c] focus:ring-2 focus:ring-[#18234a]/20 font-['IBM_Plex_Sans_Thai']"
                  placeholder="0.0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Checklist */}
          <section className="bg-white rounded-[32px] p-8 shadow-[0_8px_24px_rgba(24,35,74,0.02)]">
            <h2 className="text-[20px] font-medium text-[#18234a] mb-6 font-['IBM_Plex_Sans_Thai']">รายการที่ต้องทำ</h2>
            <div className="flex flex-wrap gap-3">
              {basicServices.map(service => {
                const isSelected = formData.basicGrooming.includes(service);
                return (
                  <button 
                    key={service} 
                    disabled={readOnly} 
                    onClick={() => toggleBasic(service)} 
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 font-['IBM_Plex_Sans_Thai'] text-[14px]",
                      isSelected 
                        ? "bg-[#18234a] text-white shadow-[0_4px_12px_rgba(24,35,74,0.2)] font-medium" 
                        : "bg-[#f9f9f9] text-[#45464e] hover:bg-[#e2e2e2] hover:text-[#1a1c1c]"
                    )}
                  >
                    {isSelected && <Check size={16} strokeWidth={3} className="text-[#daed5b]" />}
                    {service}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Section 3: Notes */}
          <section className="bg-white rounded-[32px] p-8 shadow-[0_8px_24px_rgba(24,35,74,0.02)]">
            <h2 className="text-[20px] font-medium text-[#18234a] mb-4 font-['IBM_Plex_Sans_Thai']">หมายเหตุและอื่นๆ</h2>
            <textarea
              disabled={readOnly}
              rows={2}
              className="w-full bg-[#f9f9f9] border-none rounded-2xl px-5 py-4 text-[16px] text-[#1a1c1c] focus:ring-2 focus:ring-[#18234a]/20 font-['IBM_Plex_Sans_Thai'] resize-none"
              placeholder="กรอกรายละเอียดเพิ่มเติมหรือข้อควรระวังพิเศษ..."
              value={formData.additionalConcerns || ''}
              onChange={e => setFormData(prev => ({ ...prev, additionalConcerns: e.target.value }))}
            />
          </section>

          {/* Section 4: Signature */}
          <section className="bg-white rounded-[32px] p-8 shadow-[0_8px_24px_rgba(24,35,74,0.02)]">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-[20px] font-medium text-[#18234a] font-['IBM_Plex_Sans_Thai']">การอนุญาตจากลูกค้า</h2>
               {!readOnly && <button onClick={clearSignature} className="text-[14px] font-medium text-[#ba1a1a] hover:bg-[#ffdad6] px-4 py-1.5 rounded-full transition-colors font-['IBM_Plex_Sans_Thai']">ล้างลายเซ็น</button>}
            </div>

            <div className="bg-[#f9f9f9] p-6 rounded-[24px]">
               <div className="flex items-center gap-2 text-[#45464e] font-medium mb-3 text-[14px] font-['IBM_Plex_Sans_Thai']">
                 <Pencil size={16} /> ลายเซ็นเจ้าของ
               </div>
               <div className="bg-white rounded-2xl overflow-hidden shadow-inner touch-none relative">
                  {readOnly && intakeData?.signature ? (
                    <img src={intakeData.signature} className="w-full h-[150px] object-contain" />
                  ) : (
                    <canvas 
                      ref={canvasRef}
                      width={800}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={() => setIsDrawing(false)}
                      className="w-full h-[150px] cursor-crosshair"
                    />
                  )}
               </div>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-transparent shrink-0 flex justify-end gap-4 border-t border-white/40">
          <button onClick={onClose} className="px-8 py-4 text-[16px] font-medium text-[#020d35] hover:bg-[#e8e8e8] rounded-[24px] transition-all font-['IBM_Plex_Sans_Thai']">
            {readOnly ? "ปิด" : "ยกเลิก"}
          </button>
          {!readOnly && (
            <button 
              onClick={handleSave}
              disabled={formData.basicGrooming.length === 0 || !hasSignature}
              className={cn(
                "px-8 py-4 text-[16px] font-medium rounded-[48px] flex items-center justify-center gap-3 transition-all relative overflow-hidden font-['IBM_Plex_Sans_Thai']",
                (formData.basicGrooming.length === 0 || !hasSignature)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-br from-[#18234a] to-[#020d35] text-white shadow-[0_8px_16px_rgba(2,13,53,0.2)] active:scale-95"
              )}
            >
              {!(formData.basicGrooming.length === 0 || !hasSignature) && <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>}
              <Check size={20} className={cn("relative z-10", (formData.basicGrooming.length === 0 || !hasSignature) ? "text-gray-500" : "text-[#daed5b]")} /> 
              <span className="relative z-10">เซ็นชื่อและยืนยันการเช็คอิน</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GroomingServiceModal;