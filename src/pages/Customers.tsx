"use client";

import React, { useState } from 'react';
import { Search, Mail, Phone, Plus, User, Edit3, ChevronLeft, MessageSquare, BadgeCheck } from 'lucide-react';
import { useStore, Customer, Pet } from '@/store/useStore';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';
import PetProfileRecord from '@/components/PetProfileRecord';
import LineBindingModal from '@/components/LineBindingModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { translations } from '@/utils/translations';

const Customers = () => {
  const isMobile = useIsMobile();
  const { customers, currency, language } = useStore();
  const t = translations[language];
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (isMobile) setShowDetailOnMobile(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setIsPetModalOpen(true);
  };

  const handleAddPet = () => {
    setEditingPet(null);
    setIsPetModalOpen(true);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Customer List Sidebar */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col border-r border-gray-100 bg-white shrink-0 transition-all duration-300",
        isMobile && showDetailOnMobile ? "-translate-x-full absolute" : "translate-x-0"
      )}>
        <div className="p-6 pt-20 lg:pt-6">
          <h1 className="text-2xl font-black mb-6">{language === 'th' ? 'ลูกค้าสัมพันธ์' : 'CRM'}</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F6FA] pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-[#1A1F3D]/5" 
              placeholder={language === 'th' ? 'ค้นหาลูกค้า...' : 'Search clients...'} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
          {filteredCustomers.map(customer => (
            <button
              key={customer.id}
              onClick={() => handleSelectCustomer(customer.id)}
              className={cn(
                "w-full text-left p-4 rounded-2xl mb-2 transition-all flex items-center justify-between group",
                selectedCustomerId === customer.id ? "bg-[#1A1F3D] text-white shadow-lg" : "hover:bg-gray-50"
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{customer.name}</p>
                  {customer.lineId && <div className="w-2 h-2 bg-green-500 rounded-full" title="LINE Connected" />}
                </div>
                <p className={cn("text-[10px]", selectedCustomerId === customer.id ? "text-white/60" : "text-gray-400")}>
                  {customer.pets.length} {language === 'th' ? 'ตัว' : 'Pets'} • {customer.membership}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-50">
          <button 
            onClick={handleAddCustomer}
            className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {language === 'th' ? 'เพิ่มลูกค้าใหม่' : 'Add Client'}
          </button>
        </div>
      </div>

      {/* Customer Detail View */}
      <div className={cn(
        "flex-1 overflow-y-auto bg-[#F8F9FD] scrollbar-hide transition-all duration-300",
        isMobile && !showDetailOnMobile ? "translate-x-full absolute" : "translate-x-0"
      )}>
        {selectedCustomer ? (
          <div className="p-6 lg:p-10 max-w-5xl mx-auto">
            {isMobile && (
              <button 
                onClick={() => setShowDetailOnMobile(false)}
                className="flex items-center gap-2 text-gray-400 font-bold text-xs mb-6 pt-14"
              >
                <ChevronLeft size={16} /> {language === 'th' ? 'กลับไปยังรายชื่อ' : 'Back to List'}
              </button>
            )}

            <div className="bg-white p-6 lg:p-8 rounded-[32px] shadow-sm border border-gray-100 mb-8 lg:mb-10 flex flex-col sm:flex-row justify-between items-start gap-6 group">
              <div className="flex gap-4 lg:gap-6">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#1A1F3D] rounded-[24px] flex items-center justify-center text-xl lg:text-2xl font-black text-white shrink-0">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl lg:text-3xl font-black">{selectedCustomer.name}</h2>
                    <button 
                      onClick={() => handleEditCustomer(selectedCustomer)}
                      className="p-2 text-gray-300 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-lg transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                    <span className="flex items-center gap-1.5 text-[10px] lg:text-xs text-gray-400 font-bold"><Phone size={14}/> {selectedCustomer.phone}</span>
                    <span className="flex items-center gap-1.5 text-[10px] lg:text-xs text-gray-400 font-bold"><Mail size={14}/> {selectedCustomer.email}</span>
                  </div>

                  {/* LINE Binding Section */}
                  <div className="pt-2">
                    {selectedCustomer.lineId ? (
                      <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100 w-fit">
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.lineConnected}</span>
                        <BadgeCheck size={14} />
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsLineModalOpen(true)}
                        className="flex items-center gap-2 bg-[#F5F6FA] text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-100 border border-transparent px-4 py-2 rounded-xl transition-all w-fit"
                      >
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.connectLine}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
                  {selectedCustomer.membership} MEMBER
                </span>
                <p className="text-[10px] text-gray-400 font-black uppercase">{t.totalSpent}: <span className="text-[#1A1F3D]">{currency}{selectedCustomer.totalSpent.toFixed(2)}</span></p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <h3 className="text-xl lg:text-2xl font-black text-[#1A1F3D]">{t.petRegistry}</h3>
              <button 
                onClick={handleAddPet}
                className="bg-[#D9ED5F] text-[#1A1F3D] px-4 lg:px-5 py-2 lg:2.5 rounded-xl text-[10px] lg:text-xs font-black flex items-center gap-2 shadow-lg shadow-[#D9ED5F]/20 transition-all hover:scale-105"
              >
                <Plus size={16} /> {t.registerPet}
              </button>
            </div>

            <div className="space-y-6 lg:space-y-8 pb-10">
              {selectedCustomer.pets.map(pet => (
                <PetProfileRecord 
                  key={pet.id} 
                  pet={pet} 
                  onEdit={handleEditPet} 
                />
              ))}
              
              {selectedCustomer.pets.length === 0 && (
                <div className="py-16 lg:py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Plus size={24} className="text-gray-200" />
                  </div>
                  <p className="text-xs lg:text-sm text-gray-400 font-bold">{language === 'th' ? 'ไม่มีข้อมูลสัตว์เลี้ยง' : 'No pets registered'}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <User size={64} className="mb-4" />
            <p className="font-black text-xl">{language === 'th' ? 'กรุณาเลือกโปรไฟล์ลูกค้า' : 'Select a client profile'}</p>
          </div>
        )}
      </div>

      {isCustomerModalOpen && (
        <CustomerModal 
          customer={editingCustomer} 
          onClose={() => setIsCustomerModalOpen(false)} 
        />
      )}
      
      {isPetModalOpen && selectedCustomer && (
        <PetModal 
          customerId={selectedCustomer.id} 
          pet={editingPet}
          onClose={() => setIsPetModalOpen(false)} 
        />
      )}

      {isLineModalOpen && selectedCustomer && (
        <LineBindingModal 
          customer={selectedCustomer}
          onClose={() => setIsLineModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Customers;