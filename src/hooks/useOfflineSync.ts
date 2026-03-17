import { useEffect, useRef, useCallback } from 'react';
import { localDb } from '@/db/localDb';
import { useNetworkStatus } from './useNetworkStatus';
import API_CONFIG from '@/config/api';

export function useOfflineSync() {
  const isOnline = useNetworkStatus();
  const syncingRef = useRef(false);

  const syncPendingSales = useCallback(async () => {
    if (syncingRef.current) return;

    const pending = await localDb.pending_sales
      .where('sync_status').anyOf(['pending', 'failed'])
      .toArray();

    if (pending.length === 0) return;

    syncingRef.current = true;
    console.log(`🔄 Syncing ${pending.length} pending sale(s)...`);

    const token = localStorage.getItem('authToken');
    if (!token) {
      syncingRef.current = false;
      return;
    }

    for (const sale of pending) {
      if (sale.retry_count >= 3) {
        // Give up after 3 retries
        await localDb.pending_sales.update(sale.id, { sync_status: 'failed' });
        continue;
      }

      try {
        await localDb.pending_sales.update(sale.id, { sync_status: 'syncing' });

        const response = await fetch(`${API_CONFIG.BASE_URL}/pos/sales`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            store_id: sale.store_id,
            items: sale.items,
            payment_method: sale.payment_method,
            subtotal: sale.subtotal,
            discount_amount: sale.discount_amount,
            discount_type: sale.discount_type,
            total_amount: sale.total_amount,
            customer_name: sale.customer_name,
            customer_phone: sale.customer_phone,
            customer_id: sale.customer_id,
            notes: sale.notes,
            offline_created_at: new Date(sale.created_at).toISOString()
          })
        });

        if (response.ok) {
          await localDb.pending_sales.delete(sale.id);
          console.log(`✅ Synced sale ${sale.id}`);
        } else {
          await localDb.pending_sales.update(sale.id, {
            sync_status: 'failed',
            retry_count: sale.retry_count + 1
          });
        }
      } catch {
        await localDb.pending_sales.update(sale.id, {
          sync_status: 'pending',
          retry_count: sale.retry_count + 1
        });
      }
    }

    syncingRef.current = false;
  }, []);

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline) {
      syncPendingSales();
    }
  }, [isOnline, syncPendingSales]);

  return { syncPendingSales };
}

// Cache products, categories, stores for offline use
export async function cacheDataForOffline(
  token: string,
  companyId: string,
  storeId: string
): Promise<void> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const [productsRes, categoriesRes, storesRes, customersRes] = await Promise.allSettled([
      fetch(`${API_CONFIG.BASE_URL}/client/products?store_id=${storeId}&limit=1000`, { headers }),
      fetch(`${API_CONFIG.BASE_URL}/client/categories?store_id=${storeId}`, { headers }),
      fetch(`${API_CONFIG.BASE_URL}/client/stores`, { headers }),
      fetch(`${API_CONFIG.BASE_URL}/client/utang/customers`, { headers }),
    ]);

    const now = Date.now();

    if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
      const data = await productsRes.value.json();
      const products = (data.data || data.products || []).map((p: any) => ({
        ...p,
        company_id: companyId,
        cached_at: now
      }));
      await localDb.products.bulkPut(products);
      console.log(`📦 Cached ${products.length} products`);
    }

    if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
      const data = await categoriesRes.value.json();
      const categories = (data.data || data.categories || []).map((c: any) => ({
        ...c,
        company_id: companyId,
        cached_at: now
      }));
      await localDb.categories.bulkPut(categories);
      console.log(`📂 Cached ${categories.length} categories`);
    }

    if (storesRes.status === 'fulfilled' && storesRes.value.ok) {
      const data = await storesRes.value.json();
      const stores = (data.data || data.stores || []).map((s: any) => ({
        ...s,
        company_id: companyId,
        cached_at: now
      }));
      await localDb.stores.bulkPut(stores);
      console.log(`🏪 Cached ${stores.length} stores`);
    }

    if (customersRes.status === 'fulfilled' && customersRes.value.ok) {
      const data = await customersRes.value.json();
      const customers = (data.data || data.customers || []).map((c: any) => ({
        ...c,
        company_id: companyId,
        cached_at: now
      }));
      await localDb.customers.bulkPut(customers);
      console.log(`👥 Cached ${customers.length} customers`);
    }
  } catch (err) {
    console.warn('⚠️ Cache update failed:', err);
  }
}
