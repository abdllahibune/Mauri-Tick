import { Product, StoreConfig } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { ShoppingBag, Truck, ShieldCheck, RefreshCcw, Headphones, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db, ensureAuth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

import { DEMO_PRODUCTS } from '../constants';

export function Home({ products }: { products: Product[] }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const checkAndGoToSell = () => {
    if (!user) {
      const confirmed = window.confirm(
        'هذه الخدمة للزبائن فقط 🔒\n\n' +
        'يجب أن تكون زبوناً لدينا وتملك إثبات شراء.\n\n' +
        'هل تريد تسجيل الدخول؟'
      );
      if (confirmed) {
        window.location.href = '/login?redirect=/used?tab=sell';
      }
      return;
    }
    navigate('/used?tab=sell');
  };

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

  const categories = Array.from(new Set(displayProducts.map(p => p.category).filter(Boolean)));

  const sections = [
    { title: 'الأكثر مبيعاً', data: bestSellers.length > 0 ? bestSellers : displayProducts.slice(0, 8) },
    { title: 'وصل حديثاً', data: newArrivals.length > 0 ? newArrivals : displayProducts.slice(8, 16) },
    { title: 'منتجات مختارة', data: featured.length > 0 ? featured : displayProducts.slice(16, 24) },
  ];

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Mobile Scrolling Categories (Facebook Stories Style) */}
      <div className="md:hidden categories-row">
        <button 
          onClick={() => navigate('/products')}
          className="category-chip active"
        >
          الكل
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => navigate(`/products?category=${cat}`)}
            className="category-chip"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hero Banner */}
      <section className="hero">
        <img 
          src={config?.mt_heroImage || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200'} 
          alt="Hero" 
          className="hero-bg-image" 
        />
        <div className="max-w-7xl mx-auto px-4 w-full hero-content">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hero-content-glass"
          >
            <span className="hero-badge">موريتانيا - نواكشوط</span>
            {config?.heroTitle ? (
               <h1 className="hero-title-ar">{config.heroTitle}</h1>
            ) : (
              <>
                <h1 className="hero-title-ar">موري تيك</h1>
                <h2 className="hero-title-en">Mauri Tick</h2>
              </>
            )}
            <p className="hero-desc">{config?.heroSubtitle || 'أفضل الهواتف بأفضل الأسعار. جودة نضمنها لك وتوصيل لباب منزلك.'}</p>
            <Link to="/products" className="hero-btn">
              تسوق الآن <ShoppingBag className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Main Categories & Services Banners */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Banner 1: Accessories */}
           <div 
             onClick={() => navigate('/products?category=إكسسوارات')}
             className="bg-gray-900 rounded-[32px] h-[200px] md:h-[280px] relative overflow-hidden flex items-end p-8 group cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl active:scale-95 md:active:scale-100"
            >
              <img 
                src="https://images.unsplash.com/photo-1605648916319-cf082f7524a1?auto=format&fit=crop&w=800&q=80" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="relative z-10 flex flex-col gap-2 text-white">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] w-fit font-black mb-2 uppercase">متوفرة الآن</span>
                <h3 className="text-2xl md:text-3xl font-black italic">إكسسوارات الهواتف</h3>
                <p className="text-gray-300 font-bold text-xs">سماعات، شواحن، وحماية للشاشة.</p>
                <span className="mt-2 text-white font-black text-sm flex items-center gap-2 group-hover:gap-4 transition-all">تصفح الكل <ArrowLeft className="w-4 h-4" /></span>
              </div>
           </div>

           {/* Banner 2: Used Phones */}
           <div 
             onClick={() => navigate('/products?isUsed=true')}
             className="bg-accent rounded-[32px] h-[200px] md:h-[280px] relative overflow-hidden flex items-end p-8 group cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl active:scale-95 md:active:scale-100"
            >
              <img 
                src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="relative z-10 flex flex-col gap-2 text-primary">
                <span className="bg-primary/10 px-3 py-1 rounded-full text-[10px] w-fit font-black mb-2 uppercase">أجهزة مضمونة</span>
                <h3 className="text-2xl md:text-3xl font-black italic">هواتف مستعملة</h3>
                <p className="text-primary/70 font-bold text-xs">نظيفة، مضمونة وبأفضل سعر.</p>
                <span className="mt-2 text-primary font-black text-sm flex items-center gap-2 group-hover:gap-4 transition-all">شاهد العروض <ArrowLeft className="w-4 h-4" /></span>
              </div>
           </div>

           {/* Banner 3: Trade-in & Sell */}
           <div 
             onClick={() => navigate('/tradein')}
             className="bg-gradient-to-br from-[#1A237E] to-[#0D47A1] rounded-[32px] h-[200px] md:h-[280px] relative overflow-hidden flex items-end p-8 group cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl active:scale-95 md:active:scale-100"
            >
              <div className="absolute top-6 right-6 text-7xl opacity-20 group-hover:rotate-12 transition-transform">🔄</div>
              <div className="relative z-10 flex flex-col gap-2 text-white">
                <h3 className="text-2xl md:text-3xl font-black italic">تبديل وبيع</h3>
                <p className="text-white/80 font-bold text-xs mb-4">بدّل جهازك أو بعه باحترافية وسهولة.</p>
                <span className="bg-accent text-primary px-5 py-2 rounded-xl font-black text-sm w-fit mt-2 group-hover:scale-105 transition-transform">اكتشف الخدمة</span>
              </div>
           </div>
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
