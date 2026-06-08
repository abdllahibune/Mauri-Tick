import { Product, StoreConfig } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowLeft, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db, ensureAuth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { DEMO_PRODUCTS } from '../constants';

export function Home({ products }: { products: Product[] }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const navigate = useNavigate();

  useEffect(() => {
    ensureAuth();
    const unsubscribe = onSnapshot(doc(db, 'mt_settings', 'general'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
    return () => unsubscribe();
  }, []);

  const displayProducts = products.length > 0 ? products : DEMO_PRODUCTS;

  // Horizontal Scroll Categories
  const homeCategories = [
    { name: 'الكل', emoji: '🌐' },
    { name: 'إلكترونيات', emoji: '⚡' },
    { name: 'ملابس وأزياء', emoji: '👕' },
    { name: 'منزل ومطبخ', emoji: '🏠' },
    { name: 'جمال وعناية', emoji: '💄' },
    { name: 'رياضة', emoji: '⚽' },
    { name: 'أطفال', emoji: '👶' },
    { name: 'ألعاب', emoji: '🎮' },
    { name: 'طلب مخصص', emoji: '📝' },
  ];

  // Section 3: Today's Deals (discount > 0, limit to 8)
  const deals = displayProducts
    .filter(p => (p.discount && p.discount > 0))
    .filter(p => selectedCategory === 'الكل' || p.category === selectedCategory)
    .slice(0, 8);

  // Section 4: New Products (latest 12 sorted by createdAt desc)
  const newArrivals = [...displayProducts]
    .sort((a, b) => {
      const da = a.createdAt?.toDate?.() || new Date(0);
      const db = b.createdAt?.toDate?.() || new Date(0);
      return db.getTime() - da.getTime();
    })
    .filter(p => selectedCategory === 'الكل' || p.category === selectedCategory)
    .slice(0, 12);

  return (
    <div className="flex flex-col gap-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-6" style={{ direction: 'rtl' }}>
      
      {/* Section 1: Hero Banner */}
      <section className="relative h-[350px] w-full rounded-2xl border border-[#DBDBDB] overflow-hidden bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Right side card */}
          <div className="p-8 md:p-12 flex flex-col justify-center text-right bg-white relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-black mb-3" style={{ fontFamily: 'Cairo' }}>
              باندا 🐼
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-8 max-w-md leading-relaxed font-semibold" style={{ fontFamily: 'Cairo' }}>
              متجرك الموريتاني لاستيراد المنتجات من الصين وأمريكا بأفضل الأسعار
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3 bg-[#C9A84C] text-black font-black text-sm rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
                style={{ fontFamily: 'Cairo', cursor: 'pointer' }}
              >
                تصفح المنتجات
              </button>
              <button
                onClick={() => navigate('/custom-order')}
                className="px-6 py-3 border-2 border-[#0C3299] text-[#0C3299] font-black text-sm rounded-xl transition-all hover:bg-[#0C3299] hover:text-white active:scale-95"
                style={{ fontFamily: 'Cairo', cursor: 'pointer' }}
              >
                طلب مخصص
              </button>
            </div>
          </div>
          {/* Left side background image */}
          <div className="hidden md:block h-full relative">
            <img
              src={config?.mt_heroImage || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200'}
              alt="Panda Store Hero"
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Section 2: Category Circles */}
      <section className="w-full bg-white rounded-2xl border border-[#DBDBDB] p-6 shadow-sm overflow-hidden">
        <h3 className="text-lg font-black text-[#1A1A1A] mb-4 text-right" style={{ fontFamily: 'Cairo' }}>
          تصفح بالأقسام 🗂️
        </h3>
        <div className="flex gap-6 overflow-x-auto no-scrollbar py-2 select-none" style={{ scrollbarWidth: 'none' }}>
          {homeCategories.map((item) => {
            const isActive = selectedCategory === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (item.name === 'طلب مخصص') {
                    navigate('/custom-order');
                  } else {
                    setSelectedCategory(item.name);
                  }
                }}
                className="flex flex-col items-center gap-2 flex-shrink-0 group focus:outline-none"
                style={{ cursor: 'pointer' }}
              >
                <div
                  className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl transition-all"
                  style={{
                    borderColor: isActive ? '#0C3299' : '#DBDBDB',
                    background: isActive ? '#0C3299' : '#FFFFFF',
                    boxShadow: isActive ? '0 4px 12px rgba(12, 50, 153, 0.2)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.borderColor = '#0C3299';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.borderColor = '#DBDBDB';
                  }}
                >
                  {item.emoji}
                </div>
                <span
                  style={{
                    fontFamily: 'Cairo',
                    fontSize: 13,
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? '#0C3299' : '#1A1A1A'
                  }}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 3: Today's Deals */}
      <section className="w-full">
        <div className="flex flex-col gap-1 mb-6 text-right">
          <h2 className="text-2xl font-bold text-[#0C3299]" style={{ fontFamily: 'Cairo' }}>
            عروض اليوم ⚡
          </h2>
          <p className="text-xs font-semibold text-gray-500" style={{ fontFamily: 'Cairo' }}>
            خصومات حصرية لفترة محدودة
          </p>
        </div>

        {deals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {deals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-[#DBDBDB] flex flex-col items-center gap-4">
            <div className="bg-gray-50 p-6 rounded-full">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-[#1A1A1A] font-bold text-base" style={{ fontFamily: 'Cairo' }}>
              لا توجد عروض نشطة حالياً في هذا القسم
            </p>
          </div>
        )}
      </section>

      {/* Section 4: New Products */}
      <section className="w-full">
        <div className="flex flex-col gap-1 mb-6 text-right">
          <h2 className="text-2xl font-bold text-[#0C3299]" style={{ fontFamily: 'Cairo' }}>
            أحدث المنتجات ✨
          </h2>
          <p className="text-xs font-semibold text-gray-500" style={{ fontFamily: 'Cairo' }}>
            وصلت حديثاً إلى متجرنا
          </p>
        </div>

        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-[#DBDBDB] flex flex-col items-center gap-4">
            <div className="bg-gray-50 p-6 rounded-full">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-[#1A1A1A] font-bold text-base" style={{ fontFamily: 'Cairo' }}>
              لا توجد منتجات متوفرة حالياً في هذا القسم
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
