import { Customer, Product, Rental, User, CustomerTier, AppSettings } from "../types";

/**
 * API Service
 * Handles both local persistence and server-side sync (if available).
 */

const API_URL = 'api.php';

// Internal helper for localStorage keys
const getLocalKey = (type: string) => 'gmd_backup_' + type;

const fetchFromHost = async (type: string) => {
    try {
        const url = `${API_URL}?action=get&type=${type}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        localStorage.setItem(getLocalKey(type), JSON.stringify(data));
        return data;
    } catch (e) {
        // This is critical for Netlify: it falls back to LocalStorage if api.php isn't there
        console.warn(`Sync unavailable for ${type}. Using local storage.`);
        const saved = localStorage.getItem(getLocalKey(type));
        return saved ? JSON.parse(saved) : [];
    }
};

const saveToHost = async (type: string, data: any) => {
    // Always save locally first for speed and offline support
    localStorage.setItem(getLocalKey(type), JSON.stringify(data));
    
    try {
        const url = `${API_URL}?action=save&type=${type}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            console.debug('Host update skipped (No backend detected).');
        }
    } catch (e) {
        // Silently fail as the data is already in LocalStorage
    }
};

const STORAGE_KEYS = {
  SETTINGS: 'gmd_settings'
};

const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'GMD Shuttering Store',
  tagline: 'Shuttering & Scaffold',
  storeAddress: 'Main Market, Haveli Lakha',
  storePhone: '0302-4983711',
  ownerName: 'Ghulam Mustafa Doula',
  theme: 'slate'
};

export const api = {
  getUsers: async (): Promise<User[]> => fetchFromHost('users'),
  saveUsers: async (users: User[]) => saveToHost('users', users),

  getProducts: async (): Promise<Product[]> => fetchFromHost('products'),
  saveProducts: async (products: Product[]) => saveToHost('products', products),

  getCustomers: async (): Promise<Customer[]> => fetchFromHost('customers'),
  saveCustomers: async (customers: Customer[]) => saveToHost('customers', customers),
  
  recalculateCustomerTier: (customer: Customer): Customer => {
    if (customer.totalSpent > 500000) customer.tier = CustomerTier.PLATINUM;
    else if (customer.totalSpent > 200000) customer.tier = CustomerTier.GOLD;
    else if (customer.totalSpent > 50000) customer.tier = CustomerTier.SILVER;
    else if (customer.totalSpent > 10000) customer.tier = CustomerTier.BRONZE;
    else customer.tier = CustomerTier.NEW;
    return customer;
  },

  getRentals: async (): Promise<Rental[]> => fetchFromHost('rentals'),
  saveRentals: async (rentals: Rental[]) => saveToHost('rentals', rentals),

  getSettings: (): AppSettings => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    saveToHost('settings', settings); 
  },
};