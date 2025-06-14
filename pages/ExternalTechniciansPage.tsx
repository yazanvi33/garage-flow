import React, { useState, useMemo, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';
import { Invoice, InvoiceItem, MaintenanceCard, Vehicle, Employee, InvoiceType } from '../types';
import { MOCK_INVOICES, MOCK_MAINTENANCE_CARDS, MOCK_VEHICLES, MOCK_EMPLOYEES } from '../constants';
import { AppContext } from '../context/AppContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import ColumnToggleButton from '../components/ColumnToggleButton';

const ExternalTechniciansPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { language, getLabel, currentUser } = context;
  
  // State management
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES.filter(inv => inv.type === 'External Technician Wages'));
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' | null }>({ key: null, direction: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    externalTechnicianName: '',
    maintenanceCardId: '',
    dateIssued: new Date().toISOString().split('T')[0],
    subTotal: 0,
    discountAmount: 0,
    totalAmount: 0,
    amountPaid: 0,
    notes: ''
  });

  const [currentItems, setCurrentItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    serviceDescription: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
  });

  // Combobox states
  const [maintenanceCardQuery, setMaintenanceCardQuery] = useState('');
  const [selectedMaintenanceCard, setSelectedMaintenanceCard] = useState<MaintenanceCard | null>(null);

  // Data maps
  const maintenanceCardsMap = useMemo(() => MOCK_MAINTENANCE_CARDS.reduce((map, mc) => { map[mc.id] = mc; return map; }, {} as Record<string, MaintenanceCard>), []);
  const vehiclesMap = useMemo(() => MOCK_VEHICLES.reduce((map, v) => { map[v.id] = v; return map; }, {} as Record<string, Vehicle>), []);
  const employeesMap = useMemo(() => MOCK_EMPLOYEES.reduce((map, e) => { map[e.id] = e; return map; }, {} as Record<string, Employee>), []);

  // Common styles
  const commonInputStyle = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white sm:text-sm py-2 px-3";

  // Filtered data for comboboxes
  const filteredMaintenanceCards = useMemo(() => {
    return maintenanceCardQuery === ''
      ? MOCK_MAINTENANCE_CARDS
      : MOCK_MAINTENANCE_CARDS.filter(mc =>
          mc.internalId.toLowerCase().includes(maintenanceCardQuery.toLowerCase()) ||
          vehiclesMap[mc.vehicleId]?.licensePlate.toLowerCase().includes(maintenanceCardQuery.toLowerCase())
        );
  }, [maintenanceCardQuery, vehiclesMap]);

  // Calculate totals
  const calculateTotals = () => {
    const subTotal = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subTotal - formData.discountAmount;
    setFormData(prev => ({
      ...prev,
      subTotal,
      totalAmount
    }));
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle discount change
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const discountAmount = parseFloat(e.target.value) || 0;
    const subTotal = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subTotal - discountAmount;
    setFormData(prev => ({
      ...prev,
      discountAmount,
      totalAmount
    }));
  };

  // Add item to invoice
  const addItem = () => {
    if (!newItem.serviceDescription || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      alert('يرجى ملء جميع بيانات البند بشكل صحيح');
      return;
    }

    const totalPrice = newItem.quantity * newItem.unitPrice;
    const item: InvoiceItem = {
      id: `eti-${Date.now()}`,
      serviceDescription: newItem.serviceDescription,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      totalPrice,
    };

    setCurrentItems(prev => [...prev, item]);
    setNewItem({ serviceDescription: '', quantity: 1, unitPrice: 0, totalPrice: 0 });
  };

  // Remove item from invoice
  const removeItem = (itemId: string) => {
    setCurrentItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle item changes
  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setCurrentItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Modal functions
  const openModalForCreate = () => {
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      externalTechnicianName: '',
      maintenanceCardId: '',
      dateIssued: new Date().toISOString().split('T')[0],
      subTotal: 0,
      discountAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      notes: ''
    });
    setCurrentItems([]);
    setSelectedMaintenanceCard(null);
    setMaintenanceCardQuery('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      externalTechnicianName: invoice.externalTechnicianName || '',
      maintenanceCardId: invoice.maintenanceCardId || '',
      dateIssued: invoice.dateIssued,
      subTotal: invoice.subTotal,
      discountAmount: invoice.discountAmount,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      notes: invoice.notes || ''
    });
    setCurrentItems([...invoice.items]);
    const mc = invoice.maintenanceCardId ? maintenanceCardsMap[invoice.maintenanceCardId] : null;
    setSelectedMaintenanceCard(mc);
    setMaintenanceCardQuery(mc?.internalId || '');
    setIsModalOpen(true);
  };

  const openViewModal = (invoice: Invoice) => {
    setViewingInvoice(invoice);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const closeViewModal = () => {
    setViewingInvoice(null);
  };

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [currentItems, formData.discountAmount]);

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoiceNumber || !formData.externalTechnicianName || currentItems.length === 0) {
      alert('يرجى ملء جميع البيانات المطلوبة وإضافة بند واحد على الأقل');
      return;
    }

    const invoiceData: Invoice = {
      id: editingInvoice ? editingInvoice.id : `eti-${Date.now()}`,
      invoiceNumber: formData.invoiceNumber,
      type: InvoiceType.EXTERNAL_TECHNICIAN,
      externalTechnicianName: formData.externalTechnicianName,
      maintenanceCardId: selectedMaintenanceCard?.id,
      dateIssued: formData.dateIssued,
      items: currentItems,
      subTotal: formData.subTotal,
      discountAmount: formData.discountAmount,
      taxAmount: 0, // External technician invoices typically don't have tax directly
      totalAmount: formData.totalAmount,
      amountPaid: formData.amountPaid,
      amountDue: formData.totalAmount - formData.amountPaid,
      paymentStatus: (formData.totalAmount - formData.amountPaid <= 0) ? 'paid' : (formData.amountPaid > 0 ? 'partiallyPaid' : 'unpaid'),
      notes: formData.notes,
    };

    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? invoiceData : inv));
    } else {
      setInvoices(prev => [...prev, invoiceData]);
    }

    closeModal();
  };

  // Delete invoice
  const handleDelete = (id: string) => {
    if (window.confirm(getLabel('confirmDelete') || 'هل أنت متأكد من الحذف؟')) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.externalTechnicianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.maintenanceCardId && maintenanceCardsMap[invoice.maintenanceCardId]?.internalId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [invoices, searchTerm, maintenanceCardsMap]);

  const sortedInvoices = useMemo(() => {
    let items = [...filteredInvoices];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Invoice];
        const valB = b[sortConfig.key as keyof Invoice];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }
    return items.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  }, [filteredInvoices, sortConfig]);

  // Table columns
  const allColumns = useMemo(() => [
    { header: 'invoiceNumber', accessor: 'invoiceNumber' as keyof Invoice, sortable: true },
    { header: 'externalTechnicianName', accessor: 'externalTechnicianName' as keyof Invoice, sortable: true },
    { header: 'maintenanceCard', accessor: (item: Invoice) => maintenanceCardsMap[item.maintenanceCardId || '']?.internalId || '-', sortable: false },
    { header: 'dateIssued', accessor: (item: Invoice) => new Date(item.dateIssued).toLocaleDateString(language), sortable: true, sortKey: 'dateIssued' },
    { header: 'totalAmount', accessor: (item: Invoice) => item.totalAmount.toFixed(2), sortable: true },
    { header: 'amountPaid', accessor: (item: Invoice) => item.amountPaid.toFixed(2), sortable: true },
    {
      header: 'paymentStatus',
      accessor: (item: Invoice) => {
        const remaining = item.totalAmount - item.amountPaid;
        let statusText = '';
        let statusClass = '';

        if (remaining <= 0) {
          statusText = getLabel('paid');
          statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        } else if (item.amountPaid > 0 && remaining > 0) {
          statusText = getLabel('partiallyPaid');
          statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        } else {
          statusText = getLabel('unpaid');
          statusClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        }
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>{statusText}</span>;
      },
      sortable: false
    },
    {
      header: 'actions',
      accessor: 'id' as keyof Invoice,
      render: (invoice: Invoice) => (
        <div className="flex space-x-1 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => openViewModal(invoice)} aria-label={getLabel('view')}><EyeIcon className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => openModalForEdit(invoice)} aria-label={getLabel('edit')}><PencilIcon className="h-4 w-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(invoice.id)} aria-label={getLabel('delete')}><TrashIcon className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], [language, maintenanceCardsMap, getLabel]);

  // Initialize visible columns to all columns on first render
  useEffect(() => {
    if (allColumns.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(allColumns.map(col => col.header));
    }
  }, [allColumns, visibleColumns.length]);

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const columnsToShow = useMemo(() => {
    return allColumns.filter(col => visibleColumns.includes(col.header));
  }, [allColumns, visibleColumns]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('externalTechnicianInvoices')}</h1>
        <div className="flex items-center gap-2">
          <ColumnToggleButton
            allColumns={allColumns.map(col => ({ key: col.header, label: getLabel(col.header) || col.header }))}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumnVisibility}
          />
          <Button onClick={openModalForCreate} leftIcon={PlusIcon}>{getLabel('addNewExternalTechnicianInvoice')}</Button>
        </div>
      </div>
      
      <input 
        type="text" 
        placeholder={`${getLabel('search')}...`} 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        className={commonInputStyle} 
      />
      
      <Table 
        columns={columnsToShow} 
        data={sortedInvoices} 
        keyExtractor={(invoice) => invoice.id} 
        sortConfig={sortConfig} 
        onSort={setSortConfig} 
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingInvoice ? getLabel('editExternalTechnicianInvoice') : getLabel('addNewExternalTechnicianInvoice')} size="4xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto custom-scroll p-1">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('invoiceNumber')}</label>
              <input type="text" name="invoiceNumber" id="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} required className={commonInputStyle} />
            </div>
            <div>
              <label htmlFor="externalTechnicianName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('externalTechnicianName')}</label>
              <input type="text" name="externalTechnicianName" id="externalTechnicianName" value={formData.externalTechnicianName} onChange={handleInputChange} required className={commonInputStyle} />
            </div>
            <div>
              <label htmlFor="dateIssued" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('dateIssued')}</label>
              <input type="date" name="dateIssued" id="dateIssued" value={formData.dateIssued} onChange={handleInputChange} required className={commonInputStyle} />
            </div>
          </div>

          {/* Maintenance Card Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maintenance-card-combobox" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('maintenanceCard')}</label>
              <Combobox value={selectedMaintenanceCard} onChange={(mc) => {
                setSelectedMaintenanceCard(mc);
                setFormData(prev => ({ ...prev, maintenanceCardId: mc?.id || '' }));
              }}>
                <div className="relative mt-1">
                  <Combobox.Input
                    id="maintenance-card-combobox"
                    name="maintenanceCard"
                    className={commonInputStyle}
                    displayValue={(mc: MaintenanceCard) => mc?.internalId || ''}
                    onChange={(event) => setMaintenanceCardQuery(event.target.value)}
                    placeholder={getLabel('selectMaintenanceCardOptional') || 'اختر بطاقة صيانة (اختياري)'}
                  />
                  <Combobox.Button className="absolute inset-y-0 end-0 flex items-center pe-3 rtl:ps-3 rtl:inset-y-0 rtl:start-0 rtl:end-auto">
                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
                  </Combobox.Button>
                  <Combobox.Options className={`absolute mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-secondary-700 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm z-50 ${language === 'ar' ? 'right-0 left-auto' : 'left-0 right-auto'}`}>
                    {filteredMaintenanceCards.map((mc) => (
                      <Combobox.Option
                        key={mc.id}
                        value={mc}
                        className={({ active }) => `relative cursor-default select-none py-2 ${language === 'ar' ? 'text-right ps-4 pe-10' : 'text-left ps-10 pe-4'} ${active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-white'}`}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {mc.internalId} - {vehiclesMap[mc.vehicleId]?.licensePlate || getLabel('unknownVehicle')}
                            </span>
                            {selected ? (
                              <span className={`absolute inset-y-0 ${language === 'ar' ? 'left-0 pl-3' : 'left-0 pl-3'} flex items-center ${active ? 'text-white' : 'text-primary-600'}`}>
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
            {selectedMaintenanceCard && vehiclesMap[selectedMaintenanceCard.vehicleId] && (
              <div className="bg-gray-50 dark:bg-secondary-700 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{getLabel('vehicleInformation')}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {getLabel('make')}: {vehiclesMap[selectedMaintenanceCard.vehicleId]?.make} - 
                  {getLabel('model')}: {vehiclesMap[selectedMaintenanceCard.vehicleId]?.model} - 
                  {getLabel('licensePlate')}: {vehiclesMap[selectedMaintenanceCard.vehicleId]?.licensePlate}
                </p>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <fieldset className="border p-4 rounded-md dark:border-gray-600">
            <legend className="text-lg font-medium px-2 dark:text-white">{getLabel('invoiceItems')}</legend>

            {/* Existing Items */}
            {currentItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center mb-2 p-2 border-b dark:border-gray-700">
                <div className="col-span-6">
                  <label htmlFor={`serviceDescription-${item.id}`} className="text-xs text-gray-700 dark:text-gray-300">{getLabel('description')}</label>
                  <input
                    id={`serviceDescription-${item.id}`}
                    name={`serviceDescription-${item.id}`}
                    type="text"
                    value={item.serviceDescription || ''}
                    onChange={e => handleItemChange(item.id, 'serviceDescription', e.target.value)}
                    className={commonInputStyle}
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor={`quantity-${item.id}`} className="text-xs text-gray-700 dark:text-gray-300">{getLabel('quantity')}</label>
                  <input
                    id={`quantity-${item.id}`}
                    name={`quantity-${item.id}`}
                    type="number"
                    value={item.quantity}
                    onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    min="1"
                    className={commonInputStyle}
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor={`unitPrice-${item.id}`} className="text-xs text-gray-700 dark:text-gray-300">{getLabel('unitPrice')}</label>
                  <input
                    id={`unitPrice-${item.id}`}
                    name={`unitPrice-${item.id}`}
                    type="number"
                    value={item.unitPrice}
                    onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className={commonInputStyle}
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <Button type="button" variant="danger" size="sm" onClick={() => removeItem(item.id)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add New Item */}
            <div className="grid grid-cols-12 gap-2 items-end mt-4 p-2 border-t dark:border-gray-600">
              <div className="col-span-6">
                <label htmlFor="new-serviceDescription" className="text-xs text-gray-700 dark:text-gray-300">{getLabel('description')}</label>
                <input
                  id="new-serviceDescription"
                  name="newServiceDescription"
                  type="text"
                  value={newItem.serviceDescription}
                  onChange={e => setNewItem(prev => ({ ...prev, serviceDescription: e.target.value }))}
                  className={commonInputStyle}
                  placeholder={getLabel('serviceDescriptionPlaceholder') || 'وصف الخدمة أو العمل'}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="new-quantity" className="text-xs text-gray-700 dark:text-gray-300">{getLabel('quantity')}</label>
                <input
                  id="new-quantity"
                  name="newQuantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={e => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  min="1"
                  className={commonInputStyle}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="new-unitPrice" className="text-xs text-gray-700 dark:text-gray-300">{getLabel('unitPrice')}</label>
                <input
                  id="new-unitPrice"
                  name="newUnitPrice"
                  type="number"
                  value={newItem.unitPrice}
                  onChange={e => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className={commonInputStyle}
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Button type="button" variant="secondary" onClick={addItem} leftIcon={PlusIcon}>{getLabel('addItem')}</Button>
              </div>
            </div>
          </fieldset>

          {/* Invoice Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('notes')}</label>
                <textarea name="notes" id="notes" value={formData.notes} onChange={handleInputChange} rows={3} className={commonInputStyle}></textarea>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="subTotal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('subtotal')}</label>
                <input
                  id="subTotal"
                  name="subTotal"
                  type="text"
                  value={formData.subTotal.toFixed(2)}
                  readOnly
                  className={`${commonInputStyle} bg-gray-100 dark:bg-secondary-600 text-gray-900 dark:text-white`}
                />
              </div>
              <div>
                <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('discount')}</label>
                <input type="number" name="discountAmount" id="discountAmount" value={formData.discountAmount} onChange={handleDiscountChange} min="0" step="0.01" className={commonInputStyle} />
              </div>
              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('totalAmount')}</label>
                <input
                  id="totalAmount"
                  name="totalAmount"
                  type="text"
                  value={formData.totalAmount.toFixed(2)}
                  readOnly
                  className={`${commonInputStyle} bg-gray-100 dark:bg-secondary-600 text-gray-900 dark:text-white font-bold`}
                />
              </div>
              <div>
                <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('amountPaid')}</label>
                <input type="number" name="amountPaid" id="amountPaid" value={formData.amountPaid} onChange={handleInputChange} min="0" step="0.01" className={commonInputStyle} />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 rtl:space-x-reverse border-t dark:border-secondary-600">
            <Button type="button" variant="secondary" onClick={closeModal}>{getLabel('cancel')}</Button>
            <Button type="submit" variant="primary">{getLabel('save')}</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingInvoice && (
        <Modal isOpen={!!viewingInvoice} onClose={closeViewModal} title={`${getLabel('externalTechnicianInvoice')} ${viewingInvoice.invoiceNumber}`} size="3xl">
          <div className="space-y-4 text-sm p-2">
            {/* Invoice Details */}
            <div>
              <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('invoiceDetails')}</h4>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('invoiceNumber')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.invoiceNumber}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('externalTechnicianName')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.externalTechnicianName || '-'}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('dateIssued')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{new Date(viewingInvoice.dateIssued).toLocaleDateString(language)}</dd>
                </div>
                {viewingInvoice.maintenanceCardId && (
                  <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                    <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('maintenanceCard')}:</dt>
                    <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">
                      {maintenanceCardsMap[viewingInvoice.maintenanceCardId]?.internalId || '-'}
                      {vehiclesMap[maintenanceCardsMap[viewingInvoice.maintenanceCardId]?.vehicleId || ''] && 
                        ` (${vehiclesMap[maintenanceCardsMap[viewingInvoice.maintenanceCardId]?.vehicleId || '']?.licensePlate})`}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Invoice Items */}
            <div>
              <h4 className="text-md font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('invoiceItems')}</h4>
              {viewingInvoice.items.length > 0 ? (
                <div className="overflow-x-auto max-h-60">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-secondary-700">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{getLabel('description')}</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('quantity')}</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('unitPrice')}</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('totalPrice')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                      {viewingInvoice.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white">{item.serviceDescription || '-'}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{item.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-gray-500 dark:text-gray-400">{getLabel('noDataFound')}</p>}
            </div>

            {/* Invoice Totals */}
            <div>
              <h4 className="text-md font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('invoiceTotals') || 'إجماليات الفاتورة'}</h4>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('subtotal')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.subTotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('discount')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.discountAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('totalAmount')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left font-bold">{viewingInvoice.totalAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('amountPaid')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.amountPaid.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('remainingBalance')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left font-bold text-red-600 dark:text-red-400">{(viewingInvoice.totalAmount - viewingInvoice.amountPaid).toFixed(2)}</dd>
                </div>
              </dl>
            </div>

            {viewingInvoice.notes && (
              <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('notes')}:</dt>
                <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.notes}</dd>
              </div>
            )}

            <div className="pt-4 flex justify-end border-t dark:border-gray-700 mt-4">
              <Button variant="secondary" onClick={closeViewModal}>{getLabel('close')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExternalTechniciansPage;
