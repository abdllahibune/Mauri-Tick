export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  discount: number;
  stock: number;
  description: string;
  images: string[];
  specifications: {
    screen?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    battery?: string;
    camera?: string;
    os?: string;
    colors?: string;
  };
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  soldCount?: number;
  viewCount?: number;
  accessories?: string[];
  createdAt?: any;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentProofUrl: string;
  status: 'قيد الانتظار' | 'تم التأكيد' | 'تم الشحن' | 'تم التسليم';
  createdAt: any;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface StoreConfig {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  maintenanceMode: boolean;
  aboutUs: string;
  footerText: string;
  adminPassword?: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  expiresAt: any;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}
