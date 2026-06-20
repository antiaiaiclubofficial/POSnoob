import { Language } from '@/utils/translations';

// Basic Types
export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'Package' | 'Store Credit';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant' | 'superadmin';
export type BookingType = 'Appointment' | 'Walk-in';

// Entities
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  birthday: string;
  weightHistory: { date: string; value: number }[];
  serviceHistory: any[];
  intakeHistory?: any[];
  notes: string;
  image: string;
  coatType?: 'Short' | 'Long' | string;
  color?: string;
  temperament?: string;
  vaccineBookImage?: string;
  precautions?: string;
  medicalCondition?: string;
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
  pets: Pet[];
  totalSpent: number;
  creditBalance: number;
  points?: number;
  lineId?: string;
  avatarUrl?: string;
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
  isActive: boolean;
  isPopular?: boolean;
  subServices?: SubService[];
  coatType?: 'Short' | 'Long';
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
  consignmentRate?: number;
}

export interface Partner {
  id: string;
  companyName: string;
  taxId?: string;
  address?: string;
  phone: string;
  email: string;
  contactPerson: string;
  notes: string;
  mainCategory?: string;
  gpRate: number;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  action: 'Add' | 'Adjust' | 'Sale' | 'Consignment' | 'In' | 'Out';
  oldQty: number;
  newQty: number;
  reason: string;
  staffName: string;
  timestamp: string;
}

export interface ReportHistory {
  id: string;
  reportName: string;
  filters: string;
  staffName: string;
  timestamp: string;
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
  staffId?: string;
  species: string[];
  actualDuration?: number;
  bookingType: BookingType;
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
  isPendingInvite?: boolean;
  inviteLink?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface TierRule {
  level: MembershipLevel;
  label: string;
  minSpent: number;
  discount: number;
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
  serviceId: string;
  paidSlots: number;
  freeSlots: number;
  price: number;
  recurringFreebie?: string;
  oneTimeFreebie?: string;
  bonusType?: 'none' | 'recurring' | 'limited';
  bonusName?: string;
  bonusCount?: number;
}

export interface CreditPackageTemplate {
  id: string;
  name: string;
  price: number;
  creditValue: number;
}

// App State Interface
export interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: string;
  isAuthenticated: boolean;
  currentUser: any;
  isAuthLoading: boolean;
  isPendingApproval?: boolean;
  isUserSuspended?: boolean;
  isStoreSuspended?: boolean;
  storeId: string | null;
  
  // Business Profile
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  shopIsOpen: boolean;
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperSize: '58mm' | '80mm';
  vatEnabled: boolean;
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyEmail?: string;
  vatRate?: number;
  pointsEarnRate?: number;
  pointsRedeemRate?: number;

  // LINE LIFF Settings
  liffId: string;
  liffChannelId: string;
  liffChannelSecret: string;
  liffEnabled: boolean;
  
  // Lists
  customers: Customer[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  queue: QueueItem[];
  services: Service[];
  addons: AddonItem[];
  inventory: InventoryItem[];
  partners: Partner[];
  stockLogs: StockLog[];
  reportHistory: ReportHistory[];
  transactions: Transaction[];
  tierRules: TierRule[];
  packageTemplates: PackageTemplate[];
  creditPackages: CreditPackageTemplate[];
  staff: Staff[];
  logs: ActivityLog[];
  cart: any[];
  rolePermissions: Record<StaffRole, string[]>;

  // Rules & Settings
  slotDuration: number;
  openTime: string;
  closeTime: string;
  maxCapacity: number;
  disabledSlots: string[];
  recurringHolidays: number[];
  specificHolidays: string[];
  kennelCapacity: number;

  // Actions
  login: (id: string, pass: string) => boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  logout: () => void;
  verifyPassword: (pass: string) => boolean;
  setSession: (user: any) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  addReportLog: (log: Omit<ReportHistory, 'id' | 'timestamp'>) => void;
  
  updateBusinessProfile: (profile: any) => void;
  updateBookingSettings: (settings: any) => void;
  updateTierRules: (rules: TierRule[]) => void;
  updateRolePermissions: (role: StaffRole, permissions: string[]) => void;
  
  setCustomers: (customers: Customer[]) => void;
  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setActiveQueueItem: (id: string | null) => void;
  addCustomer: (data: any) => void;
  updateCustomer: (id: string, data: any) => void;
  deleteCustomer: (id: string) => void;
  bindLineToCustomer: (customerId: string, lineId: string) => void;
  
  addPet: (customerId: string, pet: any) => void;
  updatePet: (customerId: string, petId: string, data: any) => void;
  updatePetWeight: (customerId: string, petId: string, weight: number) => void;
  saveIntakeRecord: (customerId: string, petId: string, record: any) => void;
  
  addBooking: (booking: any) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  removeQueueItem: (id: string) => void;
  toggleSlotStatus: (time: string) => void;
  maxCapacitySlot?: number;
  markAsPaid: (id: string) => void;

  addToCart: (item: any) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, delta: number) => void;
  updateCartItemDiscount: (index: number, discountType: 'percent' | 'amount' | null, discountValue: number) => void;
  clearCart: () => void;
  processPayment: (customerId: string, total: number, discount: number, items: any[], method: PaymentMethod, details: any, isTaxInvoice: boolean, redeemedPoints?: number) => void;
  deleteTransaction: (id: string) => void;

  setServices: (services: Service[]) => void;
  addService: (service: any) => void;
  updateService: (id: string, service: any) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  
  addAddon: (addon: any) => void;
  updateAddon: (id: string, addon: any) => void;
  deleteAddon: (id: string) => void;
  
  addInventoryItem: (item: any) => void;
  updateInventoryItem: (id: string, item: any) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (id: string, qty: number, mode: 'Add' | 'Set' | 'In' | 'Out', reason: string) => void;
  
  addPartner: (partner: any) => void;
  updatePartner: (id: string, partner: any) => void;
  deletePartner: (id: string) => void;
  
  addStaff: (staff: any) => void;
  updateStaff: (id: string, staff: any) => void;
  deleteStaff: (id: string) => void;
  
  addPackageTemplate: (pkg: any) => void;
  updatePackageTemplate: (id: string, pkg: any) => void;
  deletePackageTemplate: (id: string) => void;
  assignPackageToCustomer: (customerId: string, templateId: string) => void;
  
  addCreditPackage: (pkg: any) => void;
  updateCreditPackage: (id: string, pkg: any) => void;
  deleteCreditPackage: (id: string) => void;
  buyCreditPackage: (customerId: string, packageId: string) => void;
}