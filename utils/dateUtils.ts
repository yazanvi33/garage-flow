
import { DateRange } from '../types';

export const getTodayRange = (): DateRange => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end, labelKey: 'today' };
};

export const getYesterdayRange = (): DateRange => {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  return { start, end, labelKey: 'yesterday' };
};

export const getThisWeekRange = (): DateRange => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ... Saturday = 6
  // Adjust to make Monday the first day of the week
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
  const start = new Date(now.setDate(now.getDate() + diffToMonday));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end, labelKey: 'thisWeek' };
};


export const getThisMonthRange = (): DateRange => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end, labelKey: 'thisMonth' };
};

export const getLastMonthRange = (): DateRange => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  end.setHours(23, 59, 59, 999);
  return { start, end, labelKey: 'lastMonth' };
};

export const getThisYearRange = (): DateRange => {
  const start = new Date();
  start.setMonth(0, 1); // January 1st
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getFullYear(), 11, 31); // December 31st
  end.setHours(23, 59, 59, 999);
  return { start, end, labelKey: 'thisYear' };
};

export const getAllTimeRange = (): DateRange => {
  return { start: null, end: null, labelKey: 'allTime' };
};

export const isDateInRange = (dateToCheckStr: string | Date, range: DateRange): boolean => {
  if (range.labelKey === 'allTime' || (!range.start && !range.end)) {
    return true; // No date filter applied or 'allTime' selected
  }
  
  const dateToCheck = new Date(dateToCheckStr);
  if (isNaN(dateToCheck.getTime())) return false; // Invalid date string

  const startDate = range.start ? new Date(range.start) : null;
  const endDate = range.end ? new Date(range.end) : null;

  if (startDate && endDate) {
    return dateToCheck >= startDate && dateToCheck <= endDate;
  }
  if (startDate) {
    return dateToCheck >= startDate;
  }
  if (endDate) {
    return dateToCheck <= endDate;
  }
  return true; // Should not happen if labelKey is not 'allTime' and one of start/end is null
};
