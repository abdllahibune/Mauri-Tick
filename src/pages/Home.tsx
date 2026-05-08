import { Product, StoreConfig } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { ShoppingBag, Truck, ShieldCheck, RefreshCcw, Headphones, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db, ensureAuth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { DEMO_PRODUCTS } from '../constants';

export function Home({ products }: { products: Product[] }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    ensureAuth();
    const unsubscribe = onSnapshot(doc(db, 'mt_settings', 'general'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
    return () => unsubscribe();
  }, []);

  const displayProducts = products.length > 0 ? products : DEMO_PRODUCTS;

  // Improved filtering with fallbacks
  const featured = displayProducts.filter(p => p.isFeatured).slice(0, 8);
  const bestSellers = [...displayProducts].sort((a,b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 8);
  const newArrivals = [...displayProducts].sort((a,b) => {
    const da = a.createdAt?.toDate?.() || new Date(0);
    const db = b.createdAt?.toDate?.() || new Date(0);
    return db.getTime() - da.getTime();
  }).slice(0, 8);

  const [timeLeft, setTimeLeft] = useState(3600 * 24); // 24 hours

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m}:${s}`;
  };

  const trustBadges = [
    { icon: ShieldCheck, text: 'دفع آمن' },
    { icon: Truck, text: 'توصيل سريع' },
    { icon: RefreshCcw, text: 'ضمان الاسترجاع' },
    { icon: Headphones, text: 'دعم 24/7' },
  ];

  const sections = [
    { title: 'الأكثر مبيعاً', data: bestSellers.length > 0 ? bestSellers : displayProducts.slice(0, 8) },
    { title: 'وصل حديثاً', data: newArrivals.length > 0 ? newArrivals : displayProducts.slice(8, 16) },
    { title: 'منتجات مختارة', data: featured.length > 0 ? featured : displayProducts.slice(16, 24) },
  ];

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Banner */}
      <section 
        className="relative flex items-center transition-colors duration-1000 hero"
        style={{ 
          backgroundColor: config?.heroBackgroundColor || 'var(--primary)', 
          backgroundImage: `url(${config?.mt_heroImage || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200'})`, 
        }}
      >
        <div className="hero-bg" />
        <img 
          src={config?.mt_heroImage || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200'} 
          alt="Hero" 
          className="hero-image" 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-start gap-12 hero-content">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6 text-white max-w-2xl"
          >
            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-4 py-2 rounded-full w-fit tracking-widest uppercase">موريتانيا - نواكشوط</span>
            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none">
              {config?.heroTitle || (
                <>موري تيك <br /><span className="text-accent underline decoration-8 decoration-accent/30 underline-offset-8">Mauri Tick</span></>
              )}
            </h1>
            <p className="text-xl text-gray-300 font-medium">{config?.heroSubtitle || 'أفضل الهواتف بأفضل الأسعار. جودة نضمنها لك وتوصيل لباب منزلك.'}</p>
            <div className="flex gap-4 mt-4">
              <Link to="/products" className="bg-accent text-primary px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform flex items-center gap-3 btn">
                تسوق الآن <ShoppingBag />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustBadges.map((badge, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl flex flex-col items-center gap-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-gray-50 p-4 rounded-2xl text-primary">
                <badge.icon className="w-8 h-8" />
              </div>
              <span className="font-black text-primary">{badge.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sale */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="bg-accent/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden border-2 border-accent/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col gap-4">
              <h2 className="text-4xl font-black text-primary">عروض الفلاش ⚡</h2>
              <p className="text-primary/70 font-bold">خصومات تصل إلى 40% على مختاراتنا.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-primary opacity-50 uppercase tracking-widest">ينتهي العرض خلال</span>
              <div className="flex gap-4">
                {formatTime(timeLeft).split(':').map((unit, idx) => (
                  <div key={idx} className="bg-primary text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-xl">
                    {unit}
                  </div>
                ))}
              </div>
            </div>
            <Link to="/products?filter=sale" className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:gap-4 transition-all btn">
              شاهد العروض <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Sections */}
      {sections.map((section, idx) => (
        <section key={idx} className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex justify-between items-end mb-8">
            <div className="flex flex-col gap-1">
              <span className="text-accent font-black text-xs uppercase tracking-widest">تصفح الفئات</span>
              <h2 className="text-4xl font-black text-primary section-title">{section.title}</h2>
            </div>
            <Link to="/products" className="text-sm font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
              عرض الكل <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {section.data.length > 0 ? (
              section.data.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px]">
                <p className="text-gray-400 font-bold">لا توجد منتجات متوفرة حالياً</p>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Category Banner */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-gray-900 rounded-[40px] h-[300px] relative overflow-hidden flex items-center p-12 group cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1605648916319-cf082f7524a1?auto=format&fit=crop&w=800&q=80" 
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="relative z-10 flex flex-col gap-4 text-white">
                <h3 className="text-4xl font-black">إكسسوارات الهواتف</h3>
                <p className="text-gray-300 font-medium">سماعات، شواحن، وحماية للشاشة.</p>
                <button className="bg-white text-black font-bold px-6 py-3 rounded-xl w-fit">اكتشف الآن</button>
              </div>
           </div>
           <div className="bg-accent rounded-[40px] h-[300px] relative overflow-hidden flex items-center p-12 group cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80" 
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="relative z-10 flex flex-col gap-4 text-primary">
                <h3 className="text-4xl font-black">هواتف مستعملة</h3>
                <p className="text-primary/70 font-medium">نظيفة، مضمونة وبأفضل سعر.</p>
                <button className="bg-primary text-white font-bold px-6 py-3 rounded-xl w-fit">تسوق الكسر</button>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
