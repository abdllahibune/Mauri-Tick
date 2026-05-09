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
  const cat = (product.category || '').trim();

  // ===== هواتف ذكية =====
  if (cat.includes('هاتف') || cat.includes('phone') ||
      cat.includes('smartphone')) {
    if (price < 100000) return {
      label: '💚 اقتصادي', 
      desc: 'أقل من 100,000 أوقية',
      color:'#E8F5E9', textColor:'#2E7D32', 
      border:'#A5D6A7'
    };
    if (price < 250000) return {
      label: '🔵 متوسط',
      desc: '100,000 - 250,000 أوقية',
      color:'#E3F2FD', textColor:'#1565C0',
      border:'#90CAF9'
    };
    return {
      label: '⭐ رائد',
      desc: 'أكثر من 250,000 أوقية',
      color:'#FFF8E1', textColor:'#F57F17',
      border:'#FFD54F'
    };
  }

  // ===== لابتوب وحاسوب =====
  if (cat.includes('لابتوب') || cat.includes('حاسوب') ||
      cat.includes('laptop') || cat.includes('computer')) {
    if (price < 200000) return {
      label: '💚 اقتصادي',
      desc: 'أقل من 200,000 أوقية',
      color:'#E8F5E9', textColor:'#2E7D32',
      border:'#A5D6A7'
    };
    if (price < 450000) return {
      label: '🔵 متوسط',
      desc: '200,000 - 450,000 أوقية',
      color:'#E3F2FD', textColor:'#1565C0',
      border:'#90CAF9'
    };
    return {
      label: '⭐ رائد',
      desc: 'أكثر من 450,000 أوقية',
      color:'#FFF8E1', textColor:'#F57F17',
      border:'#FFD54F'
    };
  }

  // ===== سماعات وصوتيات =====
  if (cat.includes('سماع') || cat.includes('صوت') ||
      cat.includes('audio') || cat.includes('headphone')) {
    if (price < 15000) return {
      label: '💚 عادي',
      desc: 'أقل من 15,000 أوقية',
      color:'#E8F5E9', textColor:'#2E7D32',
      border:'#A5D6A7'
    };
    if (price < 50000) return {
      label: '🔵 جيد',
      desc: '15,000 - 50,000 أوقية',
      color:'#E3F2FD', textColor:'#1565C0',
      border:'#90CAF9'
    };
    return {
      label: '⭐ احترافي',
      desc: 'أكثر من 50,000 أوقية',
      color:'#FFF8E1', textColor:'#F57F17',
      border:'#FFD54F'
    };
  }

  // ===== إكسسوارات =====
  if (cat.includes('إكسس') || cat.includes('اكسس') ||
      cat.includes('accessory') || cat.includes('كفر') ||
      cat.includes('شاحن') || cat.includes('كابل')) {
    if (price < 5000) return {
      label: '💚 اقتصادي',
      desc: 'أقل من 5,000 أوقية',
      color:'#E8F5E9', textColor:'#2E7D32',
      border:'#A5D6A7'
    };
    if (price < 20000) return {
      label: '🔵 متوسط',
      desc: '5,000 - 20,000 أوقية',
      color:'#E3F2FD', textColor:'#1565C0',
      border:'#90CAF9'
    };
    return {
      label: '⭐ مميز',
      desc: 'أكثر من 20,000 أوقية',
      color:'#FFF8E1', textColor:'#F57F17',
      border:'#FFD54F'
    };
  }

  // ===== شاشات وتلفزيونات =====
  if (cat.includes('شاشة') || cat.includes('تلفز') ||
      cat.includes('screen') || cat.includes('tv')) {
    if (price < 100000) return {
      label: '💚 اقتصادي',
      desc: 'أقل من 100,000 أوقية',
      color:'#E8F5E9', textColor:'#2E7D32',
      border:'#A5D6A7'
    };
    if (price < 300000) return {
      label: '🔵 متوسط',
      desc: '100,000 - 300,000 أوقية',
      color:'#E3F2FD', textColor:'#1565C0',
      border:'#90CAF9'
    };
    return {
      label: '⭐ بريميوم',
      desc: 'أكثر من 300,000 أوقية',
      color:'#FFF8E1', textColor:'#F57F17',
      border:'#FFD54F'
    };
  }

  // ===== أجهزة لوحية =====
  if (cat.includes('لوحي') || cat.includes('تابلت') ||
      cat.includes('tablet') || cat.includes('ipad')) {
    if (price < 120000) return {
      label: '💚 اقتصادي',
      desc: 'أقل من 120,000 أوقية',
      color:'#E8F5E9', textColor:'#2E7D32',
      border:'#A5D6A7'
    };
    if (price < 280000) return {
      label: '🔵 متوسط',
      desc: '120,000 - 280,000 أوقية',
      color:'#E3F2FD', textColor:'#1565C0',
      border:'#90CAF9'
    };
    return {
      label: '⭐ رائد',
      desc: 'أكثر من 280,000 أوقية',
      color:'#FFF8E1', textColor:'#F57F17',
      border:'#FFD54F'
    };
  }

  // ===== قطع غيار =====
  if (cat.includes('قطع') || cat.includes('غيار') ||
      cat.includes('spare') || cat.includes('parts')) {
    if (price < 10000) return {
      label: '💚 رخيص',
      desc: 'أقل من 10,000 أوقية',
      color:'#E8F5E9', textColor:'#2E7D32',
      border:'#A5D6A7'
    };
    if (price < 40000) return {
      label: '🔵 متوسط',
      desc: '10,000 - 40,000 أوقية',
      color:'#E3F2FD', textColor:'#1565C0',
      border:'#90CAF9'
    };
    return {
      label: '⭐ أصلي مميز',
      desc: 'أكثر من 40,000 أوقية',
      color:'#FFF8E1', textColor:'#F57F17',
      border:'#FFD54F'
    };
  }

  // ===== كاميرات =====
  if (cat.includes('كاميرا') || cat.includes('camera')) {
    if (price < 80000) return {
      label: '💚 مبتدئ',
      desc: 'أقل من 80,000 أوقية',
      color:'#E8F5E9', textColor:'#2E7D32',
      border:'#A5D6A7'
    };
    if (price < 250000) return {
      label: '🔵 متوسط',
      desc: '80,000 - 250,000 أوقية',
      color:'#E3F2FD', textColor:'#1565C0',
      border:'#90CAF9'
    };
    return {
      label: '⭐ احترافي',
      desc: 'أكثر من 250,000 أوقية',
      color:'#FFF8E1', textColor:'#F57F17',
      border:'#FFD54F'
    };
  }

  // ===== Default for anything else =====
  if (price < 30000) return {
    label: '💚 اقتصادي',
    desc: '',
    color:'#E8F5E9', textColor:'#2E7D32',
    border:'#A5D6A7'
  };
  if (price < 100000) return {
    label: '🔵 متوسط',
    desc: '',
    color:'#E3F2FD', textColor:'#1565C0',
    border:'#90CAF9'
  };
  return {
    label: '⭐ مميز',
    desc: '',
    color:'#FFF8E1', textColor:'#F57F17',
    border:'#FFD54F'
  };
}
