import React from 'react';
import { Employee } from '../types';

interface EmployeeDetailsProps {
  employee: Employee;
  getLabel: (key: string) => string;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee, getLabel }) => {
  const DetailItem: React.FC<{ labelKey: string; value?: string | number | null }> = ({ labelKey, value }) => (
    <div className="flex justify-between py-1.5 border-b border-dashed border-gray-200 dark:border-gray-700">
      <dt className="font-medium text-gray-600 dark:text-gray-400">{getLabel(labelKey)}:</dt>
      <dd className="text-gray-800 dark:text-gray-200 text-right rtl:text-left">{value || '-'}</dd>
    </div>
  );

  return (
    <div>
      <DetailItem labelKey="internalId" value={employee.internalId} />
      <DetailItem labelKey="name" value={employee.name} />
      <DetailItem labelKey="role" value={employee.role} />
      <DetailItem labelKey="phone" value={employee.phone} />
      <DetailItem labelKey="email" value={employee.email} />
      <DetailItem labelKey="hireDate" value={new Date(employee.hireDate).toLocaleDateString(getLabel('language') === 'ar' ? 'ar-SY' : 'en-US')} />
      <DetailItem labelKey="nationalId" value={employee.nationalId} />
      <DetailItem labelKey="maritalStatus" value={employee.maritalStatus} />
      <DetailItem labelKey="gender" value={employee.gender} />
      <DetailItem labelKey="numberOfChildren" value={employee.numberOfChildren} />
      <DetailItem labelKey="salary" value={employee.salary} />
      <DetailItem labelKey="notes" value={employee.notes} />
    </div>
  );
};

export default EmployeeDetails;
