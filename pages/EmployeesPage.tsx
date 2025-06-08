import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext'; // Updated import path
import { MOCK_EMPLOYEES } from '../constants';
import { Employee } from '../types';
import Table, { Column, SortConfig } from '../components/Table';
// import Button from '../components/Button';
// import { PlusIcon } from '@heroicons/react/24/outline';

const EmployeesPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language } = context;

  // const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig<Employee>>({ key: null, direction: null });
  
  // In a real app, employees would be state: useState<Employee[]>(MOCK_EMPLOYEES);
  const employees = MOCK_EMPLOYEES;


  const sortedEmployees = useMemo(() => {
    let sortableItems = [...employees];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Employee];
        const valB = b[sortConfig.key as keyof Employee];

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
  }, [employees, sortConfig]);

  const columns: Column<Employee>[] = [
    { header: 'internalId', accessor: 'internalId', sortable: true },
    { header: 'name', accessor: 'name', sortable: true },
    { header: 'role', accessor: 'role', sortable: true }, // Consider localizing role
    { header: 'phone', accessor: 'phone', sortable: true },
    { header: 'email', accessor: 'email', sortable: true },
    { header: 'hireDate', accessor: (item) => new Date(item.hireDate).toLocaleDateString(language), sortable: true, sortKey: 'hireDate' },
    // Add actions column (Edit, View Details, etc.)
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('employees')}</h1>
        {/* <Button onClick={() => setIsModalOpen(true)} leftIcon={PlusIcon}>
          {getLabel('addNewEmployee') || 'Add New Employee'}
        </Button> */}
      </div>
      <Table 
        columns={columns} 
        data={sortedEmployees} 
        keyExtractor={(employee) => employee.id}
        sortConfig={sortConfig}
        onSort={setSortConfig}
      />
      {/* Add Modal for creating/editing employees */}
    </div>
  );
};

export default EmployeesPage;
