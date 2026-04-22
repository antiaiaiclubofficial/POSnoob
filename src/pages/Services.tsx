import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
            <p className="text-gray-400 font-medium">Update pricing and service details</p>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2A3152] transition-colors"
          >
            <Plus size={20} /> Add Service
          </button>
        </div>

        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Name</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price (S/M/L)</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-bold">{service.title}</p>
                    <p className="text-[10px] text-gray-400 font-medium truncate max-w-xs">{service.description}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-gray-600 font-bold">
                      {typeof service.prices === 'object' 
                        ? `$${service.prices.S} / $${service.prices.M} / $${service.prices.L}`
                        : `$${service.prices}`}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider">{service.category}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(service)}
                        className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteService(service.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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