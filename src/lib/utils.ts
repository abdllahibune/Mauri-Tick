import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return `${formatted} أوقية`;
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-US').format(num);
}

export function generateOrderNumber() {
  return 'MT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}
