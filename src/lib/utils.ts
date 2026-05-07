import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('ar-MR', {
    style: 'currency',
    currency: 'MRU',
  }).format(price).replace('MRU', 'أوقية');
}

export function generateOrderNumber() {
  return 'MT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}
