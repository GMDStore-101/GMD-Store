import { Customer, Product, Rental, User, CustomerTier, AppSettings } from "../types";
import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_RENTALS } from "../constants";

const STORAGE_KEYS = {
  USERS: 'gmd_users',
  PRODUCTS: 'gmd_products',
  CUSTOMERS: 'gmd_customers',
  RENTALS: 'gmd_rentals',
  SETTINGS: 'gmd_settings'
};

const loadData = (key: string, defaults: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaults;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return defaults;
  }
};

const saveData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`CRITICAL: Failed to save ${key} to localStorage (Storage full?):`, e);
    // Do not throw here to prevent React from crashing the whole app
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'GMD Shuttering Store',
  tagline: 'Shuttering & Scaffold',
  storeAddress: 'Main Market, Industrial Area',
  storePhone: '0300-1234567',
  ownerName: 'Owner Name',
  theme: 'slate'
};

export const api = {
  // Users
  getUsers: (): User[] => loadData(STORAGE_KEYS.USERS, []),
  saveUsers: (users: User[]) => saveData(STORAGE_KEYS.USERS, users),

  // Products
  getProducts: (): Product[] => loadData(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS),
  saveProducts: (products: Product[]) => saveData(STORAGE_KEYS.PRODUCTS, products),

  // Customers
  getCustomers: (): Customer[] => loadData(STORAGE_KEYS.CUSTOMERS, MOCK_CUSTOMERS),
  saveCustomers: (customers: Customer[]) => saveData(STORAGE_KEYS.CUSTOMERS, customers),
  
  // Update Customer Tier Logic
  recalculateCustomerTier: (customer: Customer): Customer => {
    if (customer.totalSpent > 500000) customer.tier = CustomerTier.PLATINUM;
    else if (customer.totalSpent > 200000) customer.tier = CustomerTier.GOLD;
    else if (customer.totalSpent > 50000) customer.tier = CustomerTier.SILVER;
    else if (customer.totalSpent > 10000) customer.tier = CustomerTier.BRONZE;
    else customer.tier = CustomerTier.NEW;
    return customer;
  },

  // Rentals
  getRentals: (): Rental[] => loadData(STORAGE_KEYS.RENTALS, MOCK_RENTALS),
  saveRentals: (rentals: Rental[]) => saveData(STORAGE_KEYS.RENTALS, rentals),

  // Settings
  getSettings: (): AppSettings => loadData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  saveSettings: (settings: AppSettings) => saveData(STORAGE_KEYS.SETTINGS, settings),
};