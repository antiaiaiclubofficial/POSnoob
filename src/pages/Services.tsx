"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Edit3, Trash2, Dog, Cat, Scissors, Search, 
  Settings2, PlusCircle, ChevronRight
} from 'lucide-react';
import { useStore, Service } from '@/store/useStore';
import ServiceModal from '@/components/ServiceModal';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Services = () => {
  const { services, deleteService, currency } = useStore();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSpecies, setTargetSpecies] = useState<'Dog' | 'Cat'>('Dog');
  const [query, setQuery] = useState('');

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase()) || 
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setTargetSpecies(service.targetSpecies);
    setIsModalOpen(true);
  };

  const handleAdd = (species: 'Dog' | 'Cat') => {
    setSelectedService(null);
    setTargetSpecies(species);
    setIsModalOpen(true);
  };

  const ServiceGrid = ({ species }: { species: 'Dog' | 'Cat' }) => {
    const speciesServices = filteredServices.filter(s => s.targetSpecies === species);
    const isDog = species === 'Dog';

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className={cn(
              "text-xl font-black uppercase tracking-widest",
              isDog ? "text-blue-700" : "text-pink-700"
            )}>{species} Service Catalog</h2>
            <p className="text-xs text-gray-400 font-medium">Manage specific treatments and pricing for {species}s</p>
          </div>
          <button 
            onClick={() => handleAdd(species)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black text-white transition-all hover:scale-105 active:scale-95 shadow-xl",
              isDog ? "bg-blue-600 shadow-blue-600/20" : "bg-pink-600 shadow-pink-600/20"
            )}
          >
            <Plus size={18} /> ADD NEW {species.toUpperCase()} SERVICE
          </button>
        </div>

        {speciesServices.length === 0 ? (
          <div className="h-80 border-2 border-dashed border-gray-200 rounded-[48px] flex flex-col items-center justify-center text-gray-300 bg-white/50">
            <PlusCircle size={48} className="mb-4 opacity-10" />
            <p className="font-black uppercase tracking-[0.2em]">No {species} services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {speciesServices.map((service) => (
              <div 
                key={service.id} 
                className={cn(
                  "bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-transparent transition-all group relative overflow-hidden",
                  isDog ? "hover:ring-4 hover:ring-blue-50" : "hover:ring-4 hover:ring-pink-50"
                )}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                    isDog ? "bg-blue-600" : "bg-pink-600"
                  )}>
                    {isDog ? <Dog size={24} /> : <Cat size={24} />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleEdit(service)} 
                      className="p-2.5 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteService(service.id)} 
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-black text-[#1A1F3D] text-lg mb-2">{service.title}</h3>
                <p className="text-xs text-gray-400 font-medium mb-6 line-clamp-2">{service.description}</p>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Pricing Structure</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(service.prices).map(([size, price]) => (
                      <div key={size} className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-2xl border text-xs font-black",
                        isDog ? "bg-blue-50/30 border-blue-100 text-blue-700" : "bg-pink-50/30 border-pink-100 text-pink-700"
                      )}>
                        <span className="opacity-40 uppercase tracking-tighter text-[9px]">{size}</span>
                        <span>{currency}{price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8F9FD] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-10 shrink-0 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings2 size={14} className="text-[#D9ED5F]" />
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Service Library</p>
            </div>
            <h1 className="text-4xl font-black text-[#1A1F3D]">Manage Inventory</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text"
              placeholder="Quick search services..."
              className="bg-white border-none pl-16 pr-8 py-5 rounded-[28px] text-sm font-bold w-96 shadow-sm focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-1 px-10 pb-10 overflow-hidden flex flex-col">
          <Tabs defaultValue="Dog" className="flex-1 flex flex-col">
            <TabsList className="bg-white p-2 rounded-[28px] border border-gray-100 shadow-sm w-fit mb-10 h-auto gap-2">
              <TabsTrigger 
                value="Dog" 
                className="rounded-[20px] px-8 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs font-black transition-all flex items-center gap-2"
              >
                <Dog size={18} /> DOG SERVICES
              </TabsTrigger>
              <TabsTrigger 
                value="Cat" 
                className="rounded-[20px] px-8 py-3 data-[state=active]:bg-pink-600 data-[state=active]:text-white text-xs font-black transition-all flex items-center gap-2"
              >
                <Cat size={18} /> CAT SERVICES
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
              <TabsContent value="Dog" className="m-0 focus-visible:outline-none">
                <ServiceGrid species="Dog" />
              </TabsContent>
              <TabsContent value="Cat" className="m-0 focus-visible:outline-none">
                <ServiceGrid species="Cat" />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      {isModalOpen && (
        <ServiceModal 
          service={selectedService} 
          defaultSpecies={targetSpecies}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Services;