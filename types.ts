export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  photo?: string;
}

export enum CustomerTier {
  NEW = 'New',
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum'
}

export enum RentalStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue',
  PARTIAL = 'Partial Return'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  rate: number;
  image: string;
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  cnic: string;
  photo?: string;
  cnicFront?: string;
  cnicBack?: string;
  guarantorName: string;
  guarantorPhone: string;
  tier: CustomerTier;
  totalSpent: number;
  totalDebt: number; // Udhaar/Credit amount
  activeRentalsCount: number;
  rating: number;
}

export interface RentalItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;        
  returnedQuantity: number; 
  unitPrice: number;
}

export interface Invoice {
  id: string;
  rentalId: string;
  date: string;
  items: { productName: string; quantity: number; days: number; amount: number }[];
  subTotal: number;
  discount: number;
  totalAmount: number; // Final Bill Amount (Current Transaction)
  advanceAdjusted?: number; 
  
  // Payment Tracking
  previousDebt: number; // Debt BEFORE this transaction
  receivedAmount: number; // Cash taken
  balanceDue: number; // Final Debt AFTER this transaction
  isPaid?: boolean;
  
  createdBy: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

export interface Rental {
  id: string;
  customerId: string;
  customerName: string;
  startDate: string;
  expectedReturnDate: string;
  status: RentalStatus;
  items: RentalItem[];
  advancePayment: number; 
  totalAmount: number;
  notes?: string;
  invoices: Invoice[];
}

export interface AppSettings {
  storeName: string;
  tagline: string;
  storeAddress: string;
  storePhone: string;
  ownerName: string;
  logoUrl?: string;
  theme: 'slate';
}