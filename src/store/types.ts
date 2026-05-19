import { Language } from '@/utils/translations';

export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'Package' | 'Store Credit';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant';
export type BookingType = 'Appointment' | 'Walk-in';

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  icon: ServiceIcon;
}

export interface CreditPackageTemplate {
  id: string;
  name: string;
  price: number;
  creditValue: number;
}

export interface CreditTransaction {
  id: string;
  date: string;
  type: 'Top-up' | 'Payment';
  description: string;
  previousBalance: number;
  amount: number;
  newBalance: number;
}

export interface IntakeRecord {
  id: string;
  date: string;
  queueItemId: string;
  staffName: string;
  details: {
    sex: string;
    spayed: string;
    basicGrooming: string[];
    addOns: string[];
    bathProduct: string;
    hairTrimLength: string;
    styleFocus: string;
    shaveShortIfMatted: string;
    dislikes: string;
    additionalConcerns: string;
  };
  weight?: number;
  signature?: string; // base4 image
}

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  stock: number;
  minStock: number;
  price: number;
  costPrice?: number;
  unit: string;
  category: string;
  image?: string;
  isConsignment: boolean;
  vendorId?: string;
  consignmentRate?: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'In' | 'Out' | 'Adjustment' | 'Damage';
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason: string;
  timestamp: string;
  staffName: string;
}

export interface StockTakeRecord {
  id: string;
  date: string;
  staffName: string;
  items: {
    itemId: string;
    itemName: string;
    systemStock: number;
    actualStock: number;
    difference: number;
  }[];
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  taxId?: string;
  address?: string;
  mainCategory?: string;
  contactPerson: string;
  phone: string;
  email: string;
  notes: string;
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
  commissionRate: number; 
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface WeightEntry {
  date: string;
  value: number;
}

export interface ServiceHistoryEntry {
  id: string;
  date: string;
  serviceName: string;
  price: number;
  size?: string;
}

export interface PackageUsage {
  id: string;
  date: string;
  serviceName: string;
  isFreebie: boolean;
}

export interface CustomerPackage {
  id: string;
  templateId: string;
  name: string;
  targetServiceId: string;
  totalSlots: number; 
  usedSlots: number;
  remainingSlots: number;
  recurringFreebie?: string;
  oneTimeFreebie?: {
    name: string;
    isUsed: boolean;
  };
  usageHistory: PackageUsage[];
  purchaseDate: string;
  expiryDate?: string;
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

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Other';
  breed: string;
  birthday: string;
  weightHistory: WeightEntry[];
  serviceHistory: ServiceHistoryEntry[];
  intakeHistory?: IntakeRecord[];
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
  points: number;
  pets: Pet[];
  packages: CustomerPackage[];
  creditBalance: number;
  creditHistory: CreditTransaction[];
  totalSpent: number;
  lineId?: string;
  // Tax Info
  taxId?: string;
  branchName?: string;
  // Address Fields
  houseNo?: string;
  villageNo?: string;
  soi?: string;
  road?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export interface TransactionItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  type: 'Service' | 'Product' | 'Credit';
  isConsignment: boolean;
  vendorId?: string;
  consignmentRate?: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  discountAmount: number;
  customerId: string;
  customerName: string;
  species: ('Dog' | 'Cat' | 'Other')[];
  paymentMethod: PaymentMethod;
  bookingType: BookingType;
  itemsCount: number;
  items: TransactionItem[];
  staffId: string; 
  staffName: string;
  processedBy: string;
  actualDuration?: number; 
  isTaxInvoice?: boolean;
  paymentDetails?: {
    cashReceived?: number;
    change?: number;
    cardLast4?: string;
    cardType?: string;
    referenceNo?: string;
    packageId?: string;
  };
}

export interface TierRule {
  level: MembershipLevel;
  label: string;
  minSpent: number;
  discount: number;
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
  icon: ServiceIcon;
  title: string;
  description: string;
  subServices: SubService[];
  category: string;
  targetSpecies: 'Dog' | 'Cat';
  coatType?: 'Short' | 'Long';
  prices: Record<string, ServicePriceInfo>;
  isActive: boolean;
  isPopular?: boolean;
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
  staffId?: string;
  startTime?: string; 
  endTime?: string;   
}

export interface CartItem {
  id: string;
  icon?: ServiceIcon;
  title: string;
  price: number;
  quantity: number;
  petId?: string;
  petName?: string;
  ownerName?: string;
  size?: string;
  queueItemId?: string;
  staffId?: string;
  staffName?: string;
  isPackageUsage?: boolean;
  type: 'Service' | 'Product' | 'Credit';
}

export interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  currentUser: { id: string; name: string; role: string; username?: string; email?: string; avatar?: string } | null;
  storeId: string | null;
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperSize: '58mm' | '80mm';
  currency: string;
  shopIsOpen: boolean;
  recurringHolidays: number[];
  specificHolidays: string[];
  
