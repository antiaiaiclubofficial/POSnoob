"use client";

import React, { useState, useEffect } from 'react';
import ServiceCard from '@/components/ServiceCard';
import ProductCard from '@/components/ProductCard';
import OrderSummary from '@/components/OrderSummary';
import ReceiptPreview from '@/components/ReceiptPreview';
import CustomerSearch from '@/components/CustomerSearch';
import CustomerModal from '@/components/CustomerModal';
import GroomingServiceModal from '@/components/GroomingServiceModal';
import AddOnModal from '@/components/AddOnModal';
import ManageServicesModal from '@/components/ManageServicesModal';
import PackagesAndCreditsModal from '@/components/PackagesAndCreditsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, X, Search, Home, CreditCard, Sparkles, ShoppingBag, 
  CheckCircle2, Dog, Cat, Scissors, Package, ClipboardList, Clock, Zap, Star, Heart, Brush, Wind, Stethoscope, Award, Bone, Bath, Wallet, Plus, AlertCircle, ArrowRight, History, LayoutGrid, List
} from 'lucide-react';
import { useStore, QueueItem, ServiceIcon, Customer, walkInCustomer } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const getIcon = (iconName: ServiceIcon) => {
  switch(iconName) {
    case 'grooming': return Scissors;
    case 'bath': return Bath;
    case 'spa': return Sparkles;
    case 'nail': return Zap;
    case 'dry': return Wind;
    case 'brush': return Brush;
    case 'health': return Stethoscope;
    case 'hotel': return Home;
    case 'love': return Heart;
    case 'food': return Bone;
    case 'premium': return Award;
    default: return Zap;
  }
};


