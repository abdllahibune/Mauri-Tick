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

export function contactWhatsApp(product: any) {
  const price = product.discount > 0
    ? Math.round(product.price * (1 - product.discount/100))
    : (product.usedPrice || product.price);
    
  const msg = 
    `مرحباً Mauri Tick 👋\n` +
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
  const price = product.discount > 0
    ? Math.round(product.price * (1 - product.discount/100))
    : (product.usedPrice || product.price);
  const cat = product.category || '';

  let economy, mid;
  
  if (cat.includes('هاتف') || cat.includes('phone')) {
    economy = 100000; mid = 250000;
  } else if (cat.includes('لابتوب') || 
             cat.includes('laptop')) {
    economy = 150000; mid = 350000;
  } else if (cat.includes('سماع') || 
             cat.includes('إكسس')) {
    economy = 20000; mid = 60000;
  } else {
    economy = 50000; mid = 150000;
  }

  if (price < economy) return {
    label: '💚 اقتصادي',
    color: '#E8F5E9',
    textColor: '#2E7D32',
    border: '#A5D6A7'
  };
  if (price < mid) return {
    label: '🔵 متوسط',
    color: '#E3F2FD', 
    textColor: '#1565C0',
    border: '#90CAF9'
  };
  return {
    label: '⭐ رائد',
    color: '#FFF8E1',
    textColor: '#F57F17',
    border: '#FFD54F'
  };
}
