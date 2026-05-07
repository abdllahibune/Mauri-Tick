import React from 'react';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../lib/utils';
import { Trash2, ShoppingCart, ArrowRight, MinusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { language, isRTL } = useLanguage();

  if (compareList.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black text-primary mb-4">قائمة المقارنة فارغة</h1>
        <p className="text-gray-500 mb-8">أضف بعض المنتجات للمقارنة بين مواصفاتها</p>
        <Link to="/products" className="bg-primary text-white px-8 py-3 rounded-xl font-black inline-flex items-center gap-2">
          تصفح المنتجات <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-primary">مقارنة المنتجات</h1>
        <button 
          onClick={clearCompare}
          className="text-red-500 font-bold flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
        >
          <Trash2 className="w-5 h-5" /> مسح الكل
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-px bg-gray-200 border border-gray-200 rounded-3xl overflow-hidden">
        {/* Labels Column */}
        <div className="hidden md:flex flex-col bg-gray-50 font-black text-gray-500">
          <div className="h-80 border-b border-gray-200 p-6 flex items-end">المنتج</div>
          <div className="p-6 border-b border-gray-200">السعر</div>
          {specKeys.map(spec => (
            <div key={spec.key} className="p-6 border-b border-gray-200">{spec.label}</div>
          ))}
          <div className="p-6">الإجراءات</div>
        </div>

        {/* Product Columns */}
        {compareList.map((product) => (
          <div key={product.id} className="bg-white flex flex-col relative group">
            <button 
              onClick={() => removeFromCompare(product.id)}
              className="absolute top-4 right-4 text-red-500 hover:scale-110 transition-transform z-10"
            >
              <MinusCircle className="w-6 h-6" />
            </button>

            <div className="h-80 border-b border-gray-200 p-6 flex flex-col items-center justify-center gap-4">
              <img src={product.images[0]} alt={product.name} className="h-48 object-contain" />
              <div className="text-center">
                <p className="text-xs font-bold text-gray-400 uppercase">{product.brand}</p>
                <h3 className="text-xl font-black text-primary">{product.name}</h3>
              </div>
            </div>

            <div className={`p-6 border-b border-gray-200 font-black text-2xl ${
              compareList.length === 2 && product.price === Math.min(...compareList.map(p => p.price))
                ? 'text-green-600'
                : 'text-primary'
            }`}>
              <span className="md:hidden text-xs text-gray-400 block mb-1">السعر</span>
              {formatPrice(product.price)}
            </div>

            {specKeys.map(spec => (
              <div key={spec.key} className="p-6 border-b border-gray-200">
                <span className="md:hidden text-xs text-gray-400 block mb-1">{spec.label}</span>
                <p className="font-bold text-gray-700">
                  {product.specifications[spec.key as keyof typeof product.specifications] || '—'}
                </p>
              </div>
            ))}

            <div className="p-6 mt-auto">
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <ShoppingCart className="w-5 h-5" /> أضف للسلة
              </button>
            </div>
          </div>
        ))}

        {compareList.length < 2 && (
          <div className="bg-gray-50 flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 m-4 rounded-3xl">
            <p className="text-gray-400 font-bold mb-4">أضف منتجاً آخر للمقارنة</p>
            <Link to="/products" className="bg-primary/10 text-primary px-6 py-3 rounded-xl font-black">
              اختر هاتفاً
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
