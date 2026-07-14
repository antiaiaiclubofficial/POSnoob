![alt text](image.png)# Prompt: พัฒนาโมดูล Hotel (โรงแรมฝากเลี้ยงสัตว์เลี้ยง) — POSnoob

> เอกสารนี้เขียนจากการอ่านโค้ดจริงในโปรเจกต์ `POSnoob` (React + TypeScript + Vite + Zustand + Supabase + Tailwind + shadcn/ui) ให้คัดลอกทั้งไฟล์นี้ไปเป็น prompt สั่งงาน Claude Code หรือ AI coding agent ในโปรเจกต์ได้เลย

---

## 0. สถานะปัจจุบัน (สำคัญมาก — อ่านก่อนเริ่ม)

โปรเจกต์นี้ **มี Hotel prototype ฝังอยู่แล้วใน `src/pages/Dashboard.tsx`** ทำงานด้วย `localStorage` ล้วนๆ ไม่ได้เชื่อม Supabase:

- `roomsConfig` (state ในไฟล์ Dashboard.tsx บรรทัด ~134) — เก็บห้องพักลง `localStorage.setItem('kennel_rooms_config', ...)`
- `hotelBookings` (state ในไฟล์เดียวกัน บรรทัด ~127) — เก็บการจองลง `localStorage.setItem('hotel_bookings', ...)`
- `src/components/HotelBookingModal.tsx` — modal จองห้อง ใช้ `useStore().customers` (จาก Zustand) ค้นหาลูกค้า/สัตว์เลี้ยง แต่ `onSave` แค่ push เข้า array แล้วเซฟ localStorage
- ปุ่ม "Check-out / คืนห้องพัก" (Dashboard.tsx บรรทัด ~944, ฟังก์ชัน `handleCheckOutRoom` บรรทัด ~278) — **แค่ลบรายการออกจาก localStorage ไม่มีการคำนวณบิลหรือส่งไป POS เลย**
- ไม่มี route `/hotel`, ไม่มีในเมนู `src/components/Sidebar.tsx`, ไม่มี Supabase table สำหรับห้อง/การจอง

**งานของคุณคือ REPLACE ของเดิมทั้งหมดด้วยระบบที่เชื่อม Supabase จริง แยกเป็นหน้าเฉพาะ พร้อม flow ส่งบิลไป POS ที่ใช้งานได้จริง** ไม่ใช่แค่เพิ่มของใหม่ซ้อนของเดิม

---

## 1. Database — Supabase Migration

สร้างไฟล์ migration ใหม่ตาม pattern เดิมของโปรเจกต์ (ดู `supabase/migrations/20260703025700_held_bills.sql` เป็นตัวอย่าง: ใช้ `store_id UUID REFERENCES public.stores(id)`, เปิด RLS, policy แบบ `TO authenticated USING (true)`)

สร้างไฟล์: `supabase/migrations/<timestamp>_hotel_module.sql`

