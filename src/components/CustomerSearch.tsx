"use client";

import React, { useState } from 'react';
import { Search, User, ChevronRight } from 'lucide-react';
import { useStore, Customer, Pet } from '@/store/useStore';
import { cn } from '@/lib/utils';

const CustomerSearch = () => {
  const { customers, selectPet, selectedPet } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.phone.includes(query) ||
    c.pets.some(p => p.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search customers, pets or phone..."
          className="w-full bg-white pl-16 pr-6 py-5 rounded-[24px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A1F3D]/10 transition-all font-medium"
        />
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-[24px] shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-gray-400 font-medium">No results found</div>
          ) : (
            filteredCustomers.map(customer => (
              <div key={customer.id} className="border-b border-gray-50 last:border-0">
                <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{customer.name}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    customer.membership === 'Gold' ? "bg-amber-100 text-amber-600" :
                    customer.membership === 'Silver' ? "bg-slate-100 text-slate-600" : "bg-gray-100 text-gray-500"
                  )}>
                    {customer.membership} Member
                  </span>
                </div>
                {customer.pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => {
                      selectPet(pet, customer);
                      setQuery('');
                      setIsOpen(false);
                    }}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <img src={pet.image} alt={pet.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <p className="font-bold text-[#1A1F3D]">{pet.name}</p>
                        <p className="text-xs text-gray-400">{pet.breed} • {pet.species}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;