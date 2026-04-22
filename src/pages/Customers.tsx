import React from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, Mail, Phone, ExternalLink } from 'lucide-react';

const Customers = () => {
  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">Customers</h1>
            <p className="text-gray-400 font-medium">Manage your client database and history</p>
          </div>
        </div>

        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl border border-gray-100" placeholder="Search customers..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[
            { name: 'John Doe', pets: 'Bella, Rocky', lastVisit: '2 days ago', avatar: 'JD' },
            { name: 'Sarah Smith', pets: 'Max', lastVisit: '1 week ago', avatar: 'SS' },
            { name: 'Mike Brown', pets: 'Luna', lastVisit: 'Yesterday', avatar: 'MB' },
          ].map((client, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between mb-6">
                <div className="w-12 h-12 bg-[#D9ED5F] rounded-2xl flex items-center justify-center font-bold text-[#1A1F3D]">
                  {client.avatar}
                </div>
                <button className="text-gray-400 hover:text-[#1A1F3D]"><ExternalLink size={18} /></button>
              </div>
              <h3 className="text-xl font-bold mb-1">{client.name}</h3>
              <p className="text-sm text-gray-400 mb-6">Pets: {client.pets}</p>
              <div className="flex gap-4 pt-4 border-t border-gray-50">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#F5F6FA] rounded-xl text-xs font-bold hover:bg-gray-100">
                  <Phone size={14} /> Call
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#F5F6FA] rounded-xl text-xs font-bold hover:bg-gray-100">
                  <Mail size={14} /> Email
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Customers;