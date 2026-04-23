"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, Mail, Phone, Plus, User, Edit3 } from 'lucide-react';
import { useStore, Customer, Pet } from '@/store/useStore';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';
import PetProfileRecord from '@/components/PetProfileRecord';

const Customers = () => {
  const { customers, currency } = useStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

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
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {/* Customer List Sidebar */}
        <div className="w-80 flex flex-col border-r border-gray-100 bg-white shrink-0">
          <div className="p-6">
            <h1 className="text-2xl font-black mb-6">CRM</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F6FA] pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-[#1A1F3D]/5" 
                placeholder="Search clients..." 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
            {filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomerId(customer.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl mb-2 transition-all flex items-center justify-between group",
                  selectedCustomerId === customer.id ? "bg-[#1A1F3D] text-white shadow-lg" : "hover:bg-gray-50"
                )}
              >
                <div>
                  <p className="font-bold text-sm">{customer.name}</p>
                  <p className={cn("text-[10px]", selectedCustomerId === customer.id ? "text-white/60" : "text-gray-400")}>
                    {customer.pets.length} Pets • {customer.membership}
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
              <Plus size={18} /> Add Client
            </button>
          </div>
        </div>

        {/* Customer Detail View */}
        <div className="flex-1 overflow-y-auto bg-[#F8F9FD] scrollbar-hide">
          {selectedCustomer ? (
            <div className="p-10 max-w-5xl mx-auto">
              {/* Profile Card */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mb-10 flex justify-between items-start group">
                <div className="flex gap-6">
                  <div className="w-20 h-20 bg-[#1A1F3D] rounded-[24px] flex items-center justify-center text-2xl font-black text-white">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-3xl font-black">{selectedCustomer.name}</h2>
                      <button 
                        onClick={() => handleEditCustomer(selectedCustomer)}
                        className="p-2 text-gray-300 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-lg transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Phone size={14}/> {selectedCustomer.phone}</span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Mail size={14}/> {selectedCustomer.email}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest block mb-2">
                    {selectedCustomer.membership} MEMBER
                  </span>
                  <p className="text-[10px] text-gray-400 font-black uppercase">Spent: <span className="text-[#1A1F3D]">{currency}{selectedCustomer.totalSpent.toFixed(2)}</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-[#1A1F3D]">Pet Registry</h3>
                <button 
                  onClick={handleAddPet}
                  className="bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-[#D9ED5F]/20 transition-all hover:scale-105"
                >
                  <Plus size={16} /> Register Pet
                </button>
              </div>

              {/* Pets List - Using the new PetProfileRecord component */}
              <div className="space-y-8 pb-10">
                {selectedCustomer.pets.map(pet => (
                  <PetProfileRecord 
                    key={pet.id} 
                    pet={pet} 
                    onEdit={handleEditPet} 
                  />
                ))}
                
                {selectedCustomer.pets.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Plus size={32} className="text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-bold">No pets registered for this household</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <User size={64} className="mb-4" />
              <p className="font-black text-xl">Select a client profile</p>
            </div>
          )}
        </div>
      </main>

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
    </div>
  );
};

export default Customers;