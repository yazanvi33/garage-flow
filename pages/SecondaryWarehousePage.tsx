
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { MOCK_SECONDARY_WAREHOUSE_ITEMS, MOCK_PARTS, MOCK_INVENTORY_ISSUE_REQUESTS } from '../constants';
import { SecondaryWarehouseItem, SparePart, ReplacedPartCondition, InventoryIssueRequest } from '../types';
import Table, { Column, SortConfig } from '../components/Table';
// import Button from '../components/Button';
// import { PlusIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
// import { Menu, Transition } from '@headlessui/react';

const SecondaryWarehousePage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language, currency } = context;

  // In a real app, these would be fetched or managed via state lifted from AppContext/API
  const secondaryWarehouseItems = MOCK_SECONDARY_WAREHOUSE_ITEMS;
  const partsMap = useMemo(() => MOCK_PARTS.reduce((map, p) => { map[p.id] = p; return map; }, {} as Record<string, SparePart>), []);
  const issueRequestsMap = useMemo(() => MOCK_INVENTORY_ISSUE_REQUESTS.reduce((map, req) => { map[req.id] = req; return map; }, {} as Record<string, InventoryIssueRequest>), []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<SecondaryWarehouseItem>>({ key: null, direction: null });
  const [conditionFilter, setConditionFilter] = useState<ReplacedPartCondition | 'All'>('All');


  const filteredItems = useMemo(() => {
    let items = [...secondaryWarehouseItems];
    if (conditionFilter !== 'All') {
      items = items.filter(item => item.condition === conditionFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      items = items.filter(item => 
        (partsMap[item.partId]?.name.toLowerCase().includes(lowerSearchTerm)) ||
        (partsMap[item.partId]?.sku.toLowerCase().includes(lowerSearchTerm)) ||
        (getLabel(item.condition).toLowerCase().includes(lowerSearchTerm)) ||
        (issueRequestsMap[item.derivedFromInventoryIssueRequestId]?.internalId.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return items;
  }, [secondaryWarehouseItems, searchTerm, conditionFilter, partsMap, issueRequestsMap, getLabel]);

  const sortedItems = useMemo(() => {
    let itemsToSort = [...filteredItems];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      itemsToSort.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'partName') {
            valA = partsMap[a.partId]?.name || '';
            valB = partsMap[b.partId]?.name || '';
        } else if (sortConfig.key === 'partSku') {
            valA = partsMap[a.partId]?.sku || '';
            valB = partsMap[b.partId]?.sku || '';
        } else {
            valA = a[sortConfig.key as keyof SecondaryWarehouseItem];
            valB = b[sortConfig.key as keyof SecondaryWarehouseItem];
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
    return itemsToSort;
  }, [filteredItems, sortConfig, partsMap]);

  const columns: Column<SecondaryWarehouseItem>[] = [
    { header: 'partName', accessor: (item) => partsMap[item.partId]?.name || getLabel('unknownPart'), sortable: true, sortKey: 'partName' },
    { header: 'partSku', accessor: (item) => partsMap[item.partId]?.sku || '-', sortable: true, sortKey: 'partSku' },
    { header: 'quantity', accessor: 'quantity', sortable: true },
    { header: 'condition', accessor: (item) => getLabel(item.condition), sortable: true, sortKey: 'condition', 
        render: item => {
            const colorClass = item.condition === ReplacedPartCondition.REUSABLE 
                ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200' 
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200';
            return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>{getLabel(item.condition)}</span>
        }
    },
    { header: 'dateAdded', accessor: (item) => new Date(item.dateAdded).toLocaleDateString(language), sortable: true, sortKey: 'dateAdded'},
    { header: 'derivedFrom', accessor: (item) => issueRequestsMap[item.derivedFromInventoryIssueRequestId]?.internalId || '-', sortable: false },
    { header: 'notes', accessor: 'notes', sortable: false, className: 'text-xs max-w-sm truncate' },
    // Add actions like "Use Part", "Mark as Sold", "Move to Scrap Process"
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('secondaryWarehouse')}</h1>
        {/* Add button for actions like "Initiate Scrap Process" */}
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <input 
            type="text" 
            placeholder={`${getLabel('search')}...`} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="mt-1 block w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white"
        />
        <select 
            value={conditionFilter} 
            onChange={(e) => setConditionFilter(e.target.value as ReplacedPartCondition | 'All')}
            className="mt-1 block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white"
        >
            <option value="All">{getLabel('allConditions') || 'All Conditions'}</option>
            <option value={ReplacedPartCondition.REUSABLE}>{getLabel(ReplacedPartCondition.REUSABLE)}</option>
            <option value={ReplacedPartCondition.DAMAGED}>{getLabel(ReplacedPartCondition.DAMAGED)}</option>
        </select>
      </div>
      <Table columns={columns} data={sortedItems} keyExtractor={(item) => item.id} sortConfig={sortConfig} onSort={setSortConfig} />
    </div>
  );
};

export default SecondaryWarehousePage;

