---
name: Pet Hotel Dashboard — Section Redesign (Statistics + Ongoing + Right Panel)
based_on: DESIGN.md (Liquid Glass Pet POS)
reference_layout: "Call Center Analytics Dashboard — เฉพาะส่วน Statistics / Ongoing Calls / Right Panel"
status: ready-for-implementation
scope_note: "เอาเฉพาะโครงสร้างส่วนนี้จากภาพอ้างอิง — ไม่รวม Left Icon Sidebar และ Top Bar เดิม"
---

# Redesign Brief: โรงแรมสัตว์เลี้ยง Dashboard — ปรับเฉพาะส่วนเนื้อหาหลัก

## 1. เป้าหมาย (Objective)

ปรับโครงสร้างส่วน **เนื้อหาหลักของหน้า Dashboard** (ไม่รวม header เดิมด้านบนสุด/เมนู tab) ให้เป็น 2 คอลัมน์ตามภาพอ้างอิงที่ระบุ:

- **คอลัมน์ซ้าย (กว้าง):** Statistics header + แถบวันที่ + กราฟ, ตามด้วย Section "การ์ดกิจกรรม/ห้องพัก" แบบกริด
- **คอลัมน์ขวา (แคบ):** List "รอเช็คอินวันนี้", List "รอเช็คเอาท์วันนี้", และการ์ดไฮไลต์ Occupancy

**ข้อกำหนดสำคัญ:**
- ⚠️ **ห้ามลบหรือเปลี่ยนความหมายของชุดข้อมูลเดิม** — ทุกตัวเลข/รายการที่มีอยู่ต้องถูกแสดงผลต่อ เพียงจัดกลุ่ม/ตำแหน่งใหม่
- ใช้ token สี/typography/radius จาก `DESIGN.md` เท่านั้น ห้ามสร้างสีใหม่นอก palette
- คงกฎ **"No-Line Rule"** และหลัก **Liquid Glass** (glassmorphism, ไม่มีมุมคม, เงาฟุ้ง) ทุกจุด
- **ไม่รวม** Left Icon Sidebar และ Top Bar ในสโคปนี้ — ให้คงโครงสร้าง header/tab ด้านบนของเดิมไว้ตามปัจจุบัน ปรับเฉพาะพื้นที่เนื้อหาด้านล่าง header

---

## 2. โครงสร้าง Layout ใหม่ (Wireframe)

```
┌──────────────────────────────────────────────┬────────────────┐
│  (Header/Tab เดิมของหน้า — ไม่เปลี่ยนแปลง)         │                │
├──────────────────────────────────────────────┼────────────────┤
│  SECTION: "ภาพรวมวันนี้"  [แถบวันที่]  [ค้นหา]     │  รอเช็คอินวันนี้  │
│                                              │  (list avatar) │
│  ┌────────────────────────────────────────┐  │                │
│  │   กราฟ/สรุปเทรนด์ (บริบทที่มีข้อมูลรองรับ)   │  ├────────────────┤
│  └────────────────────────────────────────┘  │  รอเช็คเอาท์วันนี้ │
│                                              │  (list avatar) │
│  SECTION: "กิจกรรม & ห้องพักวันนี้"  ⓷            │                │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                  ├────────────────┤
│  │การ์ด│ │การ์ด│ │การ์ด│ │การ์ด│                  │  Highlight     │
│  └────┘ └────┘ └────┘ └────┘                  │  Occupancy 17% │
│                                              │  (gradient card)│
└──────────────────────────────────────────────┴────────────────┘
```

---

## 3. Mapping: องค์ประกอบเดิม → องค์ประกอบใหม่

