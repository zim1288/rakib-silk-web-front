/**
 * TransactionsPage (Backward-Compatibility Alias)
 *
 * Route Alias: `/transactions` and `/ledger` have been consolidated into `/history`.
 * This alias re-exports HistoryPage so any legacy routes or external deep-links
 * resolve without breaking application navigation.
 */
export { HistoryPage as TransactionsPage, HistoryPage as default } from './HistoryPage';
