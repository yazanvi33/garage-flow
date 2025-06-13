
import React, { useContext, useState, useMemo, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../context/AppContext';
import { 
    MOCK_INVENTORY_ISSUE_REQUESTS, 
    MOCK_MAINTENANCE_CARDS, 
    MOCK_PARTS, 
    MOCK_EMPLOYEES,
    MOCK_VEHICLES as AllVehicles, 
    MOCK_CUSTOMERS as AllCustomers,
    MOCK_SECONDARY_WAREHOUSE_ITEMS, 
    MOCK_SUPPLIERS
} from '../constants';
import { InventoryIssueRequest, InventoryIssueRequestStatus, MaintenanceCard, SparePart, Employee, InventoryIssueRequestItem, ReplacedPartEntry, ReplacedPartCondition, Vehicle, Customer, MappedPartForCombobox, SecondaryWarehouseItem } from '../types';
import Table, { Column, SortConfig } from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, CheckCircleIcon, ArrowPathIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { Combobox, Transition } from '@headlessui/react';

const commonInputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white";
const comboboxInputStyle = "w-full py-2 ps-3 pe-10 text-sm leading-5 text-gray-900 dark:text-white border border-gray-300 dark:border-secondary-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700";


const InventoryIssueRequestsPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language, currentUser } = context;

  const [requests, setRequests] = useState<InventoryIssueRequest[]>(MOCK_INVENTORY_ISSUE_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<InventoryIssueRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<InventoryIssueRequest | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [requestToReconcile, setRequestToReconcile] = useState<InventoryIssueRequest | null>(null);
  const [isPartDetailModalOpen, setIsPartDetailModalOpen] = useState(false);
  const [partToView, setPartToView] = useState<SparePart | null>(null);


  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<InventoryIssueRequest>>({ key: null, direction: null });

  const initialFormData: Omit<InventoryIssueRequest, 'id' | 'internalId' | 'dateIssued' | 'dateReconciled' | 'status' | 'items' | 'replacedParts' > & { receiverCustomName?: string } = {
    maintenanceCardId: undefined,
    warehouseSource: 'main',
    dateCreated: new Date().toISOString().split('T')[0], 
    requestedByEmployeeId: currentUser?.id || '',
    issuedByEmployeeId: '',
    reconciledByEmployeeId: '',
    receivedByEmployeeId: undefined,
    receiverCustomName: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [currentRequestItems, setCurrentRequestItems] = useState<InventoryIssueRequestItem[]>([]);
  const [currentReplacedParts, setCurrentReplacedParts] = useState<ReplacedPartEntry[]>([]);
  
  // For Maintenance Card Combobox
  const [selectedMaintenanceCardForCombobox, setSelectedMaintenanceCardForCombobox] = useState<MaintenanceCard | null>(null);
  const [maintenanceCardInputQuery, setMaintenanceCardInputQuery] = useState('');

  // For Part Combobox
  const [selectedPartForCombobox, setSelectedPartForCombobox] = useState<MappedPartForCombobox | null>(null);
  const [partInputQuery, setPartInputQuery] = useState('');
  const [newRequestItemQuantity, setNewRequestItemQuantity] = useState(1);

  // For Receiver Combobox
  const [selectedReceiverEmployee, setSelectedReceiverEmployee] = useState<Employee | null>(null);
  const [receiverQuery, setReceiverQuery] = useState('');


  const initialNewReplacedPartInfo: Omit<ReplacedPartEntry, 'id'> = {
    inventoryIssueRequestItemId: undefined,
    partId: undefined, 
    customPartName: '',
    quantity: 1,
    condition: ReplacedPartCondition.DAMAGED,
    notes: '',
  };
  const [newReplacedPartInfo, setNewReplacedPartInfo] = useState<Omit<ReplacedPartEntry, 'id'>>(initialNewReplacedPartInfo);


  const maintenanceCards = MOCK_MAINTENANCE_CARDS;
  const parts = MOCK_PARTS;
  const employees = MOCK_EMPLOYEES;
  const secondaryWarehouseStock = MOCK_SECONDARY_WAREHOUSE_ITEMS; 

  const vehiclesMap = useMemo(() => AllVehicles.reduce((map, v) => { map[v.id] = v; return map; }, {} as Record<string, Vehicle>), []);
  const customersMap = useMemo(() => AllCustomers.reduce((map, c) => { map[c.id] = c; return map; }, {} as Record<string, Customer>), []);
  const employeesMap = useMemo(() => employees.reduce((map, e) => { map[e.id] = e; return map; }, {} as Record<string, Employee>), [employees]);
  const maintenanceCardsMap = useMemo(() => maintenanceCards.reduce((map, mc) => { map[mc.id] = mc; return map; }, {} as Record<string, MaintenanceCard>), [maintenanceCards]);
  const partsMap = useMemo(() => parts.reduce((map, p) => { map[p.id] = p; return map; }, {} as Record<string, SparePart>), [parts]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
     if (name === 'warehouseSource') { 
      setSelectedPartForCombobox(null);
      setPartInputQuery('');
    }
  };

  const handleRequestItemChange = (index: number, field: keyof InventoryIssueRequestItem, value: any) => {
    const updatedItems = [...currentRequestItems];
    updatedItems[index] = { ...updatedItems[index], [field]: field === 'quantityRequested' || field === 'quantityIssued' ? parseInt(value) || 0 : value };
    setCurrentRequestItems(updatedItems);
  };
  
  const addRequestItem = () => {
    if (!selectedPartForCombobox || newRequestItemQuantity <= 0) return;
    if (newRequestItemQuantity > selectedPartForCombobox.availableQuantity) {
        alert(getLabel('quantityErrorTooHigh'));
        return;
    }

    let definitionalPartId: string;
    if (selectedPartForCombobox.warehouse === 'main') {
        definitionalPartId = (selectedPartForCombobox.originalPartData as SparePart).id;
    } else {
        definitionalPartId = (selectedPartForCombobox.originalPartData as SecondaryWarehouseItem).partId;
    }

    const newItem: InventoryIssueRequestItem = {
        id: `reqitem-${Date.now()}`,
        partId: definitionalPartId,
        sourceWarehouse: selectedPartForCombobox.warehouse,
        sourceItemId: selectedPartForCombobox.id, 
        quantityRequested: newRequestItemQuantity,
        quantityIssued: 0, 
        notes: '', 
    };

    setCurrentRequestItems(prev => [...prev, newItem]);
    setSelectedPartForCombobox(null);
    setPartInputQuery('');
    setNewRequestItemQuantity(1);
  };
  
  const removeRequestItem = (id: string) => {
    setCurrentRequestItems(prev => prev.filter(item => item.id !== id));
  };

  const openPartDetailModal = (partId: string) => {
    const partDetail = partsMap[partId];
    if (partDetail) {
        setPartToView(partDetail);
        setIsPartDetailModalOpen(true);
    }
  };

  const handleReplacedPartInfoChange = (index: number, field: keyof ReplacedPartEntry, value: any) => {
     const updatedParts = [...currentReplacedParts];
     const currentEntry = updatedParts[index];
      let newEntryData: Partial<ReplacedPartEntry> = { [field]: value };

      if (field === 'inventoryIssueRequestItemId') {
          const issuedItemId = value;
          const issuedItem = requestToReconcile?.items.find(item => item.id === issuedItemId);
          newEntryData.partId = issuedItem?.partId; 
          newEntryData.customPartName = ''; 
      } else if (field === 'customPartName') {
          newEntryData.inventoryIssueRequestItemId = undefined;
          newEntryData.partId = undefined;
      } else if (field === 'quantity') {
          newEntryData.quantity = parseInt(value) || 0;
      }

     updatedParts[index] = {...currentEntry, ...newEntryData};
     setCurrentReplacedParts(updatedParts);
  };

  const addReplacedPartUi = () => {
      if ((!newReplacedPartInfo.inventoryIssueRequestItemId && !newReplacedPartInfo.customPartName?.trim()) || newReplacedPartInfo.quantity <= 0) {
          alert(language === 'ar' ? 'يرجى تحديد قطعة أصلية من القائمة أو إدخال اسم قطعة مخصص، وكمية صالحة.' : 'Please select an original part from the list or enter a custom part name, and a valid quantity.');
          return;
      }
      setCurrentReplacedParts(prev => [...prev, {id: `rpe-${Date.now()}`, ...newReplacedPartInfo}]);
      setNewReplacedPartInfo(initialNewReplacedPartInfo);
  };
  
  const removeReplacedPartUi = (id: string) => {
      setCurrentReplacedParts(prev => prev.filter(p => p.id !== id));
  };


  const openModalForCreate = () => {
    setEditingRequest(null);
    setFormData({...initialFormData, requestedByEmployeeId: currentUser?.id || '', dateCreated: new Date().toISOString().split('T')[0] });
    setCurrentRequestItems([]);
    setSelectedMaintenanceCardForCombobox(null);
    setMaintenanceCardInputQuery('');
    setSelectedPartForCombobox(null);
    setPartInputQuery('');
    setSelectedReceiverEmployee(null);
    setReceiverQuery('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (request: InventoryIssueRequest) => {
    if (request.status !== InventoryIssueRequestStatus.DRAFT) {
      alert(getLabel('cannotEditIssuedReconciled'));
      return;
    }
    setEditingRequest(request);
    const mCard = request.maintenanceCardId ? maintenanceCardsMap[request.maintenanceCardId] : null;
    setSelectedMaintenanceCardForCombobox(mCard);
    setMaintenanceCardInputQuery(mCard ? `${mCard.internalId} - ${vehiclesMap[mCard.vehicleId]?.make || ''} ${vehiclesMap[mCard.vehicleId]?.model || ''} (${customersMap[mCard.customerId]?.name || ''}) - ${new Date(mCard.dateCreated).toLocaleDateString(language)}` : ''); 


    const receiverEmp = request.receivedByEmployeeId ? employeesMap[request.receivedByEmployeeId] : null;
    setSelectedReceiverEmployee(receiverEmp);
    setReceiverQuery(receiverEmp ? receiverEmp.name : (request.receiverCustomName || ''));

    setFormData({
      maintenanceCardId: request.maintenanceCardId,
      warehouseSource: request.warehouseSource,
      dateCreated: request.dateCreated.split('T')[0],
      requestedByEmployeeId: request.requestedByEmployeeId || currentUser?.id || '',
      issuedByEmployeeId: request.issuedByEmployeeId || '',
      reconciledByEmployeeId: request.reconciledByEmployeeId || '',
      receivedByEmployeeId: request.receivedByEmployeeId,
      receiverCustomName: request.receiverCustomName || '',
      notes: request.notes || '',
    });
    setCurrentRequestItems(request.items.map(item => ({...item}))); 
    setSelectedPartForCombobox(null);
    setPartInputQuery('');
    setIsModalOpen(true);
  };
  
  const openViewModal = (request: InventoryIssueRequest) => {
    setViewingRequest(request);
  };
  
  const closeViewModal = () => {
    setViewingRequest(null);
  };
  
  const openReconcileModal = (request: InventoryIssueRequest) => {
    if (request.status !== InventoryIssueRequestStatus.ISSUED) {
      alert(getLabel('canOnlyReconcileIssued'));
      return;
    }
    setRequestToReconcile(request);
    setCurrentReplacedParts(request.replacedParts?.map(p => ({...p})) || []); 
    setNewReplacedPartInfo(initialNewReplacedPartInfo);
    setIsReconcileModalOpen(true);
  };
  
  const closeReconcileModal = () => {
      setRequestToReconcile(null);
      setCurrentReplacedParts([]);
      setIsReconcileModalOpen(false);
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRequest(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRequestItems.length === 0) {
      alert(getLabel('mustAddPartsToRequest'));
      return;
    }

    const finalFormDataSubmit = {...formData};
    
    if (selectedReceiverEmployee) {
        finalFormDataSubmit.receivedByEmployeeId = selectedReceiverEmployee.id;
        finalFormDataSubmit.receiverCustomName = ''; // Clear custom name if employee is selected
    } else if (receiverQuery.trim()) {
        finalFormDataSubmit.receiverCustomName = receiverQuery.trim(); // Use the typed query as custom name
        finalFormDataSubmit.receivedByEmployeeId = undefined; // Ensure employee ID is not set
    } else {
        alert(getLabel('receivedBy') + ' ' + (language === 'ar' ? 'مطلوب.' : 'is required.'));
        return;
    }


    if (editingRequest) {
      const updatedRequest: InventoryIssueRequest = {
        ...editingRequest,
        ...finalFormDataSubmit,
        items: currentRequestItems,
        dateCreated: new Date(finalFormDataSubmit.dateCreated).toISOString(), 
      };
      setRequests(prev => prev.map(r => r.id === editingRequest.id ? updatedRequest : r));
    } else {
      const newRequest: InventoryIssueRequest = {
        id: `iir-${Date.now()}`,
        internalId: `IIR-${String(Date.now()).slice(-5)}`,
        status: InventoryIssueRequestStatus.DRAFT,
        ...initialFormData, 
        ...finalFormDataSubmit,
        dateCreated: new Date(finalFormDataSubmit.dateCreated).toISOString(), 
        items: currentRequestItems,
        replacedParts: [],
      };
      setRequests(prev => [newRequest, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (requestId: string) => {
    const reqToDelete = requests.find(r => r.id === requestId);
    if(reqToDelete && reqToDelete.status !== InventoryIssueRequestStatus.DRAFT){
        alert(getLabel('cannotDeleteIssuedReconciled'));
        return;
    }
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleConfirmIssue = (requestId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId && r.status === InventoryIssueRequestStatus.DRAFT) {
        return { 
            ...r, 
            status: InventoryIssueRequestStatus.ISSUED, 
            dateIssued: new Date().toISOString(),
            issuedByEmployeeId: formData.issuedByEmployeeId || currentUser?.id || '', 
            items: r.items.map(item => ({...item, quantityIssued: item.quantityRequested})) 
        };
      }
      return r;
    }));
  };
  
  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestToReconcile) return;
    
    for(const issuedItem of requestToReconcile.items) {
        const relatedReplaced = currentReplacedParts.filter(rp => rp.inventoryIssueRequestItemId === issuedItem.id);
        const totalReplacedQty = relatedReplaced.reduce((sum, rp) => sum + rp.quantity, 0);
        if (totalReplacedQty > (issuedItem.quantityIssued || 0)) {
            const partName = partsMap[issuedItem.partId]?.name || issuedItem.partId;
            alert(`${getLabel('replacedQuantityExceedsIssuedFor')} ${partName}. ${getLabel('issued')}: ${issuedItem.quantityIssued || 0}, ${getLabel('replaced')}: ${totalReplacedQty}`);
            return;
        }
    }

    setRequests(prev => prev.map(r => {
        if (r.id === requestToReconcile.id) {
            const updatedRequest = {
                ...r,
                status: InventoryIssueRequestStatus.RECONCILED,
                dateReconciled: new Date().toISOString(),
                reconciledByEmployeeId: currentUser?.id || '', 
                replacedParts: currentReplacedParts,
            };

            currentReplacedParts.forEach(rp => {
                if ((rp.condition === ReplacedPartCondition.REUSABLE || rp.condition === ReplacedPartCondition.DAMAGED) && rp.inventoryIssueRequestItemId) {
                    const issuedItem = updatedRequest.items.find(item => item.id === rp.inventoryIssueRequestItemId);
                    if (issuedItem && issuedItem.partId) { 
                        const newSecondaryItem: SecondaryWarehouseItem = {
                            id: `swi-${Date.now()}-${Math.random().toString(36).substring(7)}`, 
                            partId: issuedItem.partId, 
                            derivedFromInventoryIssueRequestId: updatedRequest.id,
                            quantity: rp.quantity,
                            condition: rp.condition, 
                            dateAdded: new Date().toISOString(),
                            notes: rp.notes || `From IIR: ${updatedRequest.internalId}`,
                        };
                        console.log("LOG: Item prepared for Secondary Warehouse:", newSecondaryItem);
                        // In real app: MOCK_SECONDARY_WAREHOUSE_ITEMS.push(newSecondaryItem); or API call
                    }
                }
            });
            return updatedRequest;
        }
        return r;
    }));
    closeReconcileModal();
  };

  const filteredMaintenanceCardsForCombobox = useMemo(() => {
    const sortedCards = [...maintenanceCards].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
    if (maintenanceCardInputQuery === '') return sortedCards;
    return sortedCards.filter(mc => {
        const vehicle = vehiclesMap[mc.vehicleId];
        const customer = customersMap[mc.customerId];
        const searchTermLower = maintenanceCardInputQuery.toLowerCase();
        const displayTest = `${mc.internalId} ${vehicle ? vehicle.make + ' ' + vehicle.model + ' ' + vehicle.licensePlate : ''} ${customer ? customer.name : ''} ${new Date(mc.dateCreated).toLocaleDateString(language)}`;
        return displayTest.toLowerCase().includes(searchTermLower);
    });
  }, [maintenanceCards, maintenanceCardInputQuery, vehiclesMap, customersMap, language]);

  const availablePartsForCombobox = useMemo((): MappedPartForCombobox[] => {
    let sourceParts: MappedPartForCombobox[] = [];
    if (formData.warehouseSource === 'main') {
        sourceParts = parts.map(p => ({
            id: p.id,
            displayId: `main-${p.id}`,
            name: p.name,
            sku: p.sku,
            compatibleVehicles: p.compatibleVehicles,
            availableQuantity: p.quantityInStock,
            condition: p.condition,
            warehouse: 'main',
            originalPartData: p,
        }));
    } else { 
        sourceParts = secondaryWarehouseStock.map(swItem => {
            const basePartInfo = partsMap[swItem.partId];
            return {
                id: swItem.id, 
                displayId: `secondary-${swItem.id}`,
                name: basePartInfo?.name || getLabel('unknownPart'),
                sku: basePartInfo?.sku,
                availableQuantity: swItem.quantity,
                condition: swItem.condition,
                warehouse: 'secondary',
                originalPartData: swItem,
            };
        });
    }

    if (partInputQuery === '') return sourceParts;
    return sourceParts.filter(p => 
        p.name.toLowerCase().includes(partInputQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(partInputQuery.toLowerCase())) ||
        (p.compatibleVehicles && p.compatibleVehicles.toLowerCase().includes(partInputQuery.toLowerCase()))
    );
  }, [formData.warehouseSource, parts, secondaryWarehouseStock, partsMap, partInputQuery, getLabel]);

  const filteredEmployeesForReceiverCombobox = useMemo(() => {
    if (receiverQuery.trim() === '') return employees.filter(emp => emp.role === 'Technician' || emp.role === 'Service Advisor' || emp.role === 'Manager'); // Broaden roles for receiver
    return employees.filter(emp =>
        (emp.role === 'Technician' || emp.role === 'Service Advisor' || emp.role === 'Manager') &&
        emp.name.toLowerCase().includes(receiverQuery.toLowerCase())
    );
  }, [employees, receiverQuery]);


  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
        req.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.maintenanceCardId && maintenanceCardsMap[req.maintenanceCardId]?.internalId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (getLabel(req.status).toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.receivedByEmployeeId && employeesMap[req.receivedByEmployeeId]?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.receiverCustomName && req.receiverCustomName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [requests, searchTerm, maintenanceCardsMap, getLabel, employeesMap]);

  const sortedRequests = useMemo(() => {
    let items = [...filteredRequests];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key as keyof InventoryIssueRequest];
        const valB = b[sortConfig.key as keyof InventoryIssueRequest];
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
    return items.sort((a,b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()); 
  }, [filteredRequests, sortConfig]);

  const columns: Column<InventoryIssueRequest>[] = [
    { header: 'internalId', accessor: 'internalId', sortable: true },
    { header: 'maintenanceCard', accessor: (item) => item.maintenanceCardId ? (maintenanceCardsMap[item.maintenanceCardId]?.internalId || item.maintenanceCardId) : '-', sortable: true, sortKey: 'maintenanceCardId' },
    { header: 'requestDate', accessor: (item) => new Date(item.dateCreated).toLocaleDateString(language), sortable: true, sortKey: 'dateCreated'},
    { header: 'status', accessor: (item) => getLabel(item.status), sortable: true, sortKey: 'status',
        render: (item) => {
            let colorClass = '';
             switch(item.status){
                case InventoryIssueRequestStatus.DRAFT: colorClass = 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'; break;
                case InventoryIssueRequestStatus.ISSUED: colorClass = 'bg-blue-200 text-blue-700 dark:bg-blue-700 dark:text-blue-200'; break;
                case InventoryIssueRequestStatus.RECONCILED: colorClass = 'bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200'; break;
                case InventoryIssueRequestStatus.CANCELLED: colorClass = 'bg-red-200 text-red-700 dark:bg-red-700 dark:text-red-200'; break;
            }
            return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{getLabel(item.status) || item.status}</span>
        }
    },
    { header: 'requestedBy', accessor: (item) => item.requestedByEmployeeId ? employeesMap[item.requestedByEmployeeId]?.name : '-', sortable: false},
    { header: 'receivedBy', accessor: (item) => item.receivedByEmployeeId ? employeesMap[item.receivedByEmployeeId]?.name : (item.receiverCustomName || '-'), sortable: false},
    { header: 'storekeeper', accessor: (item) => item.issuedByEmployeeId ? employeesMap[item.issuedByEmployeeId]?.name : '-', sortable: false},
    {
      header: 'actions',
      accessor: 'id',
      render: (request) => (
        <div className="flex space-x-1 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => openViewModal(request)} aria-label={getLabel('view')}><EyeIcon className="h-4 w-4" /></Button>
          {request.status === InventoryIssueRequestStatus.DRAFT && (
            <>
              <Button variant="outline" size="sm" onClick={() => openModalForEdit(request)} aria-label={getLabel('edit')}><PencilIcon className="h-4 w-4" /></Button>
              <Button variant="success" size="sm" onClick={() => handleConfirmIssue(request.id)} aria-label={getLabel('confirmIssueRequest')}><CheckCircleIcon className="h-4 w-4" /></Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(request.id)} aria-label={getLabel('delete')}><TrashIcon className="h-4 w-4" /></Button>
            </>
          )}
          {request.status === InventoryIssueRequestStatus.ISSUED && (
              <Button variant="primary" size="sm" onClick={() => openReconcileModal(request)} aria-label={getLabel('reconcileIssueRequest')}><ArrowPathIcon className="h-4 w-4" /></Button>
          )}
        </div>
      ),
    },
  ];

  const DetailItem: React.FC<{ labelKey: string; value?: string | number | null }> = ({ labelKey, value }) => (
    <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
        <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel(labelKey)}:</dt>
        <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{value || '-'}</dd>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('inventoryIssueRequests')}</h1>
        <Button onClick={openModalForCreate} leftIcon={PlusIcon}>{getLabel('addNewInventoryIssueRequest')}</Button>
      </div>
      <input type="text" placeholder={`${getLabel('search')}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={commonInputStyle} />
      <Table columns={columns} data={sortedRequests} keyExtractor={(req) => req.id} sortConfig={sortConfig} onSort={setSortConfig} />


      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRequest ? getLabel('editInventoryIssueRequest') : getLabel('addNewInventoryIssueRequest')} size="4xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scroll p-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label htmlFor="dateCreated" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('requestDate')}</label>
                <input type="date" name="dateCreated" id="dateCreated" value={formData.dateCreated} onChange={handleInputChange} required className={commonInputStyle} />
            </div>
            <div>
                <label htmlFor="warehouseSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('warehouseSource')}</label>
                <select name="warehouseSource" id="warehouseSource" value={formData.warehouseSource} onChange={handleInputChange} required className={commonInputStyle}>
                    <option value="main">{getLabel('mainWarehouse')}</option>
                    <option value="secondary">{getLabel('secondaryWarehouse')}</option>
                </select>
            </div>
             <div>
                <label htmlFor="maintenanceCardCombobox" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('maintenanceCard')}</label>
                 <Combobox value={selectedMaintenanceCardForCombobox} onChange={(mc: MaintenanceCard | null) => {
                    setSelectedMaintenanceCardForCombobox(mc);
                    setFormData(prev => ({ ...prev, maintenanceCardId: mc ? mc.id : undefined }));
                    if(!mc) setMaintenanceCardInputQuery('');
                }}>
                    <div className="relative mt-1"> 
                        <Combobox.Input
                            id="maintenanceCardCombobox"
                            className={comboboxInputStyle}
                            displayValue={(mc: MaintenanceCard) => mc ? `${mc.internalId} - ${vehiclesMap[mc.vehicleId]?.make} ${vehiclesMap[mc.vehicleId]?.model} (${customersMap[mc.customerId]?.name}) - ${new Date(mc.dateCreated).toLocaleDateString(language)}` : ''}
                            onChange={(event) => setMaintenanceCardInputQuery(event.target.value)}
                            placeholder={getLabel('selectMaintenanceCardOptional')}
                        />
                        <Combobox.Button className="absolute inset-y-0 end-0 flex items-center pe-3 rtl:ps-3 rtl:inset-y-0 rtl:start-0 rtl:end-auto">
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
                        </Combobox.Button>
                    </div>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setMaintenanceCardInputQuery('')}>
                        <Combobox.Options className="absolute mt-1 max-h-60 w-80 sm:w-96 overflow-auto scrollbar-thin rounded-md bg-white dark:bg-secondary-700 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm z-50 left-0 right-auto">
                            {filteredMaintenanceCardsForCombobox.length === 0 && maintenanceCardInputQuery !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">{getLabel('noDataFound')}</div>
                            ) : (
                                filteredMaintenanceCardsForCombobox.map((mc) => (
                                    <Combobox.Option key={mc.id} value={mc} className={({ active }) => `relative cursor-default select-none py-2 ps-10 pe-4 ${language === 'ar' ? 'text-right ps-4 pe-10' : 'text-left ps-10 pe-4'} ${active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {({ selected }) => (
                                            <>
                                                <div className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                                        {mc.internalId} - {vehiclesMap[mc.vehicleId]?.make} {vehiclesMap[mc.vehicleId]?.model}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                                                        {customersMap[mc.customerId]?.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                        {vehiclesMap[mc.vehicleId]?.licensePlate} • {new Date(mc.dateCreated).toLocaleDateString(language)}
                                                    </div>
                                                </div>
                                                {selected ? <span className={`absolute inset-y-0 flex items-center ${language === 'ar' ? 'end-0 pe-3' : 'start-0 ps-3'} text-primary-600`}><CheckCircleIcon className="h-5 w-5"/></span> : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </Combobox>
            </div>
          </div>
          
          {formData.maintenanceCardId && selectedMaintenanceCardForCombobox && (
            <div className="mt-3 p-3 border rounded-md bg-gray-50 dark:bg-secondary-700 dark:border-secondary-600">
                <h4 className="text-md font-semibold mb-1 text-gray-700 dark:text-gray-200">{getLabel('vehicleInformation')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                    <p><strong className="text-gray-700 dark:text-gray-300">{getLabel('vehicle')}:</strong> <span className="text-gray-900 dark:text-white">{vehiclesMap[selectedMaintenanceCardForCombobox.vehicleId]?.make} {vehiclesMap[selectedMaintenanceCardForCombobox.vehicleId]?.model}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">{getLabel('licensePlate')}:</strong> <span className="text-gray-900 dark:text-white">{vehiclesMap[selectedMaintenanceCardForCombobox.vehicleId]?.licensePlate || '-'}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">{getLabel('vin')}:</strong> <span className="text-gray-900 dark:text-white">{vehiclesMap[selectedMaintenanceCardForCombobox.vehicleId]?.vin || '-'}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">{getLabel('color')}:</strong> <span className="text-gray-900 dark:text-white">{vehiclesMap[selectedMaintenanceCardForCombobox.vehicleId]?.color || '-'}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">{getLabel('year')}:</strong> <span className="text-gray-900 dark:text-white">{vehiclesMap[selectedMaintenanceCardForCombobox.vehicleId]?.year || '-'}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">{getLabel('customer')}:</strong> <span className="text-gray-900 dark:text-white">{customersMap[selectedMaintenanceCardForCombobox.customerId]?.name || '-'}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">{getLabel('odometerIn')}:</strong> <span className="text-gray-900 dark:text-white">{selectedMaintenanceCardForCombobox.odometerIn || '-'}</span></p>
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label htmlFor="requestedByEmployeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('requestedBy')}</label>
                <select name="requestedByEmployeeId" id="requestedByEmployeeId" value={formData.requestedByEmployeeId} onChange={handleInputChange} required className={commonInputStyle} disabled>
                     {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="receiverCombobox" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('receivedBy')}<span className="text-red-500">*</span></label>
                 <Combobox value={selectedReceiverEmployee} onChange={(employee: Employee | null) => {
                    setSelectedReceiverEmployee(employee);
                    setReceiverQuery(employee ? employee.name : '');
                }}>
                    <div className="relative mt-1">
                        <Combobox.Input
                            id="receiverCombobox"
                            className={comboboxInputStyle}
                            displayValue={(employee: Employee | null) => employee ? employee.name : receiverQuery }
                            onChange={(event) => {
                                setReceiverQuery(event.target.value);
                                if (selectedReceiverEmployee && selectedReceiverEmployee.name !== event.target.value) {
                                    setSelectedReceiverEmployee(null); 
                                }
                            }}
                            placeholder={getLabel('searchOrSelectEmployee')}
                        />
                        <Combobox.Button className="absolute inset-y-0 end-0 flex items-center pe-3 rtl:ps-3 rtl:inset-y-0 rtl:start-0 rtl:end-auto">
                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
                        </Combobox.Button>
                    </div>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" 
                        afterLeave={() => { 
                            if(!selectedReceiverEmployee && formData.receiverCustomName) {
                                setReceiverQuery(formData.receiverCustomName);
                            } else if (!selectedReceiverEmployee) {
                                // Keep receiverQuery as is (custom typed value)
                            }
                        }}
                    >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-72 sm:w-80 overflow-auto scrollbar-thin rounded-md bg-white dark:bg-secondary-700 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm z-50 left-0 right-auto">
                            {filteredEmployeesForReceiverCombobox.length === 0 && receiverQuery.trim() !== '' ? (
                                 <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                     {getLabel('noDataFound')} "{receiverQuery}". {getLabel('typeToAddNew')}
                                 </div>
                            ) : (
                                filteredEmployeesForReceiverCombobox.map((emp) => (
                                    <Combobox.Option key={emp.id} value={emp} className={({ active }) => `relative cursor-default select-none py-2 ps-10 pe-4 ${language === 'ar' ? 'text-right ps-4 pe-10' : 'text-left ps-10 pe-4'} ${active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-white'}`}>
                                       {({ selected }) => (
                                            <>
                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{emp.name}</span>
                                                {selected ? <span className={`absolute inset-y-0 flex items-center ${language === 'ar' ? 'end-0 pe-3' : 'start-0 ps-3'} text-primary-600`}><CheckCircleIcon className="h-5 w-5"/></span> : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                             {filteredEmployeesForReceiverCombobox.length === 0 && receiverQuery.trim() === '' && (
                                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">{getLabel('typeToSearchOrAdd')}</div>
                            )}
                        </Combobox.Options>
                    </Transition>
                </Combobox>
            </div>
            <div>
                <label htmlFor="issuedByEmployeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('storekeeper')}</label>
                <select name="issuedByEmployeeId" id="issuedByEmployeeId" value={formData.issuedByEmployeeId} onChange={handleInputChange} className={commonInputStyle}>
                    <option value="">{getLabel('selectEmployee')}</option>
                     {employees.filter(e => e.role === 'Accountant' || e.role === 'Manager').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>
          </div>
          
          <fieldset className="border p-4 rounded-md dark:border-gray-600">
            <legend className="text-lg font-medium px-2 dark:text-white">{getLabel('requestedParts')}</legend>
            {currentRequestItems.map((item, index) => {
              const partInfo = item.sourceWarehouse === 'main' ? partsMap[item.partId] : partsMap[secondaryWarehouseStock.find(sws => sws.id === item.sourceItemId)?.partId || ''];
              const displayInfo = partInfo ? `${partInfo.name} (${partInfo.sku})` : getLabel('unknownPart');
              return (
                <div key={item.id || index} className="grid grid-cols-12 gap-2 items-center mb-2 p-2 border-b dark:border-gray-700">
                    <div className="col-span-5"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('part')}</label><input type="text" value={displayInfo} readOnly className={`${commonInputStyle} bg-gray-100 dark:bg-secondary-600 text-gray-900 dark:text-white`} /></div>
                    <div className="col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('quantityRequested')}</label><input type="number" value={item.quantityRequested} onChange={e => handleRequestItemChange(index, 'quantityRequested', e.target.value)} className={commonInputStyle} /></div>
                    <div className="col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('notes')}</label><input type="text" name={`itemNotes-${index}`} value={item.notes || ''} onChange={e => handleRequestItemChange(index, 'notes', e.target.value)} className={commonInputStyle} /></div>
                    <div className="col-span-1 flex items-end"><Button type="button" variant="outline" size="sm" onClick={() => openPartDetailModal(item.partId)} title={getLabel('partDetails')}><EyeIcon className="h-4 w-4" /></Button></div>
                    <div className="col-span-1 flex items-end"><Button type="button" variant="danger" size="sm" onClick={() => removeRequestItem(item.id)}><TrashIcon className="h-4 w-4" /></Button></div>
                </div>
              );
            })}
            <div className="grid grid-cols-12 gap-2 items-end mt-2">
                <div className="col-span-6"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('part')}</label>
                    <Combobox value={selectedPartForCombobox} onChange={setSelectedPartForCombobox}>
                        <div className="relative mt-1">
                            <Combobox.Input
                                className={comboboxInputStyle}
                                displayValue={(p: MappedPartForCombobox) => p ? `${p.name} ${p.sku ? '('+p.sku+')' : ''} - ${getLabel('available')}: ${p.availableQuantity}` : ''}
                                onChange={(event) => setPartInputQuery(event.target.value)}
                                placeholder={getLabel('searchOrSelectPart')}
                            />
                            <Combobox.Button className="absolute inset-y-0 end-0 flex items-center pe-3 rtl:ps-3 rtl:inset-y-0 rtl:start-0 rtl:end-auto">
                                <ChevronUpDownIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
                            </Combobox.Button>
                        </div>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setPartInputQuery('')}>
                            <Combobox.Options className="absolute mt-1 max-h-60 w-96 sm:w-[28rem] overflow-auto scrollbar-thin rounded-md bg-white dark:bg-secondary-700 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm z-50 left-0 right-auto">
                                {availablePartsForCombobox.length === 0 && partInputQuery !== '' ? (
                                     <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">{getLabel('noDataFound')}</div>
                                ) : (
                                    availablePartsForCombobox.map((p) => (
                                        <Combobox.Option key={p.displayId} value={p} className={({ active }) => `relative cursor-default select-none py-3 ps-10 pe-4 ${language === 'ar' ? 'text-right ps-4 pe-10' : 'text-left ps-10 pe-4'} ${active ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-white'}`}>
                                            {({selected}) => (
                                                <>
                                                    <div className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-gray-900 dark:text-white truncate flex-1">{p.name}</span>
                                                            <span className="text-sm text-primary-600 dark:text-primary-400 ml-2 flex-shrink-0">
                                                                {getLabel('available')}: {p.availableQuantity}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${p.condition === 'New' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                                                {p.condition ? (language === 'ar' ? (p.condition === 'New' ? 'جديدة' : 'مستعملة') : (p.condition === 'New' ? 'New' : 'Used')) : ''}
                                                            </span>
                                                            {p.sku && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">SKU: {p.sku}</span>}
                                                        </div>
                                                        {p.compatibleVehicles && (
                                                            <div className="mt-1">
                                                                <span className="text-xs text-gray-600 dark:text-gray-300 block truncate">
                                                                    {language === 'ar' ? 'متوافق مع: ' : 'Compatible: '}{p.compatibleVehicles.length > 40 ? p.compatibleVehicles.substring(0, 40) + '...' : p.compatibleVehicles}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selected ? <span className={`absolute inset-y-0 flex items-center ${language === 'ar' ? 'end-0 pe-3' : 'start-0 ps-3'} text-primary-600`}><CheckCircleIcon className="h-5 w-5"/></span> : null}
                                                </>
                                            )}
                                        </Combobox.Option>
                                    ))
                                )}
                            </Combobox.Options>
                        </Transition>
                    </Combobox>
                </div>
                <div className="col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('quantity')}</label><input type="number" value={newRequestItemQuantity} onChange={e => setNewRequestItemQuantity(parseInt(e.target.value) || 1)} min="1" className={commonInputStyle} /></div>
                <div className="col-span-3"><Button type="button" variant="secondary" onClick={addRequestItem} leftIcon={PlusIcon}>{getLabel('addPartToRequest')}</Button></div>
            </div>
          </fieldset>

          <div><label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('notes')}</label><textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleInputChange} rows={2} className={commonInputStyle}></textarea></div>
          <div className="pt-4 flex justify-end space-x-3 rtl:space-x-reverse border-t dark:border-secondary-600"><Button type="button" variant="secondary" onClick={closeModal}>{getLabel('cancel')}</Button><Button type="submit" variant="primary">{getLabel('save')}</Button></div>
        </form>
      </Modal>

      {/* View Modal */}
      {viewingRequest && (
        <Modal isOpen={!!viewingRequest} onClose={closeViewModal} title={`${getLabel('issueRequest')} ${viewingRequest.internalId}`} size="3xl">
            <div className="space-y-4 text-sm p-2">
                <div>
                    <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('requestDetails')}</h4>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                        <DetailItem labelKey="internalId" value={viewingRequest.internalId} />
                        <DetailItem labelKey="status" value={getLabel(viewingRequest.status)} />
                        <DetailItem labelKey="requestDate" value={new Date(viewingRequest.dateCreated).toLocaleString(language)} />
                        <DetailItem labelKey="warehouseSource" value={getLabel(viewingRequest.warehouseSource === 'main' ? 'mainWarehouse' : 'secondaryWarehouse')} />
                        {viewingRequest.dateIssued && <DetailItem labelKey="iirDateIssued" value={new Date(viewingRequest.dateIssued).toLocaleString(language)} />}
                        {viewingRequest.dateReconciled && <DetailItem labelKey="dateReconciled" value={new Date(viewingRequest.dateReconciled).toLocaleString(language)} />}
                    </dl>
                </div>
                 <div>
                    <h4 className="text-md font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('personnel')}</h4>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                        <DetailItem labelKey="requestedBy" value={viewingRequest.requestedByEmployeeId ? employeesMap[viewingRequest.requestedByEmployeeId]?.name : undefined} />
                        <DetailItem labelKey="receivedBy" value={viewingRequest.receivedByEmployeeId ? employeesMap[viewingRequest.receivedByEmployeeId]?.name : viewingRequest.receiverCustomName} />
                        {viewingRequest.issuedByEmployeeId && <DetailItem labelKey="storekeeper" value={employeesMap[viewingRequest.issuedByEmployeeId]?.name} />}
                        {viewingRequest.reconciledByEmployeeId && <DetailItem labelKey="reconciledBy" value={employeesMap[viewingRequest.reconciledByEmployeeId]?.name} />}
                    </dl>
                </div>
                {viewingRequest.maintenanceCardId && maintenanceCardsMap[viewingRequest.maintenanceCardId] && (
                    <div>
                        <h4 className="text-md font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('linkedMaintenanceCard')}</h4>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                            <DetailItem labelKey="maintenanceCard" value={maintenanceCardsMap[viewingRequest.maintenanceCardId].internalId} />
                            <DetailItem labelKey="customer" value={customersMap[maintenanceCardsMap[viewingRequest.maintenanceCardId].customerId]?.name} />
                        </dl>

                        <h4 className="text-md font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('vehicleInformation')}</h4>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                            <DetailItem labelKey="vehicle" value={`${vehiclesMap[maintenanceCardsMap[viewingRequest.maintenanceCardId].vehicleId]?.make} ${vehiclesMap[maintenanceCardsMap[viewingRequest.maintenanceCardId].vehicleId]?.model}`} />
                            <DetailItem labelKey="licensePlate" value={vehiclesMap[maintenanceCardsMap[viewingRequest.maintenanceCardId].vehicleId]?.licensePlate} />
                            <DetailItem labelKey="vin" value={vehiclesMap[maintenanceCardsMap[viewingRequest.maintenanceCardId].vehicleId]?.vin} />
                            <DetailItem labelKey="color" value={vehiclesMap[maintenanceCardsMap[viewingRequest.maintenanceCardId].vehicleId]?.color} />
                            <DetailItem labelKey="year" value={vehiclesMap[maintenanceCardsMap[viewingRequest.maintenanceCardId].vehicleId]?.year} />
                            <DetailItem labelKey="odometerIn" value={maintenanceCardsMap[viewingRequest.maintenanceCardId].odometerIn} />
                        </dl>
                    </div>
                )}
                <div>
                    <h4 className="text-md font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('requestedParts')}</h4>
                    {viewingRequest.items.length > 0 ? (
                        <div className="overflow-x-auto max-h-60">
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-50 dark:bg-secondary-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{getLabel('part')}</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('quantityRequested')}</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('quantityIssued')}</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{getLabel('notes')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                                    {viewingRequest.items.map(item => {
                                        const partInfo = item.sourceWarehouse === 'main' ? partsMap[item.partId] : partsMap[secondaryWarehouseStock.find(sws => sws.id === item.sourceItemId)?.partId || ''];
                                        return (
                                        <tr key={item.id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white">
                                                {partInfo?.name || getLabel('unknownPart')} ({partInfo?.sku || 'N/A'})
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openPartDetailModal(item.partId)}
                                                    className="ms-2"
                                                    title={getLabel('partDetails')}
                                                >
                                                    <EyeIcon className="h-3 w-3" />
                                                </Button>
                                            </td>
                                            <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{item.quantityRequested}</td>
                                            <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{item.quantityIssued || 0}</td>
                                            <td className="px-3 py-2 text-gray-900 dark:text-white">{item.notes || '-'}</td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-gray-500 dark:text-gray-400">{getLabel('noDataFound')}</p>}
                </div>
                {viewingRequest.replacedParts.length > 0 && (
                    <div>
                        <h4 className="text-md font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-100 border-b pb-1 dark:border-gray-600">{getLabel('replacedPartsInfo')}</h4>
                         <div className="overflow-x-auto max-h-60">
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-50 dark:bg-secondary-700">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{getLabel('part')}</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300">{getLabel('quantity')}</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{getLabel('condition')}</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{getLabel('notes')}</th>
                                    </tr>
                                </thead>
                                 <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                                    {viewingRequest.replacedParts.map(rp => (
                                        <tr key={rp.id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white">{rp.customPartName || (rp.partId && partsMap[rp.partId]?.name) || getLabel('unknownPart')}</td>
                                            <td className="px-3 py-2 text-center whitespace-nowrap text-gray-900 dark:text-white">{rp.quantity}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white">{getLabel(rp.condition)}</td>
                                            <td className="px-3 py-2 text-gray-900 dark:text-white">{rp.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {viewingRequest.notes && <DetailItem labelKey="notes" value={viewingRequest.notes}/>}
                 <div className="pt-4 flex justify-end border-t dark:border-gray-700 mt-4"><Button variant="secondary" onClick={closeViewModal}>{getLabel('cancel')}</Button></div>
            </div>
        </Modal>
      )}

       {/* Part Detail Modal */}
      {isPartDetailModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsPartDetailModalOpen(false)}
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
                  onClick={() => setIsPartDetailModalOpen(false)}
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
                      <Button type="button" variant="secondary" onClick={() => setIsPartDetailModalOpen(false)}>{getLabel('close')}</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Reconcile Modal */}
      {requestToReconcile && (
         <Modal isOpen={isReconcileModalOpen} onClose={closeReconcileModal} title={`${getLabel('reconcileIssueRequest')} ${requestToReconcile.internalId}`} size="3xl">
             <form onSubmit={handleReconcileSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scroll p-1">
                 <h3 className="text-lg font-medium mb-2 dark:text-white">{getLabel('issuedParts')}:</h3>
                 {requestToReconcile.items.map(item => {
                    const partInfo = item.sourceWarehouse === 'main' ? partsMap[item.partId] : partsMap[secondaryWarehouseStock.find(sws => sws.id === item.sourceItemId)?.partId || ''];
                    return(
                     <div key={item.id} className="p-2 border rounded-md dark:border-gray-600">
                         <p className="text-gray-900 dark:text-white"><strong>{partInfo?.name || getLabel('unknownPart')}</strong> ({getLabel('sku')}: {partInfo?.sku || '-'})</p>
                         <p className="text-gray-700 dark:text-gray-300">{getLabel('quantityIssued')}: {item.quantityIssued || 0}</p>
                     </div>
                    );
                 })}
                 <hr className="my-4 dark:border-gray-600"/>
                 <h3 className="text-lg font-medium mb-2 dark:text-white">{getLabel('replacedPartsInfo')}:</h3>
                 {currentReplacedParts.map((rp, index) => (
                     <div key={rp.id || index} className="grid grid-cols-12 gap-2 items-center mb-2 p-2 border rounded-md dark:border-gray-700">
                        <div className="col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('originalPart')}</label>
                            <select 
                                value={rp.inventoryIssueRequestItemId || ''} 
                                onChange={e => handleReplacedPartInfoChange(index, 'inventoryIssueRequestItemId', e.target.value)} 
                                className={commonInputStyle}
                                disabled={!!rp.customPartName}
                            >
                                <option value="">{getLabel('selectPart')} (From Issued)</option>
                                {requestToReconcile.items.filter(item => (item.quantityIssued || 0) > 0).map(issuedItem => {
                                    const partDef = partsMap[issuedItem.partId];
                                    return <option key={issuedItem.id} value={issuedItem.id}>{partDef?.name || issuedItem.partId} (Qty: {issuedItem.quantityIssued})</option>
                                })}
                            </select>
                        </div>
                        <div className="col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('customPartName')}</label>
                            <input 
                                type="text" 
                                value={rp.customPartName || ''} 
                                placeholder={language === 'ar' ? "إذا لم يتم الاختيار" : "If not selected"} 
                                onChange={e => handleReplacedPartInfoChange(index, 'customPartName', e.target.value)} 
                                className={commonInputStyle} 
                                disabled={!!rp.inventoryIssueRequestItemId}
                            />
                        </div>
                        <div className="col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('quantity')}</label><input type="number" value={rp.quantity} min="1" onChange={e => handleReplacedPartInfoChange(index, 'quantity', e.target.value)} className={commonInputStyle} /></div>
                        <div className="col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('condition')}</label>
                            <select value={rp.condition} onChange={e => handleReplacedPartInfoChange(index, 'condition', e.target.value)} className={commonInputStyle}>
                                {Object.values(ReplacedPartCondition).map(cond => <option key={cond} value={cond}>{getLabel(cond)}</option>)}
                            </select>
                        </div>
                        <div className="col-span-11"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('notes')}</label><input type="text" value={rp.notes || ''} onChange={e => handleReplacedPartInfoChange(index, 'notes', e.target.value)} className={commonInputStyle} /></div>
                        <div className="col-span-1 flex items-end"><Button type="button" variant="danger" size="sm" onClick={() => removeReplacedPartUi(rp.id)}><TrashIcon className="h-4 w-4"/></Button></div>
                     </div>
                 ))}
                 <div className="grid grid-cols-12 gap-2 items-end mt-3 p-2 border-t dark:border-gray-600 pt-3">
                    <div className="col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('originalPart')}</label>
                        <select 
                            value={newReplacedPartInfo.inventoryIssueRequestItemId || ''} 
                            onChange={e => {
                                const issuedItemId = e.target.value;
                                const issuedItem = requestToReconcile?.items.find(item => item.id === issuedItemId);
                                setNewReplacedPartInfo(prev => ({...prev, inventoryIssueRequestItemId: issuedItemId, partId: issuedItem?.partId, customPartName: ''}))
                            }} 
                            className={commonInputStyle}
                            disabled={!!newReplacedPartInfo.customPartName}
                        >
                            <option value="">{getLabel('selectPart')} (From Issued)</option>
                             {requestToReconcile.items.filter(item => (item.quantityIssued || 0) > 0).map(issuedItem => {
                                const partDef = partsMap[issuedItem.partId];
                                return <option key={issuedItem.id} value={issuedItem.id}>{partDef?.name || issuedItem.partId} (Qty: {issuedItem.quantityIssued})</option>
                            })}
                        </select>
                    </div>
                    <div className="col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('customPartName')}</label>
                        <input 
                            type="text" 
                            value={newReplacedPartInfo.customPartName || ''} 
                            placeholder={language === 'ar' ? "إذا لم يتم الاختيار" : "If not selected"} 
                            onChange={e => setNewReplacedPartInfo(prev => ({...prev, customPartName: e.target.value, inventoryIssueRequestItemId: undefined, partId: undefined}))} 
                            className={commonInputStyle} 
                            disabled={!!newReplacedPartInfo.inventoryIssueRequestItemId}
                        />
                    </div>
                    <div className="col-span-1"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('quantity')}</label><input type="number" value={newReplacedPartInfo.quantity} min="1" onChange={e => setNewReplacedPartInfo(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))} className={commonInputStyle} /></div>
                    <div className="col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('condition')}</label>
                        <select value={newReplacedPartInfo.condition} onChange={e => setNewReplacedPartInfo(prev => ({...prev, condition: e.target.value as ReplacedPartCondition}))} className={commonInputStyle}>
                             {Object.values(ReplacedPartCondition).map(cond => <option key={cond} value={cond}>{getLabel(cond)}</option>)}
                        </select>
                    </div>
                     <div className="col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">{getLabel('notes')}</label><input type="text" value={newReplacedPartInfo.notes || ''} onChange={e => setNewReplacedPartInfo(prev => ({...prev, notes: e.target.value}))} className={commonInputStyle} /></div>
                    <div className="col-span-1 flex items-end"><Button type="button" variant="secondary" onClick={addReplacedPartUi} leftIcon={PlusIcon}></Button></div>
                 </div>
                 <div className="pt-4 flex justify-end space-x-3 rtl:space-x-reverse border-t dark:border-secondary-600 mt-4">
                    <Button type="button" variant="secondary" onClick={closeReconcileModal}>{getLabel('cancel')}</Button>
                    <Button type="submit" variant="primary">{getLabel('save')}</Button>
                </div>
             </form>
         </Modal>
      )}

    </div>
  );
};

export default InventoryIssueRequestsPage;
