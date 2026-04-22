"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, Mail, Phone, Plus, Shield, Dog, Cat, Info, MapPin, User, Edit3 } from 'lucide-react';
import { useStore, Customer } from '@/store/useStore';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';

const Customers = () => {
  const { customers } = useStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditingCustomer(selectedCustomer);
      setIsCustomerModalOpen(true);
    }
  };

  const handleAddNewClient = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {/* Left List */}
        <div className="w-96 flex flex-col border-r border-gray-100 bg-white">
          <div className="p-8 pb-4">
            <h1 className="text-3xl font-extrabold mb-6">CRM</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F6FA] pl-12 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-[#1A1F3D]/5" 
                placeholder="Find customer..." 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomerId(customer.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl mb-2 transition-all flex items-center justify-between",
                  selectedCustomerId === customer.id ? "bg-[#1A1F3D] text-white shadow-lg" : "hover:bg-gray-50"
                )}
              >
                <div>
                  <p className="font-bold">{customer.name}</p>
                  <p className={cn("text-xs", selectedCustomerId === customer.id ? "text-white/60" : "text-gray-400")}>
                    {customer.pets.length} Pets • {customer.membership}
                  </p>
                </div>
                {customer.membership === 'Gold' && <Shield size={16} className="text-amber-400" />}
              </button>
            ))}
          </div>

          <div className="p-6 border-t border-gray-50">
            <button 
              onClick={handleAddNewClient}
              className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Add New Client
            </button>
          </div>
        </div>

        {/* Right Details */}
        <div className="flex-1 overflow-y-auto bg-[#F8F9FD]">
          {selectedCustomer ? (
            <div className="p-10 max-w-4xl mx-auto">
              {/* Profile Header */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mb-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[#D9ED5F] rounded-[24px] flex items-center justify-center text-2xl font-black text-[#1A1F3D]">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black mb-1">{selectedCustomer.name}</h2>
                        <button 
                          onClick={handleEditCustomer}
                          className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-sm text-gray-400 font-medium">
                          <Phone size={14} /> {selectedCustomer.phone}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-gray-400 font-medium">
                          <Mail size={14} /> {selectedCustomer.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider mb-2",
                      selectedCustomer.membership === 'Gold' ? "bg-amber-100 text-amber-700" : 
                      selectedCustomer.membership === 'Silver' ? "bg-blue-50 text-blue-700" :
                      selectedCustomer.membership === 'VIP' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                    )}>
                      <Shield size={14} /> {selectedCustomer.membership} Membership
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Points: <span className="text-[#1A1F3D]">{selectedCustomer.points} pts</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#F5F6FA] p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Revenue</p>
                    <p className="text-xl font-black">${selectedCustomer.totalSpent}</p>
                  </div>
                  <div className="bg-[#F5F6FA] p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Visits</p>
                    <p className="text-xl font-black">12</p>
                  </div>
                  <div className="bg-[#F5F6FA] p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Last Visit</p>
                    <p className="text-xl font-black text-sm">2 Days Ago</p>
                  </div>
                </div>
              </div>

              {/* Pets Section */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black">Owned Pets ({selectedCustomer.pets.length})</h3>
                <button 
                  onClick={() => setIsPetModalOpen(true)}
                  className="bg-[#1A1F3D] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Plus size={16} /> Register New Pet
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {selectedCustomer.pets.map(pet => (
                  <div key={pet.id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center gap-6 shadow-sm group hover:shadow-md transition-all">
                    <img src={pet.image} alt={pet.name} className="w-24 h-24 rounded-[24px] object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-black">{pet.name}</h4>
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase">
                          {pet.species === 'Dog' ? <Dog size={12} className="inline mr-1" /> : <Cat size={12} className="inline mr-1" />}
                          {pet.breed}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Info size={12} /> Age: <span className="text-[#1A1F3D] font-bold">{pet.age}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Info size={12} /> Weight: <span className="text-[#1A1F3D] font-bold">{pet.weight}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-xl text-[10px] text-orange-700 font-medium">
                        <strong>Note:</strong> {pet.notes}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <User size={64} className="mb-4 opacity-20" />
              <p className="font-bold">Select a customer to view details</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isCustomerModalOpen && (
        <CustomerModal 
          customer={editingCustomer} 
          onClose={() => setIsCustomerModalOpen(false)} 
        />
      )}
      {isPetModalOpen && selectedCustomer && (
        <PetModal 
          customerId={selectedCustomer.id} 
          onClose={() => setIsPetModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Customers;