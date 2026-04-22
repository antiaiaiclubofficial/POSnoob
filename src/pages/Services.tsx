import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit2, Trash2, Dog, Cat } from 'lucide-react';
import { useStore, Service } from '@/store/useStore';
import ServiceModal from '@/components/ServiceModal';

const Services = () => {
  const { services, deleteService } = useStore();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">Services Management</h1>
            <p className="text-gray-400 font-medium">Configure flexible pricing and custom sizes</p>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2A3152] transition-colors shadow-lg shadow-[#1A1F3D]/10"
          >
            <Plus size={20} /> Add Service
          </button>
        </div>

        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dog Prices</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cat Prices</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-bold text-[#1A1F3D]">{service.title}</p>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-black text-gray-500 uppercase">{service.category}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(service.prices.dog).map(([size, price]) => (
                        <span key={size} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold border border-blue-100">
                          {size}: ${price}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(service.prices.cat).map(([size, price]) => (
                        <span key={size} className="text-[10px] bg-pink-50 text-pink-600 px-2 py-1 rounded-lg font-bold border border-pink-100">
                          {size}: ${price}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(service)}
                        className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-100 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteService(service.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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