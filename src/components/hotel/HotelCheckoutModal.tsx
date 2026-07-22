import React from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, ShoppingCart, LogOut, ArrowRight, User, BedDouble } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface HotelCheckoutModalProps {
  bookingId: string;
  onClose: () => void;
}

const HotelCheckoutModal = ({ bookingId, onClose }: HotelCheckoutModalProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToCart, selectOwner, setActivePet, clearCart } = useStore();

  // Fetch Booking details with relations
  const { data: booking, isLoading } = useQuery({
    queryKey: ['hotel_booking_checkout', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select(`
          *,
          hotel_rooms (*),
          customers (*),
          pets (*)
        `)
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  // Fetch Charges
  const { data: charges = [] } = useQuery({
    queryKey: ['hotel_booking_charges', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_booking_charges')
        .select('*')
        .eq('booking_id', bookingId);
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ roomTotal, chargesTotal, nights }: { roomTotal: number, chargesTotal: number, nights: number }) => {
      if (!booking || !booking.hotel_rooms) throw new Error("ข้อมูลไม่ครบถ้วน");

      // 1. Clear current POS cart and setup customer
      clearCart();
      const customerMock = {
        id: booking.customers.id,
        name: booking.customers.display_name || booking.customers.first_name,
        phone: booking.customers.phone,
        email: booking.customers.email,
        membership: booking.customers.membership || 'Standard',
        pets: [],
        totalSpent: 0,
        creditBalance: 0
      };
      const petMock = {
        id: booking.pets.id,
        name: booking.pets.name,
        species: booking.pets.type || 'Dog',
        breed: booking.pets.breed || '',
        birthday: '',
        weightHistory: [],
        serviceHistory: [],
        notes: '',
        image: booking.pets.image_url || ''
      };
      selectOwner(customerMock as any);
      setActivePet(petMock as any);

      // 2. Add Room Charge to Cart
      addToCart({
        id: `hotel-room-${booking.id}`,
        icon: 'hotel',
        title: `ค่าห้องพัก ${booking.hotel_rooms.room_name} (${nights} คืน)`,
        price: roomTotal,
        quantity: 1,
        petId: booking.pets.id,
        petName: booking.pets.name,
        ownerName: customerMock.name,
        type: 'Hotel'
      });

      // 3. Add Service Charges to Cart
      charges.forEach((c: any) => {
        addToCart({
          id: `hotel-charge-${c.id}`,
          icon: 'hotel', // Or match charge_type
          title: c.description,
          price: Number(c.unit_price),
          quantity: c.quantity,
          petId: booking.pets.id,
          petName: booking.pets.name,
          ownerName: customerMock.name,
          type: 'Service'
        });
      });

      // 4. Update Booking and Room Status
      await supabase.from('hotel_bookings').update({
        status: 'checked_out',
        check_out_actual: new Date().toISOString()
      }).eq('id', booking.id);

      await supabase.from('hotel_rooms').update({ 
        status: 'cleaning' 
      }).eq('id', booking.hotel_rooms.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_bookings_active'] });
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      toast.success('สรุปบิลเรียบร้อย กำลังส่งไปหน้า POS');
      onClose();
      navigate('/pos');
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  if (isLoading || !booking) {
    const loadingContent = (
      <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 flex items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1F3D]"></div>
          <p className="font-bold">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(loadingContent, document.body) : loadingContent;
  }

  const checkInDate = parseISO(booking.check_in_date);
  const checkOutExpected = parseISO(booking.check_out_expected);
  
  // คำนวณจำนวนคืน (อย่างน้อย 1 คืน)
  const nights = Math.max(1, differenceInDays(new Date(), checkInDate));
  
  const roomPrice = Number(booking.hotel_rooms.price_per_night || 0);
  const roomTotal = nights * roomPrice;
  const chargesTotal = charges.reduce((sum: number, c: any) => sum + (c.quantity * Number(c.unit_price)), 0);
  const deposit = Number(booking.deposit_amount || 0);
  
  const grandTotal = roomTotal + chargesTotal - booking.deposit_amount;

  const modalContent = (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-amber-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
              <LogOut size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">Check-out / คืนห้องพัก</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ห้องพัก: {booking.hotel_rooms.room_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-3 bg-gray-50 p-4 rounded-2xl">
              <User className="text-gray-400" size={20} />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">เจ้าของ</p>
                <p className="text-sm font-black text-[#1A1F3D]">{booking.customers?.display_name || booking.customers?.first_name}</p>
              </div>
            </div>
            <div className="flex gap-3 bg-gray-50 p-4 rounded-2xl">
              <BedDouble className="text-gray-400" size={20} />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">สัตว์เลี้ยง</p>
                <p className="text-sm font-black text-[#1A1F3D]">{booking.pets?.name}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-3xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-black text-[#1A1F3D] flex items-center gap-2">
                <Receipt size={18} className="text-gray-400" />
                สรุปค่าใช้จ่ายการเข้าพัก
              </h4>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Room Item */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-50 border-dashed">
                <div>
                  <p className="font-bold text-sm text-[#1A1F3D]">ค่าห้องพัก {booking.hotel_rooms.room_name}</p>
                  <p className="text-xs text-gray-500">฿{roomPrice} x {nights} คืน ({format(checkInDate, 'dd MMM')} - {format(new Date(), 'dd MMM')})</p>
                </div>
                <p className="font-black text-sm text-[#1A1F3D]">฿{roomTotal.toLocaleString()}</p>
              </div>

              {/* Charges */}
              {charges.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center pb-4 border-b border-gray-50 border-dashed">
                  <div>
                    <p className="font-bold text-sm text-[#1A1F3D]">{c.description}</p>
                    <p className="text-xs text-gray-500">฿{c.unit_price} x {c.quantity}</p>
                  </div>
                  <p className="font-black text-sm text-[#1A1F3D]">฿{(c.quantity * c.unit_price).toLocaleString()}</p>
                </div>
              ))}

              {/* Deposit */}
              {deposit > 0 && (
                <div className="flex justify-between items-center text-green-600 pb-4 border-b border-gray-50 border-dashed">
                  <p className="font-bold text-sm">หักมัดจำล่วงหน้า</p>
                  <p className="font-black text-sm">-฿{deposit.toLocaleString()}</p>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-end pt-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">ยอดสุทธิ (Grand Total)</p>
                <p className="text-3xl font-black text-[#1A1F3D]">฿{grandTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => checkoutMutation.mutate({ roomTotal, chargesTotal, nights })}
            disabled={checkoutMutation.isPending}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all disabled:opacity-50"
          >
            {checkoutMutation.isPending ? 'กำลังประมวลผล...' : <>ส่งบิลไปหน้า POS <ShoppingCart size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
  
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default HotelCheckoutModal;
