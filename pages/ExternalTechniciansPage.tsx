
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { MOCK_INVOICES, MOCK_MAINTENANCE_CARDS } from '../constants';
import { Invoice, InvoiceType, MaintenanceCard } from '../types';
import Table, { Column, SortConfig } from '../components/Table';
import { isDateInRange } from '../utils/dateUtils';
// import Button from '../components/Button';
// import { PlusIcon } from '@heroicons/react/24/outline';
// import Modal from '../components/Modal'; // For future add/edit functionality

const ExternalTechniciansPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language, currency, dateRange } = context;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<Invoice>>({ key: null, direction: null });

  const externalTechInvoices = useMemo(() => {
    return MOCK_INVOICES.filter(inv => inv.type === InvoiceType.EXTERNAL_TECHNICIAN);
  }, []);

  const maintenanceCardsMap = useMemo(() => 
    MOCK_MAINTENANCE_CARDS.reduce((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {} as Record<string, MaintenanceCard>), 
  []);


  const filteredAndSortedInvoices = useMemo(() => {
    let items = externalTechInvoices.filter(invoice => 
      isDateInRange(invoice.dateIssued, dateRange) &&
      (
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.items[0]?.serviceDescription && invoice.items[0].serviceDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (getLabel(invoice.paymentStatus.replace(/\s/g, '')) || invoice.paymentStatus).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'serviceDescription') { // Special sort for first item's description
            valA = a.items[0]?.serviceDescription || '';
            valB = b.items[0]?.serviceDescription || '';
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
  }, [externalTechInvoices, searchTerm, dateRange, sortConfig, getLabel]);


  const columns: Column<Invoice>[] = [
    { header: 'invoiceNumber', accessor: 'invoiceNumber', sortable: true },
    { header: 'dateIssued', accessor: (item) => new Date(item.dateIssued).toLocaleDateString(language), sortable: true, sortKey: 'dateIssued' },
    { 
      header: 'description', 
      accessor: (item) => item.items[0]?.serviceDescription || item.notes || '-', 
      sortable: true, 
      sortKey: 'serviceDescription',
      className: 'text-xs max-w-md truncate'
    },
    { 
      header: 'maintenanceCard', 
      accessor: (item) => item.maintenanceCardId ? (maintenanceCardsMap[item.maintenanceCardId]?.internalId || item.maintenanceCardId) : '-',
      sortable: false // Or sort by maintenanceCardId if needed
    },
    { header: 'totalAmount', accessor: (item) => `${item.totalAmount.toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'totalAmount' },
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
    // Add actions column: View, Edit, Mark as Paid
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-4 sm:mb-0">
          {getLabel('ExternalTechnicianWages') || 'External Technician Invoices'}
        </h1>
        {/* <Button leftIcon={PlusIcon} onClick={() => {}}>
          {getLabel('addNewExternalTechnicianInvoice') || 'Add New Ext. Tech. Invoice'}
        </Button> */}
      </div>
      <input
        type="text"
        placeholder={`${getLabel('search')}... (${getLabel('invoiceNumber')}, ${getLabel('description')})`}
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
      {/* Add Modal for creating/editing these specific invoices */}
    </div>
  );
};

export default ExternalTechniciansPage;
