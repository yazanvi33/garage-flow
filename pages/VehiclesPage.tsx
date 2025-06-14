
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { MOCK_VEHICLES, MOCK_CUSTOMERS } from '../constants';
import { Vehicle } from '../types';
import Table, { Column, SortConfig } from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ColumnToggleButton from '../components/ColumnToggleButton'; // New import
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

// Define all possible columns for the vehicle table
const ALL_VEHICLE_COLUMNS_CONFIG = (getLabel: (key: string) => string, customers: typeof MOCK_CUSTOMERS): Column<Vehicle>[] => [
  { header: 'internalId', accessor: 'internalId', sortable: true },
  { header: 'make', accessor: 'make', sortable: true },
  { header: 'model', accessor: 'model', sortable: true },
  { header: 'year', accessor: 'year', sortable: true },
  { header: 'licensePlate', accessor: 'licensePlate', className: 'font-mono', sortable: true },
  { header: 'vin', accessor: 'vin', className: 'font-mono text-xs', sortable: true },
  { header: 'color', accessor: 'color', sortable: true },
  { header: 'engineCylinders', accessor: 'engineCylinders', sortable: true },
  { header: 'engineNumber', accessor: 'engineNumber', sortable: true },
  { header: 'tireSize', accessor: 'tireSize', sortable: true },
  { 
    header: 'customer', 
    accessor: (vehicle) => customers.find(c => c.id === vehicle.customerId)?.name || getLabel('N/A'),
    sortable: true,
    sortKey: 'customerName' 
  },
];


const VehiclesPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language } = context;

  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<Vehicle>>({ key: null, direction: null });
  
  const initialFormData: Omit<Vehicle, 'id' | 'createdAt' | 'internalId'> = { 
    customerId: '', make: '', model: '', year: new Date().getFullYear(), vin: '', licensePlate: '',
    color: '', engineCylinders: undefined, engineNumber: '', tireSize: ''
  };
  const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'createdAt' | 'internalId'>>(initialFormData);

  const customers = MOCK_CUSTOMERS;

  // Column Visibility
  const ALL_COLUMNS_WITH_LABELS = useMemo(() => 
    ALL_VEHICLE_COLUMNS_CONFIG(getLabel, customers).map(col => ({ key: col.header, label: getLabel(col.header) || col.header })),
  [getLabel, customers]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    const stored = localStorage.getItem('visibleVehicleColumns');
    return stored ? JSON.parse(stored) : ALL_COLUMNS_WITH_LABELS.map(c => c.key); // Default to all visible
  });

  useEffect(() => {
    localStorage.setItem('visibleVehicleColumns', JSON.stringify(visibleColumnKeys));
  }, [visibleColumnKeys]);

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumnKeys(prev =>
      prev.includes(columnKey) ? prev.filter(k => k !== columnKey) : [...prev, columnKey]
    );
  };
  
  const displayedTableColumns = useMemo(() => {
    const actionColumn: Column<Vehicle> = {
      header: 'actions',
      accessor: 'id', // dummy accessor
      render: (vehicle) => (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => openModalForEdit(vehicle)} aria-label={getLabel('edit')}><PencilIcon className="h-4 w-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(vehicle.id)} aria-label={getLabel('delete')}><TrashIcon className="h-4 w-4" /></Button>
        </div>
      ),
    };
    return [
        ...ALL_VEHICLE_COLUMNS_CONFIG(getLabel, customers).filter(col => visibleColumnKeys.includes(col.header)),
        actionColumn
    ];
  }, [visibleColumnKeys, getLabel, customers]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'year' || name === 'engineCylinders' ? (value ? parseInt(value) : undefined) : value }));
  };

  const openModalForCreate = () => {
    setEditingVehicle(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({ 
        customerId: vehicle.customerId, 
        make: vehicle.make, 
        model: vehicle.model, 
        year: vehicle.year, 
        vin: vehicle.vin, 
        licensePlate: vehicle.licensePlate,
        color: vehicle.color || '',
        engineCylinders: vehicle.engineCylinders,
        engineNumber: vehicle.engineNumber || '',
        tireSize: vehicle.tireSize || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
        alert(getLabel('customerRequired'));
        return;
    }
    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...editingVehicle, ...formData } : v));
    } else {
      const newVehicle: Vehicle = {
        id: `veh-${Date.now()}`,
        internalId: `VEH-${String(Date.now()).slice(-4)}`,
        ...formData,
        year: formData.year || 0, // ensure year is number
        createdAt: new Date().toISOString(),
      };
      setVehicles(prev => [newVehicle, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  const filteredAndSortedVehicles = useMemo(() => {
    let items = vehicles.filter(vehicle =>
      Object.values(vehicle).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (customers.find(c => c.id === vehicle.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
        const valA = sortConfig.key === 'customerName' ? customers.find(c => c.id === a.customerId)?.name : a[sortConfig.key as keyof Vehicle];
        const valB = sortConfig.key === 'customerName' ? customers.find(c => c.id === b.customerId)?.name : b[sortConfig.key as keyof Vehicle];

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
  }, [vehicles, searchTerm, customers, sortConfig]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('vehicles')}</h1>
        <div className="flex items-center gap-2">
            <ColumnToggleButton 
                allColumns={ALL_COLUMNS_WITH_LABELS.filter(col => col.key !== 'actions')} 
                visibleColumns={visibleColumnKeys} 
                onToggleColumn={handleToggleColumn} 
            />
            <Button onClick={openModalForCreate} leftIcon={PlusIcon}>{getLabel('addNewVehicle')}</Button>
        </div>
      </div>
       <input type="text" placeholder={`${getLabel('search')}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={getCommonInputStyle(language)}/>
      <Table columns={displayedTableColumns} data={filteredAndSortedVehicles} keyExtractor={(vehicle) => vehicle.id} sortConfig={sortConfig} onSort={setSortConfig} />
      
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingVehicle ? `${getLabel('edit')} ${getLabel('vehicle')}` : getLabel('addNewVehicle')} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingVehicle && (
             <div>
                <label htmlFor="internalId_display" className={getLabelStyle(language)}>{getLabel('internalId')}</label>
                <input type="text" name="internalId_display" id="internalId_display" value={editingVehicle.internalId} readOnly className={`${getCommonInputStyle(language)} bg-gray-100 dark:bg-secondary-600`} />
            </div>
          )}
          <div>
            <label htmlFor="customerId" className={getLabelStyle(language)}>{getLabel('customer')}</label>
            <select name="customerId" id="customerId" value={formData.customerId} onChange={handleInputChange} required className={getCommonInputStyle(language)}>
              <option value="">{getLabel('selectCustomer')}</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.internalId})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="make" className={getLabelStyle(language)}>{getLabel('make')}</label><input type="text" name="make" id="make" value={formData.make} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
            <div><label htmlFor="model" className={getLabelStyle(language)}>{getLabel('model')}</label><input type="text" name="model" id="model" value={formData.model} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="year" className={getLabelStyle(language)}>{getLabel('year')}</label><input type="number" name="year" id="year" value={formData.year || ''} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
            <div><label htmlFor="licensePlate" className={getLabelStyle(language)}>{getLabel('licensePlate')}</label><input type="text" name="licensePlate" id="licensePlate" value={formData.licensePlate} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>
          </div>
          <div><label htmlFor="vin" className={getLabelStyle(language)}>{getLabel('vin')}</label><input type="text" name="vin" id="vin" value={formData.vin} onChange={handleInputChange} required className={getCommonInputStyle(language)} /></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="color" className={getLabelStyle(language)}>{getLabel('color')}</label><input type="text" name="color" id="color" value={formData.color || ''} onChange={handleInputChange} className={getCommonInputStyle(language)} /></div>
            <div><label htmlFor="tireSize" className={getLabelStyle(language)}>{getLabel('tireSize')}</label><input type="text" name="tireSize" id="tireSize" value={formData.tireSize || ''} onChange={handleInputChange} className={getCommonInputStyle(language)} /></div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="engineCylinders" className={getLabelStyle(language)}>{getLabel('engineCylinders')}</label><input type="number" name="engineCylinders" id="engineCylinders" value={formData.engineCylinders || ''} onChange={handleInputChange} className={getCommonInputStyle(language)} /></div>
            <div><label htmlFor="engineNumber" className={getLabelStyle(language)}>{getLabel('engineNumber')}</label><input type="text" name="engineNumber" id="engineNumber" value={formData.engineNumber || ''} onChange={handleInputChange} className={getCommonInputStyle(language)} /></div>
          </div>

          <div className="pt-2 flex justify-end space-x-3 rtl:space-x-reverse"><Button type="button" variant="secondary" onClick={closeModal}>{getLabel('cancel')}</Button><Button type="submit" variant="primary">{getLabel('save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default VehiclesPage;
