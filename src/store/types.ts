"use client";

import { Language } from '@/utils/translations';

// Basic Types
export interface Organization {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  organization_id?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
}

export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'Package' | 'Store Credit';
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
  address?: string;
  branchName?: string;
  houseNo?: string;
  villageNo?: string;
  soi?: string;
  road?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  createdAt?: string;
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

export interface FifoBatch {
  id: string;
  quantity: number;
  costPrice: number;
  created_at: string;
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
  fifoBatches?: FifoBatch[];
  reorderQuantity?: number;
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
  costPrice?: number;
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
  createdAt?: string;
  amount: number;
  discountAmount: number;
  subtotal?: number;
  vatAmount?: number;
  vatRate?: number;
  isTaxInvoice?: boolean;
  details?: any;
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
export interface GoodsReceiptItem {
  productId: string;
  productName: string;
  quantityExpected: number;
  quantityReceived: number;
  unitPrice: number;
  total: number;
  remarks?: string;
}

export interface GoodsReceipt {
  id: string;
  date: string;
  poId?: string;
  partnerId: string;
  items: GoodsReceiptItem[];
  status: 'Pending' | 'On Order' | 'Completed' | 'Cancelled';
  totalAmount: number;
  receiverName: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  partnerId: string;
  items: PurchaseOrderItem[];
  status: 'Pending' | 'To Order' | 'On Order' | 'Completed' | 'Cancelled';
  totalAmount: number;
  createdBy: string;
}

export interface PurchaseRequestItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseRequest {
  id: string;
  date: string;
  partnerId: string;
  items: PurchaseRequestItem[];
  status: 'Pending' | 'Approved' | 'Cancelled';
  totalAmount: number;
  createdBy: string;
}

export interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType?: 'product' | 'service' | 'addon' | 'package' | 'credit';
}

export interface Quotation {
  id: string;
  date: string;
  partnerId?: string;
  customerName?: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerPhone?: string;
  items: QuotationItem[];
  status: 'Pending' | 'Completed' | 'Cancelled';
  totalAmount: number;
  createdBy: string;
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  date: string;
  partnerId: string; // Or customerId if it makes sense, but we'll use partnerId to match Quotation clone for now
  items: SalesOrderItem[];
  status: 'Pending' | 'Completed' | 'Cancelled';
  totalAmount: number;
  createdBy: string;
}

export type BillingDocumentType = 'receipt' | 'tax_invoice' | 'invoice' | 'short_receipt';

export interface BillingDocumentItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType?: 'product' | 'service' | 'addon' | 'package' | 'credit';
}

export interface BillingDocument {
  id: string;
  documentNo: string;
  type: BillingDocumentType;
  date: string;
  partnerId?: string;
  customerId?: string;
  customerName?: string;
  customerAddress?: string;
  customerTaxId?: string;
  items: BillingDocumentItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
  remarks?: string;
  referenceDocumentNo?: string;
  createdBy: string;
}

export interface Role {
  id: string;
  store_id: string | null;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
}

export type StaffRole = string; // Make StaffRole dynamic

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
  baseSalary?: number;
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

export interface HeldBill {
  id: string;
  customerId: string;
  customerName: string;
  items: any[];
  timestamp: string;
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
  storeId: string | null; // This now acts as active Branch ID
  organizationId: string | null;
  organizationName?: string;
  branches: Branch[];
  setStoreId: (id: string | null) => void;

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
  vatInclusive: boolean;
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyEmail?: string;
  vatRate?: number;
  pointsEarnRate?: number;
  pointsRedeemRate?: number;
  maxUsers?: number;
  maxStaff?: number;

  // LINE LIFF Settings
  liffId: string;
  liffChannelId: string;
  liffChannelSecret: string;
  liffEnabled: boolean;

  // Hardware Settings
  scannerType: 'hid' | 'serial';
  printerType: 'none' | 'serial' | 'bluetooth' | 'browser';
  updateHardwareSettings: (settings: { scannerType?: 'hid' | 'serial', printerType?: 'none' | 'serial' | 'bluetooth' | 'browser' }) => void;

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
  roles: Role[]; // Add roles to AppState
  cart: any[];
  heldBills: HeldBill[];
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
  setSession: (user: any, navigate: any) => void; // Add navigate
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  addReportLog: (log: Omit<ReportHistory, 'id' | 'timestamp'>) => void;