  lineLiffId: string;
  lineChannelToken: string;
  
  services: Service[];
  addons: AddonItem[];
  packageTemplates: PackageTemplate[];
  creditPackages: CreditPackageTemplate[];
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  staff: Staff[];
  inventory: InventoryItem[];
  vendors: Vendor[];
  stockMovements: StockMovement[];
  stockTakeHistory: StockTakeRecord[];
  logs: ActivityLog[];
  cart: CartItem[];
  queue: QueueItem[];
  transactions: Transaction[];
  tierRules: TierRule[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  
  slotDuration: number;
  maxCapacity: number;
  openTime: string;
  closeTime: string;
  disabledSlots: string[];
  kennelCapacity: number;
  
  login: (id: string, pass: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  setSession: (user: any) => void;
  verifyPassword: (pass: string) => boolean;
  logout: () => Promise<void>;
  
  updateBusinessProfile: (profile: { 
    shopName?: string, 
    shopLogo?: string | null,
    shopAddress?: string,
    shopPhone?: string,
    shopLineId?: string,
    receiptHeader?: string,
    receiptFooter?: string,
    receiptPaperSize?: '58mm' | '80mm',
    currency?: string,
    shopIsOpen?: boolean,
    recurringHolidays?: number[],
    specificHolidays?: string[],
    lineLiffId?: string,
    lineChannelToken?: string
  }) => void;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  customAddToCart: (item: CartItem) => void;
  clearCart: () => void;
  
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;

  addAddon: (addon: Omit<AddonItem, 'id'>) => void;
  updateAddon: (id: string, addon: Partial<AddonItem>) => void;
  deleteAddon: (id: string) => void;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>, reason?: string) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (id: string, amount: number, type: StockMovement['type'], reason: string) => void;
  saveStockTake: (record: Omit<StockTakeRecord, 'id'>) => void;

  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  addPackageTemplate: (template: Omit<PackageTemplate, 'id'>) => void;
  updatePackageTemplate: (id: string, template: Partial<PackageTemplate>) => void;
  deletePackageTemplate: (id: string) => void;
  assignPackageToCustomer: (customerId: string, templateId: string) => void;

  addCreditPackage: (pkg: Omit<CreditPackageTemplate, 'id'>) => void;
  updateCreditPackage: (id: string, pkg: Partial<CreditPackageTemplate>) => void;
  deleteCreditPackage: (id: string) => void;
  buyCreditPackage: (customerId: string, packageId: string) => void;

  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setActiveQueueItem: (id: string | null) => void;
  
  addBooking: (booking: Omit<QueueItem, 'id'>) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  removeQueueItem: (id: string) => void;
  markAsPaid: (queueItemId: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'points' | 'pets' | 'packages' | 'totalSpent' | 'creditBalance' | 'creditHistory'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  bindLineToCustomer: (customerId, lineId: string) => void;
  addPet: (customerId: string, pet: Omit<Pet, 'id'>) => void;
  updatePet: (customerId: string, petId: string, pet: Partial<Pet>) => void;
  updatePetWeight: (customerId: string, petId: string, weight: number) => void;
  saveIntakeRecord: (customerId: string, petId: string, record: Omit<IntakeRecord, 'id' | 'date'>) => void;
  processPayment: (customerId: string, amount: number, discount: number, items: CartItem[], method?: PaymentMethod, details?: Transaction['paymentDetails'], isTaxInvoice?: boolean) => void;
  
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  recalculateCustomerStats: (customerId: string) => void;

  updateTierRules: (rules: TierRule[]) => void;
  
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, staff: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  updateBookingSettings: (settings: { slotDuration?: number, maxCapacity?: number, openTime?: string, closeTime?: string, kennelCapacity?: number }) => void;
  toggleSlotStatus: (time: string) => void;
}