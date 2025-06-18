
import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom'; // Re-added for v6
import Sidebar from './Sidebar';
import Header from './Header';
import { AppContext } from '../context/AppContext';

interface LayoutProps {
  children?: React.ReactNode; // Outlet will handle content, children not strictly needed but good for flexibility
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { sidebarCollapsed } = context;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-secondary-900 text-gray-800 dark:text-gray-200 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scroll bg-gray-100 dark:bg-secondary-900 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
