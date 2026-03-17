import Dexie, { type Table } from 'dexie';

export interface CachedProduct {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
  store_id: string;
  company_id: string;
  default_price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  unit?: string;
  image_url?: string;
  is_active: boolean;
  cached_at: number; // timestamp
}

export interface CachedCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  store_id: string;
  company_id: string;
  is_active: boolean;
  cached_at: number;
}

export interface CachedStore {
  id: string;
  name: string;
  address?: string;
  company_id: string;
  is_active: boolean;
  cached_at: number;
}

export interface CachedCustomer {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  company_id: string;
  balance?: number;
  cached_at: number;
}

export interface PendingSale {
  id: string; // local UUID
  store_id: string;
  company_id: string;
  items: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    barcode?: string;
    image_url?: string;
    discount_amount: number;
    discount_percent: number;
  }>;
  payment_method: string;
  subtotal: number;
  discount_amount: number;
  discount_type: string | null;
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  notes?: string;
  created_at: number; // timestamp
  sync_status: 'pending' | 'syncing' | 'failed';
  retry_count: number;
}

export interface AuthCache {
  id: string; // always 'current_user'
  user_id: string;
  email: string;
  password_hash: string; // SHA-256 of password
  name: string;
  user_type: string;
  company_id: string;
  company_name: string;
  token: string;
  cached_at: number;
}

class TindaPOSDatabase extends Dexie {
  products!: Table<CachedProduct>;
  categories!: Table<CachedCategory>;
  stores!: Table<CachedStore>;
  customers!: Table<CachedCustomer>;
  pending_sales!: Table<PendingSale>;
  auth_cache!: Table<AuthCache>;

  constructor() {
    super('TindaPOSOffline');
    this.version(1).stores({
      products: 'id, store_id, company_id, category_id, barcode',
      categories: 'id, store_id, company_id',
      stores: 'id, company_id',
      customers: 'id, company_id',
      pending_sales: 'id, company_id, store_id, sync_status, created_at',
      auth_cache: 'id, email',
    });
  }
}

export const localDb = new TindaPOSDatabase();

// Helper to generate a local UUID for pending sales
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Hash password using SHA-256 (Web Crypto API — works in browser + Capacitor)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
