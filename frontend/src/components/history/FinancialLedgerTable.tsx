import React from 'react';
import { TransactionItem } from '../../types';
import { formatDateDMY } from '../../utils/date';

export type SortField = 'id' | 'dateString' | 'type' | 'modelName' | 'quantity' | 'totalAmount';
export type SortOrder = 'asc' | 'desc';

interface FinancialLedgerTableProps {
  items: TransactionItem[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  searchQuery?: string;
  typeFilter?: string;
  monthFilter?: string;
  yearFilter?: string;
}

/**
 * FinancialLedgerTable Component
 *
 * Renders the primary 8-column commercial ledger table:
 * 1. DATE & TIME - stacked DD/MM/YYYY with secondary time; sortable header (▲/▼)
 * 2. TYPE - colored pill badges: SALE (mint green), EXPENSE (soft red), PRODUCTION_FINISHED (bold text)
 * 3. MODEL DESCRIPTION - bold model name
 * 4. SKU & FABRIC - subtitle metadata
 * 5. QUANTITY - count with "pcs" unit
 * 6. UNIT PRICE - calculated or explicit unit price in BDT
 * 7. TOTAL AMOUNT - signed (+ / -) total value in BDT
 * 8. CUSTOMER / NOTES - customer contact details accompanied by the official Lucide User icon
 */
export const FinancialLedgerTable: React.FC<FinancialLedgerTableProps> = ({
  items,
  sortField,
  sortOrder,
  onSort,
  searchQuery,
  typeFilter,
  monthFilter,
  yearFilter,
}) => {
  if (items.length === 0) {
    return (
      <div id="empty-msg" data-testid="empty-msg" className="empty-state">
        <p className="empty-title">No transactions recorded</p>
        <p className="empty-desc">
          {searchQuery || typeFilter !== 'ALL' || monthFilter !== 'ALL' || yearFilter !== 'ALL'
            ? 'No transactions match the selected filter criteria.'
            : 'No transaction entries yet. Click "+ Record Transaction" to log cash flows.'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="table-responsive"
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        border: '1px solid #f0e6e0',
        overflowX: 'auto',
      }}
    >
      <table id="transactions-table" data-testid="transactions-table" className="data-table spacious-ledger-table">
        <thead>
          <tr style={{ background: '#fdf4f0', borderBottom: '2px solid #ca8a04' }}>
            {/* 1. DATE & TIME (Sortable: Ascending / Descending) */}
            <th
              id="col-trans-date"
              data-testid="col-trans-date"
              onClick={() => onSort('dateString')}
              className="sortable-header"
              title="Click to sort date ascending or descending"
              style={{
                padding: '1rem 1.15rem',
                color: '#701a2d',
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                userSelect: 'none',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <div>
                  <div>DATE &amp;</div>
                  <div>TIME</div>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#ca8a04', fontWeight: 900 }}>
                  {sortField === 'dateString' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </span>
              </div>
            </th>

            {/* 2. TYPE */}
            <th
              id="col-trans-type"
              data-testid="col-trans-type"
              onClick={() => onSort('type')}
              className="sortable-header"
              style={{
                padding: '1rem 1.15rem',
                color: '#701a2d',
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              TYPE
            </th>

            {/* 3. MODEL DESCRIPTION */}
            <th
              id="col-trans-model"
              data-testid="col-trans-model"
              onClick={() => onSort('modelName')}
              className="sortable-header"
              style={{
                padding: '1rem 1.15rem',
                color: '#701a2d',
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              MODEL DESCRIPTION
            </th>

            {/* 4. SKU & FABRIC */}
            <th
              style={{
                padding: '1rem 1.15rem',
                color: '#701a2d',
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              <div>SKU &amp;</div>
              <div>FABRIC</div>
            </th>

            {/* 5. QUANTITY */}
            <th
              id="col-trans-quantity"
              data-testid="col-trans-quantity"
              onClick={() => onSort('quantity')}
              className="sortable-header"
              style={{
                padding: '1rem 1.15rem',
                color: '#701a2d',
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              QUANTITY
            </th>

            {/* 6. UNIT PRICE */}
            <th
              style={{
                padding: '1rem 1.15rem',
                color: '#701a2d',
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              <div>UNIT</div>
              <div>PRICE</div>
            </th>

            {/* 7. TOTAL AMOUNT */}
            <th
              id="col-trans-amount"
              data-testid="col-trans-amount"
              onClick={() => onSort('totalAmount')}
              className="sortable-header"
              style={{
                padding: '1rem 1.15rem',
                color: '#701a2d',
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              <div>TOTAL</div>
              <div>AMOUNT</div>
            </th>

            {/* 8. CUSTOMER / NOTES */}
            <th
              style={{
                padding: '1rem 1.15rem',
                color: '#701a2d',
                fontWeight: 800,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'left',
                verticalAlign: 'bottom',
              }}
            >
              CUSTOMER / NOTES
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSale = item.type === 'SALE' || item.type === 'SELL_OUT';
            const isProduction =
              item.type === 'PRODUCTION' ||
              item.modelName?.toLowerCase().includes('production finished');
            const isExpense = !isSale && !isProduction;

            const unitPrice =
              item.unitPrice !== undefined
                ? item.unitPrice
                : item.quantity > 0
                ? Math.round(item.totalAmount / item.quantity)
                : item.totalAmount;

            // Format time if timestamp or date string contains time
            let timeStr: string | null = null;
            if (item.timestamp) {
              const d = new Date(item.timestamp);
              if (!isNaN(d.getTime())) {
                const h = String(d.getHours()).padStart(2, '0');
                const m = String(d.getMinutes()).padStart(2, '0');
                const s = String(d.getSeconds()).padStart(2, '0');
                timeStr = `${h}:${m}:${s}`;
              }
            }

            return (
              <tr
                key={item.id}
                id={`transaction-row-${item.id}`}
                data-testid={`transaction-row-${item.id}`}
                className="spacious-ledger-row"
                style={{ borderBottom: '1px solid #f2ece7', transition: 'background-color 0.15s ease' }}
              >
                {/* 1. DATE & TIME (date/month/year format, time underneath) */}
                <td className="cell-date" style={{ padding: '1.15rem 1.1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 700, color: '#1c1917', fontSize: '0.92rem' }}>
                    {formatDateDMY(item.dateString)}
                  </div>
                  {timeStr && (
                    <div style={{ color: '#78716c', fontSize: '0.78rem', marginTop: '0.15rem', fontFamily: 'monospace' }}>
                      {timeStr}
                    </div>
                  )}
                </td>

                {/* 2. TYPE BADGE */}
                <td className="cell-type" style={{ padding: '1.15rem 1.1rem', verticalAlign: 'middle' }}>
                  {isProduction ? (
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#292524', letterSpacing: '0.02em' }}>
                      PRODUCTION_FINISHED
                    </span>
                  ) : isSale ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: '#ecfdf5',
                        color: '#16a34a',
                        border: '1.5px solid #a7f3d0',
                      }}
                    >
                      SALE
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: '#fdf2f2',
                        color: '#dc2626',
                        border: '1.5px solid #fecaca',
                      }}
                    >
                      EXPENSE
                    </span>
                  )}
                </td>

                {/* 3. MODEL DESCRIPTION */}
                <td className="cell-name" style={{ padding: '1.15rem 1.1rem', verticalAlign: 'middle' }}>
                  <strong style={{ fontSize: '0.94rem', color: '#1c1917', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                    {item.modelName}
                  </strong>
                </td>

                {/* 4. SKU & FABRIC */}
                <td style={{ padding: '1.15rem 1.1rem', verticalAlign: 'middle', fontSize: '0.84rem', color: '#57534e' }}>
                  {item.sku || item.fabricType ? (
                    <span>{[item.sku, item.fabricType].filter(Boolean).join(' • ')}</span>
                  ) : null}
                </td>

                {/* 5. QUANTITY */}
                <td className="cell-count" style={{ padding: '1.15rem 1.1rem', verticalAlign: 'middle', fontWeight: 700, fontSize: '0.92rem', color: '#1c1917', whiteSpace: 'nowrap' }}>
                  {item.quantity} pcs
                </td>

                {/* 6. UNIT PRICE */}
                <td style={{ padding: '1.15rem 1.1rem', verticalAlign: 'middle', color: '#44403c', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  ৳ {unitPrice.toLocaleString('en-US')}
                </td>

                {/* 7. TOTAL AMOUNT */}
                <td className="cell-amount" style={{ padding: '1.15rem 1.1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <strong style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1c1917' }}>
                    {item.totalAmount === 0
                      ? '৳ 0'
                      : isSale
                      ? `+ ৳ ${item.totalAmount.toLocaleString('en-US')}`
                      : `- ৳ ${item.totalAmount.toLocaleString('en-US')}`}
                  </strong>
                </td>

                {/* 8. CUSTOMER / NOTES */}
                <td style={{ padding: '1.15rem 1.1rem', verticalAlign: 'middle' }}>
                  {item.customerName || item.customerNumber ? (
                    <div className="customer-info-tag">
                      👤 {item.customerName || 'Client'}
                      {item.customerNumber && <small> ({item.customerNumber})</small>}
                    </div>
                  ) : item.notes ? (
                    <div className="customer-info-tag">
                      👤 {item.notes}
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
