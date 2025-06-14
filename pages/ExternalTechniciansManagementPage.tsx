import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ExternalTechnician } from '../types';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import ColumnToggleButton from '../components/ColumnToggleButton';
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

const ExternalTechniciansManagementPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language } = context;

  const [externalTechnicians, setExternalTechnicians] = useState<ExternalTechnician[]>([
    { id: 'ext-tech-001', internalId: 'ET-0001', name: 'ماهر الجيربوكس', phone: '0599999999', email: 'maher.gearbox@email.com', address: 'شارع الصناعة، دمشق', specialization: 'mechanic', notes: 'خبير في إصلاح الجيربوكس والمحركات' },
    { id: 'ext-tech-002', internalId: 'ET-0002', name: 'أحمد الكهربائي', phone: '0588888888', email: 'ahmed.electric@email.com', address: 'حي الميدان، دمشق', specialization: 'electrical', notes: 'متخصص في الأنظمة الكهربائية والإلكترونية' },
    { id: 'ext-tech-003', internalId: 'ET-0003', name: 'خالد الحداد', phone: '0577777777', address: 'منطقة الصناعية، حلب', specialization: 'bodywork', notes: 'خبير في إصلاح هياكل السيارات والحدادة' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<ExternalTechnician | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    specialization: 'mechanic' as ExternalTechnician['specialization'],
    notes: ''
  });

  const [visibleColumns, setVisibleColumns] = useState({
    internalId: true,
    name: true,
    phone: true,
    email: true,
    address: true,
    specialization: true,
    notes: true,
    actions: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (technician?: ExternalTechnician) => {
    if (technician) {
      setEditingTechnician(technician);
      setFormData({
        name: technician.name,
        phone: technician.phone,
        email: technician.email || '',
        address: technician.address || '',
        specialization: technician.specialization,
        notes: technician.notes || ''
      });
    } else {
      setEditingTechnician(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        specialization: 'mechanic',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTechnician(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTechnician) {
      // Update existing technician
      setExternalTechnicians(prev => prev.map(tech => 
        tech.id === editingTechnician.id 
          ? { ...tech, ...formData }
          : tech
      ));
    } else {
      // Add new technician
      const newTechnician: ExternalTechnician = {
        id: Date.now().toString(),
        internalId: `ET-${String(externalTechnicians.length + 1).padStart(4, '0')}`,
        ...formData
      };
      setExternalTechnicians(prev => [...prev, newTechnician]);
    }
    
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(getLabel('confirmDelete'))) {
      setExternalTechnicians(prev => prev.filter(tech => tech.id !== id));
    }
  };

  const getSpecializationLabel = (specialization: ExternalTechnician['specialization']) => {
    const labels = {
      mechanic: getLabel('mechanicSpecialization'),
      electrical: getLabel('electricalSpecialization'),
      bodywork: getLabel('bodyworkSpecialization'),
      painting: getLabel('paintingSpecialization'),
      tires: getLabel('tiresSpecialization'),
      ac: getLabel('acSpecialization')
    };
    return labels[specialization] || specialization;
  };

  const filteredTechnicians = externalTechnicians.filter(tech =>
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.phone.includes(searchTerm) ||
    tech.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSpecializationLabel(tech.specialization).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'internalId', label: getLabel('internalId'), visible: visibleColumns.internalId },
    { key: 'name', label: getLabel('technicianName'), visible: visibleColumns.name },
    { key: 'phone', label: getLabel('phone'), visible: visibleColumns.phone },
    { key: 'email', label: getLabel('email'), visible: visibleColumns.email },
    { key: 'address', label: getLabel('address'), visible: visibleColumns.address },
    { 
      key: 'specialization', 
      label: getLabel('specialization'), 
      visible: visibleColumns.specialization,
      render: (tech: ExternalTechnician) => getSpecializationLabel(tech.specialization)
    },
    { key: 'notes', label: getLabel('notes'), visible: visibleColumns.notes },
    {
      key: 'actions',
      label: getLabel('actions'),
      visible: visibleColumns.actions,
      render: (tech: ExternalTechnician) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openModal(tech)}
            leftIcon={PencilIcon}
            aria-label={getLabel('edit')}
          />
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(tech.id)}
            leftIcon={TrashIcon}
            aria-label={getLabel('delete')}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getLabel('externalTechnicians')}
        </h1>
        <Button
          variant="primary"
          onClick={() => openModal()}
          leftIcon={PlusIcon}
        >
          {getLabel('addNewExternalTechnician')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <input
          type="text"
          placeholder={`${getLabel('search')}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={getCommonInputStyle(language)}
        />
        <ColumnToggleButton
          allColumns={columns.map(col => ({ key: col.key, label: col.label }))}
          visibleColumns={Object.keys(visibleColumns).filter(key => visibleColumns[key as keyof typeof visibleColumns])}
          onToggleColumn={(columnKey: string) => {
            setVisibleColumns(prev => ({
              ...prev,
              [columnKey]: !prev[columnKey as keyof typeof prev]
            }));
          }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-secondary-700">
            <tr>
              {columns.filter(col => col.visible).map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTechnicians.length === 0 ? (
              <tr>
                <td colSpan={columns.filter(col => col.visible).length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {getLabel('noDataFound')}
                </td>
              </tr>
            ) : (
              filteredTechnicians.map((tech) => (
                <tr key={tech.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                  {columns.filter(col => col.visible).map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {column.render ? column.render(tech) : tech[column.key as keyof ExternalTechnician]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTechnician ? getLabel('editExternalTechnician') : getLabel('addNewExternalTechnician')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingTechnician && (
            <div>
              <label htmlFor="internalId_display" className={getLabelStyle(language)}>
                {getLabel('internalId')}
              </label>
              <input
                type="text"
                name="internalId_display"
                id="internalId_display"
                value={editingTechnician.internalId}
                readOnly
                className={`${getCommonInputStyle(language)} bg-gray-100 dark:bg-secondary-600`}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="name" className={getLabelStyle(language)}>
              {getLabel('technicianName')}
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={getCommonInputStyle(language)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className={getLabelStyle(language)}>
                {getLabel('phone')}
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className={getCommonInputStyle(language)}
              />
            </div>
            <div>
              <label htmlFor="email" className={getLabelStyle(language)}>
                {getLabel('email')}
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className={getCommonInputStyle(language)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="specialization" className={getLabelStyle(language)}>
              {getLabel('specialization')}
            </label>
            <select
              name="specialization"
              id="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              required
              className={getCommonInputStyle(language)}
            >
              <option value="mechanic">{getLabel('mechanicSpecialization')}</option>
              <option value="electrical">{getLabel('electricalSpecialization')}</option>
              <option value="bodywork">{getLabel('bodyworkSpecialization')}</option>
              <option value="painting">{getLabel('paintingSpecialization')}</option>
              <option value="tires">{getLabel('tiresSpecialization')}</option>
              <option value="ac">{getLabel('acSpecialization')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="address" className={getLabelStyle(language)}>
              {getLabel('address')}
            </label>
            <textarea
              name="address"
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={2}
              className={getCommonInputStyle(language)}
            />
          </div>

          <div>
            <label htmlFor="notes" className={getLabelStyle(language)}>
              {getLabel('notes')}
            </label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className={getCommonInputStyle(language)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              {getLabel('cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {getLabel('save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExternalTechniciansManagementPage;
