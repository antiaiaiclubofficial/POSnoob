import { create } from 'zustand';
import { AppState } from './types';

export const useStore = create<AppState>()((set, get) => ({
  // ... previous state
  receiptPaperSize: '80mm',
  // ... other initial states
  addLog: (log) => set(s => ({ 
    logs: [{ ...log, id: Math.random().toString(), timestamp: new Date().toISOString() }, ...s.logs] 
  })),
  // ... actions
}));

export * from './types';