import { create } from 'zustand';
import { AppState, InventoryItem, Partner, StockLog, SystemSettings, Transaction } from './types';

export const useStore = create<AppState>()((set, get) => ({
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  isAuthenticated: true, // For demo
  currentUser: { id: 'admin', name: 'Admin User', role: 'Admin' },

  inventory: [
    { id: '1', name: 'แชมพูสูตรอ่อนโยน', barcode: '885001', stock: 15, minStock: 5, price: 350, costPrice: 200, unit: 'ขวด', category: 'อาบน้ำ', isConsignment: false },
    { id: '2', name: 'ขนมสุนัขขัดฟัน', barcode: '885002', stock: 0, minStock: 10, price: 120, costPrice: 80, unit: 'ห่อ', category: 'ขนม', isConsignment: true, partnerId: 'p1' },
  ],

  partners: [
    { id: 'p1', companyName: 'บริษัท เพ็ทฟู้ด จำกัด', taxId: '0105560000123', address: 'กรุงเทพฯ', phone: '02-123-4567', contactName: 'คุณสมชาย', gpRate: 20 },
  ],

  stockLogs: [],

  systemSettings: {
    billHeader: 'Mellow Fellow Pet Sanctuary',
    address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
    phone: '02-999-9999',
    taxId: '010XXXXXXXXXX',
    logo: null
  },

  transactions: [],

  addInventoryItem: (item) => set((state) => ({ 
    inventory: [...state.inventory, { ...item, id: Math.random().toString(36).substr(2, 9) }] 
  })),

  updateInventoryItem: (id, item) => set((state) => ({
    inventory: state.inventory.map(i => i.id === id ? { ...i, ...item } : i)
  })),

  deleteInventoryItem: (id) => set((state) => ({ 
    inventory: state.inventory.filter(i => i.id !== id) 
  })),

  adjustStock: (id, qty, mode, reason) => set((state) => {
    const item = state.inventory.find(i => i.id === id);
    if (!item) return state;

    const oldQty = item.stock;
    const newQty = mode === 'Add' ? oldQty + qty : qty;

    const log: StockLog = {
      id: Math.random().toString(36).substr(2, 9),
      productId: id,
      productName: item.name,
      action: mode === 'Add' ? 'Add' : 'Adjust',
      oldQty,
      newQty,
      reason,
      staffName: state.currentUser?.name || 'System',
      timestamp: new Date().toISOString()
    };

    return {
      inventory: state.inventory.map(i => i.id === id ? { ...i, stock: newQty } : i),
      stockLogs: [log, ...state.stockLogs]
    };
  }),

  addPartner: (partner) => set((state) => ({ 
    partners: [...state.partners, { ...partner, id: 'p-' + Math.random().toString(36).substr(2, 5) }] 
  })),

  updatePartner: (id, partner) => set((state) => ({
    partners: state.partners.map(p => p.id === id ? { ...p, ...partner } : p)
  })),

  deletePartner: (id) => set((state) => ({ 
    partners: state.partners.filter(p => p.id !== id) 
  })),

  updateSystemSettings: (settings) => set((state) => ({
    systemSettings: { ...state.systemSettings, ...settings }
  })),

  login: (id, pass) => true, // Mock
  logout: () => set({ isAuthenticated: false, currentUser: null })
}));