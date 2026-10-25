import React from 'react';
import { ActionHistoryEntry } from '../../services/history';
import { formatDateTimeDMY } from '../../utils/date';

interface OperationsAuditTrailTableProps {
  auditList: ActionHistoryEntry[];
}

/**
 * OperationsAuditTrailTable Component
 *
 * Displays the system audit trail table:
 * - Shows historical creations, modifications, and deletions across shop workspaces
 * - Highlights Action types: CREATE (green), DELETE (red), UPDATE (amber)
 * - Formatted date & time with localized timestamps
 * - Displays target model name and descriptive event summaries
 */
export const OperationsAuditTrailTable: React.FC<OperationsAuditTrailTableProps> = ({ auditList }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #f1ece8',
        borderRadius: '12px',
        padding: '1.75rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#701a2d' }}>
            System Activity &amp; Audit Trail
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#78716c' }}>
            Timestamped log of creations, modifications, and deletions across all shop workspaces
          </p>
        </div>
        <span className="count-pill">{auditList.length} recorded events</span>
      </div>

      {auditList.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No audit records found</p>
          <p className="empty-desc">New operations in Inventory, Purchase, or Sales will appear here automatically.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr style={{ borderBottom: '2px solid #ca8a04' }}>
                <th style={{ color: '#701a2d', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  DATE &amp; TIME (DD/MM/YYYY)
                </th>
                <th style={{ color: '#701a2d', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  MODULE
                </th>
                <th style={{ color: '#701a2d', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  ACTION
                </th>
                <th style={{ color: '#701a2d', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  MODEL / ITEM
                </th>
                <th style={{ color: '#701a2d', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  DESCRIPTION
                </th>
              </tr>
            </thead>
            <tbody>
              {auditList.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ fontWeight: 600, color: '#292524', whiteSpace: 'nowrap' }}>
                    {formatDateTimeDMY(entry.timestamp || entry.dateString)}
                  </td>
                  <td>
                    <span className="badge badge-info">{entry.module}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        entry.action === 'CREATE'
                          ? 'badge-success'
                          : entry.action === 'DELETE'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td>
                    <strong>{entry.modelName}</strong>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#57534e' }}>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
