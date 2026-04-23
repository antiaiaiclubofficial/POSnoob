import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Edit3, Trash2, Dog, Cat, Scissors, Search, 
  Settings2, PlusCircle
} from 'lucide-react';
import { useStore, Service } from '@/store/useStore';
import ServiceModal from '@/components/ServiceModal';
import { cn } from '@/lib/utils';

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

  const ServiceList = ({ type }: { type: 'dog' | 'cat' }) => {
    const species = type === 'dog' ? 'Dog' : 'Cat';
    const speciesServices = filteredServices.filter(s => s.targetSpecies === species);
    const isDog = type === 'dog';

    return (
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Sub-Header for each side */}
        <div className={cn(
          "p-6 flex items-center justify-between border-b transition-colors",
          isDog ? "bg-blue-50/30 border-blue-100" : "bg-pink-50/30 border-pink-100"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg",
              isDog ? "bg-blue-600 shadow-blue-600/20" : "bg-pink-600 shadow-pink-600/20"
            )}>
              {isDog ? <Dog size={20} /> : <Cat size={20} />}
            </div>
            <div>
              <h2 className={cn(
                "text-sm font-black uppercase tracking-widest",
                isDog ? "text-blue-700" : "text-pink-700"
              )}>{species} Services</h2>
              <p className="text-[10px] text-gray-400 font-bold">{speciesServices.length} Items Listed</p>
            </div>
          </div>
          <button 
            onClick={() => handleAdd(species)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-white transition-all hover:scale-105 active:scale-95 shadow-md",
              isDog ? "bg-blue-600" : "bg-pink-600"
            )}
          >
            <Plus size={14} /> ADD NEW
          </button>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
          {speciesServices.map((service) => (
            <div 
              key={service.id} 
              className={cn(
                "p-5 rounded-[28px] border transition-all group relative overflow-hidden",
                isDog ? "bg-white border-gray-100 hover:border-blue-200" : "bg-white border-gray-100 hover:border-pink-200"
              )}
            >
              {/* Highlight strip */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                isDog ? "bg-blue-600/10 group-hover:bg-blue-600" : "bg-pink-600/10 group-hover:bg-pink-600"
              )} />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-[#1A1F3D] text-sm mb-1">{service.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded-md">{service.category}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(service)} 
                    className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => deleteService(service.id)} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(service.prices).map(([size, price]) => (
                  <div key={size} className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold",
                    isDog ? "bg-blue-50/50 border-blue-100/50 text-blue-700" : "bg-pink-50/50 border-pink-100/50 text-pink-700"
                  )}>
                    <span className="opacity-40 uppercase tracking-tighter">{size}</span>
                    <span className="font-black">{currency}{price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {speciesServices.length === 0 && (
            <div className="h-64 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-gray-300">
              <PlusCircle size={32} className="mb-4 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Start adding {species} services</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8F9FD] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-8 shrink-0 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings2 size={14} className="text-[#D9ED5F]" />
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Service Library</p>
            </div>
            <h1 className="text-3xl font-black text-[#1A1F3D]">Manage Inventory</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text"
              placeholder="Quick search services..."
              className="bg-white border-none pl-12 pr-6 py-4 rounded-[24px] text-sm font-bold w-80 shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/5"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </header>

        {/* The Dual-Pane Split Layout */}
        <div className="flex-1 flex gap-8 px-10 pb-10 overflow-hidden">
          {/* Left Column: Dogs */}
          <ServiceList type="dog" />

          {/* Right Column: Cats */}
          <ServiceList type="cat" />
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