```sql
-- ประเภท/ขนาดห้อง (ใช้ตั้งค่าสีและชื่อขนาดร่วมกันทั้งระบบ)
CREATE TABLE IF NOT EXISTS public.hotel_room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  type_name text NOT NULL,          -- เช่น "Small", "Medium", "Large", "VIP"
  color text NOT NULL DEFAULT 'gray', -- key ของ COLOR_MAP ฝั่ง frontend (gray/blue/pink/green/purple/amber)
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- ห้องพัก
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  room_name text NOT NULL,
  room_type_id uuid REFERENCES public.hotel_room_types(id),
  price_per_night numeric NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 1,
  amenities jsonb DEFAULT '[]'::jsonb,
  description text,
  photo_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status = ANY (ARRAY['available'::text,'occupied'::text,'cleaning'::text,'maintenance'::text])),
  is_active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- การจอง / เข้าพัก
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  booking_code text,
  room_id uuid REFERENCES public.hotel_rooms(id),
  customer_id uuid REFERENCES public.customers(id),
  pet_id uuid REFERENCES public.pets(id),
  check_in_date timestamp with time zone NOT NULL,
  check_out_expected timestamp with time zone NOT NULL,
  check_out_actual timestamp with time zone,
  status text NOT NULL DEFAULT 'reserved' CHECK (status = ANY (ARRAY['reserved'::text,'checked_in'::text,'checked_out'::text,'cancelled'::text])),
  special_requests text,
  health_notes text,
  deposit_amount numeric DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- กิจกรรมรายตัว (ให้อาหาร/ยา/เดินเล่น/อาบน้ำ ฯลฯ) แสดงในตาราง Dashboard
CREATE TABLE IF NOT EXISTS public.hotel_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.hotel_bookings(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES public.pets(id),
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['feeding'::text,'walk'::text,'medication'::text,'grooming'::text,'playtime'::text,'cleaning'::text,'custom'::text])),
  title text,
  scheduled_time timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text,'done'::text,'missed'::text])),
  assigned_staff_id uuid REFERENCES auth.users(id),
  note text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- รายการบริการเสริม/ค่าใช้จ่ายระหว่างพัก ที่จะสรุปตอน checkout แล้วส่งไป POS cart
CREATE TABLE IF NOT EXISTS public.hotel_booking_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.hotel_bookings(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  charge_type text DEFAULT 'service' CHECK (charge_type = ANY (ARRAY['service'::text,'product'::text])),
  created_at timestamp with time zone DEFAULT now()
);

-- RLS: ใช้ policy รูปแบบเดียวกับ held_bills.sql ทุกตาราง
ALTER TABLE public.hotel_room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_booking_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated" ON public.hotel_room_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON public.hotel_rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON public.hotel_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON public.hotel_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated" ON public.hotel_booking_charges FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

> หมายเหตุ: โปรเจกต์นี้ไม่มีไฟล์ generated Supabase types (`integrations/supabase/` มีแค่ `client.ts`) จึง query ตารางใหม่ด้วย `.from('hotel_rooms' as any)` แบบเดียวกับที่ใช้กับ `attendance_logs` ใน `Dashboard.tsx` ได้เลย ไม่ต้อง generate type เพิ่ม

---

## 2. TypeScript Types

เพิ่มใน `src/store/types.ts` ต่อจาก interface `Pet`/`Customer` เดิม:

```ts
export interface HotelRoomType {
  id: string;
  typeName: string;
  color: 'gray' | 'blue' | 'pink' | 'green' | 'purple' | 'amber';
  sortOrder: number;
}

export interface HotelRoom {
  id: string;
  roomName: string;
  roomTypeId: string | null;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  description?: string;
  photoUrl?: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  isActive: boolean;
  sortOrder: number;
}

export interface HotelBooking {
  id: string;
  bookingCode?: string;
  roomId: string;
  customerId: string;
  petId: string;
  checkInDate: string;
  checkOutExpected: string;
  checkOutActual?: string | null;
  status: 'reserved' | 'checked_in' | 'checked_out' | 'cancelled';
  specialRequests?: string;
  healthNotes?: string;
  depositAmount: number;
  notes?: string;
  // joined fields (จาก query .select('*, customers(*), pets(*), hotel_rooms(*)'))
  customer?: Customer;
  pet?: Pet;
  room?: HotelRoom;
}

export interface HotelActivity {
  id: string;
  bookingId: string;
  petId: string;
  activityType: 'feeding' | 'walk' | 'medication' | 'grooming' | 'playtime' | 'cleaning' | 'custom';
  title?: string;
  scheduledTime: string;
  status: 'pending' | 'done' | 'missed';
  assignedStaffId?: string;
  note?: string;
}

