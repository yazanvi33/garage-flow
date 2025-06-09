
import React, { useContext, useMemo, useState, useEffect, Fragment } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { MOCK_MAINTENANCE_CARDS, MOCK_VEHICLES, MOCK_CUSTOMERS, MOCK_EMPLOYEES, FUEL_LEVEL_OPTIONS, MOCK_INVENTORY_ISSUE_REQUESTS } from '../constants';
import { MaintenanceCard, Vehicle, Customer, Employee, DateRange, FuelLevel, MaintenanceTask, InventoryIssueRequest } from '../types';
import Table, { Column, SortConfig } from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ColumnToggleButton from '../components/ColumnToggleButton';
import { PlusIcon, PencilIcon, TrashIcon, ClipboardDocumentListIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { Combobox, Transition } from '@headlessui/react';
import { isDateInRange } from '../utils/dateUtils';

const commonInputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white";
const comboboxInputStyle = "w-full py-2 ps-3 pe-10 text-sm leading-5 text-gray-900 dark:text-white border border-gray-300 dark:border-secondary-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 focus:outline-none";


const ALL_MAINTENANCE_CARD_COLUMNS_CONFIG = (
    getLabel: (key: string) => string, 
    language: string, 
    vehiclesMap: Record<string, Vehicle>, 
    customersMap: Record<string, Customer>,
    employeesMap: Record<string, Employee>,
    issueRequestsMap: Record<string, InventoryIssueRequest[]> // cardId -> list of requests
): Column<MaintenanceCard>[] => [
  { header: 'internalId', accessor: 'internalId', className: 'text-xs', sortable: true },
  { 
    header: 'vehicle', 
    accessor: (item) => vehiclesMap[item.vehicleId] ? `${vehiclesMap[item.vehicleId].make} ${vehiclesMap[item.vehicleId].model} (${vehiclesMap[item.vehicleId].licensePlate})` : item.vehicleId, 
    className: 'text-xs whitespace-nowrap', 
    sortable: true,
    sortKey: 'vehicleInfo'
  },
  { 
    header: 'customer', 
    accessor: (item) => customersMap[item.customerId]?.name || item.customerId, 
    className: 'text-xs whitespace-nowrap', 
    sortable: true,
    sortKey: 'customerName'
  },
  { header: 'dateCreated', accessor: (item) => new Date(item.dateCreated).toLocaleDateString(language), sortable: true, sortKey: 'dateCreated'},
  { header: 'dateCompleted', accessor: (item) => item.dateCompleted ? new Date(item.dateCompleted).toLocaleDateString(language) : '-', sortable: true, sortKey: 'dateCompleted'},
  { header: 'status', accessor: 'status', sortable: true, 
    render: (item) => {
      let colorClass = '';
      const statusKey = item.status.replace(/\s/g, ''); 
      switch(item.status){
          case 'Completed': colorClass = 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50'; break;
          case 'In Progress': colorClass = 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50'; break;
          case 'Pending': colorClass = 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50'; break;
          case 'Cancelled': colorClass = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50'; break;
      }
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{getLabel(statusKey) || item.status}</span>
    }
  },
  { 
    header: 'issueRequest', 
    accessor: (item) => {
        const requests = issueRequestsMap[item.id] || [];
        if (requests.length > 0) {
            return requests.map(r => r.internalId).join(', ');
        }
        return getLabel('noIssueRequestLinked');
    },
    className: 'text-xs',
    sortable: false
  },
  {
    header: 'assignedTechnicians',
    accessor: (item) => item.assignedEmployeeIds.map(id => employeesMap[id]?.name || id).join(', ') || '-',
    className: 'text-xs max-w-xs truncate',
    sortable: false
  },

  {
    header: 'tasks',
    accessor: (item) => {
      const completed = item.tasks.filter(task => task.completed).length;
      const total = item.tasks.length;
      return total > 0 ? `${completed}/${total}` : '-';
    },
    className: 'text-xs',
    sortable: false,
    render: (item) => {
      const completed = item.tasks.filter(task => task.completed).length;
      const total = item.tasks.length;
      if (total === 0) return <span className="text-gray-400">-</span>;

      const percentage = (completed / total) * 100;
      let colorClass = 'text-red-600 dark:text-red-400';
      if (percentage === 100) colorClass = 'text-green-600 dark:text-green-400';
      else if (percentage >= 50) colorClass = 'text-yellow-600 dark:text-yellow-400';

      return <span className={colorClass}>{completed}/{total}</span>;
    }
  },
  { header: 'reportedIssues', accessor: (item) => (item.reportedIssues || []).join(', ') || '-', className: 'text-xs max-w-xs truncate', sortable: false},
  { header: 'faultDescription', accessor: 'faultDescription', className: 'text-xs max-w-xs truncate', sortable: true},
];

const MaintenanceCardsPage: React.FC = () => {
  const context = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  if (!context) return <p>Loading context...</p>;
  const { getLabel, language, dateRange: globalDateRange, currency } = context;

  const [cards, setCards] = useState<MaintenanceCard[]>(MOCK_MAINTENANCE_CARDS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MaintenanceCard | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig<MaintenanceCard>>({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormData: Omit<MaintenanceCard, 'id' | 'internalId' | 'dateCreated' | 'tasks' > & { reportedIssuesText: string } = {
    vehicleId: '',
    customerId: '',
    status: 'Pending',
    reportedIssues: [],
    reportedIssuesText: '', // نص الأعطال كما يكتبه المستخدم
    assignedEmployeeIds: [],
    notes: '',
    dateCompleted: undefined,
    faultDescription: '',
    causeOfFailure: '',
    odometerIn: undefined,
    odometerOut: undefined,
    fuelLevelIn: '',
    fuelLevelOut: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [currentTasks, setCurrentTasks] = useState<MaintenanceTask[]>([]);
  const [newTaskDesc, setNewTaskDesc] = useState('');

  // For Customer Combobox
  const [selectedCustomerForCombobox, setSelectedCustomerForCombobox] = useState<Customer | null>(null);
  const [customerInputQuery, setCustomerInputQuery] = useState('');


  const vehicles = MOCK_VEHICLES;
  const customers = MOCK_CUSTOMERS;
  const employees = MOCK_EMPLOYEES;
  const inventoryIssueRequests = MOCK_INVENTORY_ISSUE_REQUESTS;

  const vehiclesMap = useMemo(() => vehicles.reduce((map, v) => { map[v.id] = v; return map; }, {} as Record<string, Vehicle>), [vehicles]);
  const customersMap = useMemo(() => customers.reduce((map, c) => { map[c.id] = c; return map; }, {} as Record<string, Customer>), [customers]);
  const employeesMap = useMemo(() => employees.reduce((map, e) => { map[e.id] = e; return map; }, {} as Record<string, Employee>), [employees]);
  
  const issueRequestsByCardIdMap = useMemo(() => {
    return inventoryIssueRequests.reduce((map, req) => {
        if (req.maintenanceCardId) {
            if (!map[req.maintenanceCardId]) {
                map[req.maintenanceCardId] = [];
            }
            map[req.maintenanceCardId].push(req);
        }
        return map;
    }, {} as Record<string, InventoryIssueRequest[]>);
  }, [inventoryIssueRequests]);


  const ALL_COLUMNS_WITH_LABELS = useMemo(() => 
    ALL_MAINTENANCE_CARD_COLUMNS_CONFIG(getLabel, language, vehiclesMap, customersMap, employeesMap, issueRequestsByCardIdMap).map(col => ({ key: col.header, label: getLabel(col.header) || col.header })),
  [getLabel, language, vehiclesMap, customersMap, employeesMap, issueRequestsByCardIdMap]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    const stored = localStorage.getItem('visibleMaintenanceCardColumns');
    return stored ? JSON.parse(stored) : ALL_COLUMNS_WITH_LABELS.map(c => c.key);
  });

  useEffect(() => {
    localStorage.setItem('visibleMaintenanceCardColumns', JSON.stringify(visibleColumnKeys));
  }, [visibleColumnKeys]);

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumnKeys(prev => prev.includes(columnKey) ? prev.filter(k => k !== columnKey) : [...prev, columnKey]);
  };
  
  const displayedTableColumns = useMemo(() => {
    const actionColumn: Column<MaintenanceCard> = {
      header: 'actions',
      accessor: 'id',
      render: (card) => (
        <div className="flex space-x-1 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => openModalForEdit(card)} aria-label={getLabel('edit')}><PencilIcon className="h-4 w-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(card.id)} aria-label={getLabel('delete')}><TrashIcon className="h-4 w-4" /></Button>
          {(card.status === 'In Progress' || card.status === 'Pending') && (
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate(`/inventory/issue-requests?maintenanceCardId=${card.id}`)} 
                aria-label={getLabel('inventoryIssueRequests')}
                title={getLabel('inventoryIssueRequests')}
            >
                <ClipboardDocumentListIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    };
    const fullConfig = [
        ...ALL_MAINTENANCE_CARD_COLUMNS_CONFIG(getLabel, language, vehiclesMap, customersMap, employeesMap, issueRequestsByCardIdMap),
        actionColumn
    ];
    return fullConfig.filter(col => visibleColumnKeys.includes(col.header) || col.header === 'actions');
  }, [visibleColumnKeys, getLabel, language, vehiclesMap, customersMap, employeesMap, issueRequestsByCardIdMap, navigate]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'reportedIssues') {
        // حفظ النص كما هو بدون تقسيم فوري
        setFormData(prev => ({ ...prev, reportedIssuesText: value }));
    } else {
        const numValue = ['odometerIn', 'odometerOut'].includes(name) ? (value ? parseFloat(value) : undefined) : value;

        // إذا تم تغيير الحالة إلى "مكتملة" وليس هناك تاريخ إنجاز، أضف التاريخ الحالي
        if (name === 'status' && value === 'Completed') {
            setFormData(prev => ({
                ...prev,
                [name]: numValue,
                dateCompleted: prev.dateCompleted || new Date().toISOString()
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: numValue }));
        }
    }
  };
  
  const handleAddTask = () => {
    if (newTaskDesc.trim() === '') return;
    setCurrentTasks(prev => [...prev, { id: `task-${Date.now()}`, description: newTaskDesc, completed: false }]);
    setNewTaskDesc('');
  };

  const handleToggleTask = (taskId: string) => {
    setCurrentTasks(prev => prev.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
  };

  const handleRemoveTask = (taskId: string) => {
    setCurrentTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const openModalForCreate = () => {
    setEditingCard(null);
    setFormData(initialFormData);
    setSelectedCustomerForCombobox(null);
    setCustomerInputQuery('');
    setCurrentTasks([]);
    setIsModalOpen(true);
  };

  const openModalForEdit = (card: MaintenanceCard) => {
    setEditingCard(card);
    const customer = customersMap[card.customerId];
    setSelectedCustomerForCombobox(customer || null);
    setCustomerInputQuery(customer ? customer.name : '');

    setFormData({
      vehicleId: card.vehicleId,
      customerId: card.customerId,
      status: card.status,
      reportedIssues: card.reportedIssues || [],
      reportedIssuesText: (card.reportedIssues || []).join(', '), // تحويل المصفوفة إلى نص
      assignedEmployeeIds: card.assignedEmployeeIds || [],
      notes: card.notes || '',
      dateCompleted: card.dateCompleted,
      faultDescription: card.faultDescription || '',
      causeOfFailure: card.causeOfFailure || '',
      odometerIn: card.odometerIn,
      odometerOut: card.odometerOut,
      fuelLevelIn: card.fuelLevelIn || '',
      fuelLevelOut: card.fuelLevelOut || '',
    });
    setCurrentTasks(card.tasks || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) { // Check if a customer is actually selected via combobox
        alert(getLabel('customerRequired')); 
        return;
    }
    if (!formData.vehicleId) {
        alert(getLabel('vehicleRequired'));
        return;
    }

    const cardData: Partial<MaintenanceCard> = {
        ...formData,
        reportedIssues: formData.reportedIssuesText
            ? formData.reportedIssuesText.split(',').map(s => s.trim()).filter(Boolean)
            : [],
        tasks: currentTasks,
    };
    // إزالة reportedIssuesText من البيانات المحفوظة
    delete (cardData as any).reportedIssuesText;

    if (editingCard) {
      setCards(prev => prev.map(c => c.id === editingCard.id ? { ...editingCard, ...cardData } : c));
    } else {
      const newCard: MaintenanceCard = {
        id: `mcard-${Date.now()}`,
        internalId: `MC-${String(Date.now()).slice(-4)}`,
        dateCreated: new Date().toISOString(),
        ...initialFormData, 
        ...cardData, 
        vehicleId: formData.vehicleId, 
        customerId: formData.customerId,
      } as MaintenanceCard; 
      setCards(prev => [newCard, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  };

  const initialFilters = useMemo(() => {
    const statuses = searchParams.getAll('status') as MaintenanceCard['status'][];
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let dateFilterRange: DateRange | null = null;
    if(startDateParam || endDateParam) {
        dateFilterRange = {
            start: startDateParam ? new Date(startDateParam) : null,
            end: endDateParam ? new Date(endDateParam) : null,
            labelKey: 'custom'
        }
         if(dateFilterRange.start) dateFilterRange.start.setHours(0,0,0,0);
         if(dateFilterRange.end) dateFilterRange.end.setHours(23,59,59,999);
    }
    return { statuses, dateFilterRange };
  }, [searchParams]);

  const filteredCards = useMemo(() => {
    let filtered = [...cards];
    if (initialFilters.statuses.length > 0) {
      filtered = filtered.filter(card => initialFilters.statuses.includes(card.status));
    }
    const activeDateRange = initialFilters.dateFilterRange || globalDateRange;
    if (activeDateRange && (activeDateRange.start || activeDateRange.end)) {
        filtered = filtered.filter(card => {
            let dateToFilter: string | Date | undefined = card.dateCreated; 
            if (card.status === 'Completed' && card.dateCompleted) {
                dateToFilter = card.dateCompleted;
            }
            return dateToFilter ? isDateInRange(dateToFilter, activeDateRange) : false;
        });
    }
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(card => 
            card.id.toLowerCase().includes(lowerSearchTerm) ||
            card.internalId.toLowerCase().includes(lowerSearchTerm) ||
            card.status.toLowerCase().includes(lowerSearchTerm) ||
            (vehiclesMap[card.vehicleId] && 
                (`${vehiclesMap[card.vehicleId].make} ${vehiclesMap[card.vehicleId].model} ${vehiclesMap[card.vehicleId].licensePlate}`)
                .toLowerCase().includes(lowerSearchTerm)
            ) ||
            (customersMap[card.customerId] && customersMap[card.customerId].name.toLowerCase().includes(lowerSearchTerm)) ||
            (card.assignedEmployeeIds.map(id => employeesMap[id]?.name || '').join(', ').toLowerCase().includes(lowerSearchTerm)) ||
            (card.faultDescription && card.faultDescription.toLowerCase().includes(lowerSearchTerm)) ||
            (card.causeOfFailure && card.causeOfFailure.toLowerCase().includes(lowerSearchTerm)) ||
            (card.reportedIssues.join(', ').toLowerCase().includes(lowerSearchTerm))
        );
    }
    return filtered;
  }, [cards, initialFilters, globalDateRange, searchTerm, vehiclesMap, customersMap, employeesMap]);

  const sortedCards = useMemo(() => {
    let sortableItems = [...filteredCards];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'vehicleInfo') {
          valA = vehiclesMap[a.vehicleId] ? `${vehiclesMap[a.vehicleId].make} ${vehiclesMap[a.vehicleId].model}` : a.vehicleId;
          valB = vehiclesMap[b.vehicleId] ? `${vehiclesMap[b.vehicleId].make} ${vehiclesMap[b.vehicleId].model}` : b.vehicleId;
        } else if (sortConfig.key === 'customerName') {
          valA = customersMap[a.customerId]?.name || a.customerId;
          valB = customersMap[b.customerId]?.name || b.customerId;
        } else {
          valA = a[sortConfig.key as keyof MaintenanceCard];
          valB = b[sortConfig.key as keyof MaintenanceCard];
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
    return sortableItems;
  }, [filteredCards, sortConfig, vehiclesMap, customersMap]);

  const filteredCustomersForCombobox = customerInputQuery === ''
    ? customers
    : customers.filter((customer) =>
        customer.name.toLowerCase().replace(/\s+/g, '').includes(customerInputQuery.toLowerCase().replace(/\s+/g, '')) ||
        customer.internalId.toLowerCase().includes(customerInputQuery.toLowerCase())
      );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('maintenanceCards')}</h1>
        <div className="flex items-center gap-2">
            <ColumnToggleButton 
                allColumns={ALL_COLUMNS_WITH_LABELS.filter(col => col.key !== 'actions')} 
                visibleColumns={visibleColumnKeys} 
                onToggleColumn={handleToggleColumn} 
            />
            <Button onClick={openModalForCreate} leftIcon={PlusIcon}>{getLabel('addNewMaintenanceCard')}</Button>
        </div>
      </div>
      <input type="text" placeholder={`${getLabel('search')}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={commonInputStyle}/>
      <Table columns={displayedTableColumns} data={sortedCards} keyExtractor={(card) => card.id} sortConfig={sortConfig} onSort={setSortConfig} />
      
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCard ? getLabel('editMaintenanceCard') : getLabel('addNewMaintenanceCard')} size="3xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto custom-scroll p-1">
          {editingCard && (
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('internalId')}</label>
                <input type="text" value={editingCard.internalId} readOnly className={`${commonInputStyle} bg-gray-100 dark:bg-secondary-600`} />
            </div>
          )}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="customerCombobox" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('customer')}</label>
                    <Combobox value={selectedCustomerForCombobox} onChange={(customer: Customer | null) => {
                        setSelectedCustomerForCombobox(customer);
                        setFormData(prev => ({
                            ...prev,
                            customerId: customer ? customer.id : '',
                            vehicleId: '', // Reset vehicle when customer changes
                        }));
                        if (!customer) {
                            setCustomerInputQuery('');
                        }
                    }}>
                        <div className="relative mt-1">
                            <Combobox.Input
                                id="customerCombobox"
                                className={comboboxInputStyle}
                                displayValue={(customer: Customer) => customer?.name || ''}
                                onChange={(event) => {
                                    setCustomerInputQuery(event.target.value);
                                    // If user types and it doesn't match a full selection, clear the selection
                                    if (selectedCustomerForCombobox && selectedCustomerForCombobox.name !== event.target.value) {
                                        setSelectedCustomerForCombobox(null);
                                        setFormData(prev => ({...prev, customerId: '', vehicleId: ''}));
                                    }
                                }}
                                placeholder={getLabel('searchOrSelectCustomer') || 'Search or select customer'}
                            />
                            <Combobox.Button className="absolute inset-y-0 end-0 flex items-center pe-3 rtl:ps-3 rtl:inset-y-0 rtl:start-0 rtl:end-auto">
                                <ChevronUpDownIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
                            </Combobox.Button>
                        </div>
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setCustomerInputQuery('')}
                        >
                            <Combobox.Options className="absolute mt-1 max-h-60 w-full max-w-sm overflow-auto scrollbar-thin rounded-md bg-white dark:bg-secondary-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                                {filteredCustomersForCombobox.length === 0 && customerInputQuery !== '' ? (
                                    <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                        {getLabel('noDataFound')}
                                    </div>
                                ) : (
                                    filteredCustomersForCombobox.map((customer) => (
                                        <Combobox.Option
                                            key={customer.id}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 ps-10 pe-4 ${ language === 'ar' ? 'text-right ps-4 pe-10' : 'text-left ps-10 pe-4'} ${
                                                active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-white'
                                                }`
                                            }
                                            value={customer}
                                        >
                                        {({ selected, active }) => (
                                            <>
                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {customer.name} ({customer.internalId})
                                            </span>
                                            {selected ? (
                                                <span className={`absolute inset-y-0 flex items-center ${language === 'ar' ? 'end-0 pe-3' : 'start-0 ps-3'} ${active ? 'text-white' : 'text-primary-600'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                                </span>
                                            ) : null}
                                            </>
                                        )}
                                        </Combobox.Option>
                                    ))
                                )}
                            </Combobox.Options>
                        </Transition>
                    </Combobox>
                </div>
                <div>
                    <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('vehicle')}</label>
                    <select 
                        name="vehicleId" 
                        id="vehicleId" 
                        value={formData.vehicleId} 
                        onChange={handleInputChange} 
                        required 
                        className={commonInputStyle}
                        disabled={!formData.customerId}
                    >
                        <option value="">{formData.customerId ? getLabel('selectVehicle') : getLabel('selectCustomerFirst') || 'Select customer first'}</option>
                        {formData.customerId && vehicles
                            .filter(v => v.customerId === formData.customerId)
                            .map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)
                        }
                    </select>
                </div>
           </div>
            <div><label htmlFor="reportedIssues" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('reportedIssues')} ({language === 'ar' ? 'افصل بينها بفاصلة' : 'Comma separated'})</label>
                <textarea name="reportedIssues" id="reportedIssues" value={formData.reportedIssuesText || ''} onChange={handleInputChange} rows={2} className={commonInputStyle} placeholder="مثال: تغيير زيت وفلتر, فحص الفرامل, صوت غريب من المحرك"></textarea>
            </div>
            <div><label htmlFor="faultDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('faultDescription')}</label>
                <textarea name="faultDescription" id="faultDescription" value={formData.faultDescription || ''} onChange={handleInputChange} rows={3} className={commonInputStyle}></textarea>
            </div>
             <div><label htmlFor="causeOfFailure" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('causeOfFailure')}</label>
                <textarea name="causeOfFailure" id="causeOfFailure" value={formData.causeOfFailure || ''} onChange={handleInputChange} rows={3} className={commonInputStyle}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><label htmlFor="odometerIn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('odometerIn')}</label>
                    <input type="number" name="odometerIn" id="odometerIn" value={formData.odometerIn || ''} onChange={handleInputChange} className={commonInputStyle} />
                </div>
                <div><label htmlFor="fuelLevelIn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('fuelLevelIn')}</label>
                    <select name="fuelLevelIn" id="fuelLevelIn" value={formData.fuelLevelIn || ''} onChange={handleInputChange} className={commonInputStyle}>
                        <option value="">-- {getLabel('select')} --</option>
                        {FUEL_LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{language === 'ar' ? opt.label_ar : opt.label_en}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="odometerOut" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('odometerOut')}</label>
                    <input type="number" name="odometerOut" id="odometerOut" value={formData.odometerOut || ''} onChange={handleInputChange} className={commonInputStyle} />
                </div>
                 <div><label htmlFor="fuelLevelOut" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('fuelLevelOut')}</label>
                    <select name="fuelLevelOut" id="fuelLevelOut" value={formData.fuelLevelOut || ''} onChange={handleInputChange} className={commonInputStyle}>
                        <option value="">-- {getLabel('select')} --</option>
                        {FUEL_LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{language === 'ar' ? opt.label_ar : opt.label_en}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('status')}</label>
                    <select name="status" id="status" value={formData.status} onChange={handleInputChange} required className={commonInputStyle}>
                        {(['Pending', 'In Progress', 'Completed', 'Cancelled'] as MaintenanceCard['status'][]).map(s => <option key={s} value={s}>{getLabel(s.replace(/\s/g,''))}</option>)}
                    </select>
                </div>

                {/* تاريخ الإنجاز - يظهر فقط للبطاقات المكتملة */}
                {formData.status === 'Completed' && (
                    <div><label htmlFor="dateCompleted" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('dateCompleted')}</label>
                        <input type="datetime-local" name="dateCompleted" id="dateCompleted" value={formData.dateCompleted ? new Date(formData.dateCompleted).toISOString().slice(0, 16) : ''} onChange={handleInputChange} className={commonInputStyle} />
                    </div>
                )}
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {getLabel('assignedTechnicians')}
                </label>

                {employees.filter(emp => emp.role === 'Technician').length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        {language === 'ar' ? 'لا يوجد فنيين متاحين' : 'No technicians available'}
                    </p>
                ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin border border-gray-300 dark:border-secondary-600 rounded-md p-3 bg-gray-50 dark:bg-secondary-700">
                        {employees.filter(emp => emp.role === 'Technician').map(emp => (
                            <label key={emp.id} className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary-600 p-2 rounded-md transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.assignedEmployeeIds.includes(emp.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData(prev => ({
                                                ...prev,
                                                assignedEmployeeIds: [...prev.assignedEmployeeIds, emp.id]
                                            }));
                                        } else {
                                            setFormData(prev => ({
                                                ...prev,
                                                assignedEmployeeIds: prev.assignedEmployeeIds.filter(id => id !== emp.id)
                                            }));
                                        }
                                    }}
                                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 me-3 dark:border-secondary-500 dark:bg-secondary-600 dark:checked:bg-primary-500"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{emp.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ms-2">({emp.internalId})</span>
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                {formData.assignedEmployeeIds.length > 0 && (
                    <div className="mt-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {language === 'ar' ? `تم اختيار ${formData.assignedEmployeeIds.length} فني` : `${formData.assignedEmployeeIds.length} technician(s) selected`}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {formData.assignedEmployeeIds.map(empId => {
                                const emp = employees.find(e => e.id === empId);
                                return emp ? (
                                    <span key={empId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                                        {emp.name}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    assignedEmployeeIds: prev.assignedEmployeeIds.filter(id => id !== empId)
                                                }));
                                            }}
                                            className="ms-1 text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100 font-bold"
                                            title={language === 'ar' ? 'إزالة' : 'Remove'}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}
            </div>
             <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('tasks')}</label>
                <div className="space-y-2 mt-1 max-h-40 overflow-y-auto scrollbar-thin">
                    {currentTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-gray-50 dark:bg-secondary-600 p-2 rounded-md">
                            <label className="flex items-center">
                                <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} className="h-4 w-4 text-primary-600 border-gray-300 rounded me-2 focus:ring-primary-500" />
                                <span className={task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}>{task.description}</span>
                            </label>
                            <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveTask(task.id)} aria-label={getLabel('delete')}>
                                <TrashIcon className="h-3 w-3"/>
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="mt-2 flex gap-2">
                    <input type="text" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder={getLabel('taskDescription')} className={`${commonInputStyle} flex-grow`} />
                    <Button type="button" variant="secondary" onClick={handleAddTask} size="md">{getLabel('addTask')}</Button>
                </div>
            </div>
             <div><label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('notes')}</label>
                <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleInputChange} rows={2} className={commonInputStyle}></textarea>
            </div>
          <div className="pt-4 flex justify-end space-x-3 rtl:space-x-reverse border-t dark:border-secondary-600">
            <Button type="button" variant="secondary" onClick={closeModal}>{getLabel('cancel')}</Button>
            <Button type="submit" variant="primary">{getLabel('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceCardsPage;
