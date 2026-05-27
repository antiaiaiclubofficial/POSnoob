"use client";

import React, { useState } from 'react';
import { 
  Plus, Edit3, Trash2, Dog, Cat, Scissors, Search, Filter,
  Bath, Sparkles, Zap, Wind, Stethoscope, Brush, Home, Heart, Bone, Award
} from 'lucide-react';
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import ServiceModal from '@/components/ServiceModal';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

const Services = () => {
  const { services, deleteService, toggleServiceActive, currency } = useStore();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter States
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');
  const [coatFilter, setCoatFilter] = useState<'All' | 'Short' | 'Long'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic
  const filteredServices = services.filter(s => {
    const matchesSpecies = s.targetSpecies === speciesTab;
    const matchesCoat = coatFilter === 'All' || s.coatType === coatFilter;
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecies && matchesCoat && matchesSearch;
  });

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const getIcon = (iconName: ServiceIcon, species: string) => {
    const isDog = species === 'Dog';
    const colorClass = isDog ? "text-blue-600" : "text-pink-600";
    
    switch(iconName) {
      case 'grooming': return <Scissors className={colorClass} size={24} />;
      case 'bath': return <Bath className={colorClass} size={24} />;
      case 'spa': return <Sparkles className={colorClass} size={24} />;
      case 'nail': return <Zap className={colorClass} size={24} />;
      case 'dry': return <Wind className={colorClass} size={24} />;
      case 'brush': return <Brush className={colorClass} size={24} />;
      case 'health': return <Stethoscope className={colorClass} size={24} />;
      case 'hotel': return <Home className={colorClass} size={24} />;
      case 'love': return <Heart className={colorClass} size={24} />;
      case 'food': return <Bone className={colorClass} size={24} />;
      case 'premium': return <Award className={colorClass} size={24} />;
      default: return isDog ? <Dog className={colorClass} size={24} /> : <Cat className={colorClass} size={24} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      {/* Header */}
      <header className="px-12 py-10 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pl-14 lg:pl-12">
        <div>
          <h1 className="text-4xl font-black text-[#1A1F3D] mb-2">Service Catalog</h1>
          <p className="text-sm text-gray-400 max-w-lg">
            จัดการและตั้งค่าบริการ อาบน้ำ ตัดขน สปา พร้อมกำหนดราคาแยกตามขนาดและประเภทเส้นขน
          </p>
        </div>
        
        <button 
          onClick={handleAdd}
          className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
        >
          <Plus size={20} /> เพิ่มบริการใหม่
        </button>
      </header>

      {/* Filters Toolbar */}
      <div className="px-12 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Species Filter */}
          <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex gap-1">
            <button 
              onClick={() => setSpeciesTab('Dog')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all",
                speciesTab === 'Dog' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Dog size={16} /> สุนัข (Dog)
            </button>
            <button 
              onClick={() => setSpeciesTab('Cat')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all",
                speciesTab === 'Cat' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Cat size={16} /> แมว (Cat)
            </button>
          </div>

          {/* Coat Type Filter */}
          <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex gap-1">
            {(['All', 'Short', 'Long'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setCoatFilter(type)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-black transition-all",
                  coatFilter === type ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {type === 'All' ? 'ทุกประเภทขน' : type === 'Short' ? 'ขนสั้น' : 'ขนยาว'}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm"
            placeholder="ค้นหาบริการ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto px-12 pb-12 scrollbar-hide">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredServices.map((service) => (
            <div 
              key={service.id} 
              className={cn(
                "bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-xl group",
                !service.isActive && "opacity-60 grayscale-[0.5]"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-3xl flex items-center justify-center",
                    service.targetSpecies === 'Dog' ? "bg-blue-50" : "bg-pink-50"
                  )}>
                    {getIcon(service.icon, service.targetSpecies)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-black text-[#1A1F3D]">{service.title}</h3>
                      {service.coatType && (
                        <span className={cn(
                          "text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider",
                          service.coatType === 'Short' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                        )}>
                          {service.coatType === 'Short' ? 'ขนสั้น' : 'ขนยาว'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">{service.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Switch 
                    checked={service.isActive} 
                    onCheckedChange={() => toggleServiceActive(service.id)}
                    className="data-[state=checked]:bg-[#1A1F3D]"
                  />
                  <button 
                    onClick={() => handleEdit(service)}
                    className="p-2 text-gray-400 hover:text-[#1A1F3D] transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("ต้องการลบบริการนี้หรือไม่?")) {
                        deleteService(service.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-auto">
                <div className="bg-[#1A1F3D] rounded-t-2xl px-6 py-2.5 flex justify-between">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Pet Size</span>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Price ({currency})</span>
                </div>
                <div className="bg-[#F8F9FD] rounded-b-2xl border-x border-b border-gray-100 divide-y divide-gray-100">
                  {Object.entries(service.prices).map(([size, info]) => (
                    <div key={size} className="px-6 py-4 flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-600">{size}</span>
                      <span className="text-sm font-black text-[#1A1F3D]">{currency}{info.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredServices.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-20 border-2 border-dashed border-gray-200 rounded-[40px]">
              <Scissors size={48} className="mx-auto mb-4" />
              <p className="font-black text-lg">ไม่พบรายการบริการที่ตรงตามเงื่อนไข</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ServiceModal 
          service={selectedService} 
          defaultSpecies={speciesTab}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Services;