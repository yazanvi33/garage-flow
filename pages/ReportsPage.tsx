import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext'; // Updated import path

const ReportsPage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <p>Loading context...</p>;
  const { getLabel, language } = context;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">{getLabel('reports')}</h1>
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-300">
          {getLabel('pageUnderConstruction') || 'This page (Reports) is under construction.'}
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {language === 'ar' 
            ? 'سيتم هنا عرض تقارير شاملة ومفلترة حول المستودع، الموردين، العملاء، السيارات، الفواتير، والمصروفات. سيتم توفير خيارات تصفية متقدمة وتصدير البيانات.' 
            : 'Comprehensive and filterable reports on inventory, suppliers, customers, vehicles, invoices, and expenses will be displayed here. Advanced filtering and data export options will be provided.'}
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-700 dark:text-gray-200">
          {language === 'ar' ? 'التقارير المطلوبة (أمثلة):' : 'Requested Reports (Examples):'}
        </h2>
        <ul className="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400 marker:text-primary-500">
          <li>{language === 'ar' ? 'تقارير المستودع (جرد، حركة، كميات)' : 'Inventory Reports (Stock, Movement, Quantities)'}</li>
          <li>{language === 'ar' ? 'تقارير الموردين (فواتير، مدفوعات)' : 'Supplier Reports (Invoices, Payments)'}</li>
          <li>{language === 'ar' ? 'تقارير العملاء (فواتير، مستحقات)' : 'Customer Reports (Invoices, Dues)'}</li>
          <li>{language === 'ar' ? 'تقارير السيارات (سجل الصيانة، تكاليف)' : 'Vehicle Reports (Maintenance History, Costs)'}</li>
          <li>{language === 'ar' ? 'تقارير الفواتير (حسب النوع، التاريخ)' : 'Invoice Reports (By Type, Date)'}</li>
          <li>{language === 'ar' ? 'تقارير المصروفات (تفصيلية، إجمالية)' : 'Expense Reports (Detailed, Summary)'}</li>
        </ul>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {language === 'ar' ? 'نصيحة: استخدم مكتبات مثل Recharts أو D3 لإنشاء مخططات بيانية تفاعلية. قم بتوفير خيارات لتصدير التقارير إلى Excel/CSV.' : 'Tip: Use libraries like Recharts or D3 for interactive charts. Provide options to export reports to Excel/CSV.'}
        </p>
      </div>
    </div>
  );
};

export default ReportsPage;
