
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext'; 
import Table, { Column, SortConfig } from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ColumnToggleButton from '../components/ColumnToggleButton';
import { Customer } from '../types';
import { MOCK_CUSTOMERS } from '../constants';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const getCommonInputStyle = (language: string) => {
  const baseStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white";
  const rtlStyle = language === 'ar' ? 'text-right' : 'text-left';
  return `${baseStyle} ${rtlStyle}`;
};

const getLabelStyle = (language: string) => {
  const baseStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const rtlStyle = language === 'ar' ? 'text-right' : 'text-left';
  return `${baseStyle} ${rtlStyle}`;
};

const ALL_CUSTOMER_COLUMNS_CONFIG = (getLabel: (key: string) => string, currency: { symbol: string }): Column<Customer>[] => [
    { header: 'internalId', accessor: 'internalId', sortable: true },
    { header: 'name', accessor: 'name', sortable: true },
    { header: 'phone', accessor: 'phone', sortable: true },
    { header: 'email', accessor: 'email', sortable: true },
    { header: 'address', accessor: 'address', sortable: true, className: 'text-xs max-w-xs truncate' },
    { header: 'openingBalance', accessor: (item) => `${(item.openingBalance || 0).toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'openingBalance' },
    { header: 'totalInvoiced', accessor: (item) => `${(item.totalInvoiced || 0).toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'totalInvoiced' },
    { header: 'totalPaid', accessor: (item) => `${(item.totalPaid || 0).toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'totalPaid' },
    { header: 'remainingBalance', accessor: (item) => `${(item.remainingBalance || 0).toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'remainingBalance',
      render: (item) => {
        const balance = (item.remainingBalance || 0);
        const colorClass = balance > 0 ? 'text-red-600 dark:text-red-400' : balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400';
        return <span className={colorClass}>{balance.toFixed(2)} {currency.symbol}</span>;
      }
    },
];


// دالة لحساب القيم المالية للعميل
const calculateCustomerFinancials = (customer: Customer): Customer => {
  // هنا يمكن حساب القيم من الفواتير الفعلية
  // حالياً نستخدم القيم الموجودة أو نحسبها من البيانات التجريبية
  const totalInvoiced = customer.totalInvoiced || 0;
  const totalPaid = customer.totalPaid || 0;
  const openingBalance = customer.openingBalance || 0;
  const remainingBalance = openingBalance + totalInvoiced - totalPaid;

  return {
    ...customer,
    totalInvoiced,
    totalPaid,
    remainingBalance
  };
};

const CustomersPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language, currency } = context;

  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS.map(calculateCustomerFinancials));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<Customer>>({ key: null, direction: null });

  const initialFormData: Omit<Customer, 'id' | 'createdAt' | 'internalId'> = {
    name: '', phone: '', email: '', address: '', openingBalance: 0
  };
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt' | 'internalId'>>(initialFormData);

  // Column Visibility
  const ALL_COLUMNS_WITH_LABELS = useMemo(() => 
    ALL_CUSTOMER_COLUMNS_CONFIG(getLabel, currency).map(col => ({ key: col.header, label: getLabel(col.header) || col.header })),
  [getLabel, currency]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    const stored = localStorage.getItem('visibleCustomerColumns');
    return stored ? JSON.parse(stored) : ALL_COLUMNS_WITH_LABELS.map(c => c.key);
  });

  useEffect(() => {
    localStorage.setItem('visibleCustomerColumns', JSON.stringify(visibleColumnKeys));
  }, [visibleColumnKeys]);

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumnKeys(prev =>
      prev.includes(columnKey) ? prev.filter(k => k !== columnKey) : [...prev, columnKey]
    );
  };
  
  const displayedTableColumns = useMemo(() => {
    const actionColumn: Column<Customer> = {
      header: 'actions',
      accessor: 'id',
      render: (customer) => (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => openModalForEdit(customer)} aria-label={getLabel('edit')}><PencilIcon className="h-4 w-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(customer.id)} aria-label={getLabel('delete')}><TrashIcon className="h-4 w-4" /></Button>
        </div>
      ),
    };
    return [
        ...ALL_CUSTOMER_COLUMNS_CONFIG(getLabel, currency).filter(col => visibleColumnKeys.includes(col.header)),
        actionColumn
    ];
  }, [visibleColumnKeys, getLabel, currency]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = ['openingBalance'].includes(name) ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const openModalForCreate = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      openingBalance: customer.openingBalance || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...editingCustomer, ...formData } : c));
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        internalId: `CUST-${String(Date.now()).slice(-4)}`,
        ...formData,
        createdAt: new Date().toISOString(),
        totalInvoiced: 0, // العميل الجديد لا يوجد له فواتير
        totalPaid: 0, // العميل الجديد لم يدفع شيء
        remainingBalance: formData.openingBalance || 0 // الرصيد المتبقي = قيمة حساب أول المدة
      };
      setCustomers(prev => [calculateCustomerFinancials(newCustomer), ...prev]);
    }
    closeModal();
  };

  const handleDelete = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  };
  
  const filteredAndSortedCustomers = useMemo(() => {
    let items = customers.filter(customer =>
      customer.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Customer];
        const valB = b[sortConfig.key as keyof Customer];
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
  }, [customers, searchTerm, sortConfig]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('customers')}</h1>
        <div className="flex items-center gap-2">
           <ColumnToggleButton 
                allColumns={ALL_COLUMNS_WITH_LABELS.filter(col => col.key !== 'actions')} 
                visibleColumns={visibleColumnKeys} 
                onToggleColumn={handleToggleColumn} 
            />
            <Button onClick={openModalForCreate} leftIcon={PlusIcon}>{getLabel('addNewCustomer')}</Button>
        </div>
      </div>
      <input type="text" placeholder={`${getLabel('search')}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={getCommonInputStyle(language)} />
      <Table columns={displayedTableColumns} data={filteredAndSortedCustomers} keyExtractor={(customer) => customer.id} sortConfig={sortConfig} onSort={setSortConfig} />
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? `${getLabel('edit')} ${getLabel('customer')}` : getLabel('addNewCustomer')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
          {editingCustomer && (
            <div>
                <label htmlFor="internalId_display" className={getLabelStyle(language)}>{getLabel('internalId')}</label>
                <input type="text" name="internalId_display" id="internalId_display" value={editingCustomer.internalId} readOnly className={`${getCommonInputStyle(language)} bg-gray-100 dark:bg-secondary-600`} />
            </div>
          )}
          <div>
            <label htmlFor="name" className={getLabelStyle(language)}>{getLabel('customerName')}</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={getCommonInputStyle(language)} />
          </div>
          <div>
            <label htmlFor="phone" className={getLabelStyle(language)}>{getLabel('phone')}</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required className={getCommonInputStyle(language)} />
          </div>
          <div>
            <label htmlFor="email" className={getLabelStyle(language)}>{getLabel('email')}</label>
            <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleInputChange} className={getCommonInputStyle(language)} />
          </div>
          <div>
            <label htmlFor="address" className={getLabelStyle(language)}>{getLabel('address')}</label>
            <textarea name="address" id="address" value={formData.address || ''} onChange={handleInputChange} rows={2} className={getCommonInputStyle(language)}></textarea>
          </div>
          <div>
            <label htmlFor="openingBalance" className={getLabelStyle(language)}>{getLabel('openingBalance')}</label>
            <input type="number" step="any" name="openingBalance" id="openingBalance" value={formData.openingBalance} onChange={handleInputChange} className={getCommonInputStyle(language)} placeholder="0.00" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {language === 'ar' ? 'القيم الموجبة تعني أن العميل مدين لك، والقيم السالبة تعني أن لديه رصيد' : 'Positive values mean customer owes you, negative values mean customer has credit'}
            </p>
          </div>
          <div className="pt-2 flex justify-end space-x-3 rtl:space-x-reverse">
            <Button type="button" variant="secondary" onClick={closeModal}>{getLabel('cancel')}</Button>
            <Button type="submit" variant="primary">{getLabel('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
