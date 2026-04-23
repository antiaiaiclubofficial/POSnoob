"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Edit3, Trash2, Dog, Cat, Scissors, Search, 
  Bath, Sparkles
} from 'lucide-react';
import { useStore, Service } from '@/store/useStore';
import ServiceModal from '@/components/ServiceModal';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

const Services = () => {
  const { services, deleteService, toggleServiceActive, currency } = useStore();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');

  const filteredServices = services.filter(s => s.targetSpecies === speciesTab);

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const getIcon = (iconName: string, species: string) => {
    const isDog = species === 'Dog';
    switch(iconName) {
      case 'grooming': return <Scissors className={isDog ? "text-blue-600" : "text-pink-600"} size={24} />;
      case 'bath': return <Bath className={isDog ? "text-blue-600" : "text-pink-600"} size={24} />;
      case 'spa': return <Sparkles className={isDog ? "text-blue-600" : "text-pink-600"} size={24} />;
      default: return <Scissors className={isDog ? "text-blue-600" : "text-pink-600"} size={24} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FD] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-12 py-10 shrink-0 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-[#1A1F3D] mb-2">Service Catalog</h1>
            <p className="text-sm text-gray-500 max-w-lg">
              Manage your professional grooming services, tiered pricing models, and availability for dog and cat clients.
            </p>
          </div>
          
          <div className="bg-[#E9EBF1] p-1.5 rounded-full flex gap-1 shadow-inner">
            <button 
              onClick={() => setSpeciesTab('Dog')}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black flex items-center gap-2 transition-all",
                speciesTab === 'Dog' ? "bg-white text-[#1A1F3D] shadow-md" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Dog size={16} /> Dog Services
            </button>
            <button 
              onClick={() => setSpeciesTab('Cat')}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black flex items-center gap-2 transition-all",
                speciesTab === 'Cat' ? "bg-white text-[#1A1F3D] shadow-md" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Cat size={16} /> Cat Services
            </button>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto px-12 pb-12 scrollbar-hide">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {filteredServices.map((service) => (
              <div 
                key={service.id} 
                className={cn(
                  "bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-xl",
                  !service.isActive && "opacity-60 grayscale-[0.5]"
                )}
              >
                {/* Card Header */}
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
                        {service.isPopular && (
                          <span className="bg-[#D9ED5F] text-[#1A1F3D] text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">Popular</span>
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
                      onClick={() => deleteService(service.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Pricing Table */}
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

            {/* Add New Service Card */}
            <button 
              onClick={handleAdd}
              className="bg-transparent border-2 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center py-20 group hover:bg-white hover:border-[#1A1F3D]/20 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-gray-400" />
              </div>
              <h4 className="text-lg font-black text-[#1A1F3D] mb-1">Add New Service</h4>
              <p className="text-xs text-gray-400">Configure a new grooming or spa package</p>
            </button>
          </div>
        </div>
      </main>

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