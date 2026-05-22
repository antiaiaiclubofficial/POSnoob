import { Language } from '@/utils/translations';

// Base Types
export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'Package' | 'Store Credit';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant';
export type BookingType = 'Appointment' | 'Walk-in';

// Sub-Interfaces
export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Other';
  breed: string;
  birthday: string;
  weightHistory: { date: string; value: number }[];
  serviceHistory: any[];
  intakeHistory?: any[];
  notes: string;
  image: string;
}

export interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: string;
  phone: string;
  email: string;
  membership: MembershipLevel;
  lineId?: string;
  points: number;
  totalSpent: number;
  creditBalance: number;
  creditHistory: any[];
  packages: any[];
  pets: Pet[];
  taxId?: string;
  branchName?: string;
  houseNo?: string;
  villageNo?: string;
  soi?: string;
  road?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export interface QueueItem {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: QueueStatus;
  image: string;
  isPaid?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface ServicePriceInfo {
  price: number;
  duration: number;
}

export interface SubService {
  name: string;
  price: number;
}

export interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: ServiceIcon;
  targetSpecies: 'Dog' | 'Cat';
  prices: Record<string, ServicePriceInfo>;
  subServices: SubService[];
  isActive: boolean;
  isPopular?: boolean;
  coatType?: 'Short' | 'Long';
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  status: 'Active' | 'Inactive';
  avatar: string;
  username?: string;
  password?: string;
  commissionRate?: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  discountAmount: number;
  items: any[];
  paymentMethod: PaymentMethod;
  date: string;
  staffId?: string;
  species: string[];
  actualDuration?: number;
  bookingType: BookingType;
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
  vendorId?: string;
  consignmentRate?: number;
}

export interface Vendor {
  id: string;
  name: string;
  taxId: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  consignmentRate: number;
  notes: string;
  mainCategory?: string;
}

export interface Log {
  id: string;
  staffName: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: string;
}

export interface TierRule {
  level: MembershipLevel;
  label: string;
  minSpent: number;
  discount: number;
}

export interface PackageTemplate {
  id: string;
  name: string;
  serviceId: string;
  paidSlots: number;
  freeSlots: number;
  price: number;
  recurringFreebie?: string;
  oneTimeFreebie?: string;
}

export interface CreditPackageTemplate {
  id: string;
  name: string;
  price: number;
  creditValue: number;
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  icon: ServiceIcon;
}

// AppState Definition
export interface AppState {
  // Auth
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  currentUser: any;
  storeId: string | null;
  login: (id: string, pass: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  setSession: (user: any) => void;
  verifyPassword: (pass: string) => boolean;
  logout: () => Promise<void>;

  // Settings & Business
  language: Language;
  setLanguage: (lang: Language) => void;
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  currency: string;
  shopIsOpen: boolean;
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperSize: '58mm' | '80mm';
  kennelCapacity: number;
  slotDuration: number;
  maxCapacity: number;
  openTime: string;
  closeTime: string;
  recurringHolidays: number[];
  specificHolidays: string[];
  updateBusinessProfile: (profile: any) => void;
  updateBookingSettings: (settings: any) => void;

  // CRM
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setActiveQueueItemId: (id: string | null) => void;
  addCustomer: (data: any) => Promise<void>;
  updateCustomer: (id: string, data: any) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  bindLineToCustomer: (customerId: string, lineId: string) => Promise<void>;
  addPet: (customerId: string, data: any) => Promise<void>;
  updatePet: (customerId: string, petId: string, data: any) => Promise<void>;
  updatePetWeight: (customerId: string, petId: string, weight: number) => Promise<void>;
  saveIntakeRecord: (customerId: string, petId: string, record: any) => void;

  // Queue
  queue: QueueItem[];
  addBooking: (booking: any) => Promise<void>;
  updateQueueStatus: (id: string, status: QueueStatus) => Promise<void>;
  removeQueueItem: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  toggleSlotStatus: (time: string) => void;
  disabledSlots: string[];

  // Inventory & Vendors
  inventory: InventoryItem[];
  vendors: Vendor[];
  stockLogs: any[];
  addInventoryItem: (item: any) => void;
  updateInventoryItem: (id: string, item: any) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (productId: string, amount: number, mode: 'Add' | 'Adjust', reason: string) => void;
  addVendor: (vendor: any) => void;
  updateVendor: (id: string, vendor: any) => void;
  deleteVendor: (id: string) => void;

  // POS & Transactions
  cart: any[];
  addToCart: (item: any) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, delta: number) => void;
  clearCart: () => void;
  processPayment: (customerId: string, total: number, discount: number, items: any[], method: PaymentMethod, details: any, isTaxInvoice: boolean) => void;
  transactions: Transaction[];
  deleteTransaction: (id: string) => void;

  // Services & Addons
  services: Service[];
  addService: (service: any) => void;
  updateService: (id: string, service: any) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  addons: AddonItem[];
  addAddon: (addon: any) => void;
  updateAddon: (id: string, addon: any) => void;
  deleteAddon: (id: string) => void;

  // Staff & Logs
  staff: Staff[];
  addStaff: (staff: any) => void;
  updateStaff: (id: string, staff: any) => void;
  deleteStaff: (id: string) => void;
  logs: Log[];
  addLog: (log: Omit<Log, 'id' | 'timestamp'>) => void;

  // Loyalty & Packages
  tierRules: TierRule[];
  updateTierRules: (rules: TierRule[]) => void;
  packageTemplates: PackageTemplate[];
  addPackageTemplate: (pkg: any) => void;
  updatePackageTemplate: (id: string, pkg: any) => void;
  deletePackageTemplate: (id: string) => void;
  assignPackageToCustomer: (customerId: string, templateId: string) => void;
  creditPackages: CreditPackageTemplate[];
  addCreditPackage: (pkg: any) => void;
  updateCreditPackage: (id: string, pkg: any) => void;
  deleteCreditPackage: (id: string) => void;
  buyCreditPackage: (customerId: string, packageId: string) => void;
}