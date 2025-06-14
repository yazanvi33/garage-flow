import React, { useState, useMemo, useContext } from 'react';
import { createPortal } from 'react-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';
import { PurchaseInvoice, PurchaseInvoiceItem, SparePart, Supplier, Employee } from '../types';
import { MOCK_PURCHASE_INVOICES, MOCK_PARTS, MOCK_SUPPLIERS, MOCK_EMPLOYEES } from '../constants';
import { AppContext } from '../context/AppContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import ColumnToggleButton from '../components/ColumnToggleButton';

const PurchaseInvoicesPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { language, getLabel, currentUser } = context;
  
  // State management
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(MOCK_PURCHASE_INVOICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
  const [partToView, setPartToView] = useState<SparePart | null>(null);
  const [isPartDetailModalOpen, setIsPartDetailModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' | null }>({ key: null, direction: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    subtotal: 0,
    discount: 0,
    totalAfterDiscount: 0,
    amountPaid: 0,
    notes: ''
  });

  const [currentItems, setCurrentItems] = useState<PurchaseInvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    partId: '',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  });

  // Combobox states
  const [supplierQuery, setSupplierQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [partQuery, setPartQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  // Data maps
  const partsMap = useMemo(() => MOCK_PARTS.reduce((map, p) => { map[p.id] = p; return map; }, {} as Record<string, SparePart>), []);
  const suppliersMap = useMemo(() => MOCK_SUPPLIERS.reduce((map, s) => { map[s.id] = s; return map; }, {} as Record<string, Supplier>), []);
  const employeesMap = useMemo(() => MOCK_EMPLOYEES.reduce((map, e) => { map[e.id] = e; return map; }, {} as Record<string, Employee>), []);

  // Common styles
  const commonInputStyle = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white sm:text-sm py-2 px-3";

  // Filtered data for comboboxes
  const filteredSuppliers = useMemo(() => {
    return supplierQuery === ''
      ? MOCK_SUPPLIERS
      : MOCK_SUPPLIERS.filter(supplier =>
          supplier.name.toLowerCase().includes(supplierQuery.toLowerCase())
        );
  }, [supplierQuery]);

  const filteredParts = useMemo(() => {
    return partQuery === ''
      ? MOCK_PARTS
      : MOCK_PARTS.filter(part =>
          part.name.toLowerCase().includes(partQuery.toLowerCase()) ||
          (part.sku && part.sku.toLowerCase().includes(partQuery.toLowerCase())) ||
          (part.compatibleVehicles && part.compatibleVehicles.toLowerCase().includes(partQuery.toLowerCase()))
        );
  }, [partQuery]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAfterDiscount = subtotal - formData.discount;
    setFormData(prev => ({
      ...prev,
      subtotal,
      totalAfterDiscount
    }));
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle discount change
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const discount = parseFloat(e.target.value) || 0;
    const subtotal = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAfterDiscount = subtotal - discount;
    setFormData(prev => ({
      ...prev,
      discount,
      totalAfterDiscount
    }));
  };

  // Add item to invoice
  const addItem = () => {
    if (!selectedPart || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      alert('يرجى ملء جميع بيانات البند بشكل صحيح');
      return;
    }

    const totalPrice = newItem.quantity * newItem.unitPrice;
    const item: PurchaseInvoiceItem = {
      id: `pii-${Date.now()}`,
      partId: selectedPart.id,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      totalPrice,
      notes: newItem.notes
    };

    setCurrentItems(prev => [...prev, item]);
    setNewItem({ partId: '', quantity: 1, unitPrice: 0, notes: '' });
    setSelectedPart(null);
    setPartQuery('');
  };

  // Remove item from invoice
  const removeItem = (itemId: string) => {
    setCurrentItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle item changes
  const handleItemChange = (itemId: string, field: keyof PurchaseInvoiceItem, value: any) => {
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
      invoiceDate: new Date().toISOString().split('T')[0],
      supplierId: '',
      subtotal: 0,
      discount: 0,
      totalAfterDiscount: 0,
      amountPaid: 0,
      notes: ''
    });
    setCurrentItems([]);
    setSelectedSupplier(null);
    setSupplierQuery('');
    setSelectedPart(null);
    setPartQuery('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (invoice: PurchaseInvoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      supplierId: invoice.supplierId,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      totalAfterDiscount: invoice.totalAfterDiscount,
      amountPaid: invoice.amountPaid,
      notes: invoice.notes || ''
    });
    setCurrentItems([...invoice.items]);
    const supplier = suppliersMap[invoice.supplierId];
    setSelectedSupplier(supplier || null);
    setSupplierQuery(supplier?.name || '');
    setSelectedPart(null);
    setPartQuery('');
    setIsModalOpen(true);
  };

  const openViewModal = (invoice: PurchaseInvoice) => {
    setViewingInvoice(invoice);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const closeViewModal = () => {
    setViewingInvoice(null);
  };

  const openPartDetailModal = (partId: string) => {
    const part = partsMap[partId];
    if (part) {
      setPartToView(part);
      setIsPartDetailModalOpen(true);
    }
  };

  const closePartDetailModal = () => {
    setPartToView(null);
    setIsPartDetailModalOpen(false);
  };

  // Calculate totals when items change
  React.useEffect(() => {
    calculateTotals();
  }, [currentItems, formData.discount]);

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoiceNumber || !selectedSupplier || currentItems.length === 0) {
      alert('يرجى ملء جميع البيانات المطلوبة وإضافة بند واحد على الأقل');
      return;
    }

    const invoiceData: PurchaseInvoice = {
      id: editingInvoice ? editingInvoice.id : `pi-${Date.now()}`,
      internalId: editingInvoice ? editingInvoice.internalId : `PI-${String(invoices.length + 1).padStart(4, '0')}`,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
      supplierId: selectedSupplier.id,
      subtotal: formData.subtotal,
      discount: formData.discount,
      totalAfterDiscount: formData.totalAfterDiscount,
      amountPaid: formData.amountPaid,
      items: currentItems,
      notes: formData.notes,
      createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString(),
      createdBy: editingInvoice ? editingInvoice.createdBy : (currentUser?.id || 'unknown')
    };

    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? invoiceData : inv));
    } else {
      setInvoices(prev => [...prev, invoiceData]);
      
      // Update parts inventory and purchase prices
      currentItems.forEach(item => {
        // This would normally update the parts in the database
        // For now, we'll just log the inventory updates needed
        console.log(`Update part ${item.partId}: +${item.quantity} quantity, purchase price: ${item.unitPrice}`);
      });
      
      // Update supplier balance
      console.log(`Update supplier ${selectedSupplier.id}: +${formData.totalAfterDiscount} due, +${formData.amountPaid} paid`);
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
      invoice.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suppliersMap[invoice.supplierId]?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm, suppliersMap]);

  const sortedInvoices = useMemo(() => {
    let items = [...filteredInvoices];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key as keyof PurchaseInvoice];
        const valB = b[sortConfig.key as keyof PurchaseInvoice];
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
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredInvoices, sortConfig]);

  // Table columns
  const allColumns = useMemo(() => [
    { header: 'internalId', accessor: 'internalId' as keyof PurchaseInvoice, sortable: true },
    { header: 'supplierInvoiceNumber', accessor: 'invoiceNumber' as keyof PurchaseInvoice, sortable: true },
    { header: 'invoiceDate', accessor: (item: PurchaseInvoice) => new Date(item.invoiceDate).toLocaleDateString(language), sortable: true, sortKey: 'invoiceDate' },
    { header: 'supplier', accessor: (item: PurchaseInvoice) => suppliersMap[item.supplierId]?.name || '-', sortable: false },
    { header: 'totalAfterDiscount', accessor: (item: PurchaseInvoice) => item.totalAfterDiscount.toFixed(2), sortable: true },
    { header: 'amountPaid', accessor: (item: PurchaseInvoice) => item.amountPaid.toFixed(2), sortable: true },
    {
      header: 'paymentStatus',
      accessor: (item: PurchaseInvoice) => {
        const remaining = item.totalAfterDiscount - item.amountPaid;
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
      accessor: 'id' as keyof PurchaseInvoice,
      render: (invoice: PurchaseInvoice) => (
        <div className="flex space-x-1 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => openViewModal(invoice)} aria-label={getLabel('view')}><EyeIcon className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => openModalForEdit(invoice)} aria-label={getLabel('edit')}><PencilIcon className="h-4 w-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(invoice.id)} aria-label={getLabel('delete')}><TrashIcon className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], [language, suppliersMap, getLabel]);

  // Initialize visible columns to all columns on first render
  React.useEffect(() => {
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
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('purchaseInvoices')}</h1>
        <div className="flex items-center gap-2">
          <ColumnToggleButton
            allColumns={allColumns.map(col => ({ key: col.header, label: getLabel(col.header) || col.header }))}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumnVisibility}
          />
          <Button onClick={openModalForCreate} leftIcon={PlusIcon}>{getLabel('addNewPurchaseInvoice')}</Button>
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
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingInvoice ? getLabel('editPurchaseInvoice') : getLabel('addNewPurchaseInvoice')} size="4xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto custom-scroll p-1">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('supplierInvoiceNumber')}</label>
              <input type="text" name="invoiceNumber" id="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} required className={commonInputStyle} />
            </div>
            <div>
              <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('invoiceDate')}</label>
              <input type="date" name="invoiceDate" id="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} required className={commonInputStyle} />
            </div>
            <div>
              <label htmlFor="supplier-combobox" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('supplier')}</label>
              <Combobox value={selectedSupplier} onChange={(supplier) => {
                setSelectedSupplier(supplier);
                setFormData(prev => ({ ...prev, supplierId: supplier?.id || '' }));
              }}>
                <div className="relative mt-1">
                  <Combobox.Input
                    id="supplier-combobox"
                    name="supplier"
                    className={commonInputStyle}
                    displayValue={(supplier: Supplier) => supplier?.name || ''}
                    onChange={(event) => setSupplierQuery(event.target.value)}
                    placeholder={getLabel('selectSupplier') || 'اختر المورد'}
                  />
                  <Combobox.Button className="absolute inset-y-0 end-0 flex items-center pe-3 rtl:ps-3 rtl:inset-y-0 rtl:start-0 rtl:end-auto">
                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
                  </Combobox.Button>
                  <Combobox.Options className={`absolute mt-1 max-h-60 w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-secondary-700 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm z-50 ${language === 'ar' ? 'right-0 left-auto' : 'left-0 right-auto'}`}>
                    {filteredSuppliers.map((supplier) => (
                      <Combobox.Option
                        key={supplier.id}
                        value={supplier}
                        className={({ active }) => `relative cursor-default select-none py-2 ${language === 'ar' ? 'text-right ps-4 pe-10' : 'text-left ps-10 pe-4'} ${active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-white'}`}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {supplier.name}
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
          </div>

          {/* Invoice Items */}
          <fieldset className="border p-4 rounded-md dark:border-gray-600">
            <legend className="text-lg font-medium px-2 dark:text-white">{getLabel('invoiceItems')}</legend>

            {/* Existing Items */}
            {currentItems.map((item, index) => {
              const part = partsMap[item.partId];
              return (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center mb-2 p-2 border-b dark:border-gray-700">
                  <div className="col-span-4">
                    <label htmlFor={`part-${item.id}`} className="text-xs text-gray-700 dark:text-gray-300">{getLabel('part')}</label>
                    <input
                      id={`part-${item.id}`}
                      name={`part-${item.id}`}
                      type="text"
                      value={part ? `${part.name} (${part.sku})` : getLabel('unknownPart')}
                      readOnly
                      className={`${commonInputStyle} bg-gray-100 dark:bg-secondary-600 text-gray-900 dark:text-white`}
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
                  <div className="col-span-2">
                    <label htmlFor={`totalPrice-${item.id}`} className="text-xs text-gray-700 dark:text-gray-300">{getLabel('totalPrice')}</label>
                    <input
                      id={`totalPrice-${item.id}`}
                      name={`totalPrice-${item.id}`}
                      type="text"
                      value={item.totalPrice.toFixed(2)}
                      readOnly
                      className={`${commonInputStyle} bg-gray-100 dark:bg-secondary-600 text-gray-900 dark:text-white`}
                    />
                  </div>
                  <div className="col-span-2 flex items-end space-x-1 rtl:space-x-reverse">
                    <Button type="button" variant="outline" size="sm" onClick={() => openPartDetailModal(item.partId)} title={getLabel('partDetails')}>
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => removeItem(item.id)}>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Add New Item */}
            <div className="grid grid-cols-12 gap-2 items-end mt-4 p-2 border-t dark:border-gray-600">
              <div className="col-span-4">
                <label htmlFor="new-part-combobox" className="text-xs text-gray-700 dark:text-gray-300">{getLabel('part')}</label>
                <Combobox value={selectedPart} onChange={setSelectedPart}>
                  <div className="relative">
                    <Combobox.Input
                      id="new-part-combobox"
                      name="newPart"
                      className={commonInputStyle}
                      displayValue={(part: SparePart) => part ? `${part.name} (${part.sku})` : ''}
                      onChange={(event) => setPartQuery(event.target.value)}
                      placeholder={getLabel('selectPart')}
                    />
                    <Combobox.Button className="absolute inset-y-0 end-0 flex items-center pe-3 rtl:ps-3 rtl:inset-y-0 rtl:start-0 rtl:end-auto">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
                    </Combobox.Button>
                    <Combobox.Options className={`absolute mt-1 max-h-60 w-96 sm:w-[28rem] overflow-auto scrollbar-thin rounded-md bg-white dark:bg-secondary-700 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm z-50 ${language === 'ar' ? 'right-0 left-auto' : 'left-0 right-auto'}`}>
                      {filteredParts.map((part) => (
                        <Combobox.Option
                          key={part.id}
                          value={part}
                          className={({ active }) => `relative cursor-default select-none py-3 ${language === 'ar' ? 'text-right ps-4 pe-10' : 'text-left ps-10 pe-4'} ${active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-white'}`}
                        >
                          {({ selected, active }) => (
                            <>
                              <div className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 dark:text-white truncate flex-1">{part.name}</span>
                                  <span className="text-sm text-primary-600 dark:text-primary-400 ml-2 flex-shrink-0">
                                    {getLabel('available')}: {part.quantityInStock}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${part.condition === 'New' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                    {part.condition ? (language === 'ar' ? (part.condition === 'New' ? 'جديدة' : 'مستعملة') : (part.condition === 'New' ? 'New' : 'Used')) : ''}
                                  </span>
                                  {part.sku && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">SKU: {part.sku}</span>}
                                </div>
                                {part.compatibleVehicles && (
                                  <div className="mt-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-300 block truncate">
                                      {language === 'ar' ? 'متوافق مع: ' : 'Compatible: '}{part.compatibleVehicles.length > 40 ? part.compatibleVehicles.substring(0, 40) + '...' : part.compatibleVehicles}
                                    </span>
                                  </div>
                                )}
                              </div>
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
              <div className="col-span-2">
                <label htmlFor="new-totalPrice" className="text-xs text-gray-700 dark:text-gray-300">{getLabel('totalPrice')}</label>
                <input
                  id="new-totalPrice"
                  name="newTotalPrice"
                  type="text"
                  value={(newItem.quantity * newItem.unitPrice).toFixed(2)}
                  readOnly
                  className={`${commonInputStyle} bg-gray-100 dark:bg-secondary-600 text-gray-900 dark:text-white`}
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Button type="button" variant="secondary" onClick={addItem} leftIcon={PlusIcon}>{getLabel('addItemToInvoice')}</Button>
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
                <label htmlFor="subtotal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('subtotal')}</label>
                <input
                  id="subtotal"
                  name="subtotal"
                  type="text"
                  value={formData.subtotal.toFixed(2)}
                  readOnly
                  className={`${commonInputStyle} bg-gray-100 dark:bg-secondary-600 text-gray-900 dark:text-white`}
                />
              </div>
              <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('discount')}</label>
                <input type="number" name="discount" id="discount" value={formData.discount} onChange={handleDiscountChange} min="0" step="0.01" className={commonInputStyle} />
              </div>
              <div>
                <label htmlFor="totalAfterDiscount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('totalAfterDiscount')}</label>
                <input
                  id="totalAfterDiscount"
                  name="totalAfterDiscount"
                  type="text"
                  value={formData.totalAfterDiscount.toFixed(2)}
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
        <Modal isOpen={!!viewingInvoice} onClose={closeViewModal} title={`${getLabel('purchaseInvoice')} ${viewingInvoice.internalId}`} size="3xl">
          <div className="space-y-4 text-sm p-2">
            {/* Invoice Details */}
            <div>
              <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('invoiceDetails')}</h4>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('internalId')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.internalId}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('supplierInvoiceNumber')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.invoiceNumber}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('invoiceDate')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{new Date(viewingInvoice.invoiceDate).toLocaleDateString(language)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('supplier')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{suppliersMap[viewingInvoice.supplierId]?.name || '-'}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('createdBy')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{employeesMap[viewingInvoice.createdBy]?.name || '-'}</dd>
                </div>
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
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{getLabel('part')}</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('quantity')}</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('unitPrice')}</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('totalPrice')}</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{getLabel('notes')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                      {viewingInvoice.items.map(item => {
                        const part = partsMap[item.partId];
                        return (
                          <tr key={item.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white">
                              {part?.name || getLabel('unknownPart')} ({part?.sku || 'N/A'})
                            </td>
                            <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{item.quantity}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{item.unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{item.totalPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{item.notes || '-'}</td>
                          </tr>
                        );
                      })}
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
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('discount')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.discount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('totalAfterDiscount')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left font-bold">{viewingInvoice.totalAfterDiscount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('amountPaid')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{viewingInvoice.amountPaid.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel('remainingBalance')}:</dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left font-bold text-red-600 dark:text-red-400">{(viewingInvoice.totalAfterDiscount - viewingInvoice.amountPaid).toFixed(2)}</dd>
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

      {/* Part Detail Modal */}
      {isPartDetailModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={closePartDetailModal}
              aria-hidden="true"
            ></div>
            <div
              className="relative bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getLabel('partDetails')}</h3>
                <button
                  type="button"
                  onClick={closePartDetailModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-secondary-700"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                {partToView && (
                  <div className="space-y-4">
                    {/* Header with part name and SKU */}
                    <div className="bg-gray-50 dark:bg-secondary-700 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{partToView.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{getLabel('sku')}: {partToView.sku}</p>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white border-b pb-1">{getLabel('basicInformation')}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{getLabel('internalId')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{partToView.internalId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{getLabel('partCondition')}:</span>
                            <span className={`font-medium px-2 py-1 rounded-full text-xs ${partToView.condition === 'New' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                              {partToView.condition ? (language === 'ar' ? (partToView.condition === 'New' ? 'جديدة' : 'مستعملة') : partToView.condition) : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{getLabel('quantityInStock')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{partToView.quantityInStock}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Information */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white border-b pb-1">{getLabel('pricing')}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{getLabel('purchasePrice')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{partToView.purchasePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{getLabel('sellingPrice')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{partToView.sellingPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compatible Vehicles and Additional Information */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white border-b pb-1">{getLabel('additionalInformation')}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{getLabel('compatibleVehicles')}:</span>
                          <p className="mt-1 text-gray-900 dark:text-white bg-gray-50 dark:bg-secondary-700 p-2 rounded">{partToView.compatibleVehicles || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{getLabel('description')}:</span>
                          <p className="mt-1 text-gray-900 dark:text-white">{partToView.description || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end border-t dark:border-gray-600 mt-4">
                      <Button type="button" variant="secondary" onClick={closePartDetailModal}>{getLabel('close')}</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PurchaseInvoicesPage;
