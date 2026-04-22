"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, Mail, Phone, Plus, Shield, Dog, Cat, Info, User, Edit3, TrendingUp, History } from 'lucide-react';
import { useStore, Customer, Pet } from '@/store/useStore';
import { calculateAge } from '@/utils/petData';
import { cn } from '@/lib/utils';
import CustomerModal from '@/components/CustomerModal';
import PetModal from '@/components/PetModal';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Customers = () => {
  const { customers } = useStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

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
                  "w-full text-left p-4 rounded-2xl mb-2 transition-all flex items-center justify-between",
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
              onClick={() => setIsCustomerModalOpen(true)}
              className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Client
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8F9FD] scrollbar-hide">
          {selectedCustomer ? (
            <div className="p-10 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mb-8 flex justify-between items-start">
                <div className="flex gap-6">
                  <div className="w-20 h-20 bg-[#1A1F3D] rounded-[24px] flex items-center justify-center text-2xl font-black text-white">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black mb-1">{selectedCustomer.name}</h2>
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
                  <p className="text-[10px] text-gray-400 font-black uppercase">Spent: <span className="text-[#1A1F3D]">${selectedCustomer.totalSpent}</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black">Pet Health Hub</h3>
                <button 
                  onClick={handleAddPet}
                  className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Plus size={16} /> Register Pet
                </button>
              </div>

              <div className="space-y-8">
                {selectedCustomer.pets.map(pet => (
                  <div key={pet.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex relative group">
                    <button 
                      onClick={() => handleEditPet(pet)}
                      className="absolute top-6 right-6 p-3 bg-gray-50 text-gray-400 hover:bg-[#1A1F3D] hover:text-white rounded-2xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      title="Edit Profile"
                    >
                      <Edit3 size={18} />
                    </button>

                    <div className="w-1/3 p-8 border-r border-gray-50 bg-[#F8F9FD]/50">
                      <img src={pet.image} className="w-32 h-32 rounded-[28px] object-cover mx-auto mb-4 border-4 border-white shadow-lg" />
                      <div className="text-center">
                        <h4 className="text-xl font-black mb-1">{pet.name}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-4">{pet.breed}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-3 rounded-2xl shadow-sm">
                            <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Age</p>
                            <p className="text-xs font-black">{calculateAge(pet.birthday)}</p>
                          </div>
                          <div className="bg-white p-3 rounded-2xl shadow-sm">
                            <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Weight</p>
                            <p className="text-xs font-black">{pet.weightHistory[pet.weightHistory.length-1]?.value} kg</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-8 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={18} className="text-blue-500" />
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Weight Progression</span>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400">
                          <span className="flex items-center gap-1"><History size={12}/> Last: {pet.weightHistory[pet.weightHistory.length-1]?.date}</span>
                        </div>
                      </div>
                      
                      <div className="h-40 w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={pet.weightHistory}>
                            <XAxis dataKey="date" hide />
                            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 mt-auto">
                        <p className="text-[10px] font-black uppercase text-orange-600 mb-1">Medical Notes</p>
                        <p className="text-xs text-orange-900/70 font-medium leading-relaxed">{pet.notes || 'No special notes recorded.'}</p>
                      </div>
                    </div>
                  </div>
                ))}
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

      {isCustomerModalOpen && <CustomerModal onClose={() => setIsCustomerModalOpen(false)} />}
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