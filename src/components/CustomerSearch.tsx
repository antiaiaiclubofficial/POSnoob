"use client";

import React, { useState } from 'react';
import { Search, User, ChevronRight, Home } from 'lucide-react';
import { useStore, Customer } from '@/store/useStore';
import { cn } from '@/lib/utils';

const CustomerSearch = () => {
  const { customers, selectOwner } = useStore();
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
          placeholder="Search customer name, pet name or phone..."
          className="w-full bg-white pl-16 pr-6 py-5 rounded-[24px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A1F3D]/10 transition-all font-medium"
        />
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-[24px] shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-gray-400 font-medium">No results found</div>
          ) : (
            filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => {
                  selectOwner(customer);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center">
                    <Home size={20} className="text-[#1A1F3D]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#1A1F3D]">{customer.name}</p>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                        customer.membership === 'Gold' ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                      )}>
                        {customer.membership}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {customer.pets.map(p => p.name).join(', ')} • {customer.phone}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;