import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext'; // Updated import path

const GeneralExpensesPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language } = context;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('generalExpenses')}</h1>
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-300">
          {getLabel('pageUnderConstruction') || 'This page (General Expense Invoices) is under construction.'}
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {language === 'ar' ? 'سيتم هنا تسجيل فواتير المصروفات العامة مثل الماء، الكهرباء، المواد الاستهلاكية، إلخ.' : 'This section will record general expense invoices like water, electricity, consumables, etc.'}
        </p>
      </div>
    </div>
  );
};

export default GeneralExpensesPage;
