import { useParams, Link } from 'react-router-dom';
import { Product } from '../types';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, limit, updateDoc, increment } from 'firebase/firestore';
import { db, safeWrite, ensureAuth } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { formatPrice, cn } from '../lib/utils';
import { LiveViewers } from '../components/LiveViewers';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, Share2, ShieldCheck, Truck, RefreshCcw, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import toast from 'react-hot-toast';

import { DEMO_PRODUCTS } from '../constants';

export function ProductDetail({ allProducts }: { allProducts: Product[] }) {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, toggleWishlist, wishlist } = useCart();

  useEffect(() => {
    ensureAuth();
    async function loadProduct() {
      if (!id) return;
      setLoading(true);

      // Check demo products first
      const demoProduct = DEMO_PRODUCTS.find(p => p.id === id);
      if (demoProduct) {
        setProduct(demoProduct);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(data);
          // Increment view count
          safeWrite(() => updateDoc(docRef, { viewCount: increment(1) }));
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col gap-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square bg-gray-100 rounded-[40px] animate-pulse" />
        <div className="flex flex-col gap-6">
          <div className="h-10 bg-gray-100 w-3/4 rounded-xl animate-pulse" />
          <div className="h-6 bg-gray-100 w-1/4 rounded-xl animate-pulse" />
          <div className="h-20 bg-gray-100 w-full rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-40 text-center flex flex-col items-center gap-6">
      <h2 className="text-3xl font-black text-primary">المنتج غير موجود</h2>
      <Link to="/products" className="bg-primary text-white px-8 py-3 rounded-xl font-bold">العودة للمتجر</Link>
    </div>
  );

  const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
  const isWishlisted = wishlist.includes(product.id);

  const related = allProducts
    .filter(p => p.id !== product.id && (p.brand === product.brand || p.isFeatured))
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-bold text-gray-400">
        <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
        <ChevronLeft className="w-3 h-3" />
        <Link to="/products" className="hover:text-primary transition-colors">المنتجات</Link>
        <ChevronLeft className="w-3 h-3" />
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Gallery */}
        <div className="flex flex-col gap-6">
           <div className="bg-white rounded-[40px] aspect-square p-12 shadow-sm border border-gray-100 relative overflow-hidden group">
              <motion.img 
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={product.images[selectedImage]} 
                alt={product.name} 
                className="w-full h-full object-contain"
              />
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={cn(
                  "absolute top-6 left-6 p-4 rounded-full shadow-lg transition-all",
                  isWishlisted ? "bg-red-50 text-red-500" : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500"
                )}
              >
                <Heart className={cn("w-6 h-6", isWishlisted && "fill-current")} />
              </button>
           </div>
           
           <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "w-24 h-24 rounded-2xl border-2 p-2 flex-shrink-0 transition-all",
                    selectedImage === idx ? "border-primary bg-white" : "border-transparent bg-gray-50"
                  )}
                >
                  <img src={img} className="w-full h-full object-contain" />
                </button>
              ))}
           </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-8">
           <div className="flex flex-col gap-4">
              <LiveViewers productId={product.id} />
              <div className="flex items-center gap-2">
                 <span className="bg-primary/5 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{product.brand}</span>
                 {product.isBestSeller && <span className="bg-accent text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">الأكثر مبيعاً</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4">
                 <div className="flex flex-col">
                    {product.discount > 0 && (
                      <span className="text-lg text-gray-400 line-through mb--1">{formatPrice(product.price)}</span>
                    )}
                    <span className="text-4xl font-black text-primary">{formatPrice(discountedPrice)}</span>
                 </div>
                 {product.discount > 0 && (
                   <span className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-black transform -rotate-3">وفر {formatPrice(product.price - discountedPrice)}</span>
                 )}
              </div>
           </div>

           <p className="text-gray-600 leading-relaxed font-medium">{product.description}</p>

           <div className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">حالة المخزون</span>
                <span className={cn("text-sm font-black", product.stock > 0 ? "text-green-600" : "text-red-600")}>
                  {product.stock > 0 ? `متوفر (${product.stock} قطعة)` : 'نفذ المخزون'}
                </span>
             </div>
             <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", product.stock > 5 ? "bg-green-500" : "bg-orange-500")}
                  style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%` }}
                />
             </div>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center bg-gray-100 rounded-2xl p-2 h-16 w-40">
                 <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 text-2xl font-black text-primary">-</button>
                 <span className="flex-1 text-center font-black text-xl">{quantity}</span>
                 <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="flex-1 text-2xl font-black text-primary">+</button>
              </div>
              <button 
                disabled={product.stock === 0}
                onClick={() => {
                  addToCart(product, quantity);
                  toast.success('تمت الإضافة للسلة بنجاح! 🛒');
                }}
                className="flex-[2] bg-primary text-white h-16 rounded-2xl font-black text-xl flex items-center justify-center gap-4 hover:brightness-110 shadow-xl disabled:opacity-50"
              >
                <ShoppingBag className="w-6 h-6" /> إضافة للسلة
              </button>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4">
                 <Truck className="w-8 h-8 text-accent" />
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-primary">توصيل سريع</span>
                    <span className="text-[10px] text-gray-500">من 2-24 ساعة فقط</span>
                 </div>
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4">
                 <ShieldCheck className="w-8 h-8 text-accent" />
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-primary">ضمان موري تيك</span>
                    <span className="text-[10px] text-gray-500">أصلي 100%</span>
                 </div>
              </div>
           </div>

           <button 
             onClick={() => {
               navigator.share?.({ title: product.name, url: window.location.href });
             }}
             className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors w-fit"
           >
             <Share2 className="w-4 h-4" /> شارك هذا المنتج
           </button>
        </div>
      </div>

      {/* Specifications */}
      <section className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100">
         <h3 className="text-3xl font-black text-primary mb-8 underline decoration-accent/30 underline-offset-8">المواصفات التقنية</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {Object.entries(product.specifications || {}).map(([key, value]) => (
              value && (
                <div key={key} className="flex justify-between items-center border-b border-gray-50 py-3">
                  <span className="text-gray-500 font-bold text-sm uppercase">{key === 'screen' ? 'الشاشة' : key === 'processor' ? 'المعالج' : key === 'ram' ? 'الرام' : key === 'storage' ? 'التخزين' : key === 'battery' ? 'البطارية' : key === 'camera' ? 'الكاميرا' : key === 'os' ? 'النظام' : 'الألوان'}</span>
                  <span className="text-primary font-black">{value}</span>
                </div>
              )
            ))}
         </div>
      </section>

      {/* Related Products */}
      <section className="flex flex-col gap-8">
         <h3 className="text-3xl font-black text-primary">قد يعجبك أيضاً</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
         </div>
      </section>
    </div>
  );
}
