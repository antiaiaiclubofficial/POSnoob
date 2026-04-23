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
      <div className="flex-1 flex flex-col min-w-0">
        <div className={cn(
          "flex items-center justify-between p-6 mb-4 rounded-[28px] border-b-4",
          isDog ? "bg-blue-50/50 border-blue-500/20" : "bg-pink-50/50 border-pink-500/20"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
              isDog ? "bg-blue-600" : "bg-pink-600"
            )}>
              {isDog ? <Dog size={20} /> : <Cat size={20} />}
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">{species} SERVICES</h2>
              <p className="text-[10px] text-gray-400 font-bold">{speciesServices.length} Items Listed</p>
            </div>
          </div>
          <button 
            onClick={() => handleAdd(species)}
            className={cn(
              "p-2 rounded-xl text-white transition-all hover:scale-110 active:scale-95 shadow-md",
              isDog ? "bg-blue-600" : "bg-pink-600"
            )}
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 scrollbar-hide flex-1">
          {speciesServices.map((service) => (
            <div 
              key={service.id} 
              className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm group hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-current"
              style={{ borderLeftColor: isDog ? '#2563eb' : '#db2777' }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-[#1A1F3D] text-sm mb-1">{service.title}</h3>
                  <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded-md">{service.category}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(service)} className="p-2 text-gray-300 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-lg"><Edit3 size={14} /></button>
                  <button onClick={() => deleteService(service.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(service.prices).map(([size, price]) => (
                  <div key={size} className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold",
                    isDog ? "bg-blue-50/50 border-blue-100 text-blue-700" : "bg-pink-50/50 border-pink-100 text-pink-700"
                  )}>
                    <span className="opacity-50">{size}</span>
                    <span className="font-black">{currency}{price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {speciesServices.length === 0 && (
            <div className="h-40 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-gray-300">
              <PlusCircle size={24} className="mb-2 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">No {type} services</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-8 shrink-0 bg-white border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Settings2 size={14} className="text-[#D9ED5F]" />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Operations</p>
              </div>
              <h1 className="text-3xl font-black text-[#1A1F3D]">Service Management</h1>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text"
                placeholder="Search across all services..."
                className="bg-[#F5F6FA] border-none pl-12 pr-6 py-3.5 rounded-2xl text-sm font-bold w-80 focus:ring-2 focus:ring-[#1A1F3D]/5"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 flex gap-8 p-10 overflow-hidden">
          {/* Left Column: Dog Services */}
          <ServiceList type="dog" />

          {/* Vertical Divider (Optional styling) */}
          <div className="w-px bg-gray-100 self-stretch" />

          {/* Right Column: Cat Services */}
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