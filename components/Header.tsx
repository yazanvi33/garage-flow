
import React, { useContext, useState, Fragment, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, LanguageIcon, CogIcon, UserCircleIcon, ChevronDownIcon, CalendarDaysIcon, BanknotesIcon, GlobeAltIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import { LANGUAGE_OPTIONS, THEME_OPTIONS, USER_ROLES_CONFIG, CURRENCY_OPTIONS, ICONS } from '../constants';
import { Menu, Transition, Dialog, Popover } from '@headlessui/react';
import { DateRange, Currency as CurrencyType } from '../types'; // Renamed to avoid conflict
import { getTodayRange, getYesterdayRange, getThisWeekRange, getThisMonthRange, getLastMonthRange, getThisYearRange, getAllTimeRange } from '../utils/dateUtils';
import Button from './Button';
import { Theme } from '../context/AppContext';


const Header: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { theme, setTheme, language, setLanguage, getLabel, currentUser, setCurrentUser, dateRange, setDateRange, currency, setCurrency } = context;

  const currentThemeOption = THEME_OPTIONS.find(opt => opt.value === theme);
  const currentLanguageOption = LANGUAGE_OPTIONS.find(opt => opt.code === language);
  const currentCurrencyOption = CURRENCY_OPTIONS.find(opt => opt.code === currency.code);

  const [isCustomDateRangeModalOpen, setIsCustomDateRangeModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    if (dateRange.labelKey === 'custom' && dateRange.start && dateRange.end) {
        setCustomStartDate(dateRange.start.toISOString().split('T')[0]);
        setCustomEndDate(dateRange.end.toISOString().split('T')[0]);
    }
  }, [dateRange]);


  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const dateFilterOptions = [
    { labelKey: 'allTime', rangeFn: getAllTimeRange },
    { labelKey: 'today', rangeFn: getTodayRange },
    { labelKey: 'yesterday', rangeFn: getYesterdayRange },
    { labelKey: 'thisWeek', rangeFn: getThisWeekRange },
    { labelKey: 'thisMonth', rangeFn: getThisMonthRange },
    { labelKey: 'lastMonth', rangeFn: getLastMonthRange },
    { labelKey: 'thisYear', rangeFn: getThisYearRange },
  ];

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        start.setHours(0,0,0,0);
        const end = new Date(customEndDate);
        end.setHours(23,59,59,999);
        setDateRange({ start, end, labelKey: 'customRange' });
        setIsCustomDateRangeModalOpen(false);
    }
  };
  
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-CA'); // en-CA for YYYY-MM-DD
  }

  const currentFilterDisplayLabel = () => {
    if (dateRange.labelKey === 'customRange' && dateRange.start && dateRange.end) {
        return `${formatDateForDisplay(dateRange.start)} - ${formatDateForDisplay(dateRange.end)}`;
    }
    return getLabel(dateRange.labelKey);
  };


  return (
    <header className="bg-white dark:bg-secondary-800 shadow-sm p-4 flex justify-between items-center transition-colors duration-300">
      <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">
        {/* Dynamic page title placeholder */}
      </div>

      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        {/* Date Range Filter Dropdown */}
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-secondary-600 shadow-sm px-3 py-2 bg-white dark:bg-secondary-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-secondary-800 focus:ring-primary-500">
              <ICONS.CalendarDaysIcon className="h-5 w-5 me-2" aria-hidden="true" />
              {currentFilterDisplayLabel()}
              <ChevronDownIcon className="-me-1 ms-2 h-5 w-5" aria-hidden="true" />
            </Menu.Button>
          </div>
          <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
            <Menu.Items className={`origin-top-end absolute mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-secondary-700 ring-1 ring-black dark:ring-secondary-600 ring-opacity-5 focus:outline-none z-20 ${language === 'ar' ? 'start-0' : 'end-0'}`}>
              <div className="py-1">
                {dateFilterOptions.map((opt) => (
                  <Menu.Item key={opt.labelKey}>
                    {({ active }) => (
                      <button onClick={() => setDateRange(opt.rangeFn())} className={`${active ? 'bg-gray-100 dark:bg-secondary-600' : ''} group flex rounded-md items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200`}>
                        {getLabel(opt.labelKey)}
                      </button>
                    )}
                  </Menu.Item>
                ))}
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={() => setIsCustomDateRangeModalOpen(true)} className={`${active ? 'bg-gray-100 dark:bg-secondary-600' : ''} group flex rounded-md items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200`}>
                      {getLabel('customRange')}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* User Profile Dropdown (Now includes Theme, Language, Currency) */}
        {currentUser && (
          <Menu as="div" className="relative inline-block text-left">
            <div><Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-secondary-800 focus:ring-primary-500"><UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-300" /></Menu.Button></div>
            <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
              <Menu.Items className={`origin-top-end absolute mt-2 w-64 rounded-md shadow-lg py-1 bg-white dark:bg-secondary-700 ring-1 ring-black dark:ring-secondary-600 ring-opacity-5 focus:outline-none z-20 ${language === 'ar' ? 'start-0' : 'end-0'}`}>
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.username}</p>
                  <p className="text-xs text-primary-600 dark:text-primary-400">{getLabel(USER_ROLES_CONFIG[currentUser.role].name_en)}</p>
                </div>
                
                <div className="border-t border-gray-200 dark:border-secondary-600 my-1"></div>

                {/* Theme Switcher */}
                <Popover className="relative">
                  {({ open }) => (
                    <>
                      <Popover.Button as={Menu.Item} className="w-full">
                         {({ active }) => (
                            <button className={`${ active ? 'bg-gray-100 dark:bg-secondary-600' : '' } group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}>
                                {currentThemeOption?.icon && <currentThemeOption.icon className="h-5 w-5 me-3 text-gray-500 dark:text-gray-400" />}
                                {getLabel('theme')}: <span className="ms-1 font-semibold">{currentThemeOption ? (language === 'ar' ? currentThemeOption.name_ar : currentThemeOption.name_en) : ''}</span>
                                <ChevronDownIcon className={`w-4 h-4 ms-auto transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                            </button>
                         )}
                      </Popover.Button>
                      <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-75" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
                        <Popover.Panel className={`absolute -top-8 z-10 mt-0 w-40 transform rounded-md bg-white dark:bg-secondary-700 shadow-lg ring-1 ring-black dark:ring-secondary-600 ring-opacity-5 ${language === 'ar' ? 'right-full mr-1' : 'left-full ml-1'}`}>
                           <div className="py-1">
                            {THEME_OPTIONS.map((themeOpt) => (
                                <button key={themeOpt.value} onClick={() => setTheme(themeOpt.value as Theme)} 
                                 className={`group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-secondary-600 ${(theme === themeOpt.value) ? 'font-semibold text-primary-600 dark:text-primary-400' : ''}`}>
                                  <themeOpt.icon className="h-5 w-5 me-2" />
                                  {language === 'ar' ? themeOpt.name_ar : themeOpt.name_en}
                                </button>
                            ))}
                          </div>
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>

                {/* Language Switcher */}
                 <Popover className="relative">
                  {({ open }) => (
                    <>
                      <Popover.Button as={Menu.Item} className="w-full">
                         {({ active }) => (
                            <button className={`${ active ? 'bg-gray-100 dark:bg-secondary-600' : '' } group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}>
                                <GlobeAltIcon className="h-5 w-5 me-3 text-gray-500 dark:text-gray-400" />
                                {getLabel('language')}: <span className="ms-1 font-semibold">{currentLanguageOption?.name}</span>
                                <ChevronDownIcon className={`w-4 h-4 ms-auto transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                            </button>
                         )}
                      </Popover.Button>
                      <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-75" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
                        <Popover.Panel className={`absolute -top-8 z-10 mt-0 w-40 transform rounded-md bg-white dark:bg-secondary-700 shadow-lg ring-1 ring-black dark:ring-secondary-600 ring-opacity-5 ${language === 'ar' ? 'right-full mr-1' : 'left-full ml-1'}`}>
                           <div className="py-1">
                            {LANGUAGE_OPTIONS.map((langOpt) => (
                                <button key={langOpt.code} onClick={() => setLanguage(langOpt.code as 'en' | 'ar')} 
                                 className={`group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-secondary-600 ${(language === langOpt.code) ? 'font-semibold text-primary-600 dark:text-primary-400' : ''}`}>
                                  {langOpt.name}
                                </button>
                            ))}
                          </div>
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>

                {/* Currency Switcher */}
                <Popover className="relative">
                  {({ open }) => (
                    <>
                      <Popover.Button as={Menu.Item} className="w-full">
                         {({ active }) => (
                            <button className={`${ active ? 'bg-gray-100 dark:bg-secondary-600' : '' } group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}>
                                <BanknotesIcon className="h-5 w-5 me-3 text-gray-500 dark:text-gray-400" />
                                {getLabel('currency')}: <span className="ms-1 font-semibold">{currentCurrencyOption?.symbol} ({currentCurrencyOption ? (language === 'ar' ? currentCurrencyOption.name_ar : currentCurrencyOption.name_en) : ''})</span>
                                <ChevronDownIcon className={`w-4 h-4 ms-auto transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                            </button>
                         )}
                      </Popover.Button>
                      <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-75" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
                        <Popover.Panel className={`absolute -top-8 z-10 mt-0 w-52 transform rounded-md bg-white dark:bg-secondary-700 shadow-lg ring-1 ring-black dark:ring-secondary-600 ring-opacity-5 ${language === 'ar' ? 'right-full mr-1' : 'left-full ml-1'}`}>
                           <div className="py-1">
                            {CURRENCY_OPTIONS.map((currOpt) => (
                                <button key={currOpt.code} onClick={() => setCurrency(currOpt)} 
                                 className={`group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-secondary-600 ${(currency.code === currOpt.code) ? 'font-semibold text-primary-600 dark:text-primary-400' : ''}`}>
                                  {currOpt.symbol} <span className="mx-1">{language === 'ar' ? currOpt.name_ar : currOpt.name_en}</span> ({currOpt.code})
                                </button>
                            ))}
                          </div>
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
                
                <div className="border-t border-gray-200 dark:border-secondary-600 my-1"></div>
                <Menu.Item>
                  {({ active }) => (<button onClick={handleLogout} className={`${ active ? 'bg-red-100 dark:bg-red-700' : '' } group flex items-center w-full px-4 py-2 text-sm text-red-700 dark:text-red-300`}>
                    <ICONS.ArrowLeftOnRectangleIcon className="h-5 w-5 me-3 text-red-500 dark:text-red-400" />
                    {getLabel('logout')}
                  </button>)}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
      {/* Custom Date Range Modal */}
      <Transition appear show={isCustomDateRangeModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => setIsCustomDateRangeModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 dark:bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-secondary-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{getLabel('customRange')}</Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('startDate')}</label>
                      <input type="date" id="startDate" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-secondary-700 dark:border-secondary-600 dark:text-white focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getLabel('endDate')}</label>
                      <input type="date" id="endDate" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-secondary-700 dark:border-secondary-600 dark:text-white focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                    <Button variant="secondary" onClick={() => setIsCustomDateRangeModalOpen(false)}>{getLabel('cancel')}</Button>
                    <Button onClick={handleCustomDateApply}>{getLabel('apply')}</Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </header>
  );
};

export default Header;
