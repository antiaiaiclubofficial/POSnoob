import React from 'react';
import { format, parseISO } from 'date-fns';

interface RoomDetailCardProps {
  booking: any;
  room: any;
  onCheckout: () => void;
}

export const RoomDetailCard: React.FC<RoomDetailCardProps> = ({
  booking,
  room,
  onCheckout,
}) => {
  if (!booking || !room) return null;

  const pet = booking.pets || {};
  const owner = booking.customers || {};

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full bg-lg-tertiary-fixed/15 blur-md scale-150" />
          {pet.image_url ? (
             <img src={pet.image_url} alt={pet.name} className="relative h-14 w-14 rounded-full object-cover" />
          ) : (
             <div className="relative h-14 w-14 rounded-full bg-lg-surface-variant flex items-center justify-center text-lg-on-surface-variant font-bold text-lg">
               {pet.name?.charAt(0) || 'P'}
             </div>
          )}
        </div>
        <div>
          <p className="text-headline-sm font-medium text-lg-primary leading-tight">{pet.name}</p>
          <p className="text-label-md text-lg-on-surface-variant mt-1">{room.room_name} · {owner.display_name || owner.first_name}</p>
        </div>
      </div>

      {/* รายละเอียด check-in / check-out / บริการเสริม - ไม่มี divider เส้น ใช้ gap-4 */}
      <div className="flex flex-col gap-4 text-label-md text-lg-on-surface-variant mb-6">
        <div className="flex justify-between">
          <span>เช็คอิน</span>
          <span className="font-medium text-lg-on-surface">
            {booking.check_in_date ? format(parseISO(booking.check_in_date), 'dd MMM yyyy HH:mm') : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>คาดว่าจะเช็คเอาท์</span>
          <span className="font-medium text-lg-on-surface">
            {booking.check_out_expected ? format(parseISO(booking.check_out_expected), 'dd MMM yyyy HH:mm') : '-'}
          </span>
        </div>
        {booking.special_requests && (
          <div className="flex flex-col gap-1 mt-2">
            <span>หมายเหตุการจอง</span>
            <p className="text-lg-on-surface bg-lg-surface-container-low p-3 rounded-lg-lg">{booking.special_requests}</p>
          </div>
        )}
        {pet.notes && (
          <div className="flex flex-col gap-1 mt-2">
            <span>หมายเหตุสัตว์เลี้ยง</span>
            <p className="text-lg-on-surface bg-lg-surface-container-low p-3 rounded-lg-lg whitespace-pre-wrap">{pet.notes}</p>
          </div>
        )}
      </div>

      {/* Primary CTA - gradient ตามข้อ 2 ของ DESIGN.md */}
      <button 
        onClick={onCheckout}
        className="mt-2 w-full rounded-lg-xl bg-gradient-to-br from-lg-primary-container to-lg-primary
                          py-3.5 text-label-md font-medium text-white
                          shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:brightness-110 transition-all"
      >
        ปิดห้อง & สรุปบิลไป POS
      </button>
    </div>
  );
};
