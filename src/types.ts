export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  discount: number;
  stock: number;
  description: string;
  images: string[];
  specifications: {
    [key: string]: string | undefined;
  };
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  soldCount?: number;
  viewCount?: number;
  suggestedAccessories?: string[];
  bundleAccessoryIds?: string[];
  createdAt?: any;
}

export interface UsedProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  sellerPhone: string;
  condition: string;
  images: string[];
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export interface TradeIn {
  id: string;
  customerName: string;
  customerPhone: string;
  category: string;
  brand: string;
  oldPhoneModel: string;
  storage: string;
  condition: string;
  photos: string[];
  estimatedValue: number;
  targetPhoneId: string;
  status: 'pending' | 'contacted' | 'completed' | 'rejected';
  createdAt: any;
}

export interface Investor {
  id: string;
  name: string;
  phone: string;
  amount: string;
  message: string;
  createdAt: any;
}

export interface UserProfile {
  id: string;
  phone: string;
  password?: string; // Hashed/stored for custom auth
  name?: string;
  city?: string;
  address?: string;
  totalSpent: number;
  ordersCount: number;
  isVerified?: boolean;
  verificationCode?: string;
  isBlocked?: boolean;
  wishlist?: string[];
  createdAt: any;
}

export interface Order {
  id: string;
  userId?: string; // Link to user profile if logged in
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
  isBuyNow?: boolean; // To identify temporary buy now items
}

export interface Review {
  id: string;
  orderId?: string;
  productId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  isVerified: boolean;
  isHidden: boolean;
  createdAt: any;
}

export interface SupportRequest {
  id: string;
  phone: string;
  status: 'pending' | 'completed';
  createdAt: any;
}

export interface WheelPrize {
  text: string;
  type: 'percent' | 'fixed' | 'shipping' | 'gift';
  value: number;
  probability: number;
  color: string;
}

export interface StoreConfig {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroBackgroundColor?: string;
  themeColors?: {
    primary: string;
    accent: string;
    background: string;
    navbar: string;
    button: string;
  };
  investorPopup?: {
    title: string;
    description: string;
    minInvestment: string;
    isActive: boolean;
  };
  verificationMode?: 'whatsapp' | 'email' | 'manual';
  maintenanceMode: boolean;
  aboutUs: string;
  footerText: string;
  returnPolicy: string;
  copyrightText: string;
  workingHours: string;
  sellPageTitle?: string;
  sellPageDescription?: string;
  sellMinImages?: number;
  adminPassword?: string;
  wheelSettings?: {
    isActive: boolean;
    prizes: WheelPrize[];
    totalSpins: number;
    totalCodesUsed: number;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
    whatsapp: string;
    twitter: string;
    youtube: string;
    other: string;
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
  deviceId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  ordersCount: number;
  createdAt: any;
}

export interface Notification {
  id: string;
  targetUserIds: string[] | 'all';
  message: string;
  title: string;
  readBy: string[];
  createdAt: any;
  link?: string;
}
