import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Table, { Column, SortConfig } from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ColumnToggleButton from '../components/ColumnToggleButton';
import FileInput from '../components/FileInput';
import DatePicker from '../components/DatePicker';
import { Employee } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import EmployeeDetails from '../components/EmployeeDetails';

const getCommonInputStyle = (language: string, isViewOnly: boolean) => {
  const baseStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white";
  const rtlStyle = language === 'ar' ? 'text-right' : 'text-left';
  const viewOnlyStyle = isViewOnly ? 'bg-gray-100 dark:bg-secondary-600 cursor-not-allowed' : '';
  return `${baseStyle} ${rtlStyle} ${viewOnlyStyle}`;
};

const getLabelStyle = (language: string) => {
  const baseStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const rtlStyle = language === 'ar' ? 'text-right' : 'text-left';
  return `${baseStyle} ${rtlStyle}`;
};

const ALL_EMPLOYEE_COLUMNS_CONFIG = (getLabel: (key: string) => string): Column<Employee>[] => [
    { header: 'internalId', accessor: 'internalId', sortable: true },
    { header: 'name', accessor: 'name', sortable: true },
    { header: 'role', accessor: 'role', sortable: true },
    { header: 'phone', accessor: 'phone', sortable: true },
    { header: 'email', accessor: 'email', sortable: true },
    { header: 'hireDate', accessor: (item) => new Date(item.hireDate).toLocaleDateString(getLabel('language') === 'ar' ? 'ar-SY' : 'en-US'), sortable: true, sortKey: 'hireDate' },
    { header: 'nationalId', accessor: 'nationalId', sortable: true },
    { header: 'maritalStatus', accessor: 'maritalStatus', sortable: true },
    { header: 'gender', accessor: 'gender', sortable: true },
    { header: 'numberOfChildren', accessor: 'numberOfChildren', sortable: true },
];

const EmployeesPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language } = context;

  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<Employee>>({ key: null, direction: null });
  const [isViewOnly, setIsViewOnly] = useState(false);

  const initialFormData: Omit<Employee, 'id' | 'internalId' | 'hireDate'> = {
    name: '',
    role: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    nationalId: '',
    personalPhotoUrl: '',
    idPhotoFrontUrl: '',
    idPhotoBackUrl: '',
    maritalStatus: 'Single',
    gender: 'Male',
    numberOfChildren: 0,
    notes: '',
    salary: 0,
  };
  const [formData, setFormData] = useState(initialFormData);

  const ALL_COLUMNS_WITH_LABELS = useMemo(() => 
    ALL_EMPLOYEE_COLUMNS_CONFIG(getLabel).map(col => ({ key: col.header, label: getLabel(col.header) || col.header })),
  [getLabel]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    const stored = localStorage.getItem('visibleEmployeeColumns');
    return stored ? JSON.parse(stored) : ALL_COLUMNS_WITH_LABELS.map(c => c.key);
  });

  useEffect(() => {
    localStorage.setItem('visibleEmployeeColumns', JSON.stringify(visibleColumnKeys));
  }, [visibleColumnKeys]);

  const handleToggleColumn = (columnKey: string) => {
    setVisibleColumnKeys(prev =>
      prev.includes(columnKey) ? prev.filter(k => k !== columnKey) : [...prev, columnKey]
    );
  };
  
  const displayedTableColumns = useMemo(() => {
    const actionColumn: Column<Employee> = {
      header: 'actions',
      accessor: 'id',
      render: (employee) => (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => openModalForView(employee)} aria-label={getLabel('view')}><EyeIcon className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => openModalForEdit(employee)} aria-label={getLabel('edit')}><PencilIcon className="h-4 w-4" /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(employee.id)} aria-label={getLabel('delete')}><TrashIcon className="h-4 w-4" /></Button>
        </div>
      ),
    };
    return [
        ...ALL_EMPLOYEE_COLUMNS_CONFIG(getLabel).filter(col => visibleColumnKeys.includes(col.header)),
        actionColumn
    ];
  }, [visibleColumnKeys, getLabel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumberInput = type === 'number';
    setFormData(prev => ({ ...prev, [name]: isNumberInput ? parseInt(value, 10) || 0 : value }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, dateOfBirth: date ? date.toISOString().split('T')[0] : '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      // In a real app, you'd upload the file and save the URL.
      // For now, we'll just store a fake path or the file name for display purposes.
      setFormData(prev => ({ ...prev, [name]: files[0].name }));
    }
  };

  const openModalForCreate = () => {
    setEditingEmployee(null);
    setViewingEmployee(null);
    setIsViewOnly(false);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForView = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsModalOpen(true);
    setIsViewOnly(true);
  };

  const openModalForEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setViewingEmployee(null);
    setIsViewOnly(false);
    setFormData({
        name: employee.name,
        role: employee.role,
        phone: employee.phone,
        email: employee.email || '',
        address: employee.address || '',
        dateOfBirth: employee.dateOfBirth || '',
        nationalId: employee.nationalId || '',
        personalPhotoUrl: employee.personalPhotoUrl || '',
        idPhotoFrontUrl: employee.idPhotoFrontUrl || '',
        idPhotoBackUrl: employee.idPhotoBackUrl || '',
        maritalStatus: employee.maritalStatus || 'Single',
        gender: employee.gender || 'Male',
        numberOfChildren: employee.numberOfChildren || 0,
        notes: employee.notes || '',
        salary: employee.salary || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setViewingEmployee(null);
    setIsViewOnly(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? { ...editingEmployee, ...formData } : emp));
    } else {
      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        internalId: `EMP-${String(Date.now()).slice(-4)}`,
        ...formData,
        hireDate: new Date().toISOString(),
      };
      setEmployees(prev => [newEmployee, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };
  
  const filteredAndSortedEmployees = useMemo(() => {
    let items = employees.filter(employee =>
      employee.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone.includes(searchTerm) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      items.sort((a, b) => {
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
    return items;
  }, [employees, searchTerm, sortConfig]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('employees')}</h1>
        <div className="flex items-center gap-2">
           <ColumnToggleButton 
                allColumns={ALL_COLUMNS_WITH_LABELS.filter(col => col.key !== 'actions')} 
                visibleColumns={visibleColumnKeys} 
                onToggleColumn={handleToggleColumn} 
            />
            <Button onClick={openModalForCreate} leftIcon={PlusIcon}>{getLabel('addNewEmployee') || 'Add New Employee'}</Button>
        </div>
      </div>
      <input type="text" placeholder={`${getLabel('search')}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={getCommonInputStyle(language, isViewOnly)} />
      <Table columns={displayedTableColumns} data={filteredAndSortedEmployees} keyExtractor={(employee) => employee.id} sortConfig={sortConfig} onSort={setSortConfig} />
      
      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEmployee ? getLabel('editEmployee') : (viewingEmployee ? getLabel('employeeDetails') : getLabel('addNewEmployee'))} size="2xl">
        {viewingEmployee ? (
          <EmployeeDetails employee={viewingEmployee} getLabel={getLabel} />
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1 custom-scroll">
            {/* Column 1 */}
            <div className="flex flex-col space-y-4">
              {editingEmployee && (
                  <div>
                      <label htmlFor="internalId_display" className={getLabelStyle(language)}>{getLabel('internalId')}</label>
                      <input type="text" name="internalId_display" id="internalId_display" value={editingEmployee.internalId} readOnly className={`${getCommonInputStyle(language, isViewOnly)} bg-gray-100 dark:bg-secondary-600`} />
                  </div>
              )}
              <div>
                <label htmlFor="name" className={getLabelStyle(language)}>{getLabel('name')}</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={getCommonInputStyle(language, isViewOnly)} readOnly={isViewOnly} />
              </div>
              <div>
                <label htmlFor="role" className={getLabelStyle(language)}>{getLabel('role')}</label>
                <input type="text" name="role" id="role" value={formData.role} onChange={handleInputChange} required className={getCommonInputStyle(language, isViewOnly)} readOnly={isViewOnly} />
              </div>
              <div>
                <label htmlFor="phone" className={getLabelStyle(language)}>{getLabel('phone')}</label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required className={getCommonInputStyle(language, isViewOnly)} readOnly={isViewOnly} />
              </div>
              <div>
                <label htmlFor="email" className={getLabelStyle(language)}>{getLabel('email')}</label>
                <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleInputChange} className={getCommonInputStyle(language, isViewOnly)} readOnly={isViewOnly} />
              </div>
              <div>
                <label htmlFor="address" className={getLabelStyle(language)}>{getLabel('address')}</label>
                <textarea name="address" id="address" value={formData.address || ''} onChange={handleInputChange} rows={2} className={getCommonInputStyle(language, isViewOnly)} readOnly={isViewOnly}></textarea>
              </div>
               <div>
                  <label htmlFor="salary" className={getLabelStyle(language)}>{getLabel('salary')}</label>
                  <input type="number" step="any" name="salary" id="salary" value={formData.salary} onChange={handleInputChange} className={getCommonInputStyle(language, isViewOnly)} readOnly={isViewOnly} />
              </div>
              <div>
                <label htmlFor="notes" className={getLabelStyle(language)}>{getLabel('notes')}</label>
                <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className={getCommonInputStyle(language, isViewOnly)} readOnly={isViewOnly}></textarea>
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col space-y-4">
              <DatePicker
                label={getLabel('dateOfBirth')}
                selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                onChange={handleDateChange}
              />
              <div>
                <label htmlFor="nationalId" className={getLabelStyle(language)}>{getLabel('nationalId')}</label>
                <input type="text" name="nationalId" id="nationalId" value={formData.nationalId || ''} onChange={handleInputChange} className={getCommonInputStyle(language, isViewOnly)} readOnly={isViewOnly} />
              </div>
              <div>
                <label htmlFor="gender" className={getLabelStyle(language)}>{getLabel('gender')}</label>
                <select name="gender" id="gender" value={formData.gender} onChange={handleInputChange} className={getCommonInputStyle(language, isViewOnly)}>
                  <option value="Male">{getLabel('Male')}</option>
                  <option value="Female">{getLabel('Female')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="maritalStatus" className={getLabelStyle(language)}>{getLabel('maritalStatus')}</label>
                <select name="maritalStatus" id="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className={getCommonInputStyle(language, isViewOnly)}>
                  <option value="Single">{getLabel(`Single_${formData.gender === 'Male' ? 'male' : 'female'}`)}</option>
                  <option value="Married">{getLabel(`Married_${formData.gender === 'Male' ? 'male' : 'female'}`)}</option>
                  <option value="Divorced">{getLabel(`Divorced_${formData.gender === 'Male' ? 'male' : 'female'}`)}</option>
                  <option value="Widowed">{getLabel(`Widowed_${formData.gender === 'Male' ? 'male' : 'female'}`)}</option>
                  <option value="Other">{getLabel('Other')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="numberOfChildren" className={getLabelStyle(language)}>{getLabel('numberOfChildren')}</label>
                <input type="number" name="numberOfChildren" id="numberOfChildren" value={formData.numberOfChildren} onChange={handleInputChange} className={getCommonInputStyle(language, isViewOnly)} min="0" readOnly={isViewOnly} />
              </div>
              <FileInput name="personalPhotoUrl" label={getLabel('personalPhotoUrl')} onChange={handleFileChange} language={language} readOnly={isViewOnly}/>
              <FileInput name="idPhotoFrontUrl" label={getLabel('idPhotoFrontUrl')} onChange={handleFileChange} language={language} readOnly={isViewOnly}/>
              <FileInput name="idPhotoBackUrl" label={getLabel('idPhotoBackUrl')} onChange={handleFileChange} language={language} readOnly={isViewOnly}/>
            </div>

            {/* Footer */}
            <div className="md:col-span-2 pt-4 flex justify-end space-x-3 rtl:space-x-reverse border-t border-gray-200 dark:border-secondary-600">
              <Button type="button" variant="secondary" onClick={closeModal}>{getLabel('close')}</Button>
              {!isViewOnly && <Button type="submit" variant="primary">{getLabel('save')}</Button>}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default EmployeesPage;