| องค์ประกอบเดิม | ตำแหน่งใหม่ | รูปแบบใหม่ |
|---|---|---|
| การ์ด "อัตราการเข้าพัก (Occupancy) 17% (1/6)" | **Right Panel — การ์ดไฮไลต์ล่างสุด** | เทียบเท่าการ์ด "Outsourced Employees +372k" — gradient เข้ม + ตัวเลขใหญ่ + illustration ไอคอนสัตว์เลี้ยง |
| การ์ด "รอเช็คอินวันนี้ 0 ห้อง" + panel รายการ (empty state) | **Right Panel — Block บนสุด "รอเช็คอินวันนี้"** | เทียบเท่า "Starting calls": list การ์ดขาว มี avatar วงกลม + ชื่อ ต่อกันเป็นแถว, ถ้าไม่มีรายการแสดงข้อความ empty state |
| การ์ด "รอเช็คเอาท์วันนี้ 1 ห้อง" + panel รายการ ("หมู") | **Right Panel — Block ที่สอง "รอเช็คเอาท์วันนี้"** | เทียบเท่า "Break": list การ์ดขาว avatar + ชื่อ + เวลา/สถานะย่อยเล็ก ๆ ด้านขวา |
| Panel "กำลังเข้าพัก (1)" + รายการห้อง | **Main — Card Grid "กิจกรรม & ห้องพักวันนี้"** | เทียบเท่ากริดการ์ด "Ongoing Calls": 1 การ์ด = 1 สัตว์เลี้ยง/ห้อง |
| "กิจกรรมวันนี้ (3)" + รายการย่อย (พาเดินเล่น, ให้อาหาร ฯลฯ) | รวมเข้าในการ์ดเดียวกับ Card Grid ด้านบน | แต่ละการ์ดห้อง/สัตว์เลี้ยงแสดงรายการกิจกรรมย่อยเป็นแถวภายในการ์ด พร้อมไอคอน check วงกลม เหมือนแถว stat ("34 · 4h 34m") + dot indicator แถวล่างในการ์ด "Ongoing Calls" |
| Badge "VIP" | คงในหัวการ์ด (Card Grid) | pill-shape เหมือนแท็ก duration สีเขียว/แดงในการ์ดต้นแบบ |
| — (ไม่มีข้อมูลเดิม) | **Section "Statistics" ด้านบนคอลัมน์ซ้าย** | ดูหมายเหตุข้อ 4.1 — เป็นองค์ประกอบใหม่ที่ต้องพิจารณาแหล่งข้อมูลเพิ่ม |

---

## 4. รายละเอียดแต่ละองค์ประกอบ

### 4.1 Statistics Header + แถบวันที่ + กราฟ (คอลัมน์ซ้ายบนสุด)
⚠️ **หมายเหตุสำคัญ:** ส่วนกราฟเส้น + แถบวันที่ (01–15) ในภาพต้นแบบอ้างอิงข้อมูล "call volume รายชั่วโมง" ซึ่ง **ไม่มีชุดข้อมูลที่เทียบเท่าอยู่ในระบบโรงแรมสัตว์เลี้ยงปัจจุบัน** (ระบบปัจจุบันมีแค่ตัวเลข ณ วันนี้ ไม่มีข้อมูลย้อนหลังรายชั่วโมง/รายวัน) จึงมี 2 แนวทางให้ agent เลือกตามข้อมูลที่มี:

- **แนวทาง A (แนะนำถ้ามีข้อมูลย้อนหลัง):** ถ้า backend มี log อัตราการเข้าพักย้อนหลังรายวัน ให้ใช้พื้นที่นี้แสดงกราฟเส้น "อัตราการเข้าพัก (Occupancy) รายวัน" ของเดือนปัจจุบัน พร้อมแถบเลือกวันที่ (01–31) และ toggle "รายวัน / รายสัปดาห์ / รายเดือน" เหมือนต้นแบบ (Days/Weeks/Months)
- **แนวทาง B (fallback ถ้ายังไม่มีข้อมูลย้อนหลัง):** ให้ตัดส่วนกราฟออกชั่วคราว เหลือเฉพาะ section title "ภาพรวมวันนี้" + วันที่ปัจจุบัน (แสดงแบบ static ไม่ใช่แถบเลื่อน) แล้วข้ามไปที่ Card Grid ได้เลย — **ห้ามใส่ข้อมูลปลอม (mock data) แทนกราฟ**

