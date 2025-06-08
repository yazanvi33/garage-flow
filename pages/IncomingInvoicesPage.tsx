
import React, { useContext, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom'; // Changed back to useSearchParams
import { AppContext } from '../context/AppContext';
import { MOCK_INVOICES, MOCK_SUPPLIERS } from '../constants';
import { Invoice, InvoiceType, Supplier, DateRange } from '../types';
import Table, { Column, SortConfig } from '../components/Table'; // Corrected import path
import { isDateInRange } from '../utils/dateUtils';

const IncomingInvoicesPage: React.FC = () => {
  const context = useContext(AppContext);
  const [searchParams] = useSearchParams(); // Changed back to useSearchParams

  if (!context) return <p>Loading context...</p>;
  const { getLabel, language, currency, dateRange: globalDateRange } = context;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<Invoice>>({ key: null, direction: null });

  const suppliersMap = useMemo(() => 
    MOCK_SUPPLIERS.reduce((acc, supplier) => {
      acc[supplier.id] = supplier;
      return acc;
    }, {} as Record<string, Supplier>), 
  []);

  const initialFilters = useMemo(() => {
    const paymentStatuses = searchParams.getAll('paymentStatus') as Invoice['paymentStatus'][];
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let dateFilterRange: DateRange | null = null;
    if(startDateParam || endDateParam) {
        dateFilterRange = {
            start: startDateParam ? new Date(startDateParam) : null,
            end: endDateParam ? new Date(endDateParam) : null,
            labelKey: 'custom' // Indicates this range came from URL params
        }
        if(dateFilterRange.start) dateFilterRange.start.setHours(0,0,0,0);
        if(dateFilterRange.end) dateFilterRange.end.setHours(23,59,59,999);
    }
    return { paymentStatuses, dateFilterRange };
  }, [searchParams]);

  const filteredAndSortedInvoices = useMemo(() => {
    let items = MOCK_INVOICES.filter(inv => inv.type === InvoiceType.INCOMING);

    // Apply payment status filters from URL first
    if (initialFilters.paymentStatuses.length > 0) {
      items = items.filter(inv => initialFilters.paymentStatuses.includes(inv.paymentStatus));
    }
    
    // Determine active date range: URL params take precedence over global date range
    const activeDateRange = initialFilters.dateFilterRange || globalDateRange;
     if (activeDateRange && (activeDateRange.start || activeDateRange.end)) {
        items = items.filter(inv => isDateInRange(inv.dateIssued, activeDateRange));
    }

    // Apply search term filter
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        items = items.filter(invoice => {
        const supplierName = invoice.supplierId ? suppliersMap[invoice.supplierId]?.name.toLowerCase() : '';
        return (
            invoice.invoiceNumber.toLowerCase().includes(lowerSearchTerm) ||
            supplierName.includes(lowerSearchTerm) ||
            (getLabel(invoice.paymentStatus.replace(/\s/g, '')) || invoice.paymentStatus).toLowerCase().includes(lowerSearchTerm)
        );
        });
    }

    // Apply sorting
     if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'supplierName') {
            valA = a.supplierId ? suppliersMap[a.supplierId]?.name : '';
            valB = b.supplierId ? suppliersMap[b.supplierId]?.name : '';
        } else {
            valA = a[sortConfig.key as keyof Invoice];
            valB = b[sortConfig.key as keyof Invoice];
        }
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return items;

  }, [searchTerm, suppliersMap, sortConfig, initialFilters, globalDateRange, getLabel]);

  const columns: Column<Invoice>[] = [
    { header: 'invoiceNumber', accessor: 'invoiceNumber', sortable: true },
    { 
      header: 'supplier', 
      accessor: (item) => item.supplierId ? (suppliersMap[item.supplierId]?.name || item.supplierId) : (language === 'ar' ? 'غير معروف' : 'Unknown'),
      sortable: true,
      sortKey: 'supplierName'
    },
    { header: 'dateIssued', accessor: (item) => new Date(item.dateIssued).toLocaleDateString(language), sortable: true, sortKey: 'dateIssued' },
    { header: 'totalAmount', accessor: (item) => `${item.totalAmount.toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'totalAmount' },
    { header: 'amountPaid', accessor: (item) => `${item.amountPaid.toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'amountPaid' },
    { header: 'amountDue', accessor: (item) => `${item.amountDue.toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'amountDue' },
    { header: 'paymentStatus', accessor: 'paymentStatus', sortable: true,
      render: (item) => {
          let colorClass = '';
          const statusKey = item.paymentStatus.replace(/\s/g, ''); 
          switch(item.paymentStatus) {
              case 'Paid': colorClass = 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50'; break;
              case 'Partially Paid': colorClass = 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50'; break;
              case 'Unpaid': colorClass = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50'; break;
              case 'Overdue': colorClass = 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50'; break;
          }
          return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{getLabel(statusKey) || item.paymentStatus}</span>
      }
    },
    // Add action column if needed
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('incomingInvoices')}</h1>
       <input
        type="text"
        placeholder={`${getLabel('search')}... (${getLabel('invoiceNumber')}, ${getLabel('supplier')}, ${getLabel('status')})`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md dark:bg-secondary-700 dark:border-secondary-600 dark:text-white focus:ring-primary-500 focus:border-primary-500"
      />
      <Table 
        columns={columns} 
        data={filteredAndSortedInvoices} 
        keyExtractor={(invoice) => invoice.id}
        sortConfig={sortConfig}
        onSort={setSortConfig}
      />
    </div>
  );
};

export default IncomingInvoicesPage;