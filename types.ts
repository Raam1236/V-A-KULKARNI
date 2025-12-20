
import type { Dispatch, SetStateAction } from 'react';

export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
  fullName?: string;
  phone?: string;
}

export interface StockLogEntry {
  id: string;
  date: string;
  change: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  expireDate: string;
  stock: number;
  stockHistory?: StockLogEntry[];
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  loyaltyPoints: number;
  walletBalance: number;
  photo?: string;
  faceAttributes?: string;
  isVerified?: boolean; 
  isPremium?: boolean;
  // Security Fields
  otpCode?: string;
  otpExpiry?: number;
  lastOtpSent?: number;
  isSessionAuthenticated?: boolean; // Valid for current transaction only
}

export interface BillItem extends Product {
  quantity: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface Sale {
  id: string;
  date: string;
  items: BillItem[];
  total: number;
  employeeId: string;
  customerName?: string;
  customerMobile?: string;
  paymentMethod?: 'CASH' | 'UPI' | 'NET_BANKING';
  taxAmount?: number;
  walletUsed?: number;
  walletCredited?: number;
}

export interface ShopDetails {
  name: string;
  address: string;
  contact: string;
  upiId?: string;
  gstNumber?: string;
  defaultGstRate?: number;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
}

export interface Bill {
  customerName: string;
  customerMobile: string;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod?: 'CASH' | 'UPI' | 'NET_BANKING';
  billDiscount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  walletRedeemed?: number;
  customerId?: string;
}

export interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  sales: Sale[];
  addSale: (bill: Bill) => void;
  shopDetails: ShopDetails;
  updateShopDetails: (details: ShopDetails) => void;
  employees: User[];
  setEmployees: Dispatch<SetStateAction<User[]>>;
  customers: Customer[];
  setCustomers: Dispatch<SetStateAction<Customer[]>>;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}
