
import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import VehiclesPage from './pages/VehiclesPage';
import MaintenanceCardsPage from './pages/MaintenanceCardsPage';
import PartsPage from './pages/PartsPage';
import EmployeesPage from './pages/EmployeesPage';
import ReportsPage from './pages/ReportsPage';
import OutgoingInvoicesPage from './pages/OutgoingInvoicesPage';
import PurchaseInvoicesPage from './pages/PurchaseInvoicesPage';
import ReturnInvoicesPage from './pages/ReturnInvoicesPage';
import ExternalTechniciansPage from './pages/ExternalTechniciansPage';
import ExternalTechniciansManagementPage from './pages/ExternalTechniciansManagementPage';
import WorkshopEquipmentPage from './pages/WorkshopEquipmentPage';
import GeneralExpensesPage from './pages/GeneralExpensesPage';
import LoginPage from './pages/LoginPage';
import InventoryIssueRequestsPage from './pages/InventoryIssueRequestsPage'; // Ensured relative path
import SecondaryWarehousePage from './pages/SecondaryWarehousePage'; 
import { User, UserRole, DateRange, Currency } from './types';
import { AppContext, AppContextType, Theme, Language } from './context/AppContext';
import { MOCK_USERS_DATA, MOCK_LOGGED_IN_USER_ID, LABELS, DEFAULT_CURRENCY, CURRENCY_OPTIONS } from './constants';
import './src/styles/scrollbar.css';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}

const App: React.FC = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    return storedTheme || 'system';
  });
  const [language, setLanguageState] = useState<Language>(() => {
    const storedLang = localStorage.getItem('language') as Language | null;
    return storedLang || 'ar';
  });
  const [currentUser, setCurrentUserState] = useState<User | null>(MOCK_USERS_DATA[MOCK_LOGGED_IN_USER_ID]);

  const [dateRange, setDateRangeState] = useState<DateRange>({ start: null, end: null, labelKey: 'allTime' });
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const storedCurrencyCode = localStorage.getItem('currencyCode');
    return CURRENCY_OPTIONS.find(c => c.code === storedCurrencyCode) || DEFAULT_CURRENCY;
  });

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('currencyCode', currency.code);
  }, [currency]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
  }, []);
  
  const getLabel = useCallback((key: string): string => {
    return LABELS[language]?.[key] || LABELS['en']?.[key] || key;
  }, [language]);

  const setDateRange = useCallback((newDateRange: DateRange) => {
    setDateRangeState(newDateRange);
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  }, []);

  const appContextValue: AppContextType = useMemo(() => ({
    theme,
    setTheme,
    language,
    setLanguage,
    currentUser,
    setCurrentUser,
    getLabel,
    dateRange,
    setDateRange,
    currency,
    setCurrency,
  }), [theme, setTheme, language, setLanguage, currentUser, setCurrentUser, getLabel, dateRange, setDateRange, currency, setCurrency]);

  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const location = useLocation();
    if (!currentUser) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/" replace />; 
    }
    return children;
  };
  
  return (
    <AppContext.Provider value={appContextValue}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><CustomersPage /></ProtectedRoute>} />
            <Route path="suppliers" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><SuppliersPage /></ProtectedRoute>} />
            <Route path="vehicles" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.TECHNICIAN]}><VehiclesPage /></ProtectedRoute>} />
            <Route path="maintenance-cards" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TECHNICIAN]}><MaintenanceCardsPage /></ProtectedRoute>} />

            {/* Inventory Routes */}
            <Route path="inventory/parts" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.TECHNICIAN]}><PartsPage /></ProtectedRoute>} />
            <Route path="inventory/issue-requests" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.TECHNICIAN]}><InventoryIssueRequestsPage /></ProtectedRoute>} />
            <Route path="inventory/secondary-warehouse" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.TECHNICIAN]}><SecondaryWarehousePage /></ProtectedRoute>} />

            {/* Invoicing & Expenses Routes */}
            <Route path="invoices/outgoing" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><OutgoingInvoicesPage /></ProtectedRoute>} />
            <Route path="invoices/incoming" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><PurchaseInvoicesPage /></ProtectedRoute>} />
            <Route path="invoices/returns" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><ReturnInvoicesPage /></ProtectedRoute>} />
            <Route path="invoices/external-technicians" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><ExternalTechniciansPage /></ProtectedRoute>} />
            <Route path="invoices/equipment" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><WorkshopEquipmentPage /></ProtectedRoute>} />
            <Route path="invoices/general" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><GeneralExpensesPage /></ProtectedRoute>} />

            <Route path="employees" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><EmployeesPage /></ProtectedRoute>} />
            <Route path="external-technicians-management" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><ExternalTechniciansManagementPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ACCOUNTANT]}><ReportsPage /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
