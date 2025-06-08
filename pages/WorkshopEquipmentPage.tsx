import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext'; // Updated import path

const WorkshopEquipmentPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language } = context;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('workshopEquipment')}</h1>
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-300">
          {getLabel('pageUnderConstruction') || 'This page (Workshop Equipment Invoices) is under construction.'}
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {language === 'ar' ? 'سيتم هنا تسجيل فواتير شراء أو صيانة معدات الورشة.' : 'This section will record invoices for purchasing or maintaining workshop equipment.'}
        </p>
      </div>
    </div>
  );
};

export default WorkshopEquipmentPage;
