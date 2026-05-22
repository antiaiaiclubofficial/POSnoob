"use client";

import React, { useState } from 'react';
import { 
  Plus, Search, Scissors, Edit3, Trash2, Dog, Cat, 
  ChevronRight, Star, Clock, DollarSign, Activity
} from 'lucide-react';
import { useStore, Service, ServicePriceInfo } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';
import { Switch } from "@/components/ui/switch";
import ServiceModal from '@/components/ServiceModal';

const Services = () => {
  const { services, toggleServiceActive, deleteService, currency, language } = useStore();
  const t = translations[language];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const filteredServices = services.filter(s => 
    s.targetSpecies === speciesTab && 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (s: Service) => {
    setEditingService(s);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-6 lg:px-12 py-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pl-14 lg:pl-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scissors size={16} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.services}</p>
          </div>
          <h1 className="text-4xl font-black text-[#1A1F3D]">{language === 'th' ? 'รายการบริการ' : 'Service Catalog'}</h1>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
        >
          <Plus size={20} /> {t.newService}
        </button>
      </header>

      <div className="px-6 lg:px-12 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1 w-full lg:w-auto">
          <button 
            onClick={() => setSpeciesTab('Dog')}
            className={cn(
              "flex-1 lg:px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
              speciesTab === 'Dog' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Dog size={16} /> {language === 'th' ? 'สุนัข' : 'DOGS'}
          </button>
          <button 
            onClick={() => setSpeciesTab('Cat')}
            className={cn(
              "flex-1 lg:px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
              speciesTab === 'Cat' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Cat size={16} /> {language === 'th' ? 'แมว' : 'CATS'}
          </button>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm"
            placeholder={t.searchServices}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-10 scrollbar-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className={cn(
              "bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group",
              !service.isActive && "opacity-60"
            )}>
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-sm",
                  speciesTab === 'Dog' ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                )}>
                  <Scissors size={28} />
                </div>
                <div className="flex items-center gap-3">
                   <Switch 
                    checked={service.isActive} 
                    onCheckedChange={() => toggleServiceActive(service.id)} 
                    className="data-[state=checked]:bg-[#1A1F3D]"
                   />
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(service)} className="p-2 text-gray-400 hover:text-[#1A1F3D] rounded-xl"><Edit3 size={18}/></button>
                      <button onClick={() => { if(confirm('Delete?')) deleteService(service.id); }} className="p-2 text-gray-400 hover:text-red-500 rounded-xl"><Trash2 size={18}/></button>
                   </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{service.title}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{service.category}</p>
              </div>

              <div className="space-y-4">
                {(Object.entries(service.prices) as [string, ServicePriceInfo][]).map(([size, info]) => (
                  <div key={size} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter w-14">{size}</span>
                       <div className="flex items-center gap-1.5 text-gray-300">
                          <Clock size={12} />
                          <span className="text-[10px] font-bold">{info.duration}m</span>
                       </div>
                    </div>
                    <span className="text-lg font-black text-[#1A1F3D]">{currency}{info.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredServices.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-20">
               <Activity size={64} className="mb-4" />
               <p className="text-xl font-black uppercase tracking-widest">No services found in this category</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ServiceModal 
          service={editingService} 
          defaultSpecies={speciesTab}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Services;