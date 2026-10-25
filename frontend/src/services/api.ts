/**
 * Backend API Client Service for Rakib Silk & Fashion (Tally Khata).
 *
 * Provides typed HTTP communication with the remote MongoDB / Node.js backend on Render:
 * - Authentication (Registration & Login)
 * - Saree Inventory CRUD & Bulk Data Reset
 * - Loom Batch Production Management
 * - Financial Ledger Transactions (Single & Bulk)
 * - Customer Directory Synchronization
 * - Cloudinary Image Storage Proxy & Cleanup
 * - Real-Time Request Latency Telemetry
 */

import { InventoryItem, ProductionItem, TransactionItem, AuthResponse } from '../types';

/** Base URL for the production backend microservice (configurable via VITE_API_URL or defaults to live Render URL) */
export const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'https://rakib-fashion-backend.onrender.com/v1';

let lastLatency = 0;
const latencyListeners: Array<(latency: number) => void> = [];

/**
 * Subscribes a listener callback to round-trip HTTP latency updates (in milliseconds).
 *
 * @param listener - Callback receiving the round-trip duration of the last API call.
 * @returns Unsubscribe function.
 */
export function subscribeLatency(listener: (latency: number) => void): () => void {
  latencyListeners.push(listener);
  return () => {
    const idx = latencyListeners.indexOf(listener);
    if (idx !== -1) latencyListeners.splice(idx, 1);
  };
}

/**
 * Retrieves the latest recorded network round-trip latency in milliseconds.
 */
export function getLastLatency(): number {
  return lastLatency;
}

/**
 * Broadcasts the elapsed round-trip duration to all registered telemetry listeners.
 */
function notifyLatency(ms: number): void {
  lastLatency = ms;
  for (const listener of latencyListeners) {
    listener(ms);
  }
}

/**
 * Core generic HTTP requester with automatic email tenant isolation headers,
 * JSON error parsing, and latency benchmarking.
 *
 * @template T - Expected JSON response shape.
 * @param path - API path relative to {@link BASE_URL}.
 * @param options - Fetch RequestInit configuration.
 * @param userEmail - Optional explicit user email override for multi-tenant isolation.
 * @returns Parsed JSON response payload.
 * @throws Error on network failure or non-2xx HTTP status codes.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  userEmail?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const email = userEmail || sessionStorage.getItem('rakib_user_email');
  if (email) {
    headers['X-User-Email'] = email;
  }

  const startTime = performance.now();
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - startTime);
    notifyLatency(elapsed);
    const msg = err instanceof Error ? err.message : 'Network request failed';
    throw new Error(`Connection error: ${msg}. If this is the first request, the server may be waking up.`);
  }

  const elapsed = Math.round(performance.now() - startTime);
  notifyLatency(elapsed);

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`;
    if (data) {
      if (typeof data === 'string') {
        errMsg = data;
      } else if (data.message) {
        errMsg = data.message;
      } else if (data.error) {
        errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      }
    }
    throw new Error(errMsg);
  }

  return data as T;
}

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

/**
 * Registers a new merchant account.
 *
 * @param email - Merchant email address.
 * @param password - Merchant password.
 * @returns AuthResponse containing authenticated user credentials.
 */
export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Authenticates an existing merchant account.
 *
 * @param email - Merchant email address.
 * @param password - Account password.
 * @returns AuthResponse containing access token and user metadata.
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/* ==========================================================================
   INVENTORY MANAGEMENT ENDPOINTS
   ========================================================================== */

/**
 * Fetches all active (non-soft-deleted) saree inventory items for the current merchant.
 *
 * @returns Array of inventory records.
 */
export async function getInventory(): Promise<InventoryItem[]> {
  const res = await request<any>('/inventory', { method: 'GET' });
  const items: InventoryItem[] = Array.isArray(res) ? res : (res?.data || res?.items || []);
  return items.filter((item) => !item.isDeleted);
}

/**
 * Creates or updates a saree inventory item.
 *
 * @param item - Full inventory item data payload.
 */
