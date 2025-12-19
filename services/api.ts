import { Customer, Product, Rental, User, CustomerTier, AppSettings } from "../types";

/**
 * Advanced Cloud API Service
 * Integrates with Netlify Functions (Neon Database) and fallback systems.
 */

// Try Netlify Function endpoint first, then standard api.php for cPanel
const NETLIFY_API = '/.netlify/functions/api';
const PHP_API = 'api.php';

const getLocalKey = (type: string) => 'gmd_cloud_cache_' + type;

const fetchFromCloud = async (type: string) => {
    try {
        // Attempt Netlify Function
        let response = await fetch(`${NETLIFY_API}?type=${type}`);
        
        // If not found or error, try PHP fallback
        if (!response.ok) {
            response = await fetch(`${PHP_API}?action=get&type=${type}`);
        }
        
        if (response.ok) {
            const data = await response.json();
            if (data) {
              localStorage.setItem(getLocalKey(type), JSON.stringify(data));
              return data;
            }
        }
    } catch (e) {
        console.debug(`Cloud fetch failed for ${type}, using cache.`);
    }
    
    // Recovery from local cache
    const saved = localStorage.getItem(getLocalKey(type));
    return saved ? JSON.parse(saved) : [];
};

const saveToCloud = async (type: string, data: any) => {
    // Immediate local update for UI snappiness
    localStorage.setItem(getLocalKey(type), JSON.stringify(data));
    
    try {
        // Attempt Netlify Function save
        const response = await fetch(`${NETLIFY_API}?type=${type}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
          // Fallback to PHP save
          await fetch(`${PHP_API}?action=save&type=${type}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });
        }
    } catch (e) {
        console.debug(`Cloud save delayed for ${type}.`);
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
  getUsers: async (): Promise<User[]> => fetchFromCloud('users'),
  saveUsers: async (users: User[]) => saveToCloud('users', users),

  getProducts: async (): Promise<Product[]> => fetchFromCloud('products'),
  saveProducts: async (products: Product[]) => saveToCloud('products', products),

  getCustomers: async (): Promise<Customer[]> => fetchFromCloud('customers'),
  saveCustomers: async (customers: Customer[]) => saveToCloud('customers', customers),
  
  recalculateCustomerTier: (customer: Customer): Customer => {
    if (customer.totalSpent > 500000) customer.tier = CustomerTier.PLATINUM;
    else if (customer.totalSpent > 200000) customer.tier = CustomerTier.GOLD;
    else if (customer.totalSpent > 50000) customer.tier = CustomerTier.SILVER;
    else if (customer.totalSpent > 10000) customer.tier = CustomerTier.BRONZE;
    else customer.tier = CustomerTier.NEW;
    return customer;
  },

  getRentals: async (): Promise<Rental[]> => fetchFromCloud('rentals'),
  saveRentals: async (rentals: Rental[]) => saveToCloud('rentals', rentals),

  getSettings: (): AppSettings => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    saveToCloud('settings', settings); 
  },
};