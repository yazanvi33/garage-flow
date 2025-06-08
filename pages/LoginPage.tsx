
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Changed back to useNavigate
import { AppContext } from '../context/AppContext';
import Button from '../components/Button';
import { MOCK_USERS_DATA, USER_ROLES_CONFIG, APP_NAME, APP_NAME_EN } from '../constants';
import { User, UserRole } from '../types';
import { LockClosedIcon, UserIcon as UserSolidIcon } from '@heroicons/react/24/solid';

const LoginPage: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate(); // Changed back to useNavigate
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [error, setError] = useState('');

  if (!context) return <p>Loading context...</p>;
  const { setCurrentUser, getLabel, language, theme, setTheme } = context;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError(language === 'ar' ? 'الرجاء اختيار صلاحية' : 'Please select a role');
      return;
    }

    const userToLogin = Object.values(MOCK_USERS_DATA).find(
      (user: User) => user.role === selectedRole
    );

    if (userToLogin) {
      setCurrentUser(userToLogin);
      navigate('/'); // Changed back to navigate('/')
    } else {
      setError(language === 'ar' ? 'لم يتم العثور على مستخدم بهذه الصلاحية لأغراض العرض.' : 'No user found with this role for demo purposes.');
    }
  };

  const appName = language === 'ar' ? APP_NAME : APP_NAME_EN;

  return (
    <div className={`flex items-center justify-center min-h-screen bg-gray-100 dark:bg-secondary-900 transition-colors duration-300 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="p-8 bg-white dark:bg-secondary-800 shadow-xl rounded-lg w-full max-w-md">
        <div className="text-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-3 text-primary-600 dark:text-primary-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 1.905c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.333.184-.582.496-.646.87l-.212 1.282a1.125 1.125 0 0 1-1.11.94h-2.594a1.125 1.125 0 0 1-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-1.905c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.184.582-.496.644-.87l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{appName}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{language === 'ar' ? 'نظام إدارة ورش صيانة السيارات' : 'Car Workshop Management System'}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {getLabel('selectRole')}
            </label>
            <div className="mt-1 relative">
                <span className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <UserSolidIcon className="w-5 h-5 text-gray-400" />
                </span>
                <select
                id="role"
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                required
                className="block w-full ps-10 p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white"
                >
                <option value="">{language === 'ar' ? '-- اختر الصلاحية --' : '-- Select Role --'}</option>
                {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                    {language === 'ar' ? USER_ROLES_CONFIG[role].name_ar : USER_ROLES_CONFIG[role].name_en}
                    </option>
                ))}
                </select>
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'اسم المستخدم (تجريبي)' : 'Username (Demo)'}
            </label>
            <div className="mt-1 relative">
                <span className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <UserSolidIcon className="w-5 h-5 text-gray-400" />
                </span>
                <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                className="block w-full ps-10 p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white"
                />
            </div>
          </div>

          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'كلمة المرور (تجريبي)' : 'Password (Demo)'}
            </label>
             <div className="mt-1 relative">
                <span className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <LockClosedIcon className="w-5 h-5 text-gray-400" />
                </span>
                <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === 'ar' ? 'ادخل كلمة المرور' : 'Enter password'}
                className="block w-full ps-10 p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-700 dark:border-secondary-600 dark:text-white"
                />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" isLoading={false}>
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </form>
         <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          {language === 'ar' ? 'اختر صلاحية لتسجيل الدخول التجريبي. لا يتم التحقق من اسم المستخدم/كلمة المرور.' : 'Select a role to demo login. Username/Password are not validated.'}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
