import { Product } from './types';

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'آيفون 15 بروك ماكس',
    brand: 'Apple',
    price: 55000,
    discount: 10,
    stock: 5,
    description: 'أقوى هاتف من أبل مع كاميرا احترافية وشاشة مذهلة.',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d256e?auto=format&fit=crop&w=400&q=80'],
    specifications: { ram: '8GB', storage: '256GB', battery: '4441mAh', camera: '48MP' },
    isFeatured: true, isBestSeller: true, soldCount: 150, viewCount: 1200, createdAt: new Date()
  },
  {
    id: 'demo-2',
    name: 'سامسونج S24 ألترا',
    brand: 'Samsung',
    price: 48000,
    discount: 5,
    stock: 8,
    description: 'هاتف سامسونج الرائد مع قلم S-Pen وذكاء اصطناعي متطور.',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80'],
    specifications: { ram: '12GB', storage: '512GB', battery: '5000mAh', camera: '200MP' },
    isFeatured: true, isNewArrival: true, soldCount: 85, viewCount: 950, createdAt: new Date()
  },
  {
    id: 'demo-3',
    name: 'شاومي 14 برو',
    brand: 'Xiaomi',
    price: 35000,
    discount: 15,
    stock: 12,
    description: 'أسرع شحن في العالم وكاميرا لايكا الأسطورية.',
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'],
    specifications: { ram: '16GB', storage: '512GB', battery: '4880mAh', camera: '50MP' },
    isNewArrival: true, soldCount: 40, viewCount: 600, createdAt: new Date()
  },
  {
    id: 'demo-4',
    name: 'بيكسل 8 برو',
    brand: 'Google',
    price: 32000,
    discount: 0,
    stock: 3,
    description: 'أفضل تجربة أندرويد خام مع ذكاء اصطناعي من جوجل.',
    images: ['https://images.unsplash.com/photo-1574757591407-f50a83c33305?auto=format&fit=crop&w=400&q=80'],
    specifications: { ram: '12GB', storage: '128GB', battery: '5050mAh', camera: '50MP' },
    isFeatured: true, soldCount: 25, viewCount: 450, createdAt: new Date()
  }
];
