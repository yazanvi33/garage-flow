import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext'; // Updated import path

const ReturnInvoicesPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language } = context; // Added language destructuring

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('returnInvoices')}</h1>
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-300">
          {getLabel('pageUnderConstruction')}
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {language === 'ar' ? 'سيتم هنا عرض وإدارة فواتير المرتجعات من وإلى العملاء والموردين.' : 'This section will display and manage return invoices from/to customers and suppliers.'}
        </p>
      </div>
    </div>
  );
};

export default ReturnInvoicesPage;
