"use client";

import React, { useState, useMemo } from 'react';
import { X, Scissors, Plus, Edit3, Trash2, Zap, Dog, Cat } from 'lucide-react';
import { useStore, Service, AddonItem } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { translations } from '@/utils/translations';
import ServiceModal from './ServiceModal';
import AddonSettingsModal from './AddonSettingsModal';

interface ManageServicesModalProps {
  onClose: () => void;
}

const ManageServicesModal = ({ onClose }: ManageServicesModalProps) => {
  const { 
    services, toggleServiceActive, deleteService, 
    addons, deleteAddon, currency, language 
  } = useStore();
  
  const t = translations[language];

  // Local states for modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<AddonItem | null>(null);

  // Filter States
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');
  const [coatFilter, setCoatFilter] = useState<'All' | 'Short' | 'Long'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSpecies = s.targetSpecies === speciesTab;
      const matchesCoat = coatFilter === 'All' || s.coatType === coatFilter;
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSpecies && matchesCoat && matchesSearch;
    });
  }, [services, speciesTab, coatFilter, searchQuery]);

  const handleEditService = (s: Service) => {
    setSelectedService(s);
    setIsServiceModalOpen(true);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditAddon = (addon: AddonItem) => {
    setSelectedAddon(addon);
    setIsAddonModalOpen(true);
  };

  const handleAddAddon = () => {
    setSelectedAddon(null);
    setIsAddonModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[140] flex items-center justify-center p-4 lg:p-10 overflow-y-auto">
      <div className="bg-[#F8F9FD] w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F]">
              <Scissors size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1A1F3D]">
                {language === 'th' ? 'จัดการบริการและบริการเสริม' : 'Manage Services & Add-ons'}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {language === 'th' ? 'ตั้งค่ารายการบริการหลักและบริการเสริมของร้าน' : 'Configure main services and global add-ons'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          
          {/* Section 1: Main Services */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-[#1A1F3D]">{language === 'th' ? 'รายการบริการหลัก' : 'Service Catalog'}</h3>
                <p className="text-xs text-gray-400 font-medium">
                  {language === 'th' ? 'บริการหลักแยกตามประเภทสัตว์และขนาด' : 'Define your specialized grooming treatments.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
                  <button onClick={() => setSpeciesTab('Dog')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", speciesTab === 'Dog' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>DOG</button>
                  <button onClick={() => setSpeciesTab('Cat')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", speciesTab === 'Cat' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>CAT</button>
                </div>
                <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
                  {(['All', 'Short', 'Long'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setCoatFilter(type)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                        coatFilter === type ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400"
                      )}
                    >
                      {type === 'All' ? 'ALL' : type === 'Short' ? 'SHORT' : 'LONG'}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleAddService}
                  className="bg-[#1A1F3D] text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-[#2A3152] transition-all ml-auto sm:ml-0"
                >
                  <Plus size={14} /> {language === 'th' ? 'เพิ่มบริการ' : 'Add Service'}
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold"
                placeholder={language === 'th' ? 'ค้นหาบริการ...' : 'Search services...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map(s => (
                <div key={s.id} className="p-5 bg-white border border-gray-100 rounded-[24px] flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm", s.targetSpecies === 'Dog' ? "bg-blue-500" : "bg-pink-500")}>
                      <Scissors size={20}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-[#1A1F3D] text-sm">{s.title}</h4>
                        {s.coatType && (
                          <span className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase",
                            s.coatType === 'Short' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                          )}>
                            {s.coatType === 'Short' ? 'Short' : 'Long'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{s.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={s.isActive} onCheckedChange={() => toggleServiceActive(s.id)} className="data-[state=checked]:bg-[#1A1F3D]" />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditService(s)} className="p-2 text-gray-300 hover:text-[#1A1F3D] bg-gray-50 rounded-lg"><Edit3 size={16}/></button>
                      <button onClick={() => { if(confirm(language === 'th' ? 'ต้องการลบบริการนี้ใช่หรือไม่?' : 'Delete service?')) deleteService(s.id); }} className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredServices.length === 0 && (
                <div className="col-span-full py-10 text-center opacity-30 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-xs font-bold uppercase">{language === 'th' ? 'ไม่พบรายการบริการ' : 'No services found'}</p>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Add-ons */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-[#1A1F3D]">{language === 'th' ? 'บริการเสริม (Add-ons)' : 'Global Add-ons'}</h3>
                <p className="text-xs text-gray-400 font-medium">
                  {language === 'th' ? 'บริการเสริมพิเศษที่สามารถเลือกเพิ่มในบิลได้' : 'Extra items that can be added to any order.'}
                </p>
              </div>
              <button 
                onClick={handleAddAddon} 
                className="bg-[#1A1F3D] text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-[#2A3152] transition-all"
              >
                <Plus size={14} /> {language === 'th' ? 'เพิ่มบริการเสริม' : 'Add Add-on'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addons.map(addon => (
                <div key={addon.id} className="p-6 bg-[#F5F6FA] rounded-[24px] flex justify-between items-center group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                      <Zap size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1A1F3D]">{addon.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{currency}{addon.price}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditAddon(addon)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                    <button onClick={() => { if(confirm(language === 'th' ? 'ต้องการลบบริการเสริมนี้ใช่หรือไม่?' : 'Delete add-on?')) deleteAddon(addon.id); }} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {addons.length === 0 && (
                <div className="col-span-full py-10 text-center opacity-30 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-xs font-bold uppercase">{language === 'th' ? 'ยังไม่มีบริการเสริม' : 'No add-ons configured'}</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="bg-[#1A1F3D] text-white px-8 py-3 rounded-xl font-black text-xs shadow-md hover:bg-[#2A3152] transition-all"
          >
            {language === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>
      </div>

      {/* Nested Modals */}
      {isServiceModalOpen && (
        <ServiceModal 
          service={selectedService} 
          defaultSpecies={speciesTab}
          onClose={() => setIsServiceModalOpen(false)} 
        />
      )}
      {isAddonModalOpen && (
        <AddonSettingsModal 
          addon={selectedAddon} 
          onClose={() => setIsAddonModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default ManageServicesModal;