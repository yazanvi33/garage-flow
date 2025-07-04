import React, { useContext } from 'react';
import DatePicker, { DatePickerProps } from 'react-datepicker';
import { AppContext } from '../context/AppContext';

// Custom input component to match the app's style
const CustomInput = React.forwardRef<HTMLInputElement, { value?: string; onClick?: () => void; language: string }>(
  ({ value, onClick, language }, ref) => (
    <input
      onClick={onClick}
      ref={ref}
      value={value}
      readOnly
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white ${language === 'ar' ? 'text-right' : 'text-left'}`}
    />
  )
);

interface StyledDatePickerProps extends Omit<DatePickerProps, 'onChange' | 'selected'> {
  label: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
}

const StyledDatePicker: React.FC<StyledDatePickerProps> = ({ label, selected, onChange, ...props }) => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { language, theme } = context;

  return (
    <div>
      <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        {label}
      </label>
      <DatePicker
        selected={selected}
        onChange={onChange as any} // Cast to any to resolve type incompatibility
        customInput={<CustomInput language={language} />}
        dateFormat="dd/MM/yyyy"
        className="w-full" // This class is on the wrapper, customInput handles the input style
        calendarClassName={theme === 'dark' ? 'dark-theme-datepicker' : ''}
        popperPlacement="bottom-start"
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        {...(props as any)} // Cast all remaining props to any to bypass strict type checking
      />
    </div>
  );
};

export default StyledDatePicker;
