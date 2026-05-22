export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed' | 'Cancelled';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type BookingType = 'Grooming' | 'Daycare' | 'Hotel' | 'Walk-in' | 'Appointment';
export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'hotel' | 'scissors' | 'cat' | 'dog' | 'package' | 'nail' | 'dry' | 'health' | 'brush' | 'love' | 'food' | 'premium';
export type StaffRole = 'Admin' | 'Manager' | 'Groomer' | 'Assistant' | 'Receptionist';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'QR' | 'Credit' | 'Package' | 'Store Credit';

export interface ServicePriceInfo {
  price: number;
  duration: number;
}

export interface SubService {
  id: string;
  title: string;
  price: number;
}

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat';
  breed: string;
  gender: 'Male' | 'Female';
  weight: number;
  birthday: string;
  weightHistory: { date: string; value: number }[];
  serviceHistory: any[];
  intakeHistory?: any[];
  image: string;
  notes: string;
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
  description: string;
  serviceId: string;
  services: { serviceId: string; quantity: number }[];
  paidSlots: number;
  freeSlots: number;
  price: number;
  validDays: number;
  recurringFreebie?: string;
  oneTimeFreebie?: string;
}

export interface CreditPackageTemplate {
  id: string;
  name: string;
  creditAmount: number;
  creditValue: number;
  price: number;
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
  totalSpent: number;
  points: number;
  creditBalance: number;
  creditHistory: any[];
  pets: Pet[];
  packages: any[];
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
  notes?: string;
}

export interface QueueItem {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: QueueStatus;
  image: string;
  isPaid: boolean;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  category: string;
  image?: string;
  isConsignment: boolean;
  partnerId?: string;
}

export interface StockLog {
  id: string;
  timestamp: string;
  productName: string;
  oldQty: number;
  newQty: number;
  reason: string;
  staffName: string;
}

export interface Partner {
  id: string;
  companyName: string;
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
  date: string;
  amount: number;
  discountAmount?: number;
  customerId: string;
  customerName: string;
  items: any[];
  paymentMethod: PaymentMethod;
  staffId?: string;
  staffName: string;
  species: string[];
  bookingType: BookingType;
  actualDuration?: number;
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
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  icon: ServiceIcon;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  details: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

export interface AppState {
  // Auth
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  currentUser: any;
  storeId: string | null;
  login: (id: string, pass: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  setSession: (user: any) => void;
  logout: () => void;
  verifyPassword: (pass: string) => boolean;

  // Business
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  shopIsOpen: boolean;
  currency: string;
  language: 'en' | 'th';
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperSize: '58mm' | '80mm';
  updateBusinessProfile: (data: any) => void;
  setLanguage: (lang: 'en' | 'th') => void;

  // CRM
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setActiveQueueItem: (id: string | null) => void;
  addCustomer: (data: any) => void;
  updateCustomer: (id: string, data: any) => void;
  deleteCustomer: (id: string) => void;
  bindLineToCustomer: (cid: string, lid: string) => void;
  addPet: (cid: string, pet: any) => void;
  updatePet: (cid: string, pid: string, data: any) => void;
  updatePetWeight: (cid: string, pid: string, w: number) => void;
  saveIntakeRecord: (cid: string, pid: string, rec: any) => void;

  // Operations
  queue: QueueItem[];
  slotDuration: number;
  openTime: string;
  closeTime: string;
  maxCapacity: number;
  kennelCapacity: number;
  disabledSlots: string[];
  recurringHolidays: number[];
  specificHolidays: string[];
  addBooking: (booking: any) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  removeQueueItem: (id: string) => void;
  toggleSlotStatus: (time: string) => void;
  updateBookingSettings: (data: any) => void;
  markAsPaid: (id: string) => void;

  // POS
  cart: any[];
  addToCart: (item: any) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, delta: number) => void;
  clearCart: () => void;
  processPayment: (cid: string, total: number, disc: number, items: any[], method: PaymentMethod, details: any, tax: boolean) => void;
  deleteTransaction: (id: string) => void;

  // Catalog & Inventory
  services: Service[];
  addons: AddonItem[];
  inventory: InventoryItem[];
  partners: Partner[];
  vendors: Partner[]; // Alias
  stockLogs: StockLog[];
  transactions: Transaction[];
  staff: Staff[];
  logs: ActivityLog[];
  packageTemplates: PackageTemplate[];
  creditPackages: CreditPackageTemplate[];
  tierRules: TierRule[];

  addService: (data: any) => void;
  updateService: (id: string, data: any) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  addAddon: (data: any) => void;
  updateAddon: (id: string, data: any) => void;
  deleteAddon: (id: string) => void;
  addInventoryItem: (data: any) => void;
  updateInventoryItem: (id: string, data: any) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (id: string, qty: number, mode: string, reason: string) => void;
  addStaff: (data: any) => void;
  updateStaff: (id: string, data: any) => void;
  deleteStaff: (id: string) => void;
  addPackageTemplate: (data: any) => void;
  updatePackageTemplate: (id: string, data: any) => void;
  deletePackageTemplate: (id: string) => void;
  assignPackageToCustomer: (cid: string, tid: string) => void;
  addCreditPackage: (data: any) => void;
  updateCreditPackage: (id: string, data: any) => void;
  deleteCreditPackage: (id: string) => void;
  buyCreditPackage: (cid: string, pid: string) => void;
  updateTierRules: (rules: TierRule[]) => void;
  addLog: (log: any) => void;
}