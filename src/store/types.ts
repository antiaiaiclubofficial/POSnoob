// ... rest of types remain same
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  discountAmount: number;
  customerId: string;
  customerName: string;
  staffId?: string; // Added for StaffPerformance
  actualDuration?: number; // Added for StaffPerformance
  items: any[];
  paymentMethod: PaymentMethod;
  staffName: string;
  species: string[];
  bookingType: BookingType;
}

export interface Partner {
  id: string;
  companyName: string;
  name?: string; // Alias for v.name
  taxId?: string;
  address?: string;
  // ... other fields
}
// ...