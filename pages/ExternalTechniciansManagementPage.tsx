import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ExternalTechnician, SortConfig, Column } from '../types';
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

const ALL_EXTERNAL_TECHNICIAN_COLUMNS_CONFIG = (getLabel: (key: string) => string, currency: { symbol: string }): Column<ExternalTechnician>[] => [
  { header: 'internalId', accessor: 'internalId', sortable: true },
  { header: 'technicianName', accessor: 'name', sortable: true },
  { header: 'phone', accessor: 'phone', sortable: true },
  { header: 'email', accessor: 'email', sortable: true },
  { header: 'address', accessor: 'address', sortable: true, className: 'text-xs max-w-xs truncate' },
  { header: 'specialization', accessor: (item) => getSpecializationLabel(item.specialization, getLabel), sortable: true, sortKey: 'specialization' },
  { header: 'openingBalance', accessor: (item) => `${(item.openingBalance || 0).toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'openingBalance' },
  { header: 'totalInvoiced', accessor: (item) => `${(item.totalInvoiced || 0).toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'totalInvoiced' },
  { header: 'totalPaid', accessor: (item) => `${(item.totalPaid || 0).toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'totalPaid' },
  { header: 'remainingBalance', accessor: (item) => `${(item.remainingBalance || 0).toFixed(2)} ${currency.symbol}`, sortable: true, sortKey: 'remainingBalance',
    render: (item) => {
      const balance = (item.remainingBalance || 0);
      // للفنيين الخارجيين: السالب يعني نحن مدينون لهم (أحمر)، الموجب يعني هم مدينون لنا (أخضر)
      const colorClass = balance < 0 ? 'text-red-600 dark:text-red-400' : balance > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400';
      return <span className={colorClass}>{balance.toFixed(2)} {currency.symbol}</span>;
    }
  },
  { header: 'notes', accessor: 'notes', sortable: true, className: 'text-xs max-w-xs truncate' },
];

// دالة لحساب القيم المالية للفني الخارجي
const calculateExternalTechnicianFinancials = (technician: ExternalTechnician): ExternalTechnician => {
  // هنا يمكن حساب القيم من الفواتير الفعلية
  // حالياً نستخدم القيم الموجودة أو نحسبها من البيانات التجريبية
  const totalInvoiced = technician.totalInvoiced || 0;
  const totalPaid = technician.totalPaid || 0;
  const openingBalance = technician.openingBalance || 0;
  const remainingBalance = openingBalance + totalInvoiced - totalPaid;

  return {
    ...technician,
    totalInvoiced,
    totalPaid,
    remainingBalance
  };
};

const getSpecializationLabel = (specialization: ExternalTechnician['specialization'], getLabel: (key: string) => string) => {
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

const ExternalTechniciansManagementPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language, currency } = context;

  const [externalTechnicians, setExternalTechnicians] = useState<ExternalTechnician[]>([
    { id: 'ext-tech-001', internalId: 'ET-0001', name: 'ماهر الجيربوكس', phone: '0599999999', email: 'maher.gearbox@email.com', address: 'شارع الصناعة، دمشق', specialization: 'mechanic', notes: 'خبير في إصلاح الجيربوكس والمحركات', openingBalance: 1500, totalInvoiced: 3200, totalPaid: 2800 },
    { id: 'ext-tech-002', internalId: 'ET-0002', name: 'أحمد الكهربائي', phone: '0588888888', email: 'ahmed.electric@email.com', address: 'حي الميدان، دمشق', specialization: 'electrical', notes: 'متخصص في الأنظمة الكهربائية والإلكترونية', openingBalance: 800, totalInvoiced: 2100, totalPaid: 1950 },
    { id: 'ext-tech-003', internalId: 'ET-0003', name: 'خالد الحداد', phone: '0577777777', address: 'منطقة الصناعية، حلب', specialization: 'bodywork', notes: 'خبير في إصلاح هياكل السيارات والحدادة', openingBalance: 0, totalInvoiced: 1800, totalPaid: 1800 },
  ].map(calculateExternalTechnicianFinancials));
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<ExternalTechnician | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig<ExternalTechnician>>({ key: null, direction: null });

  const initialFormData: Omit<ExternalTechnician, 'id' | 'internalId'> = {
    name: '',
    phone: '',
    email: '',
    address: '',
    specialization: 'mechanic' as ExternalTechnician['specialization'],
    notes: '',
    openingBalance: 0
  };

  const [formData, setFormData] = useState(initialFormData);

  const [visibleColumns, setVisibleColumns] = useState({
    internalId: true,
    technicianName: true,
    phone: true,
    email: false,
    address: false,
    specialization: true,
    openingBalance: true,
    totalInvoiced: true,
    totalPaid: true,
    remainingBalance: true,
    notes: false,
    actions: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = ['openingBalance'].includes(name) ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const openModalForCreate = () => {
    setEditingTechnician(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (technician: ExternalTechnician) => {
    setEditingTechnician(technician);
    setFormData({
      name: technician.name,
      phone: technician.phone,
      email: technician.email || '',
      address: technician.address || '',
      specialization: technician.specialization,
      notes: technician.notes || '',
      openingBalance: technician.openingBalance || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTechnician(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTechnician) {
      setExternalTechnicians(prev => prev.map(t => t.id === editingTechnician.id ? { ...editingTechnician, ...formData } : t));
    } else {
      const newTechnician: ExternalTechnician = {
        id: `ext-tech-${Date.now()}`,
        internalId: `ET-${String(Date.now()).slice(-4)}`,
        ...formData,
        totalInvoiced: 0, // الفني الجديد لا توجد له فواتير
        totalPaid: 0, // الفني الجديد لم ندفع له شيء
        remainingBalance: formData.openingBalance || 0 // الرصيد المتبقي = قيمة حساب أول المدة
      };
      setExternalTechnicians(prev => [calculateExternalTechnicianFinancials(newTechnician), ...prev]);
    }
    closeModal();
  };

  const handleDelete = (technicianId: string) => {
    setExternalTechnicians(prev => prev.filter(t => t.id !== technicianId));
  };

  const filteredAndSortedTechnicians = React.useMemo(() => {
    let filtered = externalTechnicians.filter(tech =>
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.phone.includes(searchTerm) ||
      tech.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSpecializationLabel(tech.specialization, getLabel).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        const aValue = sortConfig.key === 'specialization'
          ? getSpecializationLabel(a.specialization, getLabel)
          : a[sortConfig.key as keyof ExternalTechnician];
        const bValue = sortConfig.key === 'specialization'
          ? getSpecializationLabel(b.specialization, getLabel)
          : b[sortConfig.key as keyof ExternalTechnician];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [externalTechnicians, searchTerm, sortConfig, getLabel]);

  const allTableColumns = ALL_EXTERNAL_TECHNICIAN_COLUMNS_CONFIG(getLabel, currency);

  const displayedTableColumns = allTableColumns.filter(col => visibleColumns[col.header as keyof typeof visibleColumns]).concat([
    {
      header: 'actions',
      accessor: () => '',
      render: (technician: ExternalTechnician) => (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openModalForEdit(technician)}
            leftIcon={PencilIcon}
            aria-label={getLabel('edit')}
          />
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(technician.id)}
            leftIcon={TrashIcon}
            aria-label={getLabel('delete')}
          />
        </div>
      )
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getLabel('externalTechnicians')}
        </h1>
        <Button
          variant="primary"
          onClick={openModalForCreate}
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
          allColumns={allTableColumns.map(col => ({ key: col.header, label: getLabel(col.header) })).concat([{ key: 'actions', label: getLabel('actions') }])}
          visibleColumns={Object.keys(visibleColumns).filter(key => visibleColumns[key as keyof typeof visibleColumns])}
          onToggleColumn={(columnKey: string) => {
            setVisibleColumns(prev => ({
              ...prev,
              [columnKey]: !prev[columnKey as keyof typeof prev]
            }));
          }}
        />
      </div>

      <Table
        columns={displayedTableColumns}
        data={filteredAndSortedTechnicians}
        keyExtractor={(technician) => technician.id}
        sortConfig={sortConfig}
        onSort={setSortConfig}
      />

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
            <label htmlFor="openingBalance" className={getLabelStyle(language)}>
              {getLabel('openingBalance')}
            </label>
            <input
              type="number"
              step="any"
              name="openingBalance"
              id="openingBalance"
              value={formData.openingBalance}
              onChange={handleInputChange}
              className={getCommonInputStyle(language)}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {getLabel('openingBalanceNote')}
            </p>
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