export async function saveInventoryItem(item: InventoryItem): Promise<any> {
  return request('/inventory/item', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

/**
 * Marks or deletes an inventory item by ID.
 *
 * @param id - Numerical inventory record ID.
 */
export async function deleteInventoryItem(id: number): Promise<any> {
  return request(`/inventory/item/${id}`, {
    method: 'DELETE',
  });
}

export interface SellRequestPayload {
  itemId: number;
  quantity: number;
  unitPrice?: number;
  customerName?: string;
  customerNumber?: string;
  notes?: string;
}

export interface SellResponsePayload {
  status: string;
  message: string;
  remainingStock: number;
  updatedItem: InventoryItem;
  transaction: TransactionItem;
}

/**
 * Atomically executes a sale on the server:
 * - Checks that stock is >= quantity with MongoDB atomic locks
 * - Prevents overselling across multiple simultaneous devices
 * - Bundles the SELL_OUT transaction record in the same atomic call
 */
export async function sellInventoryItemAtomic(payload: SellRequestPayload): Promise<SellResponsePayload> {
  return request<SellResponsePayload>('/inventory/sell', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Sequentially wipes all test inventory records for testing purposes.
 *
 * @param currentItems - List of inventory items to purge.
 */
export async function resetInventoryData(currentItems: InventoryItem[]): Promise<void> {
  for (const item of currentItems) {
    try {
      await deleteInventoryItem(item.id);
    } catch {
      // Continue deleting remaining items even if an individual delete fails
    }
  }
}

/* ==========================================================================
   PRODUCTION ORDERS ENDPOINTS
   ========================================================================== */

/**
 * Retrieves all active loom batch production orders for the merchant.
 *
 * @returns Array of production order items.
 */
export async function getProduction(): Promise<ProductionItem[]> {
  const res = await request<any>('/production', { method: 'GET' });
  const items: ProductionItem[] = Array.isArray(res) ? res : (res?.data || res?.items || []);
  return items.filter((item) => !item.isDeleted);
}

/**
 * Saves a batch of production orders to the loom queue.
 *
 * @param items - Array of production order records.
 */
export async function saveProductionItems(items: ProductionItem[]): Promise<any> {
  return request('/production', {
    method: 'POST',
    body: JSON.stringify(items),
  });
}

/**
 * Deletes a production batch order by ID.
 *
 * @param id - Numerical production record ID.
 */
export async function deleteProductionItem(id: number): Promise<any> {
  return request(`/production/item/${id}`, {
    method: 'DELETE',
  });
}

/* ==========================================================================
   FINANCIAL TRANSACTIONS ENDPOINTS
   ========================================================================== */

/**
 * Fetches all recorded ledger transactions (Sales, Expenses, Purchases, etc.).
 *
 * @returns Array of financial transaction records.
 */
export async function getTransactions(): Promise<TransactionItem[]> {
  const res = await request<any>('/transactions', { method: 'GET' });
  const items: TransactionItem[] = Array.isArray(res) ? res : (res?.data || res?.items || []);
  return items;
}

/**
 * Persists an individual commercial transaction record to the ledger.
 *
 * @param item - Transaction item details.
 */
export async function saveTransaction(item: TransactionItem): Promise<any> {
  return request('/transactions', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

/**
 * Persists a bulk array of commercial transactions (e.g. multi-item cart purchases or sales).
 *
 * @param items - Array of transaction item details.
 */
export async function saveBulkTransactions(items: TransactionItem[]): Promise<any> {
  return request('/transactions', {
    method: 'POST',
    body: JSON.stringify(items),
  });
}

/* ==========================================================================
   CUSTOMER PROFILE ENDPOINTS
   ========================================================================== */

/**
 * Updates a customer's name and contact number across all associated transactions.
 *
 * @param oldName - Previous customer name.
 * @param oldNumber - Previous customer phone number.
 * @param newName - Updated customer name.
 * @param newNumber - Updated customer phone number.
 */
export async function updateCustomer(
  oldName: string,
  oldNumber: string,
  newName: string,
  newNumber: string
): Promise<any> {
  return request('/customers/update', {
    method: 'POST',
    body: JSON.stringify({ oldName, oldNumber, newName, newNumber }),
  });
}

/* ==========================================================================
   IMAGE ASSET STORAGE ENDPOINTS
   ========================================================================== */

/**
 * Uploads a binary image file via multipart form-data to the backend Cloudinary proxy.
 *
 * @param file - Image file selected from disk or camera.
 * @returns Publicly accessible CDN image URL.
 */
export async function uploadImageFile(file: File): Promise<string> {
  const email = sessionStorage.getItem('rakib_user_email');
  const formData = new FormData();
  formData.append('image', file);

  const headers: Record<string, string> = {};
  if (email) {
    headers['X-User-Email'] = email;
  }

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.imageUrl;
}

/**
 * Requests deletion of a stored asset from the backend Cloudinary bucket.
 * Non-critical operation: fails gracefully without interrupting user workflow.
 *
 * @param imageUrl - Full URL of the image to remove.
 */
export async function deleteCloudinaryImage(imageUrl: string): Promise<any> {
  if (!imageUrl || (!imageUrl.includes('cloudinary') && !imageUrl.includes('tally-app'))) {
    return;
  }
  return request('/delete-image', {
    method: 'POST',
    body: JSON.stringify({ imageUrl }),
  }).catch(() => {
    // Non-critical background cleanup
  });
}
