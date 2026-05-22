"use client";

export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed' | 'Cancelled';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type BookingType = 'Grooming' | 'Daycare' | 'Hotel' | 'Walk-in' | 'Appointment';
export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'hotel' | 'scissors' | 'cat' | 'dog' | 'package' | 'nail' | 'dry' | 'health' | 'brush' | 'love' | 'food' | 'premium';
export type StaffRole = 'Admin' | 'Manager' | 'Groomer' | 'Assistant' | 'Receptionist';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'QR' | 'Credit' | 'Package' | 'Store Credit';

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Other';
  breed: string;
  birthday: string;
  weightHistory: { date: string; value: number }[];
  serviceHistory: any[];
  intakeHistory?: any[]; // Added for records view
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
  lineId?: string;
  membership: MembershipLevel;
  points: number;
  totalSpent: number;
  creditBalance: number;
  pets: Pet[];
  packages?: any[];
  creditHistory?: any[];
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
  customerId: string;
  customerName: string;
  petId: string;
  petName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: QueueStatus;
  image: string;
  isPaid: boolean;
  ownerName?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  totalAmount?: number;
}

export interface ServicePriceInfo {
  price: number;
  duration: number;
}

export interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: ServiceIcon;
  targetSpecies: 'Dog' | 'Cat';
  isActive: boolean;
  prices: Record<string, ServicePriceInfo>;
  coatType?: 'Short' | 'Long';
  isPopular?: boolean; // Added for Services page
}

export interface SubService {
  id: string;
  title: string;
  price: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  costPrice: number;
  image?: string;
  isConsignment: boolean;
  partnerId?: string;
  vendorId?: string; // Added alias for compatibility
  consignmentRate?: number;
}

export interface Partner {
  id: string;
  companyName: string;
  name?: string;
  gpRate: number;
  taxId?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  notes?: string;
  mainCategory?: string;
}

export type Vendor = Partner; // Exporting Vendor as an alias

export interface StockLog {
  id: string;
  timestamp: string;
  productName: string;
  oldQty: number;
  newQty: number;
  reason: string;
  staffName: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  discountAmount: number;
  customerId: string;
  customerName: string;
  items: any[];
  paymentMethod: PaymentMethod;
  staffName: string;
  species: string[];
  bookingType: BookingType;
  staffId?: string;
  actualDuration?: number;
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
  email?: string; // Added for OAuth compatibility
  commissionRate?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  staffName: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  icon: ServiceIcon;
}

export interface PackageTemplate {
  id: string;
  name: string;
  description?: string;
  services?: any[];
  serviceId?: string;
  price: number;
  validDays: number;
  paidSlots?: number;
  freeSlots?: number;
  recurringFreebie?: string;
  oneTimeFreebie?: string;
}

export interface CreditPackageTemplate {
  id: string;
  name: string;
  price: number;
  creditValue: number;
  creditAmount?: number;
}

export interface TierRule {
  level: MembershipLevel;
  label: string;
  minSpent: number;
  discount: number;
}

export interface AppState {
  language: 'en' | 'th';
  setLanguage: (lang: 'en' | 'th') => void;
  currency: string;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  currentUser: Staff | null;
  storeId: string | null; // Added storeId
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
  queue: QueueItem[];
  services: Service[];
  addons: AddonItem[];
  inventory: InventoryItem[];
  partners: Partner[];
  vendors: Partner[];
  stockLogs: StockLog[];
  transactions: Transaction[];
  staff: Staff[];
  logs: ActivityLog[];
  cart: any[];
  packageTemplates: PackageTemplate[];
  creditPackages: CreditPackageTemplate[];
  tierRules: TierRule[];
  slotDuration: number;
  openTime: string;
  closeTime: string;
  maxCapacity: number;
  kennelCapacity: number;
  disabledSlots: string[];
  recurringHolidays: number[];
  specificHolidays: string[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  setSession: (user: any) => void;
  setCustomers: (customers: Customer[]) => void;
  login: (id: string, pass: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  addLog: (log: any) => void;
  updateBusinessProfile: (profile: any) => void;
  updateBookingSettings: (settings: any) => void;
  updateTierRules: (rules: TierRule[]) => void;
  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setActiveQueueItemId?: (id: string | null) => void; // Keep original property name
  setActiveQueueItem: (id: string | null) => void;
  addBooking: (booking: any) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  removeQueueItem: (id: string) => void;
  toggleSlotStatus: (time: string) => void;
  markAsPaid: (id: string) => void;
  addCustomer: (data: any) => void;
  updateCustomer: (id: string, data: any) => void;
  deleteCustomer: (id: string) => void;
  bindLineToCustomer: (cid: string, lid: string) => void;
  addPet: (cid: string, pet: any) => void;
  updatePet: (cid: string, pid: string, data: any) => void;
  updatePetWeight: (cid: string, pid: string, w: number) => void;
  saveIntakeRecord: (cid: string, pid: string, rec: any) => void;
  addToCart: (item: any) => void;
  removeFromCart: (idx: number) => void;
  updateCartQuantity: (idx: number, delta: number) => void;
  clearCart: () => void;
  processPayment: (cid: string, total: number, disc: number, items: any[], method: PaymentMethod, details: any, isTax: boolean) => void;
  deleteTransaction: (id: string) => void;
  addService: (ser: any) => void;
  updateService: (id: string, ser: any) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  addAddon: (ad: any) => void;
  updateAddon: (id: string, ad: any) => void;
  deleteAddon: (id: string) => void;
  addInventoryItem: (i: any) => void;
  updateInventoryItem: (id: string, i: any) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (id: string, qty: number, mode: string, reason: string) => void;
  addStaff: (st: any) => void;
  updateStaff: (id: string, st: any) => void;
  deleteStaff: (id: string) => void;
  addPackageTemplate: (pkg: any) => void;
  updatePackageTemplate: (id: string, pkg: any) => void;
  deletePackageTemplate: (id: string) => void;
  assignPackageToCustomer: (cid: string, tid: string) => void;
  addCreditPackage: (pkg: any) => void;
  updateCreditPackage: (id: string, pkg: any) => void;
  deleteCreditPackage: (id: string) => void;
  buyCreditPackage: (cid: string, pid: string) => void;
  verifyPassword: (pass: string) => boolean;
}