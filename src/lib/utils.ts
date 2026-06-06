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
  return 'PD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

export function contactWhatsApp(product: any) {
  const price = product.discount > 0
    ? Math.round(product.price * (1 - product.discount/100))
    : (product.usedPrice || product.price);
    
  const msg = 
    `مرحباً Panda 👋\n` +
    `أريد الاستفسار عن هذا المنتج:\n\n` +
    `📱 المنتج: ${product.name}\n` +
    `🏷️ الماركة: ${product.brand}\n` +
    `💰 السعر: ${price.toLocaleString()} أوقية\n` +
    `🔗 الرابط: ${window.location.origin}/product/${product.id}\n\n` +
    `هل هو متوفر؟`;
    
  window.open(
    `https://wa.me/22236096100?text=${encodeURIComponent(msg)}`,
    '_blank'
  );
}

export function getProductTier(product: any) {
  if (product.tier === 'economy') return {
    label: '💚 اقتصادي', 
    color:'#E8F5E9', textColor:'#2E7D32', 
    border:'#A5D6A7'
  };
  if (product.tier === 'mid') return {
    label: '🔵 متوسط',
    color:'#E3F2FD', textColor:'#1565C0',
    border:'#90CAF9'
  };
  if (product.tier === 'flagship') return {
    label: '⭐ رائد',
    color:'#FFF8E1', textColor:'#F57F17',
    border:'#FFD54F'
  };

  return {
    label: '',
    color: 'transparent',
    textColor: 'transparent',
    border: 'transparent'
  };
}
