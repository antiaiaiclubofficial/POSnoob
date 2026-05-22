export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed' | 'Cancelled';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type BookingType = 'Grooming' | 'Daycare' | 'Hotel' | 'Walk-in' | 'Appointment';
export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'hotel' | 'scissors' | 'cat' | 'dog' | 'package' | 'nail' | 'dry' | 'health' | 'brush' | 'love' | 'food' | 'premium';
export type StaffRole = 'Admin' | 'Manager' | 'Groomer' | 'Assistant' | 'Receptionist';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'QR' | 'Credit' | 'Package' | 'Store Credit';

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat';
  breed: string;
  gender: 'Male' | 'Female';
  weight: number;
  birthday?: string;
  weightHistory: { date: string; value: number }[];
  serviceHistory?: any[];
  intakeHistory?: any[];
  image?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female';
  age?: string;
  phone: string;
  email?: string;
  lineId?: string;
  taxId?: string;
  membership: MembershipLevel;
  membershipLevel: MembershipLevel; // Keep both for compatibility
  totalSpent: number;
  creditBalance: number;
  pets: Pet[];
  packages?: any[];
  branchName?: string;
  houseNo?: string;
  villageNo?: string;
  soi?: string;
  road?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
}

export interface QueueItem {
  id: string;
  customerId: string;
  customerName: string;
  ownerName?: string; // Compatibility
  petId: string;
  petName: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime?: string;
  date: string;
  time: string;
  image?: string;
  duration: number;
  status: QueueStatus;
  isPaid: boolean;
  totalAmount: number;
  staffId?: string;
  staffName?: string;
  notes?: string;
}

export interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: ServiceIcon;
  targetSpecies: 'Dog' | 'Cat';
  isActive: boolean;
  prices: Record<string, { price: number; duration: number }>;
  coatType?: string;
}

export interface PackageTemplate {
  id: string;
  name: string;
  description: string;
  serviceId?: string; // Single service link
  services: { serviceId: string; quantity: number }[];
  paidSlots?: number;
  freeSlots?: number;
  price: number;
  validDays: number;
  recurringFreebie?: string;
  oneTimeFreebie?: string;
}

export interface CreditPackageTemplate {
  id: string;
  name: string;
  creditAmount: number;
  creditValue: number; // Compatibility
  price: number;
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  nickname?: string;
  phone?: string;
  isActive: boolean;
  status: 'Active' | 'Inactive';
  avatar?: string;
  image?: string;
  username?: string;
  password?: string;
  commissionRate?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  staffName?: string; // Compatibility
  action: string;
  details: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
  category: 'CRM' | 'POS' | 'WMS' | 'System';
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  discountAmount: number;
  customerId: string;
  customerName: string;
  staffId?: string;
  actualDuration?: number;
  items: any[];
  paymentMethod: PaymentMethod;
  staffName: string;
  species: string[];
  bookingType: BookingType;
}

export interface Partner {
  id: string;
  companyName: string;
  name?: string; // Alias
  gpRate: number;
  // ... other fields
}

export interface Vendor extends Partner {}

export interface AppState {
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  currency: string;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  currentUser: any;
  storeId: string | null;
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  shopIsOpen: boolean;
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperSize: '58mm' | '80mm';
  customers: Customer[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  queue: QueueItem[];
  slotDuration: number;
  openTime: string;
  closeTime: string;
  maxCapacity: number;
  disabledSlots: string[];
  recurringHolidays: number[];
  specificHolidays: string[];
  kennelCapacity: number;
  services: Service[];
  inventory: any[];
  vendors: Vendor[];
  partners: Partner[];
  stockLogs: any[];
  transactions: Transaction[];
  staff: Staff[];
  logs: ActivityLog[];
  cart: any[];
  packageTemplates: PackageTemplate[];
  creditPackages: CreditPackageTemplate[];
  tierRules: any[];
  // ... actions (same as before)
  addLog: (log: any) => void;
  adjustStock: (id: string, qty: number, mode: any, reason: string) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
}