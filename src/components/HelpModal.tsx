import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, BookOpen, MessageCircle, ExternalLink, Calculator, FileText, CheckCircle2, ShieldCheck, Layers, ArrowRight, Activity, BarChart3, Database, Table, HelpCircle as HelpIcon } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'accounting' | 'contact'>('accounting');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-[#1A1F3D]/5 via-white to-blue-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1F3D] text-[#EAFD69] flex items-center justify-center shadow-lg shadow-[#1A1F3D]/20 shrink-0">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1F3D] tracking-tight">ศูนย์ช่วยเหลือ & คู่มือการใช้งานระบบบัญชี</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">คู่มือการใช้งานระบบบัญชีคู่ (Double-Entry Accounting) อย่างละเอียดแบบอิงโค้ดจริง</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 px-6 pt-4 bg-gray-50/30 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('accounting')}
                className={`px-5 py-3 rounded-t-2xl text-xs font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'accounting'
                    ? 'bg-white text-[#1A1F3D] border-[#1A1F3D] shadow-sm'
                    : 'text-gray-400 border-transparent hover:text-gray-700'
                }`}
              >
                <BookOpen size={16} /> คู่มือการใช้งานระบบบัญชีอย่างละเอียด (Full Manual)
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-5 py-3 rounded-t-2xl text-xs font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'contact'
                    ? 'bg-white text-[#1A1F3D] border-[#1A1F3D] shadow-sm'
                    : 'text-gray-400 border-transparent hover:text-gray-700'
                }`}
              >
                <MessageCircle size={16} className="text-green-600" /> ติดต่อเจ้าหน้าที่ (LINE Support)
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 scrollbar-hide">
              {activeTab === 'accounting' && (
                <div className="space-y-8">
                  {/* System Overview Banner */}
                  <div className="p-6 bg-gradient-to-br from-[#18234a] to-[#020d35] rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[#EAFD69] text-[#1A1F3D] rounded-full text-[10px] font-black uppercase tracking-wider">
                          Multi-tenant Accounting Engine
                        </span>
                        <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-bold">
                          Supabase Postgres RLS Powered
                        </span>
                      </div>
                      <h4 className="text-2xl font-black text-[#EAFD69]">คู่มือการใช้งานระบบบัญชี (อิงจากโค้ดจริง)</h4>
                      <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
                        ระบบบัญชีนี้ถูกออกแบบโครงสร้างตามหลักการบัญชีคู่ (เดบิต = เครดิต) รองรับการแชร์ผังบัญชีระดับองค์กรและระดับสาขา พร้อมเชื่อมโยงยอดขายจาก POS เข้าสู่สมุดรายวันและงบการเงินให้อัตโนมัติ
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Chart of Accounts */}
                  <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-200/60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#1A1F3D]">1. การจัดการผังบัญชี (Chart of Accounts)</h4>
                        <p className="text-xs text-gray-500">จัดการผังบัญชีมาตรฐาน 5 หมวด และสิทธิ์การใช้งานระดับองค์กร/สาขา</p>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs text-gray-700 leading-relaxed pl-2">
                      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 space-y-2">
                        <span className="font-bold text-[#1A1F3D] block text-sm border-b pb-1">📌 หมวดบัญชีมาตรฐาน 5 หมวด:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <p>• <strong>1000 - Assets (สินทรัพย์):</strong> เงินสด (1001), เงินฝากธนาคาร (1002), ลูกหนี้การค้า (1003)</p>
                          <p>• <strong>2000 - Liabilities (หนี้สิน):</strong> เจ้าหนี้การค้า (2001), ภาษีขายรอลงนำส่ง VAT 7% (2002)</p>
                          <p>• <strong>3000 - Equity (ทุน):</strong> ทุนเรือนหุ้น / กำไรสะสม (3001)</p>
                          <p>• <strong>4000 - Revenue (รายได้):</strong> รายได้จากการขายสินค้า (4001), รายได้ค่าบริการ (4002)</p>
                          <p className="md:col-span-2">• <strong>5000 - Expenses (ค่าใช้จ่าย):</strong> ต้นทุนขาย COGS (5001), ส่วนลดจ่าย (5002)</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 space-y-2">
                        <span className="font-bold text-[#1A1F3D] block text-sm border-b pb-1">💡 วิธีใช้งานหน้าผังบัญชี (`ChartOfAccounts.tsx`):</span>
                        <p>• <strong>ดูรหัสบัญชี:</strong> เข้าไปที่เมนู <code className="bg-gray-100 px-1.5 py-0.5 rounded font-bold">ระบบบัญชี -&gt; ผังบัญชี</code> ระบบจะแยกแผ่นการ์ดตาม 5 หมวดหมู่อย่างชัดเจน</p>
                        <p>• <strong>แยกสิทธิ์ระดับองค์กร/สาขา:</strong> รายการที่มีป้าย <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">ระดับองค์กร</span> จะแชร์ใช้ร่วมกันทุกสาขา ส่วนป้าย <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">ระดับสาขา</span> จะใช้เฉพาะสาขาปัจจุบัน</p>
                        <p>• <strong>เพิ่มรหัสบัญชีใหม่:</strong> กดปุ่ม <span className="bg-[#1A1F3D] text-white px-2 py-1 rounded font-bold">+ เพิ่มรหัสบัญชี</span> ระบุหมวด รหัสบัญชี ชื่อบัญชี และบันทึก</p>
                        <p>• <strong>แก้ไขรหัสบัญชี:</strong> คลิกไอคอนดินสอ ✏️ บนแถบรายการบัญชีที่ต้องการ เพื่อปรับแก้ไขชื่อ รหัส หรือเปิด/ปิดสถานะ Active ได้ทันที</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Automatic Posting Engine */}
                  <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-200/60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#1A1F3D]">2. ระบบโพสต์รายการบัญชีอัตโนมัติ (Auto-Posting Engine)</h4>
                        <p className="text-xs text-gray-500">การบันทึกรายการขายจาก POS เข้าสู่สมุดรายวันอัตโนมัติ</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs text-gray-700 leading-relaxed pl-2">
                      <p>
                        เมื่อพนักงานชำระเงินบิล POS สำเร็จ ตาราง Database Trigger <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-indigo-600">trg_auto_post_sales</code> บน Supabase จะเรียกฟังก์ชัน <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-indigo-600">fn_post_sales_transaction_to_accounting()</code> เพื่อเดบิต/เครดิตเข้าสมุดรายวันให้อัตโนมัติ:
                      </p>

                      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2 font-mono text-[11px]">
                        <div className="flex justify-between items-center text-[#1A1F3D] font-bold border-b pb-1">
                          <span>ประเภทรายการค้า</span>
                          <span>การลงบัญชีเดบิต (Debit) / เครดิต (Credit)</span>
                        </div>
                        <div className="flex justify-between text-blue-600">
                          <span>[Dr.] 1001/1002 สินทรัพย์/เงินรับชำระ</span>
                          <span>= ยอดเงินรับชำระทั้งหมด (Total Amount)</span>
                        </div>
                        <div className="flex justify-between text-purple-600">
                          <span>[Dr.] 5002 ส่วนลดจ่าย (Sales Discount)</span>
                          <span>= ยอดส่วนลดการขาย (ถ้ามี)</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>[Cr.] 4001/4002 รายได้ขาย/ค่าบริการ</span>
                          <span>= ยอดขายสินค้าก่อนภาษี (Subtotal)</span>
                        </div>
                        <div className="flex justify-between text-amber-600">
                          <span>[Cr.] 2002 ภาษีขายรอส่งมอบ (VAT 7%)</span>
                          <span>= ยอดภาษีมูลค่าเพิ่ม VAT 7%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#EAFD69]/30 rounded-2xl border border-amber-200 text-gray-800 text-[11px] flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                        <span>
                          <strong>การการันตีความถูกต้อง:</strong> ระบบมี Trigger <code className="font-mono text-indigo-700">fn_check_journal_entry_balance()</code> ตรวจสอบให้ <code className="font-mono">SUM(Debit) == SUM(Credit)</code> เสมอ หากยอดไม่สมดุลระบบจะไม่อนุญาตให้โพสต์ลงฐานข้อมูล
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Manual Journal Entries */}
                  <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-200/60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#1A1F3D]">3. การลงรายการสมุดรายวันด้วยตนเอง (Manual Journal Entries)</h4>
                        <p className="text-xs text-gray-500">สำหรับบันทึกรายการปรับปรุง บันทึกซื้อสินค้า หรือค่าใช้จ่ายทั่วไป</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs text-gray-700 leading-relaxed pl-2">
                      <p>ขั้นตอนการลงรายการสมุดรายวันแมนนวลผ่านหน้าจอ <code className="bg-gray-100 px-1.5 py-0.5 rounded font-bold">ระบบบัญชี -&gt; สมุดรายวัน</code> (`JournalEntries.tsx`):</p>
                      
                      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 space-y-2">
                        <ol className="list-decimal pl-5 space-y-1.5">
                          <li>กดปุ่ม <span className="bg-[#1A1F3D] text-white px-2 py-0.5 rounded font-bold">+ ลงรายการสมุดรายวัน</span> ที่มุมขวาบน</li>
                          <li><strong>เลือกประเภทสมุดรายวัน (Journal Type):</strong>
                            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-gray-600">
                              <li><strong>JV (Journal Voucher):</strong> สมุดรายวันทั่วไป (รายการปรับปรุง / ปิดงวด)</li>
                              <li><strong>PJ (Purchase Journal):</strong> สมุดรายวันซื้อ (ตั้งเจ้าหนี้ / ซื้อสินค้า)</li>
                              <li><strong>SJ (Sales Journal):</strong> สมุดรายวันขาย</li>
                              <li><strong>CR (Cash Receipt):</strong> สมุดรายวันรับเงิน</li>
                              <li><strong>CP (Cash Payment):</strong> สมุดรายวันจ่ายเงิน (ค่าน้ำ, ค่าไฟ, ค่าเช่า ฯลฯ)</li>
                            </ul>
                          </li>
                          <li>ระบุวันที่, เลขที่อ้างอิง (เช่น <code className="text-blue-600 font-mono">INV-2026-001</code>) และคำอธิบายรายการ</li>
                          <li>เลือกรหัสบัญชี เพิ่มแถวเดบิต (Dr) และ เครดิต (Cr) (สามารถเพิ่ม/ลบแถวได้ไม่จำกัด)</li>
                          <li>ตรวจสอบตัวชี้วัดความสมดุลด้านล่าง: หากขึ้นป้าย <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">เดบิต = เครดิต (สมดุล)</span> ให้กดบันทึกสมุดรายวัน</li>
                          <li><strong>ดูรายละเอียด:</strong> คลิกที่แถวรายการในตารางสมุดรายวัน เพื่อเปิด Pop-up ดูตารางเดบิต/เครดิตรายแถวได้ทันที</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: General Ledger */}
                  <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-200/60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#1A1F3D]">4. บัญชีแยกประเภท (General Ledger)</h4>
                        <p className="text-xs text-gray-500">ตรวจสอบประวัติการเคลื่อนไหวรายบัญชีและยอดยกไป</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-gray-700 leading-relaxed pl-2">
                      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 space-y-1.5">
                        <p>• เข้าไปที่เมนู <code className="bg-gray-100 px-1.5 py-0.5 rounded font-bold">ระบบบัญชี -&gt; บัญชีแยกประเภท</code> (`GeneralLedger.tsx`)</p>
                        <p>• เลือกรหัสบัญชีที่ต้องการตรวจสอบ (เช่น <code className="font-mono text-blue-600">1001 - เงินสด</code> หรือ <code className="font-mono text-green-600">4001 - รายได้จากการขาย</code>)</p>
                        <p>• ตารางจะแสดง **ยอดยกมา (Opening Balance)**, รายการเคลื่อนไหวเดบิต/เครดิตแต่ละวัน และ **ยอดยกไปคงเหลือ (Ending Balance)** แบบเรียลไทม์</p>
                        <p>• สามารถเลือกกรองสลับดูเฉพาะสาขา หรือดูยอดรวมทุกสาขาได้</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Financial Reports */}
                  <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-200/60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-green-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-green-500/20 shrink-0">
                        5
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#1A1F3D]">5. งบการเงินและการรวมงบระดับองค์กร (Financial Reports)</h4>
                        <p className="text-xs text-gray-500">รายงานงบทดลอง งบกำไรขาดทุน และงบแสดงฐานะการเงิน</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700 pl-2">
                      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 space-y-2">
                        <span className="font-bold text-[#1A1F3D] block text-sm border-b pb-1">📊 สรุปงบการเงินระดับสูง:</span>
                        <p>• <strong>รายได้รวม (Total Revenue):</strong> คำนวณจากยอดเครดิตหมวด 4000</p>
                        <p>• <strong>ค่าใช้จ่ายรวม (Total Expenses):</strong> คำนวณจากยอดเดบิตหมวด 5000</p>
                        <p>• <strong>กำไรสุทธิ (Net Profit):</strong> คำนวณจาก <code className="font-bold text-green-600">Revenue - Expenses</code></p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 space-y-2">
                        <span className="font-bold text-[#1A1F3D] block text-sm border-b pb-1">📈 งบการเงินหลัก 3 งบ:</span>
                        <p>• <strong>งบทดลอง (Trial Balance):</strong> สรุปยอดยกไปของทุกรหัสบัญชี แยกดุลเดบิต/เครดิต</p>
                        <p>• <strong>งบกำไรขาดทุน (P&L):</strong> เรียกผ่าน RPC <code className="text-green-600 font-mono">get_consolidated_profit_loss()</code></p>
                        <p>• <strong>งบแสดงฐานะการเงิน (Balance Sheet):</strong> ตรวจสอบ <code className="font-mono">สินทรัพย์ = หนี้สิน + ทุน</code></p>
                      </div>
                    </div>
                  </div>

                  {/* Banner LINE Support */}
                  <div className="p-5 bg-green-50 rounded-3xl border border-green-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="text-green-600 shrink-0" size={28} />
                      <div>
                        <h5 className="text-sm font-bold text-gray-800">หากต้องการสอบถามเพิ่มเติมเกี่ยวกับระบบบัญชี</h5>
                        <p className="text-xs text-gray-500">สามารถติดต่อเจ้าหน้าที่ผ่าน LINE Official Account ได้ตลอดเวลา</p>
                      </div>
                    </div>
                    <a
                      href="https://lin.ee/wU8azb5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shrink-0 shadow-md shadow-green-600/20"
                    >
                      <span>แชท LINE Official</span> <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-6 text-center py-6">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4 shadow-sm border border-green-100">
                    <MessageCircle size={40} />
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-[#1A1F3D] mb-1">เจ้าหน้าที่ฝ่ายบริการลูกค้า & Support</h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      สอบถามวิธีการใช้งานระบบ แจ้งปัญหาการใช้งาน หรือขอคำแนะนำเพิ่มเติมผ่าน LINE Official Account
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-3xl max-w-md mx-auto border border-gray-100 space-y-4">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700">
                      <span>LINE Official:</span>
                      <span className="px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-green-600 font-mono">@mellowfellow</span>
                    </div>

                    <a
                      href="https://lin.ee/wU8azb5"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#00B900] hover:bg-[#009900] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#00B900]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      <span>เปิดแชทใน LINE Official Account</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#1A1F3D] text-white rounded-xl text-xs font-bold hover:bg-[#2A3158] transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HelpModal;
