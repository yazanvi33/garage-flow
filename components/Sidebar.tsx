
import React, { useContext, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext'; 
import { NAVIGATION_ITEMS, NavItem, USER_ROLES_CONFIG, ICONS } from '../constants';


const SidebarNavItem: React.FC<{ item: NavItem; isChild?: boolean }> = ({ item, isChild = false }) => {
  const context = useContext(AppContext);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  if (!context) return null;
  const { language, getLabel, currentUser } = context;

  if (item.roles && currentUser && !item.roles.includes(currentUser.role)) {
    return null; 
  }

  const label = language === 'ar' ? item.label_ar : item.label_en;

  const handleToggleSubmenu = (e: React.MouseEvent) => {
    if (item.children && item.children.length > 0) {
      e.preventDefault(); 
      setIsSubmenuOpen(!isSubmenuOpen);
    }
  };
  
  const navLinkClasses = ({ isActive }: { isActive: boolean }, isSubmenuLink: boolean) => 
    `flex items-center p-2 rounded-lg hover:bg-primary-500 hover:text-white dark:hover:bg-primary-700 transition-colors duration-200 ${isChild ? (language === 'ar' ? 'ps-6' : 'pl-6') : ''} ${isActive && !isSubmenuLink ? 'bg-primary-600 text-white dark:bg-primary-700' : 'text-gray-700 dark:text-gray-300'}`;


  return (
    <li>
      <NavLink
        to={item.children && item.children.length > 0 ? (item.path || '#') : item.path}
        onClick={handleToggleSubmenu}
        className={({ isActive }) => navLinkClasses(isActive, !!(item.children && item.children.length > 0))}
        end={item.path === '/'} // Use 'end' prop for exact matching on index/home routes in v6
      >
        <item.icon className={`w-6 h-6 ${language === 'ar' ? 'ms-3' : 'mr-3'}`} />
        <span className="flex-1">{label}</span>
        {item.children && item.children.length > 0 && (
          isSubmenuOpen ? <span className="w-4 h-4">^</span> : <span className="w-4 h-4">V</span>
        )}
      </NavLink>
      {item.children && item.children.length > 0 && isSubmenuOpen && (
        <ul className={`overflow-hidden transition-all duration-300 ease-in-out ${language === 'ar' ? 'ps-4' : 'pl-4'} mt-1 space-y-1`}>
          {item.children.map((child) => (
             <SidebarNavItem key={child.id} item={child} isChild={true} />
          ))}
        </ul>
      )}
    </li>
  );
};


const Sidebar: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { language, getLabel, currentUser, setCurrentUser } = context;
  const appName = getLabel('appName');

  const handleLogout = () => {
    setCurrentUser(null); 
  };

  return (
    <aside className="w-64 bg-white dark:bg-secondary-800 shadow-md flex flex-col transition-colors duration-300">
      <div className="p-4 border-b dark:border-secondary-700">
        <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          {appName}
        </Link>
        {currentUser && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getLabel(USER_ROLES_CONFIG[currentUser.role].name_en)} ({currentUser.name})
          </p>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <ul>
          {NAVIGATION_ITEMS.map((item) => (
            <SidebarNavItem key={item.id} item={item} />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t dark:border-secondary-700">
         <button 
            onClick={handleLogout}
            className="w-full flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-700 transition-colors duration-200"
          >
            <ICONS.ArrowLeftOnRectangleIcon className={`w-6 h-6 ${language === 'ar' ? 'ms-3' : 'mr-3'}`} />
            {getLabel('logout')}
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