รูปแบบ UI เมื่อมีกราฟ (แนวทาง A):
- Section title "ภาพรวมวันนี้" ใช้ `headline-lg` สี `on-surface`
- แถบวันที่: การ์ดวันที่ทรงกลม/สี่เหลี่ยมมุมมน (`rounded.DEFAULT`) พื้นหลัง `surface-container-low` วันที่ active ใช้พื้นขาว `surface-container-lowest` + เงาฟุ้งเบา
- กราฟเส้น: ใช้เส้น Bezier โค้งมนตามหลัก "Vibrant Data Viz" ใน DESIGN.md, เส้นหลักสี `secondary` (#5c5b7d), เส้นเปรียบเทียบ (ถ้ามี) เป็นเส้นประสี `accent-brown` (#C5805D)
- Tooltip ลอย (popup) เมื่อ hover จุดข้อมูล: การ์ดลอยพื้นหลัง `surface-container-lowest` @ 70% + blur 20px, radius `md`, เงา ambient tint จาก `primary`

### 4.2 Card Grid — "กิจกรรม & ห้องพักวันนี้"
- Section title `headline-lg` สี `on-surface` + badge วงกลมจำนวนกิจกรรม (พื้นเข้ม `primary`, ตัวเลข `on-primary`) — คงค่าจากเดิม "3"
- Grid: desktop 3–4 คอลัมน์, การ์ดแต่ละใบ = สัตว์เลี้ยง/ห้อง 1 รายการ (Level 2 card: `surface-container-lowest`, radius `xl`, padding 2rem)
- โครงสร้างภายในการ์ด (ไล่จากบนลงล่างตามต้นแบบ "Ongoing Calls"):
  1. หัวการ์ด: avatar/ไอคอนสัตว์เลี้ยงวงกลม + ชื่อสัตว์เลี้ยง (`headline-sm`) + badge เวลา/สถานะ (pill สีเขียวอ่อนหรือ `secondary-container`)
  2. แถว stat: ไอคอน + ตัวเลข เช่น "ห้อง: 1" และ badge "VIP" (pill `full` radius สี `tertiary-fixed`)
  3. เจ้าของสัตว์เลี้ยง (`body-md` สี `on-surface-variant`) + ไอคอนจำนวนกิจกรรมค้าง (เทียบแบบ "9" ในต้นแบบ)
  4. แถว dot indicator: ใช้แทนรายการกิจกรรมย่อย (พาเดินเล่น/ให้อาหาร) — จุดสีเขียว = เสร็จแล้ว, จุดสีส้ม/แดง = ค้าง/ด่วน (ใช้ `accent-red`, `accent-brown` ตามความหมายเดิม)
  5. footer เล็กมุมล่าง: หมายเลขอ้างอิง/ID การจอง สีจาง `on-surface-variant`

### 4.3 Right Panel — "รอเช็คอินวันนี้" (เทียบเท่า "Starting calls")
- หัวข้อ `label-md` ตัวหนา สี `on-surface`
- แต่ละแถว: การ์ดขาวเล็ก (`surface-container-lowest`, radius `lg`) มี avatar วงกลม (ไอคอน placeholder สัตว์เลี้ยง) + ชื่อสัตว์เลี้ยง (`body-md`)
- Empty state (กรณีไม่มีรายการ เช่นปัจจุบัน 0 ห้อง): การ์ดพื้น `surface-container-low` ข้อความกลาง "ไม่มีการเช็คอินวันนี้" สี `on-surface-variant`

### 4.4 Right Panel — "รอเช็คเอาท์วันนี้" (เทียบเท่า "Break")
- โครงสร้างเดียวกับ 4.3 แต่เพิ่มข้อความรองเล็กด้านขวาแถว (เทียบเท่าเวลา "00:05" ในต้นแบบ) — ใช้แสดงห้อง หรือเวลาที่ต้องเช็คเอาท์
- รายการปัจจุบัน: "หมู" เจ้าของ "นวล สุนัขสกุล" ห้อง 1

### 4.5 Right Panel — Highlight Stat Card (Occupancy)
- วางล่างสุดของคอลัมน์ขวา ให้เด่นสุด (เทียบเท่า "Outsourced Employees +372k")
- พื้นหลัง **Liquid Gradient**: `primary-container` (#18234a) → `primary` (#020d35) มุม 135deg
- ตัวเลขหลัก "17%" ใช้ `display-md` สี `on-primary`, ข้อความรอง "(1/6 ห้อง)" ใช้ `label-md` สี `inverse-primary`
- glow "halo" เบา ๆ ด้วย `tertiary-fixed` ที่ 10% opacity ด้านหลัง icon/illustration สัตว์เลี้ยง
- Radius `xl`, เงา ambient tint จาก `primary` 4% alpha

---

## 5. สรุปการใช้สี (อ้างอิงจาก DESIGN.md tokens เท่านั้น)

| องค์ประกอบ | Token สี |
|---|---|
| พื้นหลังคอลัมน์ขวา (Level 1) | `surface-container-low` #f3f3f3 |
| การ์ดทั่วไป (Level 2) | `surface-container-lowest` #ffffff |
| Tooltip ลอย/popup (Level 3 glass) | `surface-container-lowest` @ 70% opacity + blur 20px |
| Badge/pill "VIP" | `tertiary-fixed` #daed5b |
| Badge/pill สถานะรอง | `secondary-container` #d9d6fe / `on-secondary-container` |
| Highlight Stat Card gradient | `primary-container` #18234a → `primary` #020d35 (135deg) |
| ข้อความรองทั่วไป | `on-surface-variant` #45464E |
| Dot indicator/สถานะค้าง-ด่วน | `accent-red` #8E171D, `accent-brown` #C5805D |
| เส้นกราฟหลัก/เส้นเปรียบเทียบ (ถ้ามีข้อมูล) | `secondary` #5c5b7d / `accent-brown` #C5805D (เส้นประ) |

Typography: หัวข้อใช้ `Plus Jakarta Sans` (display-md / headline-lg / headline-sm), เนื้อหา/label ใช้ `Inter` (body-md / label-md) — ห้ามใช้ font อื่นนอกเหนือจากนี้

---

## 6. กฎที่ต้องคงไว้จาก DESIGN.md (ไม่เปลี่ยนแปลง)

- ❌ ห้ามใช้เส้นขอบ 1px solid แบ่ง section — ใช้ tonal shift / shadow / backdrop blur เท่านั้น
- ❌ ห้ามใช้มุมคม (`none`/`sm`) — การ์ด/ปุ่มทั้งหมดใช้ radius ตั้งแต่ `lg` ขึ้นไป (ยกเว้น pill ใช้ `full`)
- ❌ ห้ามใช้เงาสีดำล้วน (#000000) — ใช้เงา tint จาก `primary` เท่านั้น
- ❌ ห้ามใส่ mock/placeholder data แทนกราฟที่ยังไม่มีแหล่งข้อมูลจริง (ดูข้อ 4.1)
- ✅ ใช้ whitespace จัดโครงสร้าง หากส่วนใดดูแน่นให้เพิ่ม spacing จาก `gap-sm` เป็น `gap-md`

---

## 7. Responsive Notes

- **Desktop (≥1280px):** 2 คอลัมน์ตาม wireframe (main flexible / right panel ~300px)
- **Tablet (768–1279px):** right panel ย้ายมาต่อท้าย main content เป็นแถวแนวนอน scroll ได้ หรือยุบเป็น accordion
- **Mobile (<768px):** right panel (รอเช็คอิน/เช็คเอาท์/highlight card) ย้ายไปเป็น section ท้ายสุดของหน้า, Card Grid ปรับเป็น 1 คอลัมน์

---

## 8. Checklist ก่อนส่งมอบงาน

- [ ] ข้อมูลทุกตัว (occupancy 17% (1/6), เช็คอิน 0 ห้อง, เช็คเอาท์ 1 ห้อง "หมู", กำลังเข้าพัก "หมู"/VIP/ห้อง1, กิจกรรม 3 รายการ) ปรากฏครบในตำแหน่งใหม่
- [ ] ไม่มีเส้นขอบ 1px solid หลงเหลืออยู่
- [ ] สีทั้งหมดใช้ token จาก DESIGN.md เท่านั้น
- [ ] Header/Tab เดิมด้านบนสุดของหน้าไม่ถูกแตะต้อง (นอกสโคปนี้)
- [ ] ส่วนกราฟ Statistics ใช้แนวทาง A หรือ B ตามความพร้อมของข้อมูลจริง (ไม่ mock)
- [ ] Right panel แสดง empty state ที่ถูกต้องเมื่อไม่มีรายการเช็คอิน
