
import React, { useContext, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext'; 
import { NAVIGATION_ITEMS, NavItem, USER_ROLES_CONFIG, ICONS } from '../constants';


const SidebarNavItem: React.FC<{ item: NavItem; isChild?: boolean; collapsed?: boolean }> = ({ item, isChild = false, collapsed = false }) => {
  const context = useContext(AppContext);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  if (!context) return null;
  const { language, currentUser } = context;

  if (item.roles && currentUser && !item.roles.includes(currentUser.role)) {
    return null;
  }

  const label = language === 'ar' ? item.label_ar : item.label_en;

  const handleToggleSubmenu = (e: React.MouseEvent) => {
    if (item.children && item.children.length > 0 && !collapsed) {
      e.preventDefault();
      setIsSubmenuOpen(!isSubmenuOpen);
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }, isSubmenuLink: boolean) =>
    `flex items-center p-2 rounded-lg hover:bg-primary-500 hover:text-white dark:hover:bg-primary-700 transition-colors duration-200 ${isChild ? (language === 'ar' ? 'ps-6' : 'pl-6') : ''} ${isActive && !isSubmenuLink ? 'bg-primary-600 text-white dark:bg-primary-700' : 'text-gray-700 dark:text-gray-300'} ${collapsed && !isChild ? 'justify-center' : ''}`;

  return (
    <li>
      <NavLink
        to={item.children && item.children.length > 0 ? (item.path || '#') : item.path}
        onClick={handleToggleSubmenu}
        className={({ isActive }) => navLinkClasses({ isActive }, !!(item.children && item.children.length > 0))}
        end={item.path === '/'} // Use 'end' prop for exact matching on index/home routes in v6
        title={collapsed ? label : undefined}
      >
        <item.icon className={`w-6 h-6 ${collapsed ? '' : (language === 'ar' ? 'ms-3' : 'mr-3')}`} />
        {!collapsed && (
          <>
            <span className="flex-1 whitespace-nowrap">{label}</span>
            {item.children && item.children.length > 0 && (
              isSubmenuOpen ? <span className="w-4 h-4">^</span> : <span className="w-4 h-4">V</span>
            )}
          </>
        )}
      </NavLink>
      {!collapsed && item.children && item.children.length > 0 && isSubmenuOpen && (
        <ul className={`overflow-hidden transition-all duration-300 ease-in-out ${language === 'ar' ? 'ps-4' : 'pl-4'} mt-1 space-y-1`}>
          {item.children.map((child) => (
             <SidebarNavItem key={child.id} item={child} isChild={true} collapsed={collapsed} />
          ))}
        </ul>
      )}
    </li>
  );
};


const Sidebar: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { language, getLabel, currentUser, setCurrentUser, sidebarCollapsed, setSidebarCollapsed } = context;
  const appName = getLabel('appName');

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <aside className={`${sidebarCollapsed ? 'w-16 min-w-16' : 'w-64 min-w-64'} bg-white dark:bg-secondary-800 shadow-md flex flex-col transition-all duration-300`}>
      {/* Removed empty div that caused spacing issues */}

      <nav className={`flex-1 ${sidebarCollapsed ? 'p-2' : 'p-4'} space-y-2 overflow-y-auto`}>
        <ul>
          {/* زر طي/فتح القائمة كأول عنصر */}
          <li>
            <button
              onClick={toggleSidebar}
              className={`w-full flex items-center p-2 rounded-lg hover:bg-primary-500 hover:text-white dark:hover:bg-primary-700 transition-colors duration-200 text-gray-700 dark:text-gray-300 ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? getLabel('expandSidebar') : getLabel('collapseSidebar')}
            >
              <ICONS.Bars3Icon className={`w-6 h-6 ${sidebarCollapsed ? '' : (language === 'ar' ? 'ms-3' : 'mr-3')}`} />
              {!sidebarCollapsed && (
                <span className="flex-1 whitespace-nowrap">
                  {sidebarCollapsed ? getLabel('expandSidebar') : getLabel('collapseSidebar')}
                </span>
              )}
            </button>
          </li>

          {NAVIGATION_ITEMS.map((item) => (
            <SidebarNavItem key={item.id} item={item} collapsed={sidebarCollapsed} />
          ))}
        </ul>
      </nav>

      <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t dark:border-secondary-700`}>
         <button
            onClick={handleLogout}
            className={`w-full flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-700 transition-colors duration-200 ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? getLabel('logout') : undefined}
          >
            <ICONS.ArrowLeftOnRectangleIcon className={`w-6 h-6 ${sidebarCollapsed ? '' : (language === 'ar' ? 'ms-3' : 'mr-3')}`} />
            {!sidebarCollapsed && getLabel('logout')}
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
