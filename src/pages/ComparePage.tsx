import React from 'react';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../lib/utils';
import { Trash2, ShoppingCart, ArrowRight, MinusCircle, Share2, Star, Smartphone, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { language, isRTL } = useLanguage();

  const handleShare = () => {
    const ids = compareList.map(p => p.id).join(',');
    const url = `${window.location.origin}/compare?ids=${ids}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ رابط المقارنة! يمكنك مشاركته الآن.');
  };

  if (compareList.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Share2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-primary mb-4">قائمة المقارنة فارغة</h1>
        <p className="text-gray-500 font-bold mb-8">أضف بعض المنتجات للمقارنة بين مواصفاتها واتخاذ القرار الأفضل</p>
        <Link to="/products" className="bg-primary text-white px-12 py-5 rounded-[32px] font-black inline-flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-primary/20">
          تصفح المنتجات <ArrowRight className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
      </div>
    );
  }

  const specKeys = [
    { key: 'screen', label: 'الشاشة' },
    { key: 'processor', label: 'المعالج' },
    { key: 'ram', label: 'الرام' },
    { key: 'storage', label: 'التخزين' },
    { key: 'battery', label: 'البطارية' },
    { key: 'camera', label: 'الكاميرا' },
    { key: 'os', label: 'النظام' },
    { key: 'colors', label: 'الألوان' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-black text-primary mb-2">مقارنة المنتجات</h1>
          <p className="text-gray-400 font-bold">قارن بين التقنيات والمواصفات لاختيار ما يناسبك</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleShare}
            className="bg-white text-primary border-2 border-primary/10 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-5 h-5" /> مشاركة
          </button>
          <button 
            onClick={clearCompare}
            className="bg-red-50 text-red-500 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" /> مسح الكل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr_1fr] gap-px bg-gray-100 border-x border-gray-100 rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5">
        {/* Labels Column */}
        <div className="hidden md:flex flex-col bg-gray-50/50 backdrop-blur-sm font-black text-gray-400">
          <div className="h-[450px] border-b border-white p-10 flex items-end text-sm uppercase tracking-widest">المنتج الأساسي</div>
          <div className="p-8 border-b border-white text-sm uppercase tracking-widest">السعر الحالي</div>
          <div className="p-8 border-b border-white text-sm uppercase tracking-widest">التقييم</div>
          {specKeys.map(spec => (
            <div key={spec.key} className="p-8 border-b border-white text-sm uppercase tracking-widest">{spec.label}</div>
          ))}
          <div className="p-10 text-sm uppercase tracking-widest">الإجراءات والطلب</div>
        </div>

        {/* Product Columns */}
        {compareList.map((product) => {
          const isCheaper = compareList.length === 2 && product.price === Math.min(...compareList.map(p => p.price));
          
          return (
            <div key={product.id} className="bg-white flex flex-col relative group border-r border-gray-100">
              <button 
                onClick={() => removeFromCompare(product.id)}
                className="absolute top-6 right-6 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all z-20"
              >
                <MinusCircle className="w-6 h-6" />
              </button>

              <div className="h-[450px] border-b border-gray-100 p-10 flex flex-col items-center justify-center gap-8">
                <div className="relative group/img">
                  <div className="absolute inset-0 bg-primary/5 rounded-full scale-150 blur-3xl opacity-0 group-hover/img:opacity-100 transition-opacity" />
                  <img src={product.images[0]} alt={product.name} className="h-64 object-contain relative z-10 transition-transform group-hover/img:scale-110 duration-500" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-accent uppercase tracking-widest mb-1">{product.brand}</p>
                  <h3 className="text-3xl font-black text-primary leading-tight">{product.name}</h3>
                </div>
              </div>

              <div className={`p-8 border-b border-gray-100 font-black text-3xl flex items-center justify-between ${
                isCheaper ? 'bg-green-50/50 text-green-600' : 'text-primary'
              }`}>
                <div className="flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 block mb-1">السعر</span>
                  {formatPrice(product.price)}
                </div>
                {isCheaper && <span className="bg-green-600 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full">الأقل سعراً</span>}
              </div>

              <div className="p-8 border-b border-gray-100 flex items-center gap-1">
                 <span className="md:hidden text-xs text-gray-400 block ml-4">التقييم:</span>
                 {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                 <span className="text-xs font-bold text-gray-400 mr-2">(12 (تقييم</span>
              </div>

              {specKeys.map(spec => (
                <div key={spec.key} className="p-8 border-b border-gray-100 group-hover:bg-gray-50/30 transition-colors">
                  <span className="md:hidden text-xs text-gray-400 block mb-2 font-black">{spec.label}</span>
                  <p className="font-bold text-gray-700 text-lg">
                    {product.specifications[spec.key as keyof typeof product.specifications] || '—'}
                  </p>
                </div>
              ))}

              <div className="p-10 mt-auto bg-gray-50/50">
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-primary text-white py-6 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  <ShoppingCart className="w-6 h-6" /> أضف للسلة
                </button>
              </div>
            </div>
          );
        })}

        {compareList.length < 2 && (
          <div className="bg-gray-50/50 flex flex-col items-center justify-center p-20 text-center">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-6 text-gray-300">
               <Smartphone className="w-10 h-10" />
            </div>
            <p className="text-gray-400 font-bold mb-6 text-lg">لم تقارن بجهاز آخر بعد</p>
            <Link to="/products" className="bg-white text-primary border-2 border-primary/10 px-10 py-4 rounded-2xl font-black hover:bg-primary hover:text-white hover:border-primary transition-all">
              اختر هاتفاً آخر
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

