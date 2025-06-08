
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass?: string; // e.g., 'bg-blue-500', 'text-green-500'
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, colorClass = 'bg-primary-500' }) => {
  return (
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 rtl:space-x-reverse transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
      <div className={`p-3 rounded-full ${colorClass} text-white`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-semibold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
    