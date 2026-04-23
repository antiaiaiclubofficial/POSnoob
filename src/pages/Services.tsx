import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Edit3, Trash2, Dog, Cat, Scissors, Search, 
  LayoutGrid, ChevronRight, Settings2 
} from 'lucide-react';
import { useStore, Service } from '@/store/useStore';
import ServiceModal from '@/components/ServiceModal';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Services = () => {
  const { services, deleteService, currency } = useStore();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase()) || 
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleAdd = (species: 'Dog' | 'Cat') => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const PricingGrid = ({ type }: { type: 'dog' | 'cat' }) => {
    const species = type === 'dog' ? 'Dog' : 'Cat';
    const speciesServices = filteredServices.filter(s => s.targetSpecies === species);

    return (
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Service Details</th>
              <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Sizes & Rates</th>
              <th className="px-8 py-6 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {speciesServices.map((service) => (
              <tr key={service.id} className="group hover:bg-gray-50/30 transition-colors">
                <td className="px-8 py-8">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      type === 'dog' ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                    )}>
                      <Scissors size={20} />
                    </div>
                    <div>
                      <p className="font-black text-[#1A1F3D] mb-1">{service.title}</p>
                      <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase">
                        {service.category}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(service.prices).length > 0 ? (
                      Object.entries(service.prices).map(([size, price]) => (
                        <div key={size} className={cn(
                          "flex items-center px-3 py-2 rounded-xl border transition-all",
                          type === 'dog' ? "bg-blue-50/30 border-blue-100" : "bg-pink-50/30 border-pink-100"
                        )}>
                          <span className={cn(
                            "text-[10px] font-black uppercase mr-2",
                            type === 'dog' ? "text-blue-400" : "text-pink-400"
                          )}>{size}</span>
                          <span className="text-sm font-black text-[#1A1F3D]">{currency}{price}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-300 italic font-bold">No pricing set</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-8 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(service)}
                      className="p-3 text-gray-300 hover:text-[#1A1F3D] hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-100"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteService(service.id)}
                      className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {speciesServices.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold">No services found for this category</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-8 shrink-0 bg-white border-b border-gray-100">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Settings2 size={14} className="text-[#D9ED5F]" />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Service Catalog</p>
              </div>
              <h1 className="text-4xl font-black text-[#1A1F3D]">Service Management</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text"
                  placeholder="Search services..."
                  className="bg-[#F5F6FA] border-none pl-12 pr-6 py-3.5 rounded-2xl text-sm font-bold w-64 focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => handleAdd('Dog')}
                className="bg-[#1A1F3D] text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#2A3152] transition-all shadow-xl shadow-[#1A1F3D]/10 active:scale-95"
              >
                <Plus size={18} /> Add Service
              </button>
            </div>
          </div>

          <Tabs defaultValue="dog" className="w-full">
            <TabsList className="bg-gray-100/50 p-1 rounded-2xl h-auto gap-1">
              <TabsTrigger 
                value="dog" 
                className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-xs font-black transition-all flex items-center gap-2"
              >
                <Dog size={16} /> DOG SERVICES
              </TabsTrigger>
              <TabsTrigger 
                value="cat" 
                className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm text-xs font-black transition-all flex items-center gap-2"
              >
                <Cat size={16} /> CAT SERVICES
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-8 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-hide pb-10">
              <TabsContent value="dog" className="mt-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <PricingGrid type="dog" />
              </TabsContent>
              <TabsContent value="cat" className="mt-0 animate-in fade-in slide-in-from-right-2 duration-300">
                <PricingGrid type="cat" />
              </TabsContent>
            </div>
          </Tabs>
        </header>
      </main>

      {isModalOpen && (
        <ServiceModal 
          service={selectedService} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Services;