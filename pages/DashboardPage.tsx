
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom'; // Changed back to useNavigate
import DashboardCard from '../components/DashboardCard';
import { MOCK_INVOICES, MOCK_MAINTENANCE_CARDS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, ICONS } from '../constants';
import { TruckIcon, WrenchScrewdriverIcon, CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Invoice, InvoiceType, MaintenanceCard, WorkshopStats } from '../types';
import Table, { Column, SortConfig } from '../components/Table';
import { isDateInRange } from '../utils/dateUtils';

const DashboardPage: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate(); // Changed back to useNavigate

  if (!context) return <p className="text-center p-4">Loading context...</p>;

  const { getLabel, language, currency, dateRange } = context;
  
  const [sortConfig, setSortConfig] = useState<SortConfig<Invoice>>({ key: null, direction: null });

  const dynamicStats = useMemo<WorkshopStats>(() => {
    const stats: WorkshopStats = {
      carsInWorkshop: 0,
      carsRepairedThisPeriod: 0,
      totalExpensesThisPeriod: 0,
      totalRevenueThisPeriod: 0,
      dueFromCustomers: 0,
      dueToSuppliers: 0,
    };

    MOCK_MAINTENANCE_CARDS.forEach(card => {
      // Filter cars in workshop by their creation date being within the range,
      // AND if they are still pending or in progress.
      if ((card.status === 'In Progress' || card.status === 'Pending') && isDateInRange(card.dateCreated, dateRange)) {
          stats.carsInWorkshop++;
      }
      // Filter repaired cars by their completion date.
      if (card.status === 'Completed' && card.dateCompleted && isDateInRange(card.dateCompleted, dateRange)) {
        stats.carsRepairedThisPeriod++;
      }
    });

    MOCK_INVOICES.forEach(invoice => {
      if (isDateInRange(invoice.dateIssued, dateRange)) {
        if (invoice.type === InvoiceType.OUTGOING) {
          stats.totalRevenueThisPeriod += invoice.totalAmount;
          if (invoice.paymentStatus === 'Unpaid' || invoice.paymentStatus === 'Partially Paid') {
            stats.dueFromCustomers += invoice.amountDue;
          }
        } else if (
            invoice.type === InvoiceType.INCOMING || 
            invoice.type === InvoiceType.EXTERNAL_TECHNICIAN || // Corrected: Was EXTERNAL_TECHNICIAN_WAGES
            invoice.type === InvoiceType.WORKSHOP_EQUIPMENT ||
            invoice.type === InvoiceType.GENERAL_EXPENSE
        ) {
          stats.totalExpensesThisPeriod += invoice.totalAmount;
          if (invoice.type === InvoiceType.INCOMING && (invoice.paymentStatus === 'Unpaid' || invoice.paymentStatus === 'Partially Paid')) {
            stats.dueToSuppliers += invoice.amountDue;
          }
        }
      }
    });
    return stats;
  }, [dateRange]);
  
  const recentInvoices = useMemo(() => 
    MOCK_INVOICES.filter(invoice => isDateInRange(invoice.dateIssued, dateRange))
                 .sort((a,b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime()) 
                 .slice(0,10),
  [dateRange]);


  const sortedInvoices = useMemo(() => {
    let sortableItems = [...recentInvoices];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        const valA = typeof sortConfig.key === 'function' ? (sortConfig.key as (item: Invoice) => any)(a) : a[sortConfig.key as keyof Invoice];
        const valB = typeof sortConfig.key === 'function' ? (sortConfig.key as (item: Invoice) => any)(b) : b[sortConfig.key as keyof Invoice];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [recentInvoices, sortConfig]);


  const invoiceColumns: Column<Invoice>[] = [
    { header: 'invoiceNumber', accessor: 'invoiceNumber', sortable: true },
    { header: 'type', accessor: (item) => getLabel(InvoiceType[item.type.toUpperCase().replace(/\s|\(|\)/g, '') as keyof typeof InvoiceType] || item.type), sortable: true, sortKey: 'type' },
    { header: 'date', accessor: (item) => new Date(item.dateIssued).toLocaleDateString(language), sortable: true, sortKey: 'dateIssued'},
    { header: 'totalAmount', accessor: (item) => `${item.totalAmount.toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'totalAmount' },
    { header: 'status', accessor: 'paymentStatus', sortable: true, sortKey: 'paymentStatus', 
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
  ];

  const buildDateQueryString = () => {
    let qs = '';
    // Use the global dateRange for links from dashboard.
    // The target pages will interpret these or use their own global dateRange if not provided.
    if (dateRange.start) qs += `&startDate=${dateRange.start.toISOString().split('T')[0]}`;
    if (dateRange.end) qs += `&endDate=${dateRange.end.toISOString().split('T')[0]}`;
    return qs;
  }

  // Cars in workshop should not be filtered by the global date range directly here,
  // as a car could have entered "last month" and still be "in workshop" "this month".
  // The filtering for "cars in workshop" is handled by the MaintenanceCardsPage based on card status 'Pending' or 'In Progress'
  // and the creation date relative to the selected global filter on *that* page.
  // We navigate with status filters. Date range will be applied on the target page.
  const handleCarsInWorkshopClick = () => navigate(`/maintenance-cards?status=Pending&status=InProgress`);
  
  // Cars repaired should be filtered by completion date within the period.
  const handleCarsRepairedClick = () => navigate(`/maintenance-cards?status=Completed${buildDateQueryString()}`);
  
  // Dues should be filtered by invoice issue date within the period.
  const handleDueFromCustomersClick = () => navigate(`/invoices/outgoing?paymentStatus=Unpaid&paymentStatus=Partially Paid${buildDateQueryString()}`);
  const handleDueToSuppliersClick = () => navigate(`/invoices/incoming?paymentStatus=Unpaid&paymentStatus=Partially Paid${buildDateQueryString()}`);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('dashboard')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <div onClick={handleCarsInWorkshopClick} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleCarsInWorkshopClick()} className="cursor-pointer">
          <DashboardCard title={getLabel('carsInWorkshop')} value={dynamicStats.carsInWorkshop} icon={TruckIcon} colorClass="bg-blue-500" />
        </div>
        <div onClick={handleCarsRepairedClick} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleCarsRepairedClick()} className="cursor-pointer">
          <DashboardCard title={getLabel('carsRepairedThisPeriod')} value={dynamicStats.carsRepairedThisPeriod} icon={WrenchScrewdriverIcon} colorClass="bg-yellow-500" />
        </div>
        <DashboardCard title={getLabel('totalExpensesPeriod')} value={`${dynamicStats.totalExpensesThisPeriod.toFixed(2)} ${currency.symbol}`} icon={ArrowTrendingDownIcon} colorClass="bg-red-500" />
        <DashboardCard title={getLabel('totalRevenuePeriod')} value={`${dynamicStats.totalRevenueThisPeriod.toFixed(2)} ${currency.symbol}`} icon={ArrowTrendingUpIcon} colorClass="bg-teal-500" />
        <div onClick={handleDueFromCustomersClick} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleDueFromCustomersClick()} className="cursor-pointer">
         <DashboardCard title={getLabel('dueFromCustomers')} value={`${dynamicStats.dueFromCustomers.toFixed(2)} ${currency.symbol}`} icon={BanknotesIcon} colorClass="bg-purple-500" />
        </div>
        <div onClick={handleDueToSuppliersClick} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleDueToSuppliersClick()} className="cursor-pointer">
         <DashboardCard title={getLabel('dueToSuppliers')} value={`${dynamicStats.dueToSuppliers.toFixed(2)} ${currency.symbol}`} icon={CurrencyDollarIcon} colorClass="bg-pink-500" />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{getLabel('recentActivity')}</h2>
        <div className="bg-white dark:bg-secondary-800 p-0 rounded-lg shadow">
           <Table
            columns={invoiceColumns}
            data={sortedInvoices}
            keyExtractor={(invoice) => invoice.id}
            sortConfig={sortConfig as SortConfig<Invoice>}
            onSort={(config) => setSortConfig(config as SortConfig<Invoice>)}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