const Index = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { 
    selectedOwner, 
    activePet, 
    services, 
    addons,
    inventory,
    packageTemplates,
    creditPackages,
    selectOwner, 
    setActivePet, 
    queue, 
    customers,
    setActiveQueueItem,
    cart,
    addToCart,
    clearCart,
    heldBills,
    removeHeldBill,
    currency,
    language,
    transactions,
    voidTransaction,
    shopName,
    shopLogo,
    shopAddress,
    shopPhone,
    receiptHeader,
    receiptFooter,
    receiptPaperSize
  } = useStore();

  const t = translations[language];
  const today = format(new Date(), 'yyyy-MM-dd');

  const [posTab, setPosTab] = useState('services');
  const [speciesFilter, setSpeciesFilter] = useState<'Dog' | 'Cat'>('Dog');
  const [coatFilter, setCoatFilter] = useState<'All' | 'Short' | 'Long'>('Short');
  const [productSearch, setProductQuery] = useState('');
  const [productViewMode, setProductViewMode] = useState<'grid' | 'list'>('grid');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);
  const [isPackagesCreditsModalOpen, setIsPackagesCreditsModalOpen] = useState(false);
  const [isSavedBillsSheetOpen, setIsSavedBillsSheetOpen] = useState(false);
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [intakeItem, setIntakeItem] = useState<QueueItem | null>(null);
  const [selectedAddOn, setSelectedAddOn] = useState<any>(null);
  const [productCategory, setProductCategory] = useState<string>('All');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('today');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReasonInput, setVoidReasonInput] = useState('');
  const [viewingReceiptTx, setViewingReceiptTx] = useState<any>(null);

  useEffect(() => {
    if (activePet) {
      setSpeciesFilter(activePet.species === 'Dog' ? 'Dog' : 'Cat');
    }
  }, [activePet]);

  const todayQueue = queue.filter(q => q.date === today && !q.isPaid);
  const historyTransactions = transactions.filter(tx => {
    const matchSearch = historySearch === '' || 
      tx.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      tx.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      (tx.items && tx.items.some((i: any) => i.title?.toLowerCase().includes(historySearch.toLowerCase()) || i.name?.toLowerCase().includes(historySearch.toLowerCase())));
      
    const txDateLocal = tx.createdAt ? format(new Date(tx.createdAt), 'yyyy-MM-dd') : tx.date;
    const matchDate = historyDateFilter === 'all' || txDateLocal === today;
    const matchStatus = historyStatusFilter === 'all' || 
                        (historyStatusFilter === 'voided' ? tx.status === 'voided' : tx.status !== 'voided');

    return matchSearch && matchDate && matchStatus;
  });

  const handleQuickSelectFromQueue = (item: QueueItem) => {
    const owner = customers.find(c => c.name === item.ownerName);
    if (owner) {
      selectOwner(owner);
      const pet = owner.pets.find(p => p.id === item.petId);
      if (pet) {
        setActivePet(pet);
        setActiveQueueItem(item.id);
        toast.success(`Active Session: ${item.petName}`);
        setPosTab('services');
        setIsSavedBillsSheetOpen(false);
      }
    }
  };

  const handleLoadHeldBill = (bill: any) => {
    // 1. Clear current cart
    clearCart();
    // 2. Select Owner
    const owner = customers.find(c => c.id === bill.customerId);
    if (owner) {
      selectOwner(owner);
    } else if (bill.customerId === 'walk-in') {
      selectOwner(walkInCustomer);
    }
    // 3. Add items to cart
    bill.items.forEach((item: any) => addToCart(item));
    // 4. Remove from heldBills
    removeHeldBill(bill.id);
    setIsSavedBillsSheetOpen(false);
    toast.success(language === 'th' ? "ดึงบิลสำเร็จ" : "Bill loaded");
  };

  const handleQuickSale = () => {
    selectOwner(walkInCustomer);
    toast.success(language === 'th' ? "เปิดโหมดขายด่วน (ลูกค้าทั่วไป)" : "Quick Sale Mode Activated");
  };

  const filteredServices = services.filter(s => 
    s.targetSpecies === speciesFilter && 
    s.isActive && 
    (!s.coatType || s.coatType === coatFilter)
  );
  
  const filteredProducts = inventory.filter(p => 
    (productCategory === 'All' || p.category === productCategory) &&
    (p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
     p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );
  
  const productCategories = ['All', ...Array.from(new Set(inventory.map(p => p.category)))];
  
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="flex-1 flex overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 lg:px-10 py-6 lg:py-8 flex justify-between items-center shrink-0">
          <div className="pl-14 lg:pl-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-[#D9ED5F]" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.pointOfSale}</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">{t.pos}</h1>
          </div>
          <div className="flex gap-3">
            <Sheet open={isSavedBillsSheetOpen} onOpenChange={setIsSavedBillsSheetOpen}>
              <SheetContent className="w-[400px] sm:w-[540px] border-l-0 rounded-l-[40px] p-8 shadow-2xl flex flex-col">
                <div>
                  <h2 className="text-2xl font-black text-[#1A1F3D] mb-1">{language === 'th' ? 'บิลที่พักไว้ และ คิววันนี้' : 'Saved Bills & Today\'s Queue'}</h2>
                  <p className="text-gray-400 text-sm font-bold mb-6">{language === 'th' ? 'เลือกบิลหรือคิวเพื่อชำระเงิน' : 'Select a bill or queue to checkout'}</p>
                </div>
                
                <Tabs defaultValue="held" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 rounded-2xl mb-4 shrink-0">
                    <TabsTrigger value="held" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      {language === 'th' ? 'บิลที่พักไว้' : 'Held Bills'} ({heldBills?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="queue" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      {language === 'th' ? 'คิววันนี้' : 'Today Queue'} ({todayQueue.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="held" className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {!heldBills || heldBills.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 font-bold">
                        {language === 'th' ? 'ไม่มีบิลที่พักไว้' : 'No held bills'}
                      </div>
                    ) : (
                      heldBills.map(bill => (
                        <div key={bill.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:border-[#D9ED5F] transition-all group">
                          <div>
                            <p className="font-black text-[#1A1F3D]">{bill.customerName}</p>
                            <p className="text-xs text-gray-400 font-bold">{format(new Date(bill.timestamp), 'HH:mm')} • {bill.items.length} items</p>
                          </div>
                          <button 
                            onClick={() => handleLoadHeldBill(bill)}
                            className="bg-gray-50 text-[#1A1F3D] px-4 py-2 rounded-xl text-xs font-black group-hover:bg-[#1A1F3D] group-hover:text-[#D9ED5F] transition-all"
                          >
                            {language === 'th' ? 'เลือกชำระ' : 'Checkout'}
                          </button>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="queue" className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {todayQueue.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 font-bold">
                        {language === 'th' ? 'ไม่มีคิวที่รอชำระเงิน' : 'No pending queue'}
                      </div>
                    ) : (
                      todayQueue.map(item => (
                        <div key={item.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:border-[#D9ED5F] transition-all group">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.petName} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                              <p className="font-black text-[#1A1F3D]">{item.petName}</p>
                              <p className="text-xs text-gray-400 font-bold">{item.ownerName} • {item.serviceName}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleQuickSelectFromQueue(item)}
                            className="bg-gray-50 text-[#1A1F3D] px-4 py-2 rounded-xl text-xs font-black group-hover:bg-[#1A1F3D] group-hover:text-[#D9ED5F] transition-all"
                          >
                            {language === 'th' ? 'เลือกชำระ' : 'Checkout'}
                          </button>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>

            <Sheet open={isTransactionHistoryOpen} onOpenChange={(open) => {
              setIsTransactionHistoryOpen(open);
              if (!open) setSelectedTransaction(null);
            }}>
              <SheetContent 
                className="w-[95vw] sm:max-w-[700px] border-l-0 rounded-l-[40px] p-8 shadow-2xl flex flex-col"
                onInteractOutside={(e) => {
                  if (isVoidModalOpen || viewingReceiptTx) {
                    e.preventDefault();
                  }
                }}
              >
                {selectedTransaction ? (
                  <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <button 
                        onClick={() => setSelectedTransaction(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ArrowRight size={20} className="rotate-180 text-gray-500" />
                      </button>
                      <div>
                        <h2 className="text-2xl font-black text-[#1A1F3D] mb-1">{language === 'th' ? 'รายละเอียดรายการขาย' : 'Transaction Details'}</h2>
                        <p className="text-gray-400 text-sm font-bold">
                          {format(new Date(selectedTransaction.createdAt || new Date()), 'HH:mm')} • {selectedTransaction.customerName}
                          {selectedTransaction.items?.some((i: any) => i.petName) && ` | ${Array.from(new Set(selectedTransaction.items.filter((i: any) => i.petName).map((i: any) => i.petName))).join(', ')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                      <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-bold">{language === 'th' ? 'เลขที่ใบเสร็จ' : 'Receipt No.'}</span>
                          <button 
                            onClick={() => setViewingReceiptTx(selectedTransaction)}
                            className="font-black text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors cursor-pointer text-right"
                          >
                            {selectedTransaction.details?.receiptNo || selectedTransaction.id}
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-bold">{language === 'th' ? 'ช่องทางการชำระ' : 'Payment Method'}</span>
                          <span className="font-black text-[#1A1F3D]">{selectedTransaction.paymentMethod}</span>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-3 mt-1 space-y-2">
                          {(selectedTransaction.subtotal !== undefined && selectedTransaction.subtotal !== selectedTransaction.amount) && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-bold">{language === 'th' ? 'ยอดก่อนหักส่วนลด' : 'Subtotal'}</span>
                              <span className="font-bold text-gray-700">{currency} {selectedTransaction.subtotal.toLocaleString()}</span>
                            </div>
                          )}
                          {(selectedTransaction.discountAmount > 0) && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-red-500 font-bold">{language === 'th' ? 'ส่วนลด' : 'Discount'}</span>
                              <span className="font-bold text-red-500">-{currency} {selectedTransaction.discountAmount.toLocaleString()}</span>
                            </div>
                          )}
                          {(selectedTransaction.vatAmount > 0) && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-bold">VAT ({selectedTransaction.vatRate}%)</span>
                              <span className="font-bold text-gray-700">{currency} {selectedTransaction.vatAmount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm pt-1">
                            <span className="text-[#1A1F3D] font-black">{language === 'th' ? 'ยอดรวมสุทธิ' : 'Total Amount'}</span>
                            <span className="font-black text-[#1A1F3D] text-lg">{currency} {selectedTransaction.amount.toLocaleString()}</span>
                          </div>
                        </div>

                        {selectedTransaction.note && (
                          <div className="mt-3 text-sm font-medium w-full text-left bg-yellow-50 p-3 rounded-xl border border-yellow-100/50 flex flex-col gap-1">
                            <span className="font-bold text-yellow-700">{language === 'th' ? 'หมายเหตุ:' : 'Note:'}</span>
                            <span className="text-yellow-800 whitespace-pre-wrap">{selectedTransaction.note}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-black text-[#1A1F3D] mt-6 mb-3">{language === 'th' ? 'รายการสินค้า/บริการ' : 'Items'}</h3>
                      <div className="space-y-3">
                        {selectedTransaction.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                            <div>
                              <p className="font-bold text-[#1A1F3D] text-sm">{item.title || item.name}</p>
                              <p className="text-xs text-gray-400">{item.quantity} x {currency} {item.price.toLocaleString()}</p>
                            </div>
                            <p className="font-black text-[#1A1F3D]">{currency} {(item.quantity * item.price).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                        {selectedTransaction.status === 'voided' ? (
                          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex flex-col gap-1">
                            <span>{language === 'th' ? 'รายการนี้ถูกยกเลิกแล้ว' : 'This transaction was voided'}</span>
                            <span className="text-xs opacity-80">
                              {language === 'th' ? 'เหตุผล' : 'Reason'}: {selectedTransaction.voidReason}
                            </span>
                            <span className="text-xs opacity-80">
                              {language === 'th' ? 'โดย' : 'By'}: {selectedTransaction.voidedBy} ({format(new Date(selectedTransaction.voidedAt), 'dd/MM/yyyy HH:mm')})
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setVoidReasonInput('');
                              setIsVoidModalOpen(true);
                            }}
                            className="bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            {language === 'th' ? 'ยกเลิกบิล (Void Bill)' : 'Void Bill'}
                          </button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isVoidModalOpen && selectedTransaction && (
                        <div 
                          className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-l-[40px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border border-gray-100 rounded-3xl p-6 w-full max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <h3 className="text-xl font-black text-[#1A1F3D] mb-4">
                              {language === 'th' ? 'เหตุผลในการยกเลิกบิล' : 'Void Reason'}
                            </h3>
                            <input
                              type="text"
                              autoFocus
                              placeholder={language === 'th' ? 'กรุณาระบุเหตุผล...' : 'Enter reason...'}
                              value={voidReasonInput}
                              onChange={(e) => setVoidReasonInput(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl mb-6 font-medium focus:outline-none focus:ring-2 focus:ring-[#1A1F3D]"
                            />
                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsVoidModalOpen(false);
                                }}
                                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                              >
                                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!selectedTransaction) return;
                                  if (!voidReasonInput.trim()) {
                                    toast.error(language === 'th' ? 'กรุณาระบุเหตุผล' : 'Reason is required');
                                    return;
                                  }
                                  try {
                                    await voidTransaction(selectedTransaction.id, voidReasonInput);
                                    toast.success(language === 'th' ? 'ยกเลิกบิลสำเร็จและปรับปรุงสต๊อกแล้ว' : 'Bill voided and inventory restored');
                                    const currentUser = useStore.getState().currentUser?.name || 'Admin';
                                    setSelectedTransaction({ 
                                      ...selectedTransaction, 
                                      status: 'voided', 
                                      voidReason: voidReasonInput,
                                      voidedBy: currentUser,
                                      voidedAt: new Date().toISOString()
                                    });
                                    setIsVoidModalOpen(false);
                                  } catch (err: any) {
                                    toast.error(err.message);
                                  }
                                }}
                                className="px-6 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                              >
                                {language === 'th' ? 'ยืนยัน' : 'Confirm'}
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                  </div>
                ) : (
                  <>
                    <div className="mb-6 space-y-4">
                      <div>
                        <h2 className="text-2xl font-black text-[#1A1F3D] mb-1">{language === 'th' ? 'ประวัติการขาย' : "Sales History"}</h2>
                        <p className="text-gray-400 text-sm font-bold">{language === 'th' ? 'รายการชำระเงินทั้งหมด' : 'All transactions'}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="text"
                            placeholder={language === 'th' ? 'ค้นหาชื่อ, เลขที่...' : 'Search name, ref...'}
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D] outline-none"
                          />
                        </div>
                        <select 
                          value={historyDateFilter}
                          onChange={(e) => setHistoryDateFilter(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D] outline-none"
                        >
                          <option value="today">{language === 'th' ? 'วันนี้' : 'Today'}</option>
                          <option value="all">{language === 'th' ? 'ทั้งหมด' : 'All Dates'}</option>
                        </select>
                        <select 
                          value={historyStatusFilter}
                          onChange={(e) => setHistoryStatusFilter(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D] outline-none"
                        >
                          <option value="all">{language === 'th' ? 'ทุกสถานะ' : 'All Status'}</option>
                          <option value="completed">{language === 'th' ? 'สำเร็จ' : 'Completed'}</option>
                          <option value="voided">{language === 'th' ? 'ยกเลิก' : 'Voided'}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                      {historyTransactions.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 font-bold">
                          {language === 'th' ? 'ไม่มีรายการขาย' : 'No transactions'}
                        </div>
                      ) : (
                        historyTransactions.map(tx => (
                          <div 
                            key={tx.id} 
                            onClick={() => setSelectedTransaction(tx)}
                            className="bg-white border border-gray-100 p-4 rounded-2xl flex flex-col hover:border-[#D9ED5F] transition-all cursor-pointer group gap-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-black text-[#1A1F3D] group-hover:text-[#1A1F3D]">
                                  {tx.customerName}
                                  {tx.items?.some((i: any) => i.petName) && (
                                    <span className="ml-2">
                                      | {Array.from(new Set(tx.items.filter((i: any) => i.petName).map((i: any) => i.petName))).join(', ')}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 font-bold">
                                  {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')} • {tx.paymentMethod}
                                </p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                {tx.status === 'voided' && (
                                  <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Voided
                                  </span>
                                )}
                                <p className={cn("font-black text-[#1A1F3D]", tx.status === 'voided' && "line-through opacity-50")}>
                                  {currency} {tx.amount.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold">{tx.items?.length || 0} items</p>
                              </div>
                            </div>
                            {tx.items && tx.items.length > 0 && (
                              <div className="text-xs text-gray-500 font-medium truncate w-full text-left bg-gray-50 p-2 rounded-xl border border-gray-100/50">
                                {tx.items.map((item: any) => item.title || item.name).join(', ')}
                              </div>
                            )}
                            {tx.note && (
                              <div className="text-xs text-gray-500 font-medium w-full text-left bg-yellow-50 p-2 rounded-xl border border-yellow-100/50 flex gap-2">
                                <span className="font-bold text-yellow-700 whitespace-nowrap">{language === 'th' ? 'หมายเหตุ:' : 'Note:'}</span>
                                <span className="text-yellow-800 line-clamp-2">{tx.note}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>

            <button 
              onClick={() => setIsTransactionHistoryOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-white border border-gray-100 text-[#1A1F3D] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
            >
              <History size={16} />
              {language === 'th' ? 'ประวัติการขาย' : 'Sales History'}
            </button>
            <button 
              onClick={() => setIsPackagesCreditsModalOpen(true)}
              className="hidden xl:flex items-center gap-2 bg-white border border-gray-100 text-[#1A1F3D] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
            >
              <Package size={16} />
              {language === 'th' ? 'จัดการแพ็กเกจและเครดิต' : 'Manage Package Bundles & Credits'}
            </button>
            <button 
              onClick={() => setIsManageServicesOpen(true)}
              className="flex items-center gap-2 bg-white border border-gray-100 text-[#1A1F3D] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
            >
              <Scissors size={16} />
              {language === 'th' ? 'จัดการบริการ' : 'Manage Services'}
            </button>
            <button 
              onClick={handleQuickSale}
              className="flex items-center gap-2 bg-[#1A1F3D] text-[#D9ED5F] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
            >
              <Zap size={16} />
              {language === 'th' ? 'ขายด่วน (Quick Sale)' : 'Quick Sale'}
            </button>
            <button 
              onClick={() => setIsCustomerModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
            >
              <UserPlus size={16} />
              {t.newCustomer}
            </button>
          </div>
        </header>

        <div className="px-6 lg:px-10 space-y-6 shrink-0 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <CustomerSearch />
            
            {selectedOwner && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-[#1A1F3D] text-white pl-4 pr-2 py-2 rounded-full shadow-xl shadow-[#1A1F3D]/10 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2">
                    <Home size={14} className="text-[#D9ED5F]" />
                    <span className="text-[11px] font-black uppercase tracking-tight">{selectedOwner.name}</span>
                  </div>
                  <button 
                    onClick={() => selectOwner(null)}
                    className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* ตัวเลือกสัตว์เลี้ยงสำหรับลูกค้าที่เลือกอยู่ */}
                {selectedOwner.pets.length > 0 && (
                  <div className="flex gap-1.5 bg-white p-1 rounded-full border border-gray-100 shadow-sm animate-in fade-in duration-300">
                    {selectedOwner.pets.map(pet => (
                      <button
                        key={pet.id}
                        onClick={() => activePet?.id === pet.id ? setActivePet(null) : setActivePet(pet)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-1.5",
                          activePet?.id === pet.id 
                            ? "bg-[#1A1F3D] text-white shadow-sm" 
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {pet.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {todayQueue.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Today's Appointments ({todayQueue.length})</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {todayQueue.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 bg-white border px-4 py-3 rounded-[24px] shrink-0 transition-all group relative",
                      activePet?.id === item.petId ? "border-[#1A1F3D] ring-2 ring-[#1A1F3D]/5" : "border-gray-100",
                      item.status === 'Waiting' ? "border-orange-100" : "border-green-100"
                    )}
                  >
                    <button onClick={() => handleQuickSelectFromQueue(item)} className="flex items-center gap-3 text-left">
                      <img src={item.image} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                      <div className="pr-10">
                        <p className="text-xs font-black text-[#1A1F3D]">{item.petName}</p>
                        <div className="flex items-center gap-1.5">
                           <Clock size={8} className="text-gray-300" />
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.time}</p>
                        </div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setIntakeItem(item)}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                        item.status === 'Waiting' ? "bg-orange-50 text-white shadow-lg shadow-orange-500/20" : "bg-gray-50 text-gray-300"
                      )}
                    >
                      <ClipboardList size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-2">
            <Tabs value={posTab} onValueChange={setPosTab} className="w-full sm:w-auto">
              <TabsList className="bg-[#F5F6FA] p-1.5 rounded-full flex gap-1 h-auto overflow-x-auto scrollbar-hide items-center">
                <TabsTrigger 
                  value="services" 
                  className={cn(
                    "flex-1 sm:px-6 py-3 rounded-full text-[11px] font-black uppercase transition-all duration-300 whitespace-nowrap flex items-center justify-center outline-none",
                    posTab === 'services' ? "!bg-[#1A1F3D] !text-[#D9ED5F] shadow-md scale-105" : "text-gray-500 hover:text-[#1A1F3D]"
                  )}
                >
                  <Scissors size={16} className="mr-2" /> {language === 'th' ? 'บริการ' : 'Services'}
                </TabsTrigger>
                <TabsTrigger 
                  value="addons" 
                  className={cn(
                    "flex-1 sm:px-6 py-3 rounded-full text-[11px] font-black uppercase transition-all duration-300 whitespace-nowrap flex items-center justify-center outline-none",
                    posTab === 'addons' ? "!bg-[#1A1F3D] !text-[#D9ED5F] shadow-md scale-105" : "text-gray-500 hover:text-[#1A1F3D]"
                  )}
                >
                  <Zap size={16} className="mr-2" /> {language === 'th' ? 'บริการเสริม' : 'Add-ons'}
                </TabsTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <TabsTrigger 
                      value="products" 
                      className={cn(
                        "flex-1 sm:px-6 py-3 rounded-full text-[11px] font-black uppercase transition-all duration-300 whitespace-nowrap flex items-center justify-center outline-none cursor-pointer",
                        posTab === 'products' ? "!bg-[#1A1F3D] !text-[#D9ED5F] shadow-md scale-105" : "text-gray-500 hover:text-[#1A1F3D]"
                      )}
                    >
                      <Package size={16} className="mr-2" /> 
                      {productCategory === 'All' ? (language === 'th' ? 'สินค้า' : 'Products') : productCategory}
                    </TabsTrigger>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-white border-gray-100 rounded-2xl shadow-xl z-50 p-2">
                    {productCategories.map(cat => (
                      <DropdownMenuItem 
                        key={cat} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductCategory(cat);
                          setPosTab('products');
                        }}
                        className="text-xs font-bold rounded-xl focus:bg-gray-50 focus:text-[#1A1F3D] cursor-pointer py-2 px-3 transition-colors"
                      >
                        {cat === 'All' ? (language === 'th' ? 'สินค้าทั้งหมด' : 'All Products') : cat}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <TabsTrigger 
                  value="packages" 
                  className={cn(
                    "flex-1 sm:px-6 py-3 rounded-full text-[11px] font-black uppercase transition-all duration-300 whitespace-nowrap flex items-center justify-center outline-none",
                    posTab === 'packages' ? "!bg-[#1A1F3D] !text-[#D9ED5F] shadow-md scale-105" : "text-gray-500 hover:text-[#1A1F3D]"
                  )}
                >
                  <Package size={16} className="mr-2" /> {language === 'th' ? 'แพ็กเกจ' : 'Packages'}
                </TabsTrigger>
                <TabsTrigger 
                  value="credits" 
                  className={cn(
                    "flex-1 sm:px-6 py-3 rounded-full text-[11px] font-black uppercase transition-all duration-300 whitespace-nowrap flex items-center justify-center outline-none",
                    posTab === 'credits' ? "!bg-[#1A1F3D] !text-[#D9ED5F] shadow-md scale-105" : "text-gray-500 hover:text-[#1A1F3D]"
                  )}
                >
                  <Wallet size={16} className="mr-2" /> {language === 'th' ? 'เครดิต' : 'Credits'}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {posTab === 'services' && (
               <div className="flex gap-4 animate-in zoom-in-95">
                 {/* Species Filter */}
                 <div className="bg-white p-1.5 rounded-full border border-gray-100 flex gap-1 shadow-sm h-full">
                   <button onClick={() => setSpeciesFilter('Dog')} className={cn("px-5 py-2 rounded-full text-[11px] font-black uppercase flex items-center gap-2 transition-all duration-300", speciesFilter === 'Dog' ? "bg-[#1A1F3D] text-[#D9ED5F] shadow-md scale-105" : "text-gray-400 hover:text-[#1A1F3D]")}><Dog size={16} /> {language === 'th' ? 'สุนัข' : 'DOG'}</button>
                   <button onClick={() => setSpeciesFilter('Cat')} className={cn("px-5 py-2 rounded-full text-[11px] font-black uppercase flex items-center gap-2 transition-all duration-300", speciesFilter === 'Cat' ? "bg-[#1A1F3D] text-[#D9ED5F] shadow-md scale-105" : "text-gray-400 hover:text-[#1A1F3D]")}><Cat size={16} /> {language === 'th' ? 'แมว' : 'CAT'}</button>
                 </div>

                 {/* Coat Filter */}
                 <div className="bg-white p-1.5 rounded-full border border-gray-100 flex gap-1 shadow-sm h-full">
                   <button onClick={() => setCoatFilter('Short')} className={cn("px-5 py-2 rounded-full text-[11px] font-black uppercase transition-all duration-300", coatFilter === 'Short' ? "bg-[#1A1F3D] text-[#D9ED5F] shadow-md scale-105" : "text-gray-400 hover:text-[#1A1F3D]")}>{language === 'th' ? 'ขนสั้น' : 'SHORT COAT'}</button>
                   <button onClick={() => setCoatFilter('Long')} className={cn("px-5 py-2 rounded-full text-[11px] font-black uppercase transition-all duration-300", coatFilter === 'Long' ? "bg-[#1A1F3D] text-[#D9ED5F] shadow-md scale-105" : "text-gray-400 hover:text-[#1A1F3D]")}>{language === 'th' ? 'ขนยาว' : 'LONG COAT'}</button>
                 </div>
               </div>
            )}

            {posTab === 'products' && (
              <div className="flex items-center gap-2 animate-in zoom-in-95 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={e => setProductQuery(e.target.value)}
                  />
                </div>
                <div className="bg-[#F5F6FA] p-1 rounded-xl flex items-center shrink-0">
                  <button 
                    onClick={() => setProductViewMode('grid')}
                    className={cn("p-1.5 rounded-lg transition-all", productViewMode === 'grid' ? "bg-white shadow-sm text-[#1A1F3D]" : "text-gray-400 hover:text-[#1A1F3D]")}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button 
                    onClick={() => setProductViewMode('list')}
                    className={cn("p-1.5 rounded-lg transition-all", productViewMode === 'list' ? "bg-white shadow-sm text-[#1A1F3D]" : "text-gray-400 hover:text-[#1A1F3D]")}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-24 lg:pb-10 scrollbar-hide">
          <Tabs value={posTab} className="h-full">
            <TabsContent value="services" className="m-0 h-full">
              {filteredServices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <ShoppingBag size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่พบบริการ' : 'No services found'}</h2>
                  <p className="text-xs font-bold uppercase">For {speciesFilter} - {coatFilter} category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="addons" className="m-0 h-full">
               {addons.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <Zap size={48} className="mb-4" />
                    <h2 className="text-xl font-black">No Add-ons Configured</h2>
                    <p className="text-xs font-bold uppercase">Go to Settings to add global add-ons</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                    {addons.map(addon => {
                      const Icon = getIcon(addon.icon);
                      return (
                        <button
                          key={addon.id}
                          onClick={() => setSelectedAddOn({ ...addon, defaultPrice: addon.price, icon: Icon })}
                          className="bg-white rounded-[40px] p-8 border border-transparent hover:border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group"
                        >
                          <div className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:scale-110 bg-blue-50")}>
                            <Icon className={cn("w-10 h-10 text-blue-600")} />
                          </div>
                          <h3 className="text-xl font-black text-[#1A1F3D] mb-1">{addon.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Service Add-on</p>
                          <div className="mt-auto w-full pt-6 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-300 uppercase">Default</span>
                            <span className="text-lg font-black text-[#1A1F3D]">฿{addon.price}</span>
                          </div>
                        </button>
                      );
                    })}
                 </div>
               )}
            </TabsContent>

            <TabsContent value="products" className="m-0 h-full">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Package size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่พบสินค้า' : 'No products found'}</h2>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={productViewMode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className={cn(
                      "w-full",
                      productViewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6" 
                        : "flex flex-col gap-3"
                    )}
                  >
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} viewMode={productViewMode} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="packages" className="m-0 h-full">
              {packageTemplates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Package size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่มีแพ็กเกจบริการ' : 'No packages found'}</h2>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {packageTemplates.map((pkg) => {
                    const targetService = services.find(s => s.id === pkg.serviceId);
                    return (
                      <div key={pkg.id} className="bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                            <Package className="w-7 h-7" />
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Price</p>
                            <p className="text-3xl font-black text-[#1A1F3D]">{currency}{pkg.price.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="mb-8 flex-1">
                          <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{pkg.name}</h3>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {targetService?.title || 'บริการทั่วไป'} • จำนวน {pkg.paidSlots + pkg.freeSlots} ครั้ง (จ่าย {pkg.paidSlots} แถม {pkg.freeSlots})
                          </p>
                          {pkg.bonusType && pkg.bonusType !== 'none' && (
                            <p className="text-[10px] text-indigo-600 font-black uppercase mt-2 flex items-center gap-1">
                              <Sparkles size={12} /> 
                              {pkg.bonusType === 'recurring' ? `แถมฟรี: ${pkg.bonusName} (ทุกครั้ง)` : `แถมฟรี: ${pkg.bonusName} (${pkg.bonusCount} ครั้ง)`}
                            </p>
                          )}
                        </div>

                          <button 
                            onClick={() => {
                              if (!selectedOwner || selectedOwner.id === 'walk-in') {
                                toast.error(language === 'th' ? "กรุณาเลือกลูกค้าสมาชิกก่อนซื้อแพ็กเกจ" : "Please select a registered customer first");
                                return;
                              }
                              addToCart({
                                id: `package-${pkg.id}`,
                                title: pkg.name,
                                price: pkg.price,
                                quantity: 1,
                                ownerName: selectedOwner.name,
                                type: 'Package'
                              });
                              toast.success(`Added ${pkg.name} to cart`);
                            }}
                          className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10"
                        >
                          <Plus size={20} /> {language === 'th' ? 'เพิ่มลงตะกร้า' : 'Add to Cart'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="credits" className="m-0 h-full">
              {creditPackages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Wallet size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่มีแพ็กเกจเครดิต' : 'No credit packages found'}</h2>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {creditPackages.map((pkg) => (
                    <div key={pkg.id} className="bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-amber-50 rounded-[20px] flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                          <Wallet className="w-7 h-7" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Price</p>
                          <p className="text-3xl font-black text-[#1A1F3D]">{currency}{pkg.price.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mb-8 flex-1">
                        <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{pkg.name}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          เติมเงิน {currency}{pkg.price.toLocaleString()} ได้รับเครดิตมูลค่า {currency}{pkg.creditValue.toLocaleString()}
                        </p>
                      </div>

                      <button 
                        onClick={() => {
                          if (!selectedOwner || selectedOwner.id === 'walk-in') {
                            toast.error(language === 'th' ? "กรุณาเลือกลูกค้าสมาชิกก่อนซื้อเครดิต" : "Please select a registered customer first");
                            return;
                          }
                          addToCart({
                            id: `credit-${pkg.id}`,
                            title: pkg.name,
                            price: pkg.price,
                            quantity: 1,
                            ownerName: selectedOwner.name,
                            type: 'Credit',
                            creditValue: pkg.creditValue
                          });
                          toast.success(`Added ${pkg.name} to cart`);
                        }}
                        className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10"
                      >
                        <Plus size={20} /> {language === 'th' ? 'เพิ่มลงตะกร้า' : 'Add to Cart'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <div className="hidden lg:block">
        <OrderSummary onOpenSavedBills={() => setIsSavedBillsSheetOpen(true)} />
      </div>

      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <button className="bg-[#1A1F3D] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-500">
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-2 -right-2 bg-[#D9ED5F] text-[#1A1F3D] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase opacity-60 leading-none mb-0.5">{language === 'th' ? 'ดูตะกร้า' : 'View Cart'}</p>
                  <p className="text-sm font-black">฿{cartTotal.toLocaleString()}</p>
                </div>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-full sm:max-w-md border-none">
              <OrderSummary isMobile onOpenSavedBills={() => setIsSavedBillsSheetOpen(true)} />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {isCustomerModalOpen && (
        <CustomerModal onClose={() => setIsCustomerModalOpen(false)} />
      )}

      {isManageServicesOpen && (
        <ManageServicesModal onClose={() => setIsManageServicesOpen(false)} />
      )}
      <PackagesAndCreditsModal isOpen={isPackagesCreditsModalOpen} onClose={() => setIsPackagesCreditsModalOpen(false)} />

      {intakeItem && (
        <GroomingServiceModal item={intakeItem} onClose={() => setIntakeItem(null)} />
      )}

      {selectedAddOn && (
        <AddOnModal addOn={selectedAddOn} onClose={() => setSelectedAddOn(null)} />
      )}

      {viewingReceiptTx && (
        <ReceiptPreview 
          shopName={shopName}
          shopLogo={shopLogo}
          shopAddress={shopAddress}
          shopPhone={shopPhone}
          header={receiptHeader}
          footer={receiptFooter}
          paperSize={receiptPaperSize}
          transaction={viewingReceiptTx}
          onClose={() => setViewingReceiptTx(null)}
        />
      )}
    </div>
  );
};

export default Index;