import { createContext } from 'react';
import { User, DateRange, Currency } from '../types';

// Define Theme and Language types here as they were originally in App.tsx
// and are part of AppContextType
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ar';

export interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  getLabel: (key: string) => string;
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const AppContext = createContext<AppContextType | null>(null);