  updateBusinessProfile: (profile: any, showToast?: boolean) => void;
  updateBookingSettings: (settings: any, showToast?: boolean) => void;
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
  processPayment: (customerId: string, total: number, discount: number, items: any[], method: PaymentMethod, details: any, isTaxInvoice: boolean, redeemedPoints?: number, subtotal?: number, vatAmount?: number, vatRate?: number) => Promise<any>;
  deleteTransaction: (id: string) => void;
  holdBill: (customerId: string, customerName: string, items: any[]) => void;
  removeHeldBill: (id: string) => void;
  setHeldBills: (bills: HeldBill[]) => void;

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
  adjustStock: (id: string, qty: number, mode: 'Add' | 'Set' | 'In' | 'Out', reason: string, replenishmentCostPrice?: number) => void;

  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseOrder: (id: string, updates: Partial<Omit<PurchaseOrder, 'id'>>) => void;
  updatePurchaseOrderStatus: (id: string, status: 'Pending' | 'To Order' | 'On Order' | 'Completed' | 'Cancelled') => void;

  goodsReceipts: GoodsReceipt[];
  addGoodsReceipt: (gr: Omit<GoodsReceipt, 'id'>) => void;
  updateGoodsReceipt: (id: string, updates: Partial<Omit<GoodsReceipt, 'id'>>) => void;
  updateGoodsReceiptStatus: (id: string, status: 'Pending' | 'On Order' | 'Completed' | 'Cancelled') => void;

  purchaseRequests: PurchaseRequest[];
  addPurchaseRequest: (pr: Omit<PurchaseRequest, 'id'>) => void;
  updatePurchaseRequest: (id: string, updates: Partial<Omit<PurchaseRequest, 'id'>>) => void;
  updatePurchaseRequestStatus: (id: string, status: 'Pending' | 'Approved' | 'Cancelled') => void;
  approvePurchaseRequestToPO: (id: string) => void;

  quotations: Quotation[];
  addQuotation: (qt: Omit<Quotation, 'id'>) => void;
  updateQuotation: (id: string, updates: Partial<Omit<Quotation, 'id'>>) => void;
  updateQuotationStatus: (id: string, status: 'Pending' | 'Completed' | 'Cancelled') => void;

  salesOrders: SalesOrder[];
  addSalesOrder: (so: Omit<SalesOrder, 'id'>) => void;
  updateSalesOrder: (id: string, updates: Partial<Omit<SalesOrder, 'id'>>) => void;
  updateSalesOrderStatus: (id: string, status: 'Pending' | 'Completed' | 'Cancelled') => void;

  addPartner: (partner: any) => Promise<any>;
  updatePartner: (id: string, partner: any) => void;
  deletePartner: (id: string) => void;

  addStaff: (staff: any) => void;
  updateStaff: (id: string, staff: any) => void;
  deleteStaff: (id: string) => void;

