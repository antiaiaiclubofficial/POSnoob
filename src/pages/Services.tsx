import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit2, Check, X } from 'lucide-react';
import { useStore, Service } from '@/store/useStore';
import { toast } from 'sonner';

const Services = () => {
  const { services, updateServicePrice } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrices, setEditPrices] = useState<{S: string, M: string, L: string} | string>("");

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    if (typeof service.prices === 'object') {
      setEditPrices({
        S: service.prices.S.toString(),
        M: service.prices.M.toString(),
        L: service.prices.L.toString()
      });
    } else {
      setEditPrices(service.prices.toString());
    }
  };

  const handleSave = (id: string) => {
    let newPrices: Service['prices'];
    if (typeof editPrices === 'object') {
      newPrices = {
        S: Number(editPrices.S),
        M: Number(editPrices.M),
        L: Number(editPrices.L)
      };
    } else {
      newPrices = Number(editPrices);
    }
    updateServicePrice(id, newPrices);
    setEditingId(null);
    toast.success("Price updated successfully");
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
          <button className="bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2">
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
                <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6 font-bold">{service.title}</td>
                  <td className="px-8 py-6">
                    {editingId === service.id ? (
                      <div className="flex gap-2">
                        {typeof editPrices === 'object' ? (
                          <>
                            <input 
                              className="w-16 border rounded px-2 py-1 text-sm" 
                              value={editPrices.S} 
                              onChange={e => setEditPrices({...editPrices, S: e.target.value})}
                              placeholder="S"
                            />
                            <input 
                              className="w-16 border rounded px-2 py-1 text-sm" 
                              value={editPrices.M} 
                              onChange={e => setEditPrices({...editPrices, M: e.target.value})}
                              placeholder="M"
                            />
                            <input 
                              className="w-16 border rounded px-2 py-1 text-sm" 
                              value={editPrices.L} 
                              onChange={e => setEditPrices({...editPrices, L: e.target.value})}
                              placeholder="L"
                            />
                          </>
                        ) : (
                          <input 
                            className="w-24 border rounded px-2 py-1 text-sm" 
                            value={editPrices as string} 
                            onChange={e => setEditPrices(e.target.value)}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {typeof service.prices === 'object' 
                          ? `$${service.prices.S} / $${service.prices.M} / $${service.prices.L}`
                          : `$${service.prices}`}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">{service.category}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === service.id ? (
                        <>
                          <button onClick={() => handleSave(service.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg"><Check size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={18} /></button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(service)} className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-lg"><Edit2 size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Services;