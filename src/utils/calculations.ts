import { differenceInDays, parseISO, isAfter, startOfDay } from 'date-fns';
import { Item } from '../types';

export function calculateDailyCost(item: Item): number {
  const purchaseDate = parseISO(item.purchase_date);
  const endDate = item.end_date ? parseISO(item.end_date) : new Date();
  
  // Ensure we don't divide by zero or negative days
  // Use at least 1 day to avoid infinity
  const daysUsed = Math.max(1, differenceInDays(startOfDay(endDate), startOfDay(purchaseDate)));
  
  const netCost = item.price - (item.resale_value || 0);
  return netCost / daysUsed;
}

export function getDaysUsed(item: Item): number {
  const purchaseDate = parseISO(item.purchase_date);
  const endDate = item.end_date ? parseISO(item.end_date) : new Date();
  return Math.max(1, differenceInDays(startOfDay(endDate), startOfDay(purchaseDate)));
}

export function getWarrantyStatus(item: Item): '已过保' | '在保中' | '无保修' {
  if (!item.warranty_expiry) return '无保修';
  
  const purchaseDate = parseISO(item.purchase_date);
  const warrantyDate = parseISO(item.warranty_expiry);
  
  // Formula provided by user: Warranty Expiry - Purchase Date
  const diff = differenceInDays(startOfDay(warrantyDate), startOfDay(purchaseDate));
  
  return diff < 0 ? '已过保' : '在保中';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(value);
}