export interface HotelBookingCharge {
  id: string;
  bookingId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  chargeType: 'service' | 'product';
}
```

**อย่าใส่ CRUD state/actions พวกนี้เข้า `useStore.ts` ตรงๆ** (ไฟล์นั้นยาว 2000+ บรรทัดอยู่แล้ว) ให้ทำ data fetching ด้วย `@tanstack/react-query` (`useQuery`/`useMutation`) เหมือนที่ `Dashboard.tsx` ทำกับ `attendance_logs` (บรรทัด ~135-168) แทน — เขียน query/mutation ไว้ในคอมโพเนนต์ที่ใช้งานแต่ละหน้าได้เลย

---

## 3. Sidebar — เพิ่มเมนู

แก้ `src/components/Sidebar.tsx`:

1. import ไอคอน `Building2` (หรือ `BedDouble`) จาก `lucide-react` เพิ่มในบรรทัด import เดิม
2. เพิ่มรายการใน `menuGroups` (บรรทัด ~40) ต่อจาก `{ icon: Users, label: t.customers, path: '/customers' }`:

```ts
{ icon: Building2, label: t.hotel || 'โรงแรม', path: '/hotel' },
```

3. เพิ่ม key `hotel` ในทั้งสอง object (`en`/`th`) ของ `src/utils/translations.ts` ต่อจาก `queue:` (บรรทัด ~7 และ ~267):

```ts
hotel: "Pet Hotel",   // ในฝั่ง en
hotel: "โรงแรมสัตว์เลี้ยง", // ในฝั่ง th
```

4. ตรวจสอบระบบสิทธิ์: `Sidebar.tsx` กรองเมนูผ่าน `rolePermissions[userRole]` (อ่านจาก `useStore`) — path `/hotel` จะไม่โชว์จนกว่าจะถูกเพิ่มใน `rolePermissions` ของ role ที่เกี่ยวข้อง (ตรวจสอบใน `src/pages/Settings.tsx` หรือ `RoleManagementModal.tsx` ว่าที่ไหนกำหนดค่า default แล้วเพิ่ม `/hotel` เข้าไปด้วย เช่นเดียวกับที่ `/sales-procurement` และ `/accounting` ถูก force-allow ให้ Admin/superadmin ใน `Sidebar.tsx` บรรทัด ~76-83)

---

## 4. Routing

แก้ `src/components/AuthInitializer.tsx`:

1. เพิ่ม `import Hotel from "@/pages/Hotel";` ต่อจาก `import Customers from "@/pages/Customers";`
2. เพิ่ม route ในกลุ่ม `<ProtectedRoute><Layout /></ProtectedRoute>` (บรรทัด ~956) ต่อจาก `/customers`:

```tsx
<Route path="/hotel" element={<Hotel />} />
```

---

## 5. โครงสร้างหน้า Hotel

**ใช้ pattern เดียวกับ `src/pages/Accounting.tsx`** — หน้าเดียว มี internal tab state ไม่ต้องแยก route ย่อย (เพราะทั้งโปรเจกต์ไม่มีหน้าไหนทำ nested route สำหรับ sub-view เลย ทุกหน้าที่ซับซ้อนใช้ tab state + sub-component)

### ไฟล์ที่ต้องสร้าง

```
src/pages/Hotel.tsx                          <- shell, tab switcher (ก็อป pattern จาก Accounting.tsx)
src/components/hotel/HotelDashboardTab.tsx   <- ภาพรวมห้อง + ตารางกิจกรรม
src/components/hotel/HotelRoomsTab.tsx       <- Grid ห้องพัก + คลิกเพื่อจอง/ดูรายละเอียด/checkout
src/components/hotel/HotelSettingsTab.tsx    <- CRUD ห้องพัก + ตั้งค่าประเภท/สีห้อง
src/components/hotel/HotelBookingModal.tsx   <- แทนที่ไฟล์เดิมที่ src/components/HotelBookingModal.tsx (ย้ายมา + ต่อ Supabase จริงแทน onSave callback เดิม)
src/components/hotel/HotelCheckoutModal.tsx  <- สรุปบิลก่อนส่งไป POS (ใหม่)
```

`src/pages/Hotel.tsx` โครงร่าง (เทียบ `Accounting.tsx`):

```tsx
type HotelTab = 'dashboard' | 'rooms' | 'settings';

