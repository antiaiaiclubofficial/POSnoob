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
