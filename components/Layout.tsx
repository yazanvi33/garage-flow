
import React from 'react';
import { Outlet } from 'react-router-dom'; // Re-added for v6
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children?: React.ReactNode; // Outlet will handle content, children not strictly needed but good for flexibility
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-secondary-900 text-gray-800 dark:text-gray-200 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-secondary-900 p-6">
          {children || <Outlet />} {/* Changed back to Outlet, or render children if passed explicitly */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