const Hotel = () => {
  const [activeTab, setActiveTab] = useState<HotelTab>('dashboard');
  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'rooms', label: 'ห้องพัก & การจอง', icon: BedDouble },
    { id: 'settings', label: 'ตั้งค่าห้องพัก', icon: SettingsIcon },
  ];
  // ... header เหมือน Accounting.tsx, render ตาม activeTab
};
```

### สิ่งที่ต้อง "ย้ายออก" จาก Dashboard.tsx

ลบส่วนต่อไปนี้ออกจาก `src/pages/Dashboard.tsx` ทั้งหมด แล้วย้าย logic ไปที่ `components/hotel/*` แทน (Dashboard ควรเหลือแค่สรุปภาพรวมร้านทั่วไป ไม่ควรมี business logic ของโรงแรมทั้งดุ้น):
- state: `isHotelBookingOpen`, `selectedRoomForBooking`, `selectedOccupiedRoom`, `hotelBookings`, `isEditRoomsMode`, `editingRoomIndex`, `tempRoomName`, `tempRoomColor`, `roomsConfig`
- functions: `initializeDefaultRooms`, `handleSaveRoomEdit`, `handleIncreaseCapacity`, `handleDecreaseCapacity`, `handleSaveHotelBooking`, `handleCheckOutRoom`, `handleRoomClick`, `hotelRooms` (useMemo)
- JSX: ทั้ง block "ตารางห้องพักโรงแรมสัตว์เลี้ยง", `HotelBookingModal`, "Occupied Room Details Modal", "Room Customization Modal"
- `interface RoomConfig` และ `COLOR_MAP` — ย้ายไปเป็น shared constant ที่ `src/components/hotel/roomColorMap.ts` เพื่อใช้ร่วมกันทั้ง 3 tab (Dashboard tab ก็ต้องใช้สีเดียวกับ Settings tab)

(ถ้าอยากให้ Dashboard หลักยังโชว์ widget สรุปห้องพักแบบย่อได้ — แต่ให้ดึงจาก Supabase table ใหม่ผ่าน react-query ไม่ใช่ local state/localStorage เดิม)

---

## 6. รายละเอียดแต่ละ Tab

### 6.1 `HotelSettingsTab.tsx`
- CRUD `hotel_room_types` (ชื่อประเภท + สี ผูกกับ `COLOR_MAP` เดิมที่มีอยู่ใน `Dashboard.tsx` — คัดลอก object นี้ไปไว้ที่ `roomColorMap.ts` แล้ว import ใช้ร่วมกัน อย่า hardcode ซ้ำ)
- CRUD `hotel_rooms`: ฟอร์มมี room_name, room_type_id (dropdown จาก hotel_room_types), price_per_night, capacity, amenities, description, photo_url
- แสดงห้องเป็น Grid card สีตาม `room_type` (ใช้ `COLOR_MAP[type.color].bg` แบบเดียวกับโค้ดเดิมใน Dashboard.tsx บรรทัด ~809)

### 6.2 `HotelRoomsTab.tsx`
- Query `hotel_rooms` join `hotel_bookings` (เฉพาะ status `checked_in`/`reserved`) join `customers`, `pets` เพื่อรู้ว่าห้องไหนไม่ว่าง แสดงชื่อสัตว์เลี้ยง
- Grid การ์ดห้อง (คัดลอก style เดิมจาก Dashboard.tsx บรรทัด ~809-833 มาใช้) — คลิกห้องว่าง → เปิด `HotelBookingModal`, คลิกห้องไม่ว่าง → เปิด modal รายละเอียด (คัดลอก style จาก Dashboard.tsx บรรทัด ~876-951)
- **`HotelBookingModal.tsx` (เวอร์ชันใหม่)**: ใช้โครง UI เดิมจาก `src/components/HotelBookingModal.tsx` ทั้งหมด (ค้นหาลูกค้า/สัตว์เลี้ยงจาก `useStore().customers`, เลือกวันที่ check-in/out) **แต่เปลี่ยน `handleSubmit`/`onSave` จากการ push array + localStorage เป็น**:
  ```ts
  const { error } = await supabase.from('hotel_bookings' as any).insert([{
    store_id: storeId,
    room_id: roomId,
    customer_id: selectedOwner.id,
    pet_id: selectedPet.id,
    check_in_date: `${checkInDate}T${checkInTime}:00`,
    check_out_expected: `${checkOutDate}T${checkOutTime}:00`,
    status: 'reserved',
    deposit_amount: depositAmount,
    special_requests: specialRequests,
    created_by: currentUser?.id
  }]);
  ```
  แล้ว `queryClient.invalidateQueries({ queryKey: ['hotel_bookings'] })`
- เพิ่ม step "บริการเสริม" ในฟอร์ม (เลือกจาก `services`/`addons` ที่มีอยู่แล้วใน `useStore()` — ดู `ServiceCard.tsx`/`AddOnModal.tsx` เป็นตัวอย่างการดึงรายการบริการ) → insert เป็นแถวใน `hotel_booking_charges` หลัง booking ถูกสร้าง
- ปุ่ม "Check-in" (เปลี่ยน status `reserved` → `checked_in`, update `hotel_rooms.status` เป็น `occupied`)

### 6.3 `HotelDashboardTab.tsx`
- การ์ดสรุป: check-in วันนี้, check-out วันนี้, occupancy rate (`checked_in count / total rooms`)
- ตารางกิจกรรม (`hotel_activities`) — แถวคือแต่ละสัตว์เลี้ยงที่ `checked_in` อยู่, คอลัมน์คือกิจกรรมเรียงตามเวลา คลิก mark done ได้ (`update hotel_activities set status='done', completed_at=now()`)
- รายการ "ต้อง Check-out วันนี้" (`hotel_bookings.check_out_expected` = วันนี้ และ status = `checked_in`) พร้อมปุ่มลัดเปิด `HotelCheckoutModal`

### 6.4 Check-out → POS (ส่วนสำคัญที่สุดที่ของเดิมยังไม่มี)

สร้าง `HotelCheckoutModal.tsx`:

1. Query `hotel_booking_charges` ของ booking นั้น + คำนวณ:
   ```ts
   const nights = Math.max(1, differenceInDays(new Date(), parseISO(booking.checkInDate)));
   const roomTotal = nights * room.pricePerNight;
   const chargesTotal = charges.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0);
   const grandTotal = roomTotal + chargesTotal - (booking.depositAmount || 0);
   ```
2. แสดงตารางสรุปให้พนักงานตรวจสอบ/แก้ไขได้ก่อนกด "ยืนยัน & ไปหน้า POS"
3. เมื่อกดยืนยัน **ใช้ Zustand store ที่มีอยู่แล้ว** (`src/store/useStore.ts` มี `cart`, `addToCart`, `selectOwner`, `setActivePet` พร้อมใช้งานอยู่แล้ว ไม่ต้องสร้างระบบ cart ใหม่):
   ```ts
   const { addToCart, selectOwner, setActivePet, clearCart } = useStore.getState();

   clearCart(); // เริ่ม cart ใหม่สำหรับบิลนี้
   selectOwner(booking.customer);   // Customer type เดิมจาก store
   setActivePet(booking.pet);       // Pet type เดิมจาก store

   addToCart({
     id: `hotel-room-${booking.id}`,
     icon: 'hotel',
     title: `ค่าห้องพัก ${room.roomName} (${nights} คืน)`,
     price: roomTotal,
     quantity: 1,
     petId: booking.pet.id,
     petName: booking.pet.name,
     ownerName: booking.customer.name,
     type: 'Hotel'
   });

   charges.forEach(c => addToCart({
     id: `hotel-charge-${c.id}`,
     icon: 'hotel',
     title: c.description,
     price: c.unitPrice,
     quantity: c.quantity,
     petId: booking.pet.id,
     petName: booking.pet.name,
     ownerName: booking.customer.name,
     type: 'Service'
   }));

   // ปิดสถานะฝั่ง hotel (ยังไม่ตัดว่า checkout จริง รอ POS ปิดบิลก่อน)
   await supabase.from('hotel_bookings' as any).update({
     status: 'checked_out',
     check_out_actual: new Date().toISOString()
   }).eq('id', booking.id);
   await supabase.from('hotel_rooms' as any).update({ status: 'cleaning' }).eq('id', room.id);

   navigate('/pos'); // ไปหน้า POS (Index.tsx) cart จะโชว์รายการที่เพิ่งใส่ทันทีเพราะเป็น store เดียวกัน
   ```
   > object ที่ push เข้า `addToCart` ต้องตรงกับ shape ที่ใช้จริงใน `src/components/ServiceCard.tsx` บรรทัด ~63 (`id, icon, title, price, quantity, petId, petName, ownerName, type`) — คัดลอก shape นี้เป๊ะๆ อย่าเดาใหม่ เพราะ `cart` เป็น `any[]` ไม่มี type บังคับ ถ้า field ไม่ตรงจะแสดงผลผิดในหน้า POS (`Index.tsx`)
4. หน้า POS (`src/pages/Index.tsx`) จะแสดง cart ที่เพิ่งเติมให้อัตโนมัติ พนักงานกดชำระเงินตามขั้นตอนปกติ (`PaymentModal.tsx`) ซึ่งจะสร้างแถวใน `sales_transactions` เองอยู่แล้วโดยไม่ต้องแก้อะไรเพิ่ม
5. (ตัวเลือกเสริม) ถ้าต้องการ mark สถานะห้องกลับเป็น `available` อัตโนมัติหลังทำความสะอาด ให้เพิ่มปุ่ม "ทำความสะอาดเสร็จแล้ว" ใน `HotelRoomsTab.tsx` สำหรับห้องที่ status = `cleaning`

---

## 7. Checklist สำหรับ AI agent

- [ ] สร้าง migration SQL (ข้อ 1) แล้วรันผ่าน Supabase CLI/Dashboard
- [ ] เพิ่ม types ใน `store/types.ts` (ข้อ 2)
- [ ] แก้ `Sidebar.tsx` + `translations.ts` เพิ่มเมนู `/hotel` (ข้อ 3)
- [ ] แก้ `AuthInitializer.tsx` เพิ่ม route (ข้อ 4)
- [ ] สร้าง `src/pages/Hotel.tsx` + `src/components/hotel/*` ทั้งหมด (ข้อ 5-6)
- [ ] **ลบ** hotel logic เดิมทั้งหมดออกจาก `Dashboard.tsx` (ข้อ 5) — อย่าปล่อยโค้ดซ้ำสองที่
- [ ] ลบไฟล์เดิม `src/components/HotelBookingModal.tsx` (ย้ายไป `components/hotel/` แล้ว)
- [ ] ทดสอบ flow เต็ม: สร้างห้อง → จอง (ผูก CRM) → check-in → เพิ่มบริการเสริม → check-out → เห็น cart ในหน้า POS ถูกต้อง → ชำระเงินสำเร็จ → ห้องเปลี่ยนเป็น cleaning
- [ ] ตรวจสอบว่า role permission (`rolePermissions`) อนุญาต path `/hotel` ให้ role ที่ควรเข้าถึงได้
