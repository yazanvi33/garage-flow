
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext'; 
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

export interface Column<T> {
  header: string; // The key for label lookup, also used as sort key if not specified otherwise
  accessor: keyof T | ((item: T) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean; // If false, column is not sortable
  sortKey?: string; // Optional: if sort key is different from header string (e.g. for nested properties)
}

export interface SortConfig<T> {
  key: keyof T | string | null; // string for custom sortKey
  direction: 'ascending' | 'descending' | null;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  sortConfig?: SortConfig<T>; // Optional: for controlled sorting
  onSort?: (sortConfig: SortConfig<T>) => void; // Optional: for controlled sorting
}

const Table = <T extends object>({ columns, data, onRowClick, keyExtractor, sortConfig, onSort }: TableProps<T>): React.ReactNode => {
  const context = useContext(AppContext);
  if (!context) {
    return <p className="text-center py-4 text-gray-500 dark:text-gray-400">Loading context...</p>;
  }
  const { getLabel } = context;

  const handleSort = (columnKey: keyof T | string, isSortable: boolean = true) => {
    if (!onSort || !isSortable) return;

    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    onSort({ key: columnKey, direction });
  };
  
  if (!data) { // Check for null or undefined data first
    return <p className="text-center py-10 text-gray-500 dark:text-gray-400">{getLabel('loading')}</p>;
  }
  if (data.length === 0) {
    return <p className="text-center py-10 text-gray-500 dark:text-gray-400">{getLabel('noDataFound')}</p>;
  }


  return (
    <div className="overflow-x-auto table-scroll shadow-md sm:rounded-lg bg-white dark:bg-secondary-800 ring-1 ring-gray-200 dark:ring-secondary-700">
      <table className="w-full text-sm text-left rtl:text-right text-gray-700 dark:text-gray-300">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-secondary-700 dark:text-gray-400">
          <tr>
            {columns.map((col, index) => {
              const sortable = col.sortable !== false && onSort; // Default to true if onSort is provided
              const currentSortKey = col.sortKey || (typeof col.accessor === 'string' ? col.accessor : col.header);
              return (
                <th 
                  key={`${col.header}-${index}`} 
                  scope="col" 
                  className={`px-6 py-3 text-start ${col.className || ''} ${sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary-600' : ''}`}
                  onClick={() => sortable && handleSort(currentSortKey as keyof T, col.sortable)}
                  aria-sort={sortConfig?.key === currentSortKey ? (sortConfig.direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    {getLabel(col.header) || col.header}
                    {sortable && sortConfig?.key === currentSortKey && (
                      sortConfig.direction === 'ascending' ? <ChevronUpIcon className="w-3 h-3 ms-1.5" /> : <ChevronDownIcon className="w-3 h-3 ms-1.5" />
                    )}
                     {sortable && sortConfig?.key !== currentSortKey && (
                       <ChevronDownIcon className="w-3 h-3 ms-1.5 opacity-30 group-hover:opacity-100" /> // Default subtle icon
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={`border-b dark:border-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-600/50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(item) : undefined}
            >
              {columns.map((col, cellIndex) => (
                <td 
                  key={`${keyExtractor(item)}-${col.header}-${cellIndex}`} 
                  className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}
                >
                  {col.render 
                    ? col.render(item) 
                    : typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : String(item[col.accessor as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