  addRole: (role: Omit<Role, 'id' | 'created_at'>) => Promise<void>; // Add role actions
  updateRole: (id: string, role: Partial<Omit<Role, 'id' | 'created_at'>>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;

  addPackageTemplate: (pkg: any) => void;
  updatePackageTemplate: (id: string, pkg: any) => void;
  deletePackageTemplate: (id: string) => void;
  assignPackageToCustomer: (customerId: string, templateId: string) => void;

  addCreditPackage: (pkg: any) => void;
  updateCreditPackage: (id: string, pkg: any) => void;
  deleteCreditPackage: (id: string) => void;
  buyCreditPackage: (customerId: string, packageId: string) => void;

  // Staff Settings
  staffSettings: StaffSettings;
  updateStaffSettings: (settings: Partial<StaffSettings>) => Promise<void>;

  // Accounting System
  accountCodes: AccountCode[];
  journalEntries: JournalEntry[];
  taxRecords: TaxRecord[];
  
  setAccountCodes: (codes: AccountCode[]) => void;
  addAccountCode: (code: Omit<AccountCode, 'id'>) => void;
  updateAccountCode: (id: string, code: Partial<Omit<AccountCode, 'id'>>) => void;
  deleteAccountCode: (id: string) => void;
  
  setJournalEntries: (entries: JournalEntry[]) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  updateJournalEntryStatus: (id: string, status: 'Draft' | 'Posted' | 'Void') => void;
  
  setTaxRecords: (records: TaxRecord[]) => void;
  addTaxRecord: (record: Omit<TaxRecord, 'id'>) => void;
  updateTaxRecordStatus: (id: string, status: 'Pending' | 'Filed' | 'Cancelled') => void;

  // Billing Documents
  billingDocuments: BillingDocument[];
  addBillingDocument: (doc: Omit<BillingDocument, 'id'>) => void;
  updateBillingDocument: (id: string, updates: Partial<Omit<BillingDocument, 'id'>>) => void;
  updateBillingDocumentStatus: (id: string, status: 'Pending' | 'Paid' | 'Cancelled') => void;
  deleteBillingDocument: (id: string) => void;
}

export interface DeductionPreset {
  id: string;
  name: string;
  amount: number;
}

export interface StaffSettings {
  attendance: {
    requireGps: boolean;
    lateBufferMinutes: number;
    autoCheckoutTime: string;
  };
  schedule: {
    allowShiftSwapping: boolean;
    minHoursBetweenShifts: number;
    releaseNoticeDays: number;
  };
  payroll: {
    payFrequency: 'monthly' | 'semi-monthly' | 'weekly';
    payDayOfMonth: number;
    overtimeRate: number;
    socialSecurityRate: number;
    deductionPresets?: DeductionPreset[];
  };
}

// --- Accounting System Types ---
export type AccountCategory = 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';

export interface AccountCode {
  id: string;
  code: string;
  name: string;
  category: AccountCategory;
  description?: string;
  isActive: boolean;
}

export type JournalType = 'JV' | 'PJ' | 'SJ' | 'CR' | 'CP';

export interface JournalEntryLine {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  journalType: JournalType;
  referenceNo?: string;
  description: string;
  lines: JournalEntryLine[];
  status: 'Draft' | 'Posted' | 'Void';
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  isOpeningBalance?: boolean;
  isClosingEntry?: boolean;
}

export type TaxType = 'Input' | 'Output' | 'Withholding';

export interface TaxRecord {
  id: string;
  date: string;
  type: TaxType;
  referenceNo: string;
  partnerName: string;
  taxId: string;
  baseAmount: number;
  taxRate: number;
  taxAmount: number;
  journalEntryId?: string;
  status: 'Pending' | 'Filed' | 'Cancelled';
}

// --- Hotel System Types ---
export interface HotelRoomType {
  id: string;
  typeName: string;
  color: 'gray' | 'blue' | 'pink' | 'green' | 'purple' | 'amber';
  sortOrder: number;
}

export interface HotelRoom {
  id: string;
  roomName: string;
  roomTypeId: string | null;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  description?: string;
  photoUrl?: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  isActive: boolean;
  sortOrder: number;
}

export interface HotelBooking {
  id: string;
  bookingCode?: string;
  roomId: string;
  customerId: string;
  petId: string;
  checkInDate: string;
  checkOutExpected: string;
  checkOutActual?: string | null;
  status: 'reserved' | 'checked_in' | 'checked_out' | 'cancelled';
  specialRequests?: string;
  healthNotes?: string;
  depositAmount: number;
  notes?: string;
  customer?: Customer;
  pet?: Pet;
  room?: HotelRoom;
}

export interface HotelActivity {
  id: string;
  bookingId: string;
  petId: string;
  activityType: 'feeding' | 'walk' | 'medication' | 'grooming' | 'playtime' | 'cleaning' | 'custom';
  title?: string;
  scheduledTime: string;
  status: 'pending' | 'done' | 'missed';
  assignedStaffId?: string;
  note?: string;
}

export interface HotelBookingCharge {
  id: string;
  bookingId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  chargeType: 'service' | 'product';
}