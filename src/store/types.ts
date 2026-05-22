import { Language } from '@/utils/translations';

export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'Package' | 'Store Credit';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant';
export type BookingType = 'Appointment' | 'Walk-in';

export interface SystemSettings {
  billHeader: string;
  address: string;
  phone: string;
  taxId: string;
  logo: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  stock: number;
  minStock: number;
  price: number;
  costPrice: number;
  unit: string;
  category: string;
  image?: string;
  isConsignment: boolean;
  partnerId?: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  action: 'Add' | 'Adjust' | 'Sale' | 'Consignment';
  oldQty: number;
  newQty: number;
  reason: string;
  staffName: string;
  timestamp: string;
}

export interface Partner {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  contactName: string;
  gpRate: number; // Percentage shop takes
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

// ... Keep other interfaces like Pet, Customer, Transaction but ensure they align
export interface TransactionItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  type: 'Service' | 'Product' | 'Credit';
  isConsignment: boolean;
  partnerId?: string;
  gpRate?: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  discountAmount: number;
  customerId: string;
  customerName: string;
  items: TransactionItem[];
  paymentMethod: PaymentMethod;
  staffName: string;
}

export interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  isAuthenticated: boolean;
  currentUser: { id: string; name: string; role: string } | null;
  
  // WMS State
  inventory: InventoryItem[];
  partners: Partner[];
  stockLogs: StockLog[];
  systemSettings: SystemSettings;
  transactions: Transaction[];

  // WMS Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (id: string, qty: number, mode: 'Add' | 'Set', reason: string) => void;
  
  addPartner: (partner: Omit<Partner, 'id'>) => void;
  updatePartner: (id: string, partner: Partial<Partner>) => void;
  deletePartner: (id: string) => void;
  
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  
  login: (id: string, pass: string) => boolean;
  logout: () => void;
}