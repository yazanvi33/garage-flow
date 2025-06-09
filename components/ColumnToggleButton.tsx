
import React, { Fragment, useContext } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../context/AppContext';
import Button from './Button';

interface ColumnConfig {
  key: string;
  label: string; // Already translated label
}

interface ColumnToggleButtonProps {
  allColumns: ColumnConfig[];
  visibleColumns: string[];
  onToggleColumn: (columnKey: string) => void;
}

const ColumnToggleButton: React.FC<ColumnToggleButtonProps> = ({ allColumns, visibleColumns, onToggleColumn }) => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { getLabel } = context;

  return (
    <Popover className="relative inline-block text-left">
      {({ open }) => (
        <>
          <Popover.Button as={Button} variant="outline" size="md" rightIcon={ChevronDownIcon} leftIcon={ViewColumnsIcon}>
            {getLabel('columns')}
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Popover.Panel className="origin-top-end absolute end-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-secondary-700 ring-1 ring-black dark:ring-secondary-600 ring-opacity-5 focus:outline-none z-20">
              <div className="p-1">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {getLabel('toggleColumns')}
                </div>
                {allColumns.map((col) => (
                  <div key={col.key}>
                    <label
                      className="group flex rounded-md items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-secondary-600"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 me-3 dark:border-secondary-500 dark:bg-secondary-600 dark:checked:bg-primary-500 dark:focus:ring-primary-600 dark:focus:ring-offset-secondary-700"
                        checked={visibleColumns.includes(col.key)}
                        onChange={(e) => {
                          e.stopPropagation(); // منع إغلاق القائمة
                          onToggleColumn(col.key);
                        }}
                      />
                      {col.label}
                    </label>
                  </div>
                ))}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default ColumnToggleButton;
