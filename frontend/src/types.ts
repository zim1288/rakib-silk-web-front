/**
 * Data Models & Domain Contracts
 *
 * Core TypeScript definitions for Rakib Silk & Fashion Boutique:
 * - Inventory & Finished Garments
 * - Loom Weaving & Production Batches
 * - Commercial Financial Transactions & Ledgers
 * - Purchase Cart & Procurement Inflow
 * - Customer Profiles & Relationship Tracking
 * - Authentication Responses
 */

/**
 * InventoryItem represents finished boutique stock ready for retail sale
 */
export interface InventoryItem {
  id: number;
  modelName: string;
  sku?: string;
  color?: string;
  fabricType?: string;
  brandCategory?: string;
  unitPrice: number;
  pieceCount: number;
  imageUrl?: string;
  isDeleted?: boolean;
  lastModified?: number;
}

/**
 * ProductionStatus tracks the stage of active loom weaving orders
 */
export type ProductionStatus = 'Pending' | 'In Progress' | 'Completed';

/**
 * ProductionItem represents active weaving batches in the production pipeline
 */
export interface ProductionItem {
  id: number;
  modelName: string;
  sku?: string;
  color?: string;
  fabricType?: string;
  quantity: number;
  estimatedCompletionDate: string;
  status: ProductionStatus;
  imageUrl?: string;
  isDeleted?: boolean;
  lastModified?: number;
}

/**
 * TransactionType represents cash flow directions and operational reasons
 */
export type TransactionType =
  | 'SALE'
  | 'EXPENSE'
  | 'HOUSE'
  | 'PRODUCTION'
  | 'PURCHASE_IN'
  | 'SELL_OUT';

/**
 * TransactionItem represents an entry in the primary commercial financial ledger
 */
export interface TransactionItem {
  id: number;
  type: TransactionType;
  modelName: string;
  sku?: string;
  color?: string;
  fabricType?: string;
  quantity: number;
  unitPrice?: number;
  totalAmount: number;
  customerName?: string;
  customerNumber?: string;
  timestamp: number;
  dateString: string;
  timeString?: string;
  imageUrl?: string;
  notes?: string;
}

/**
 * PurchaseCartItem represents an item being drafted in the vendor intake cart
 */
export interface PurchaseCartItem {
  id: string;
  modelName: string;
  sku?: string;
  color?: string;
  fabricType?: string;
  brandCategory: string;
  unitCost: number;
  quantity: number;
  imageUrl?: string;
}

/**
 * CustomerProfile aggregates historical purchasing activity for a single client
 */
export interface CustomerProfile {
  id: string;
  name: string;
  number: string;
  totalSpent: number;
  purchaseCount: number;
  ordersCount?: number;
  lastPurchaseDate: string;
  transactions: TransactionItem[];
  purchases?: TransactionItem[];
}

/**
 * AuthResponse represents the server payload returned by authentication endpoints
 */
export interface AuthResponse {
  status: string;
  email: string;
  message?: string;
  token?: string;
  tokenVersion?: number;
}
