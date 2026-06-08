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
  const base = getDisplayPrice(product);
  const price = product.discount > 0
    ? Math.round(base * (1 - product.discount/100))
    : base;
    
  const msg = 
    `مرحباً Panda\n` +
    `أريد الاستفسار عن هذا المنتج:\n\n` +
    `المنتج: ${product.name}\n` +
    `الماركة: ${product.brand}\n` +
    `السعر: ${price.toLocaleString()} أوقية\n` +
    `الرابط: ${window.location.origin}/product/${product.id}\n\n` +
    `هل هو متوفر؟`;
    
  window.open(
    `https://wa.me/22236096100?text=${encodeURIComponent(msg)}`,
    '_blank'
  );
}

export function getProductTier(product: any) {
  if (product.tier === 'economy') return {
    label: 'اقتصادي', 
    color:'#E8F5E9', textColor:'#2E7D32', 
    border:'#A5D6A7'
  };
  if (product.tier === 'mid') return {
    label: 'متوسط',
    color:'#E3F2FD', textColor:'#1565C0',
    border:'#90CAF9'
  };
  if (product.tier === 'flagship') return {
    label: 'رائد',
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

export function proxyImage(url: string | undefined): string | null {
  if (!url || url.length < 10) return null;
  if (url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  if (url.includes('images.weserv.nl')) {
    return url;
  }
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400&output=webp&q=75`;
}

export function getDisplayPrice(product: any, customMargins?: any, customUsdToMru?: number) {
  if (!product) return 0;
  
  let margins = customMargins;
  if (!margins || Object.keys(margins).length === 0) {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('panda_margins');
        if (saved) margins = JSON.parse(saved);
      } catch (e) {}
    }
  }
  
  if (!margins || Object.keys(margins).length === 0) {
    margins = {
      default: 1.30,
      'إلكترونيات': 1.20,
      'ملابس وأزياء': 1.40,
      'منزل ومطبخ': 1.35,
      'جمال وعناية': 1.45,
      'رياضة': 1.30,
      'أطفال': 1.35,
      'ألعاب وترفيه': 1.25,
    };
  }

  let usdToMru = customUsdToMru;
  if (!usdToMru) {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('panda_general_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          usdToMru = Number(parsed.usdToMru);
        }
      } catch (e) {}
    }
  }
  if (!usdToMru) {
    usdToMru = Number(product.usdToMru) || Number(product.usd_to_mru) || 40;
  }

  const margin = margins[product.category] || margins.default || 1.3;

  return Number(product.price) ||
    Number(product.priceMRU) ||
    Number(product.priceMru) ||
    Math.round(Number(product.priceUSD || 0) * usdToMru * margin) ||
    0;
}

