/**
 * Operational & System Audit History Service.
 *
 * Provides a local, high-speed audit log of all create, update, and delete actions
 * across Inventory, Production, and Financial Transactions.
 *
 * Data is isolated per logged-in merchant account and synchronized cross-tab
 * via native browser Storage events and reactive refresh hooks.
 */

/** Valid business modules subject to system audit logging */
export type ActionModule = 'Inventory' | 'Production' | 'Transactions';

/** Action classification */
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Audit log entry structure stored in the audit trail.
 */
export interface ActionHistoryEntry {
  /** Unique audit log record ID */
  id: string;
  /** Unix millisecond timestamp when the event occurred */
  timestamp: number;
  /** Human-readable localized date and time string */
  dateString: string;
  /** Merchant email account responsible for the action */
  userEmail: string;
  /** Functional module affected */
  module: ActionModule;
  /** Mutation type */
  action: ActionType;
  /** ID of the affected entity */
  targetId: string | number;
  /** Model or entity descriptor */
  modelName: string;
  /** Detailed human-readable description of the operation */
  description: string;
}

const STORAGE_KEY_PREFIX = 'rakib_audit_history_';

/**
 * Retrieves the full chronological audit history entries for a given user.
 * Automatically seeds initial realistic historical logs on first launch for business demonstration.
 *
 * @param userEmail - Optional explicit user email. Falls back to active session storage or 'system'.
 * @returns Array of audit log entries, newest first.
 */
export function getActionHistory(userEmail?: string | null): ActionHistoryEntry[] {
  const email = userEmail || sessionStorage.getItem('rakib_user_email') || 'system';
  const key = `${STORAGE_KEY_PREFIX}${email}`;
  const raw = localStorage.getItem(key);

  if (!raw) {
    // Generate realistic initial historical logs for demonstration
    const seed: ActionHistoryEntry[] = [
      {
        id: 'hist-1',
        timestamp: Date.now() - 3600000 * 24 * 2,
        dateString: new Date(Date.now() - 3600000 * 24 * 2).toLocaleString(),
        userEmail: email,
        module: 'Inventory',
        action: 'CREATE',
        targetId: '101',
        modelName: 'Jamdani Gold Zari',
        description: 'Added initial saree stock: 20 pcs at ৳4,500/pc (Category: Silk)',
      },
      {
        id: 'hist-2',
        timestamp: Date.now() - 3600000 * 24,
        dateString: new Date(Date.now() - 3600000 * 24).toLocaleString(),
        userEmail: email,
        module: 'Production',
        action: 'CREATE',
        targetId: '201',
        modelName: 'Banarasi Bridal Weave',
        description: 'Dispatched loom batch order of 50 pcs (Status: In Progress)',
      },
      {
        id: 'hist-3',
        timestamp: Date.now() - 3600000 * 5,
        dateString: new Date(Date.now() - 3600000 * 5).toLocaleString(),
        userEmail: email,
        module: 'Transactions',
        action: 'CREATE',
        targetId: '301',
        modelName: 'Katan Silk Festive',
        description: 'Wholesale SELL_OUT transaction recorded: 8 pcs for ৳28,000',
      },
    ];
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Appends a new operational mutation entry to the system audit trail.
 *
 * @param entry - The audit record details including module, action, target, and description.
 */
export function logAction(entry: {
  module: ActionModule;
  action: ActionType;
  targetId: string | number;
  modelName: string;
  description: string;
  userEmail?: string | null;
}): void {
  const email = entry.userEmail || sessionStorage.getItem('rakib_user_email') || 'system';
  const key = `${STORAGE_KEY_PREFIX}${email}`;
  const current = getActionHistory(email);

  const newEntry: ActionHistoryEntry = {
    id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    dateString: new Date().toLocaleString(),
    userEmail: email,
    module: entry.module,
    action: entry.action,
    targetId: entry.targetId,
    modelName: entry.modelName,
    description: entry.description,
  };

  const updated = [newEntry, ...current];
  localStorage.setItem(key, JSON.stringify(updated));
}

/** Alias for {@link logAction} */
export const recordAction = logAction;

/**
 * Clears all audit history records for the specified merchant account.
 *
 * @param userEmail - Optional explicit merchant email address.
 */
export function clearActionHistory(userEmail?: string | null): void {
  const email = userEmail || sessionStorage.getItem('rakib_user_email') || 'system';
  const key = `${STORAGE_KEY_PREFIX}${email}`;
  localStorage.removeItem(key);
}
