import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit3, Trash2, Dog, Cat, Scissors, Search } from 'lucide-react';
import { useStore, Service } from '@/store/useStore';
import ServiceModal from '@/components/ServiceModal';
import { cn } from '@/lib/utils';

const Services = () => {
  const { services, deleteService } = useStore();
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

  const handleAdd = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-end mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-[#D9ED5F] rounded-full animate-pulse" />
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
                  className="bg-white border-none pl-12 pr-6 py-3.5 rounded-2xl shadow-sm text-sm font-bold w-64 focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={handleAdd}
                className="bg-[#1A1F3D] text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#2A3152] transition-all shadow-xl shadow-[#1A1F3D]/10 active:scale-95"
              >
                <Plus size={18} /> Add New Service
              </button>
            </div>
          </header>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Service Details</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Dog Pricing</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Cat Pricing</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F5F6FA] rounded-2xl flex items-center justify-center text-[#1A1F3D] group-hover:scale-110 transition-transform">
                          <Scissors size={20} />
                        </div>
                        <div>
                          <p className="font-black text-[#1A1F3D] mb-1">{service.title}</p>
                          <span className="bg-[#D9ED5F]/20 text-[#1A1F3D] text-[9px] font-black px-2.5 py-1 rounded-lg uppercase">
                            {service.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(service.prices.dog).length > 0 ? (
                          Object.entries(service.prices.dog).map(([size, price]) => (
                            <div key={size} className="flex items-center bg-blue-50/50 px-2.5 py-1.5 rounded-xl border border-blue-100">
                              <span className="text-[9px] font-black text-blue-400 uppercase mr-1.5">{size}</span>
                              <span className="text-xs font-black text-blue-700">${price}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-300 italic">No dog prices</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(service.prices.cat).length > 0 ? (
                          Object.entries(service.prices.cat).map(([size, price]) => (
                            <div key={size} className="flex items-center bg-pink-50/50 px-2.5 py-1.5 rounded-xl border border-pink-100">
                              <span className="text-[9px] font-black text-pink-400 uppercase mr-1.5">{size}</span>
                              <span className="text-xs font-black text-pink-700">${price}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-300 italic">No cat prices</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(service)}
                          className="p-3 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-100 rounded-2xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteService(service.id)}
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredServices.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors size={32} className="text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold">No services found matching your search</p>
              </div>
            )}
          </div>
        </div>
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