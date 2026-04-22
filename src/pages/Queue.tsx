"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, Clock, CheckCircle2 } from 'lucide-react';

const Queue = () => {
  const queueItems = [
    { name: 'Bella', breed: 'Golden Retriever', owner: 'John Doe', status: 'Waiting', time: '10:30 AM', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=64&h=64&fit=crop' },
    { name: 'Max', breed: 'Beagle', owner: 'Sarah Smith', status: 'In Service', time: '11:00 AM', image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=64&h=64&fit=crop' },
    { name: 'Luna', breed: 'Persian Cat', owner: 'Mike Brown', status: 'Completed', time: '09:15 AM', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=64&h=64&fit=crop' },
  ];

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">Pet Queue</h1>
            <p className="text-gray-400 font-medium">Manage daily appointments and walk-ins</p>
          </div>
          <button className="bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl font-bold">New Booking</button>
        </div>

        <div className="space-y-4">
          {queueItems.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-[32px] flex items-center justify-between shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover" />
                <div>
                  <h3 className="text-xl font-bold">{item.name}</h3>
                  <p className="text-sm text-gray-400">{item.breed} • {item.owner}</p>
                </div>
              </div>
              <div className="flex items-center gap-10">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Scheduled Time</p>
                  <p className="font-bold flex items-center gap-2">
                    <Clock size={16} /> {item.time}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-bold ${
                  item.status === 'Completed' ? 'bg-green-100 text-green-600' :
                  item.status === 'In Service' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Queue;