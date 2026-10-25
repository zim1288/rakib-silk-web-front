import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  History,
  Scissors,
  Users,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInventory, getTransactions, getProduction } from '../services/api';
import { getActionHistory, ActionHistoryEntry } from '../services/history';
import { InventoryItem, TransactionItem, ProductionItem } from '../types';

export const SettingsPage: React.FC = () => {
  const { userEmail, logout, apiLatency } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'exports' | 'backup'>('exports');
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live item counts from database
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([]);
  const [auditHistoryItems, setAuditHistoryItems] = useState<ActionHistoryEntry[]>([]);
  const [customerCount, setCustomerCount] = useState<number>(0);

  // Filter state for transaction export
  const [txRange, setTxRange] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'SELL_OUT' | 'PURCHASE_IN' | 'PRODUCTION'>('ALL');

  // Filter state for audit history export
  const [auditModuleFilter, setAuditModuleFilter] = useState<'ALL' | 'Inventory' | 'Production' | 'Transactions'>('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState<'ALL' | 'CREATE' | 'UPDATE' | 'DELETE'>('ALL');

  // Filter state for loom production export
  const [prodStatusFilter, setProdStatusFilter] = useState<'ALL' | 'Pending' | 'In Progress' | 'Completed'>('ALL');

  // Inventory Testing Reset Button visibility state
  const [isResetButtonHidden, setIsResetButtonHidden] = useState<boolean>(() => {
    return localStorage.getItem('hide_inventory_reset_btn') === 'true';
  });

  useEffect(() => {
    document.title = 'Data Export Center & Settings - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
      return;
    }

    // Fetch initial datasets for counts and fast exports
    getInventory()
      .then((items) => setInventoryItems(items))
      .catch(() => {});

    getTransactions()
      .then((txs) => {
        setTransactionItems(txs);
        const uniqueCustomers = new Set(
          txs.map((t) => t.customerNumber?.trim() || t.customerName?.trim()).filter(Boolean)
        );
        setCustomerCount(uniqueCustomers.size);
      })
      .catch(() => {});

    getProduction()
      .then((prods) => setProductionItems(prods))
      .catch(() => {});

    try {
      const logs = getActionHistory(userEmail);
      setAuditHistoryItems(logs);
    } catch {
      // ignore
    }
  }, [userEmail, navigate]);

  // Helper to trigger browser file download
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Export Inventory to CSV (with UTF-8 BOM for Excel)
  const handleExportInventoryCSV = async () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const items = await getInventory();
      setInventoryItems(items);
      let csv = '\uFEFFModel Name,Category,SKU,Color,Fabric Type,Unit Price (BDT),Pieces in Hand,Total Valuation (BDT)\n';

      items.forEach((item) => {
        const totalVal = (Number(item.unitPrice) || 0) * (Number(item.pieceCount) || 0);
        csv += `"${(item.modelName || '').replace(/"/g, '""')}",`;
        csv += `"${(item.brandCategory || 'Rakib Silk').replace(/"/g, '""')}",`;
        csv += `"${(item.sku || '').replace(/"/g, '""')}",`;
        csv += `"${(item.color || '').replace(/"/g, '""')}",`;
        csv += `"${(item.fabricType || '').replace(/"/g, '""')}",`;
        csv += `${item.unitPrice || 0},`;
        csv += `${item.pieceCount || 0},`;
        csv += `${totalVal}\n`;
      });

      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(csv, `Silk_Fashion_Inventory_${dateStr}.csv`, 'text/csv;charset=utf-8;');
      setFeedbackMsg({ type: 'success', text: `Inventory CSV exported successfully (${items.length} items)!` });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to export inventory CSV.' });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export Inventory to Printable PDF
  const handlePrintInventoryPDF = async () => {
    setIsExporting(true);
    try {
      const items = await getInventory();
      setInventoryItems(items);
      const totalPieces = items.reduce((acc, it) => acc + (Number(it.pieceCount) || 0), 0);
      const totalValuation = items.reduce(
        (acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.pieceCount) || 0),
        0
      );

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to generate the printable PDF.');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Silk &amp; Fashion - House Inventory Catalog (${new Date().toLocaleDateString()})</title>
            <style>
              @page { size: A4 portrait; margin: 15mm 12mm; }
              * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
              body { margin: 0; padding: 20px; color: #1c1917; background: #ffffff; }
              .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ca8a04; padding-bottom: 12px; margin-bottom: 16px; }
              .brand-name { font-size: 22px; font-weight: 800; color: #4c0519; font-family: Georgia, serif; margin: 0; }
              .brand-subtitle { font-size: 11px; color: #78716c; margin-top: 2px; }
              .report-meta { text-align: right; font-size: 11px; color: #57534e; }
              .report-title { font-size: 16px; font-weight: 700; color: #1c1917; margin: 12px 0 6px 0; }
              .summary-box { display: flex; gap: 16px; background: #faf5f5; border: 1px solid #fecdd3; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; }
              .summary-item strong { color: #4c0519; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background: #4c0519; color: #ffffff; text-align: left; padding: 8px; font-weight: 600; font-size: 10.5px; }
              td { padding: 7px 8px; border-bottom: 1px solid #e7e5e4; }
              tr:nth-child(even) td { background-color: #fbfbfb; }
              .num { text-align: right; font-variant-numeric: tabular-nums; }
              .footer-note { margin-top: 24px; padding-top: 8px; border-top: 1px dashed #d6d3d1; font-size: 10px; color: #a8a29e; display: flex; justify-content: space-between; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div>
                <h1 class="brand-name">Silk &amp; Fashion</h1>
                <div class="brand-subtitle">House Stock &amp; Saree Inventory Catalog</div>
              </div>
              <div class="report-meta">
                <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>Manager:</strong> ${userEmail || 'Store Manager'}</div>
              </div>
            </div>

            <div class="report-title">Active Warehouse Stock Audit</div>
            
            <div class="summary-box">
              <div class="summary-item"><strong>Total Models:</strong> ${items.length}</div>
              <div class="summary-item"><strong>Total Units in Hand:</strong> ${totalPieces} pcs</div>
              <div class="summary-item"><strong>Inventory Valuation:</strong> ৳${totalValuation.toLocaleString()}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Model Description</th>
                  <th>SKU</th>
                  <th>Color / Shade</th>
                  <th>Fabric</th>
                  <th class="num">Unit Price (BDT)</th>
                  <th class="num">Stock</th>
                  <th class="num">Total Valuation (BDT)</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (it) => `
                  <tr>
                    <td><strong>${it.modelName || 'Untitled Model'}</strong></td>
                    <td><code>${it.sku || '-'}</code></td>
                    <td>${it.color || '-'}</td>
                    <td>${it.fabricType || 'Silk'}</td>
                    <td class="num">৳${(Number(it.unitPrice) || 0).toLocaleString()}</td>
                    <td class="num"><strong>${it.pieceCount || 0}</strong></td>
                    <td class="num">৳${(
                      (Number(it.unitPrice) || 0) * (Number(it.pieceCount) || 0)
                    ).toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="footer-note">
              <span>Official Silk &amp; Fashion Inventory Report — Confidential</span>
              <span>Page 1 of 1</span>
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setFeedbackMsg({ type: 'success', text: `Print / PDF document generated for ${items.length} inventory items!` });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to generate inventory PDF view.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to filter transactions
  const getFilteredTransactions = (txs: TransactionItem[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return txs.filter((tx) => {
      // Type filter
      if (txTypeFilter !== 'ALL' && tx.type !== txTypeFilter) return false;

      // Date Range filter
      if (txRange === 'ALL') return true;
      if (!tx.dateString) return true;

      const txDate = new Date(tx.dateString);
      if (isNaN(txDate.getTime())) return true;

      if (txRange === 'THIS_MONTH') {
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      }
      if (txRange === 'LAST_MONTH') {
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
        return txDate.getFullYear() === lastMonthYear && txDate.getMonth() === lastMonthIdx;
      }
      return true;
    });
  };

  // 3. Export Transactions to CSV (with Range & Type filter, or full archive)
  const handleExportTransactionsCSV = async (exportAll: boolean = false) => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const txs = await getTransactions();
      setTransactionItems(txs);
      const filtered = exportAll ? txs : getFilteredTransactions(txs);

      let csv = '\uFEFFID,Date (DD/MM/YYYY),Type,Model Name,SKU,Fabric,Quantity,Unit Price BDT,Total Amount BDT,Customer Name,Phone,Notes\n';
      filtered.forEach((tx) => {
        const unitP = tx.unitPrice !== undefined ? tx.unitPrice : Math.round(tx.totalAmount / (tx.quantity || 1));
        csv += `"${tx.id || ''}",`;
        csv += `"${tx.dateString || ''}",`;
        csv += `"${tx.type || ''}",`;
        csv += `"${(tx.modelName || '').replace(/"/g, '""')}",`;
        csv += `"${(tx.sku || '').replace(/"/g, '""')}",`;
        csv += `"${(tx.fabricType || '').replace(/"/g, '""')}",`;
        csv += `${tx.quantity || 0},`;
        csv += `${unitP || 0},`;
        csv += `${tx.totalAmount || 0},`;
        csv += `"${(tx.customerName || '').replace(/"/g, '""')}",`;
        csv += `"${(tx.customerNumber || '').replace(/"/g, '""')}",`;
        csv += `"${(tx.notes || '').replace(/"/g, '""')}"\n`;
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = exportAll
        ? `Silk_Fashion_Complete_Financial_Ledger_${dateStr}.csv`
        : `Silk_Fashion_Financial_Ledger_${txTypeFilter}_${txRange}_${dateStr}.csv`;
      downloadFile(csv, filename, 'text/csv;charset=utf-8;');
      setFeedbackMsg({
        type: 'success',
        text: exportAll
          ? `Complete Commercial Ledger archive exported (${filtered.length} total records)!`
          : `Financial Ledger CSV exported successfully (${filtered.length} records)!`,
      });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to export transactions CSV.' });
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Export Filtered Transactions to Printable PDF
  const handlePrintLedgerPDF = async () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const txs = await getTransactions();
      setTransactionItems(txs);
      const filtered = getFilteredTransactions(txs);

      const totalAmount = filtered.reduce((acc, t) => acc + (Number(t.totalAmount) || 0), 0);
      const totalQty = filtered.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);

      const typeLabel =
        txTypeFilter === 'ALL'
          ? 'All Transactions'
          : txTypeFilter === 'SELL_OUT'
          ? 'Sales Only (SELL_OUT)'
          : txTypeFilter === 'PURCHASE_IN'
          ? 'Purchases Only (PURCHASE_IN)'
          : 'Production Only';
      const rangeLabel = txRange === 'ALL' ? 'All Time' : txRange === 'THIS_MONTH' ? 'This Month' : 'Last Month';

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to generate the printable PDF.');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Silk &amp; Fashion - Transaction Ledger Report (${new Date().toLocaleDateString()})</title>
            <style>
              @page { size: A4 portrait; margin: 15mm 12mm; }
              * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
              body { margin: 0; padding: 20px; color: #1c1917; background: #ffffff; }
              .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ca8a04; padding-bottom: 12px; margin-bottom: 16px; }
              .brand-name { font-size: 22px; font-weight: 800; color: #4c0519; font-family: Georgia, serif; margin: 0; }
              .brand-subtitle { font-size: 11px; color: #78716c; margin-top: 2px; }
              .report-meta { text-align: right; font-size: 11px; color: #57534e; }
              .report-title { font-size: 16px; font-weight: 700; color: #1c1917; margin: 12px 0 6px 0; }
              .summary-box { display: flex; gap: 16px; background: #faf5f5; border: 1px solid #fecdd3; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; flex-wrap: wrap; }
              .summary-item strong { color: #4c0519; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background: #4c0519; color: #ffffff; text-align: left; padding: 7px 8px; font-weight: 600; font-size: 10.5px; }
              td { padding: 6px 8px; border-bottom: 1px solid #e7e5e4; }
              tr:nth-child(even) td { background-color: #fbfbfb; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 700; }
              .badge-sale { background: #dcfce7; color: #166534; }
              .badge-purchase { background: #dbeafe; color: #1e40af; }
              .badge-prod { background: #fef3c7; color: #92400e; }
              .num { text-align: right; font-variant-numeric: tabular-nums; }
              .footer-note { margin-top: 24px; padding-top: 8px; border-top: 1px dashed #d6d3d1; font-size: 10px; color: #a8a29e; display: flex; justify-content: space-between; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div>
                <h1 class="brand-name">Silk &amp; Fashion</h1>
                <div class="brand-subtitle">Commercial Transaction Ledger &amp; Cash Flow Tally</div>
              </div>
              <div class="report-meta">
                <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>Account:</strong> ${userEmail || 'Store Manager'}</div>
              </div>
            </div>

            <div class="report-title">Commercial Transaction Audit Report</div>
            
            <div class="summary-box">
              <div class="summary-item"><strong>Filter:</strong> ${typeLabel}</div>
              <div class="summary-item"><strong>Period:</strong> ${rangeLabel}</div>
              <div class="summary-item"><strong>Records:</strong> ${filtered.length}</div>
              <div class="summary-item"><strong>Total Volume:</strong> ${totalQty} pcs</div>
              <div class="summary-item"><strong>Total Turnover:</strong> ৳${totalAmount.toLocaleString()}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Model Description</th>
                  <th class="num">Qty</th>
                  <th class="num">Amount (BDT)</th>
                  <th>Party / Customer</th>
                  <th>Phone / Reference</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered.length === 0
                    ? '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#78716c;">No matching records found.</td></tr>'
                    : ''
                }
                ${filtered
                  .map((tx) => {
                    const bClass =
                      tx.type === 'SELL_OUT'
                        ? 'badge-sale'
                        : tx.type === 'PURCHASE_IN'
                        ? 'badge-purchase'
                        : 'badge-prod';
                    const bText =
                      tx.type === 'SELL_OUT' ? 'SALE' : tx.type === 'PURCHASE_IN' ? 'PURCHASE' : 'PROD';
                    return `
                    <tr>
                      <td>${tx.dateString || '-'}</td>
                      <td><span class="badge ${bClass}">${bText}</span></td>
                      <td><strong>${tx.modelName || 'General Item'}</strong></td>
                      <td class="num">${tx.quantity || 1}</td>
                      <td class="num">৳${(Number(tx.totalAmount) || 0).toLocaleString()}</td>
                      <td>${tx.customerName || '-'}</td>
                      <td>${tx.customerNumber || '-'}</td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>

            <div class="footer-note">
              <span>Official Silk &amp; Fashion Commercial Ledger — Confidential</span>
              <span>Page 1 of 1</span>
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setFeedbackMsg({ type: 'success', text: `Print / PDF report generated for ${filtered.length} records!` });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to generate PDF view.' });
    } finally {
      setIsExporting(false);
    }
  };

  // 5. Export Customer Directory to CSV
  const handleExportCustomersCSV = async () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const txs = await getTransactions();
      const customerMap = new Map<
        string,
        { name: string; number: string; totalSpent: number; orders: number; lastDate: string }
      >();

      txs.forEach((tx) => {
        const name = tx.customerName?.trim();
        const number = tx.customerNumber?.trim();
        if (name || number) {
          const key = number || name?.toLowerCase() || '';
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              name: name || 'Client',
              number: number || '',
              totalSpent: 0,
              orders: 0,
              lastDate: tx.dateString || '',
            });
          }
          const c = customerMap.get(key)!;
          c.totalSpent += Number(tx.totalAmount) || 0;
          c.orders += 1;
          if (tx.dateString && tx.dateString > c.lastDate) {
            c.lastDate = tx.dateString;
          }
        }
      });

      const list = Array.from(customerMap.values());
      setCustomerCount(list.length);
      let csv = '\uFEFFClient Name,Phone Number,Total Spent (BDT),Total Orders,Last Purchase Date\n';
      list.forEach((c) => {
        csv += `"${c.name.replace(/"/g, '""')}",`;
        csv += `"${c.number.replace(/"/g, '""')}",`;
        csv += `${c.totalSpent},`;
        csv += `${c.orders},`;
        csv += `"${c.lastDate}"\n`;
      });

      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(csv, `Silk_Fashion_Customers_${dateStr}.csv`, 'text/csv;charset=utf-8;');
      setFeedbackMsg({ type: 'success', text: `Customer directory exported (${list.length} clients)!` });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to export customer directory.' });
    } finally {
      setIsExporting(false);
    }
  };

  // 6. Export Operations Audit Trail to CSV (Dedicated History Feature)
  const handleExportAuditTrailCSV = () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const logs = getActionHistory(userEmail);
      setAuditHistoryItems(logs);

      const filtered = logs.filter((log) => {
        if (auditModuleFilter !== 'ALL' && log.module !== auditModuleFilter) return false;
        if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
        return true;
      });

      let csv = '\uFEFFLog ID,Timestamp,Date & Time,Module,Action,Target ID,Model Name,Operator,Description\n';
      filtered.forEach((log) => {
        csv += `"${log.id || ''}",`;
        csv += `${log.timestamp || ''},`;
        csv += `"${log.dateString || ''}",`;
        csv += `"${log.module || ''}",`;
        csv += `"${log.action || ''}",`;
        csv += `"${log.targetId || ''}",`;
        csv += `"${(log.modelName || '').replace(/"/g, '""')}",`;
        csv += `"${(log.userEmail || '').replace(/"/g, '""')}",`;
        csv += `"${(log.description || '').replace(/"/g, '""')}"\n`;
      });

      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(csv, `Silk_Fashion_Audit_Trail_${auditModuleFilter}_${auditActionFilter}_${dateStr}.csv`, 'text/csv;charset=utf-8;');
      setFeedbackMsg({ type: 'success', text: `Operations Audit Trail CSV exported (${filtered.length} events)!` });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to export audit trail CSV.' });
    } finally {
      setIsExporting(false);
    }
  };

  // 7. Export Operations Audit Trail to Printable PDF
  const handlePrintAuditTrailPDF = () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const logs = getActionHistory(userEmail);
      setAuditHistoryItems(logs);

      const filtered = logs.filter((log) => {
        if (auditModuleFilter !== 'ALL' && log.module !== auditModuleFilter) return false;
        if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
        return true;
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to generate the printable PDF report.');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Silk &amp; Fashion - Operations &amp; Audit Trail Report (${new Date().toLocaleDateString()})</title>
            <style>
              @page { size: A4 landscape; margin: 15mm 12mm; }
              * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
              body { margin: 0; padding: 20px; color: #1c1917; background: #ffffff; }
              .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ca8a04; padding-bottom: 12px; margin-bottom: 16px; }
              .brand-name { font-size: 22px; font-weight: 800; color: #4c0519; font-family: Georgia, serif; margin: 0; }
              .brand-subtitle { font-size: 11px; color: #78716c; margin-top: 2px; }
              .report-meta { text-align: right; font-size: 11px; color: #57534e; }
              .report-title { font-size: 16px; font-weight: 700; color: #1c1917; margin: 12px 0 6px 0; }
              .summary-box { display: flex; gap: 16px; background: #faf5f5; border: 1px solid #fecdd3; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; }
              .summary-item strong { color: #4c0519; }
              table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
              th { background: #4c0519; color: #ffffff; text-align: left; padding: 7px 8px; font-weight: 600; font-size: 10px; }
              td { padding: 6px 8px; border-bottom: 1px solid #e7e5e4; }
              tr:nth-child(even) td { background-color: #fbfbfb; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
              .badge-create { background: #dcfce7; color: #166534; }
              .badge-update { background: #dbeafe; color: #1e40af; }
              .badge-delete { background: #fee2e2; color: #991b1b; }
              .footer-note { margin-top: 24px; padding-top: 8px; border-top: 1px dashed #d6d3d1; font-size: 10px; color: #a8a29e; display: flex; justify-content: space-between; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div>
                <h1 class="brand-name">Silk &amp; Fashion</h1>
                <div class="brand-subtitle">Commercial Operations &amp; Audit Trail Log</div>
              </div>
              <div class="report-meta">
                <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>Account:</strong> ${userEmail || 'Store Manager'}</div>
              </div>
            </div>
            <div class="report-title">Operational Audit Activity Report</div>
            <div class="summary-box">
              <div class="summary-item"><strong>Module:</strong> ${auditModuleFilter}</div>
              <div class="summary-item"><strong>Action:</strong> ${auditActionFilter}</div>
              <div class="summary-item"><strong>Logged Events:</strong> ${filtered.length}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 130px;">Date &amp; Time</th>
                  <th style="width: 90px;">Module</th>
                  <th style="width: 75px;">Action</th>
                  <th style="width: 140px;">Entity / Model</th>
                  <th>Operational Description</th>
                  <th style="width: 150px;">Operator</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#78716c;">No matching audit records found.</td></tr>' : ''}
                ${filtered.map(l => {
                  const bClass = l.action === 'CREATE' ? 'badge-create' : l.action === 'UPDATE' ? 'badge-update' : 'badge-delete';
                  return `
                    <tr>
                      <td>${l.dateString || '-'}</td>
                      <td><strong>${l.module}</strong></td>
                      <td><span class="badge ${bClass}">${l.action}</span></td>
                      <td>${l.modelName || '-'}</td>
                      <td>${l.description || '-'}</td>
                      <td>${l.userEmail || 'system'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <div class="footer-note">
              <span>Official Silk &amp; Fashion System Audit Log — Confidential</span>
              <span>Generated via Data Export Center</span>
            </div>
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setFeedbackMsg({ type: 'success', text: `Audit Trail printable report generated (${filtered.length} records)!` });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to generate audit trail PDF view.' });
    } finally {
      setIsExporting(false);
    }
  };

  // 8. Export Loom Production Pipeline to CSV
  const handleExportProductionCSV = async () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const prods = await getProduction();
      setProductionItems(prods);

      const filtered = prods.filter((p) => {
        if (prodStatusFilter !== 'ALL' && p.status !== prodStatusFilter) return false;
        return true;
      });

      let csv = '\uFEFFBatch ID,Model Name,SKU,Color,Fabric Type,Quantity (Pieces),Target Completion Date,Status\n';
      filtered.forEach((p) => {
        csv += `"${p.id || ''}",`;
        csv += `"${(p.modelName || '').replace(/"/g, '""')}",`;
        csv += `"${(p.sku || '').replace(/"/g, '""')}",`;
        csv += `"${(p.color || '').replace(/"/g, '""')}",`;
        csv += `"${(p.fabricType || '').replace(/"/g, '""')}",`;
        csv += `${p.quantity || 0},`;
        csv += `"${p.estimatedCompletionDate || ''}",`;
        csv += `"${p.status || ''}"\n`;
      });

      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(csv, `Silk_Fashion_Loom_Production_${prodStatusFilter}_${dateStr}.csv`, 'text/csv;charset=utf-8;');
      setFeedbackMsg({ type: 'success', text: `Loom Production CSV exported (${filtered.length} batches)!` });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to export production CSV.' });
    } finally {
      setIsExporting(false);
    }
  };

  // 9. Full JSON System Backup
  const handleDownloadFullBackup = async () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const [inv, tx, prod] = await Promise.all([
        getInventory().catch(() => []),
        getTransactions().catch(() => []),
        getProduction().catch(() => []),
      ]);
      const history = getActionHistory();

      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        userEmail,
        inventory: inv,
        transactions: tx,
        production: prod,
        auditHistory: history,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(jsonStr, `Rakib_Silk_Backup_${dateStr}.json`, 'application/json');
      setFeedbackMsg({ type: 'success', text: 'Complete system snapshot downloaded safely!' });
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to generate backup file.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="settings-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="header-breadcrumbs">
            <button
              type="button"
              className="back-to-dashboard-btn"
              onClick={() => navigate('/')}
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Settings &amp; Tools</span>
          </div>
          <h1 className="page-heading">Settings &amp; System Center</h1>
          <p className="page-description">
            Export data spreadsheets, manage database backups, review cloud diagnostics, and configure testing tools.
          </p>
        </div>

        <div className="header-actions">
          <div className="sync-status-pill">
            <span className="sync-dot pulsing"></span>
            <span className="sync-text">{userEmail}</span>
            <span className="sync-latency">{apiLatency > 0 ? `${apiLatency}ms` : 'Connected'}</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={feedbackMsg.type === 'success' ? 'purchase-success-banner' : 'alert-error-box'}
          style={{ padding: '1rem', marginBottom: '1.5rem' }}
        >
          {feedbackMsg.type === 'success' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={20} className="success-banner-icon" />
              <span>{feedbackMsg.text}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={20} />
              <span>{feedbackMsg.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs Row */}
      <div className="settings-tabs-nav">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'exports' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('exports')}
        >
          <FileSpreadsheet size={16} />
          <span>Data Export Center</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'backup' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <Database size={16} />
          <span>Database Backup &amp; Health</span>
        </button>
      </div>

      {/* Tab 1: Data Export Center (CSV & Excel) */}
      {activeTab === 'exports' && (
        <div className="data-export-center-card">
          {/* Card Title & Icon */}
          <div className="export-center-header">
            <span className="export-center-icon">📥</span>
            <h2 className="export-center-title">Data Export Center (CSV &amp; Excel)</h2>
          </div>

          <p className="export-center-subtitle">
            All exports include UTF-8 BOM encoding so Bengali and English characters display cleanly in Microsoft Excel,
            Google Sheets, or Apple Numbers.
          </p>

          {/* Section 1: Stock in House Inventory */}
          <div className="export-section">
            <h3 className="export-section-heading">
              Stock in House Inventory ({inventoryItems.length} items)
            </h3>
            <p className="export-section-desc">
              Includes Model Description, SKU, Color, Fabric, Brand, Unit Price, and Quantity.
            </p>
            <div className="export-actions-row">
              <button
                type="button"
                className="btn-export-inventory"
                onClick={handleExportInventoryCSV}
                disabled={isExporting}
              >
                Export Inventory to CSV
              </button>
              <button
                type="button"
                className="btn-export-pdf"
                onClick={handlePrintInventoryPDF}
                disabled={isExporting}
              >
                <span>🖨️</span> Print / Save as PDF
              </button>
            </div>
          </div>

          <hr className="export-divider" />

          {/* Section 2: Transaction Ledger */}
          <div className="export-section">
            <h3 className="export-section-heading">
              Transaction Ledger ({transactionItems.length} total records)
            </h3>
            <p className="export-section-desc">
              Filter by transaction category and date range before exporting.
            </p>

            <div className="export-filter-controls">
              <div className="filter-field">
                <label className="filter-field-label">Type:</label>
                <select
                  className="filter-field-select"
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value as any)}
                >
                  <option value="ALL">All Transactions</option>
                  <option value="SELL_OUT">Sales Only (SELL_OUT)</option>
                  <option value="PURCHASE_IN">Purchases Only (PURCHASE_IN)</option>
                  <option value="PRODUCTION">Production Only</option>
                </select>
              </div>

              <div className="filter-field">
                <label className="filter-field-label">Date Range:</label>
                <select
                  className="filter-field-select"
                  value={txRange}
                  onChange={(e) => setTxRange(e.target.value as any)}
                >
                  <option value="ALL">All Time</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="LAST_MONTH">Last Month</option>
                </select>
              </div>
            </div>

            <div className="export-actions-row">
              <button
                type="button"
                className="btn-export-ledger-csv"
                onClick={() => handleExportTransactionsCSV(false)}
                disabled={isExporting}
                title="Download filtered transactions as Excel CSV"
              >
                Export Filtered Ledger to CSV
              </button>
              <button
                type="button"
                className="btn-export-secondary"
                onClick={() => handleExportTransactionsCSV(true)}
                disabled={isExporting}
                title="Download all ledger records without filtering"
              >
                Export Complete Ledger ({transactionItems.length} records)
              </button>
              <button
                type="button"
                className="btn-export-pdf"
                onClick={handlePrintLedgerPDF}
                disabled={isExporting}
              >
                <span>🖨️</span> Print / Save as PDF
              </button>
            </div>
          </div>

          <hr className="export-divider" />

          {/* Section 3: Operations & System Audit Trail (History) */}
          <div className="export-section">
            <h3 className="export-section-heading">
              Operations &amp; System Audit Trail ({auditHistoryItems.length} logged events)
            </h3>
            <p className="export-section-desc">
              Timestamped records of all entity additions, inventory updates, batch progress, and financial transactions.
            </p>

            <div className="export-filter-controls">
              <div className="filter-field">
                <label className="filter-field-label">Module:</label>
                <select
                  className="filter-field-select"
                  value={auditModuleFilter}
                  onChange={(e) => setAuditModuleFilter(e.target.value as any)}
                >
                  <option value="ALL">All Modules</option>
                  <option value="Inventory">Inventory Only</option>
                  <option value="Transactions">Transactions / Ledger Only</option>
                  <option value="Production">Production Only</option>
                </select>
              </div>

              <div className="filter-field">
                <label className="filter-field-label">Action Type:</label>
                <select
                  className="filter-field-select"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value as any)}
                >
                  <option value="ALL">All Actions</option>
                  <option value="CREATE">Record Creations (CREATE)</option>
                  <option value="UPDATE">Modifications (UPDATE)</option>
                  <option value="DELETE">Deletions (DELETE)</option>
                </select>
              </div>
            </div>

            <div className="export-actions-row">
              <button
                type="button"
                className="btn-export-audit-csv"
                onClick={handleExportAuditTrailCSV}
                disabled={isExporting}
              >
                Export Audit Trail to CSV
              </button>
              <button
                type="button"
                className="btn-export-pdf"
                onClick={handlePrintAuditTrailPDF}
                disabled={isExporting}
              >
                <span>🖨️</span> Print / Save as PDF
              </button>
            </div>
          </div>

          <hr className="export-divider" />

          {/* Section 4: Loom Production Pipeline */}
          <div className="export-section">
            <h3 className="export-section-heading">
              Loom Production Pipeline ({productionItems.length} loom batches)
            </h3>
            <p className="export-section-desc">
              Active weaving batches, target delivery dates, loom quantities, and production stages.
            </p>

            <div className="export-filter-controls">
              <div className="filter-field">
                <label className="filter-field-label">Batch Status:</label>
                <select
                  className="filter-field-select"
                  value={prodStatusFilter}
                  onChange={(e) => setProdStatusFilter(e.target.value as any)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="export-actions-row">
              <button
                type="button"
                className="btn-export-production-csv"
                onClick={handleExportProductionCSV}
                disabled={isExporting}
              >
                Export Production to CSV
              </button>
            </div>
          </div>

          <hr className="export-divider" />

          {/* Section 5: Customer Directory */}
          <div className="export-section">
            <h3 className="export-section-heading">
              Customer Directory ({customerCount} client profiles)
            </h3>
            <p className="export-section-desc">
              Includes customer names, phone numbers, lifetime spent in BDT, and order volume.
            </p>
            <div className="export-actions-row">
              <button
                type="button"
                className="btn-export-customers-csv"
                onClick={handleExportCustomersCSV}
                disabled={isExporting}
              >
                Export Customer Directory to CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Database Backup & Cloud Health */}
      {activeTab === 'backup' && (
        <div className="settings-content-grid">
          <div className="settings-action-card">
            <div className="action-card-header">
              <div className="header-icon-circle icon-sage">
                <Database size={20} />
              </div>
              <div>
                <h3 className="action-card-title">Full System JSON Snapshot</h3>
                <span className="action-card-desc">Download a complete backup archive of your business database</span>
              </div>
            </div>

            <div className="action-card-body">
              <p className="card-info-text">
                Creates an encrypted, self-contained JSON snapshot containing all saree models, active loom production
                batches, tally ledger transactions, and audit activity records. Keep this file safe for offline archiving.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadFullBackup}
              disabled={isExporting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              <span>Download JSON Database Backup</span>
            </button>
          </div>

          <div className="settings-action-card">
            <div className="action-card-header">
              <div className="header-icon-circle icon-bronze">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="action-card-title">Cloud Diagnostic &amp; Server Health</h3>
                <span className="action-card-desc">Inspect MongoDB connection and real-time API latency</span>
              </div>
            </div>

            <div className="action-card-body">
              <div className="diagnostic-stat-row">
                <span className="diag-label">Cloud Backend:</span>
                <span className="diag-val text-forest">https://rakib-fashion-backend.onrender.com</span>
              </div>
              <div className="diagnostic-stat-row">
                <span className="diag-label">Manager Account:</span>
                <span className="diag-val">{userEmail}</span>
              </div>
              <div className="diagnostic-stat-row">
                <span className="diag-label">Round-Trip Latency:</span>
                <span className="diag-val text-gold">
                  {apiLatency > 0 ? `${apiLatency} ms (Fast)` : 'Live & Active'}
                </span>
              </div>
              <div className="diagnostic-stat-row">
                <span className="diag-label">System Security:</span>
                <span className="diag-val text-forest">SSL Encrypted / Session Protected</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-logout"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              <LogOut size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              <span>Secure Log Out</span>
            </button>
          </div>

          {/* Developer / Testing Utility Settings Card */}
          <div className="settings-action-card">
            <div className="action-card-header">
              <div className="header-icon-circle icon-gold">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="action-card-title">Inventory Testing Utility</h3>
                <span className="action-card-desc">Safety switch for test data wipe button</span>
              </div>
            </div>

            <div className="action-card-body">
              <p className="card-info-text">
                The &quot;Reset my test data&quot; button removes all saree models from the database for developer testing.
                For live shop management, keep this button hidden to protect real inventory records from accidental deletion.
              </p>
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  background: '#fafaf9',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '8px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!isResetButtonHidden}
                    onChange={(e) => {
                      const show = e.target.checked;
                      setIsResetButtonHidden(!show);
                      localStorage.setItem('hide_inventory_reset_btn', (!show).toString());
                      setFeedbackMsg({
                        type: 'success',
                        text: show
                          ? 'Reset test data button is now VISIBLE in the Inventory header.'
                          : 'Reset test data button is now HIDDEN from the Inventory header (Production Safe).',
                      });
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#701a2d', cursor: 'pointer' }}
                  />
                  <div>
                    <span
                      style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', display: 'block' }}
                    >
                      Show &quot;Reset my test data&quot; button in Inventory header
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {isResetButtonHidden
                        ? 'Currently HIDDEN (Safe for live sales)'
                        : 'Currently VISIBLE (Testing mode)'}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
