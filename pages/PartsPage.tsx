
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { MOCK_PARTS, MOCK_SUPPLIERS, MOCK_INVENTORY_MOVEMENTS } from '../constants';
import { SparePart, Supplier, InventoryMovement } from '../types';
import Table, { Column, SortConfig } from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ColumnToggleButton from '../components/ColumnToggleButton';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CalculatedPart extends SparePart {
  incomingQuantity: number;
  outgoingQuantity: number;
}

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

const ALL_PARTS_COLUMNS_CONFIG = (
    getLabel: (key: string) => string,
    currency: { symbol: string }
): Column<CalculatedPart>[] => [
  { header: 'internalId', accessor: 'internalId', sortable: true },
  { header: 'name', accessor: 'name', sortable: true },
  { header: 'sku', accessor: 'sku', sortable: true },
  { header: 'partCondition', accessor: (item) => item.condition ? getLabel(item.condition) : getLabel('N/A'), sortable: true, sortKey: 'condition' },
  { header: 'initialStock', accessor: 'initialStock', sortable: true },
  { header: 'incomingQuantity', accessor: 'incomingQuantity', sortable: true },
  { header: 'outgoingQuantity', accessor: 'outgoingQuantity', sortable: true },
  { header: 'quantityInStock', accessor: 'quantityInStock', sortable: true }, 
  { header: 'purchasePrice', accessor: (item) => `${item.purchasePrice.toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'purchasePrice'},
  { header: 'sellingPrice', accessor: (item) => `${item.sellingPrice.toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'sellingPrice' },
  { header: 'compatibleVehicles', accessor: 'compatibleVehicles', sortable: true, className: 'text-xs max-w-xs truncate' },
  { 
    header: 'supplier', 
    accessor: (item) => MOCK_SUPPLIERS.find(s => s.id === item.supplierId)?.name || getLabel('N/A'),
    sortable: true,
    sortKey: 'supplierName' 
  },
];


const PartsPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language, currency } = context;

  const [parts, setParts] = useState<SparePart[]>(MOCK_PARTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<CalculatedPart>>({ key: null, direction: null });
  
  const initialFormData: Omit<SparePart, 'id' | 'internalId' | 'quantityInStock' | 'supplierId'> = {
    name: '', 
    sku: '', 
    purchasePrice: 0, 
    sellingPrice: 0, 
    description: '', 
    compatibleVehicles: '', 
    initialStock: 0, 
    condition: 'New'
  };
  const [formData, setFormData] = useState<Omit<SparePart, 'id' | 'internalId' | 'quantityInStock' | 'supplierId'>>(initialFormData);
  
  const suppliers = MOCK_SUPPLIERS; // Still needed for display in table if a part somehow has a supplierId

  const calculatedPartsData = useMemo(() => {
    return parts.map(part => {
      const movements = MOCK_INVENTORY_MOVEMENTS.filter(m => m.partId === part.id);
      const incomingQuantity = movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + m.quantity, 0);
      const outgoingQuantity = movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      // quantityInStock should ideally be calculated based on initialStock and movements
      // For mock data, we use the value from MOCK_PARTS, but it should be:
      // (part.initialStock || 0) + incomingQuantity - outgoingQuantity;
      // However, since MOCK_PARTS already has quantityInStock, we'll use that for now.
      // The core change is for *new* parts.
      return {
        ...part,
        incomingQuantity,
        outgoingQuantity,
      };
    });
  }, [parts, MOCK_INVENTORY_MOVEMENTS]); 

  const ALL_COLUMNS_WITH_LABELS = useMemo(() => 
    ALL_PARTS_COLUMNS_CONFIG(getLabel, currency).map(col => ({ key: col.header, label: getLabel(col.header) || col.header })),
  [getLabel, currency]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    const stored = localStorage.getItem('visiblePartsColumns');
    return stored ? JSON.parse(stored) : ALL_COLUMNS_WITH_LABELS.map(c => c.key);
  });

  useEffect(() => {
    localStorage.setItem('visiblePartsColumns', JSON.stringify(visibleColumnKeys));
  }, [visibleColumnKeys]);

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumnKeys(prev =>
      prev.includes(columnKey) ? prev.filter(k => k !== columnKey) : [...prev, columnKey]
    );
  };
  
  const displayedTableColumns = useMemo(() => {
    const actionColumn: Column<CalculatedPart> = {
      header: 'actions',
      accessor: 'id',
      render: (part) => (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => openModalForEdit(part)} aria-label={getLabel('edit')}><PencilIcon className="h-4 w-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(part.id)} aria-label={getLabel('delete')}><TrashIcon className="h-4 w-4" /></Button>
        </div>
      ),
    };
    return [
        ...ALL_PARTS_COLUMNS_CONFIG(getLabel, currency).filter(col => visibleColumnKeys.includes(col.header)),
        actionColumn
    ];
  }, [visibleColumnKeys, getLabel, currency, parts]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numFields = ['purchasePrice', 'sellingPrice', 'initialStock'];
    setFormData(prev => ({ ...prev, [name]: numFields.includes(name) ? parseFloat(value) || 0 : value }));
  };

  const openModalForCreate = () => {
    setEditingPart(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (part: SparePart) => {
    setEditingPart(part);
    // When editing, we include supplierId if it exists, but not for new part creation form.
    // quantityInStock is also not directly editable.
    setFormData({
      name: part.name,
      sku: part.sku,
      purchasePrice: part.purchasePrice,
      sellingPrice: part.sellingPrice,
      // supplierId: part.supplierId || '', // supplierId is not part of initialFormData for new items.
      description: part.description || '',
      compatibleVehicles: part.compatibleVehicles || '',
      initialStock: part.initialStock || 0,
      condition: part.condition || 'New',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPart(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPart) {
      // For editing, we update based on current formData which doesn't include quantityInStock or supplierId (as they are not in the edit form directly for those fields)
      // The existing supplierId on editingPart will be preserved.
      // quantityInStock is derived.
      const updatedPart = { 
          ...editingPart, 
          ...formData,
          // quantityInStock for an edited part is more complex, typically derived from movements, or initialStock if that's what's being edited.
          // For simplicity here, if initialStock is edited, it might imply a correction.
          // True stock calculation should happen elsewhere.
          quantityInStock: formData.initialStock || 0, // Simplified: if initialStock changes, qis reflects that *if no other movements*. This is a simplification.
      };
      setParts(prev => prev.map(p => p.id === editingPart.id ? updatedPart : p));
    } else {
      const newPart: SparePart = {
        id: `part-${Date.now()}`,
        internalId: `PART-${String(Date.now()).slice(-4)}`,
        ...formData,
        quantityInStock: formData.initialStock || 0, // New part's stock is its initial stock
        supplierId: undefined, // Explicitly undefined for new parts
      };
      setParts(prev => [newPart, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (partId: string) => {
    setParts(prev => prev.filter(p => p.id !== partId));
  };
  
  const filteredAndSortedParts = useMemo(() => {
    let items: CalculatedPart[] = calculatedPartsData.filter(part =>
      part.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.condition && getLabel(part.condition).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (part.compatibleVehicles && part.compatibleVehicles.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (MOCK_SUPPLIERS.find(s => s.id === part.supplierId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'supplierName') {
            valA = MOCK_SUPPLIERS.find(s => s.id === a.supplierId)?.name || '';
            valB = MOCK_SUPPLIERS.find(s => s.id === b.supplierId)?.name || '';
        } else {
            valA = a[sortConfig.key as keyof CalculatedPart];
            valB = b[sortConfig.key as keyof CalculatedPart];
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
  }, [calculatedPartsData, searchTerm, sortConfig, getLabel]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('spareParts')}</h1>
        <div className="flex items-center gap-2">
            <ColumnToggleButton 
                allColumns={ALL_COLUMNS_WITH_LABELS.filter(col => col.key !== 'actions')} 
                visibleColumns={visibleColumnKeys} 
                onToggleColumn={handleToggleColumn} 
            />
            <Button onClick={openModalForCreate} leftIcon={PlusIcon}>{getLabel('addNewPart')}</Button>
        </div>
      </div>
      <input type="text" placeholder={`${getLabel('search')}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={getCommonInputStyle(language)} />
      <Table columns={displayedTableColumns} data={filteredAndSortedParts} keyExtractor={(part) => part.id} sortConfig={sortConfig} onSort={setSortConfig} />
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPart ? getLabel('editPart') : getLabel('addNewPart')} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingPart && (
             <div>
                <label htmlFor="internalId_display" className={getLabelStyle(language)}>{getLabel('internalId')}</label>
                <input type="text" name="internalId_display" id="internalId_display" value={editingPart.internalId} readOnly className={`${getCommonInputStyle(language)} bg-gray-100 dark:bg-secondary-600`} />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="name" className={getLabelStyle(language)}>{getLabel('name')}</label><input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
            <div><label htmlFor="sku" className={getLabelStyle(language)}>{getLabel('sku')}</label><input type="text" name="sku" id="sku" value={formData.sku} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="condition" className={getLabelStyle(language)}>{getLabel('partCondition')}</label>
              <select name="condition" id="condition" value={formData.condition} onChange={handleInputChange} className={getCommonInputStyle(language)}>
                <option value="New">{getLabel('New')}</option>
                <option value="Used">{getLabel('Used')}</option>
              </select>
            </div>
            <div><label htmlFor="initialStock" className={getLabelStyle(language)}>{getLabel('initialStock')}</label><input type="number" name="initialStock" id="initialStock" value={formData.initialStock || ''} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
           {/* QuantityInStock field removed from here for new part creation as per request */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="purchasePrice" className={getLabelStyle(language)}>{getLabel('purchasePrice')}</label><input type="number" step="any" name="purchasePrice" id="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
            <div><label htmlFor="sellingPrice" className={getLabelStyle(language)}>{getLabel('sellingPrice')}</label><input type="number" step="any" name="sellingPrice" id="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
          </div>
          {/* SupplierId field removed from here for new part creation as per request */}
          <div><label htmlFor="compatibleVehicles" className={getLabelStyle(language)}>{getLabel('compatibleVehicles')}</label><input type="text" name="compatibleVehicles" id="compatibleVehicles" value={formData.compatibleVehicles} onChange={handleInputChange} placeholder="e.g., Toyota Camry 2020, Honda Civic 2018-2022" className={getCommonInputStyle(language)} /></div>
          <div><label htmlFor="description" className={getLabelStyle(language)}>{getLabel('description') || 'Description'}</label><textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={2} className={getCommonInputStyle(language)}></textarea></div>
          <div className="pt-2 flex justify-end space-x-3 rtl:space-x-reverse"><Button type="button" variant="secondary" onClick={closeModal}>{getLabel('cancel')}</Button><Button type="submit" variant="primary">{getLabel('save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default PartsPage;
