import React from 'react';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Services = () => {
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
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Base Price</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { name: 'Full Grooming', price: '$45', category: 'Grooming', status: 'Active' },
                { name: 'Bath & Brush', price: '$35', category: 'Hygiene', status: 'Active' },
                { name: 'Nail Trim', price: '$15', category: 'Quick Service', status: 'Active' },
              ].map((service, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6 font-bold">{service.name}</td>
                  <td className="px-8 py-6 text-gray-600">{service.price}</td>
                  <td className="px-8 py-6">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">{service.category}</span>
                  </td>
                  <td className="px-8 py-6 text-green-500 font-medium">{service.status}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-[#1A1F3D]"><Edit2 size={18} /></button>
                      <button className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
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