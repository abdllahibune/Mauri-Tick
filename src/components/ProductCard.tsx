import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, TrendingUp, LayoutGrid, Timer } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { formatPrice, cn } from '../lib/utils';
import { motion } from 'motion/react';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const isWishlisted = wishlist.includes(product.id);
  const isCompared = isInCompare(product.id);
  const [timeLeft, setTimeLeft] = useState('');
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 12) + 3);

  useEffect(() => {
    // Countdown Timer (Resets every 24h)
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    const viewerInterval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(3, Math.min(15, prev + change));
      });
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(viewerInterval);
    };
  }, []);

  const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 product-card"
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {product.discount > 0 && (
          <div className="flex flex-col gap-1 items-end">
             <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                خصم {product.discount}%
             </span>
             <span className={cn(
               "text-[9px] font-black px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm border shadow-sm flex items-center gap-1",
               timeLeft.startsWith('00') ? "text-red-500 border-red-200" : "text-primary border-gray-100"
             )}>
                <Timer className="w-2 h-2" /> {timeLeft}
             </span>
          </div>
        )}
        {product.isBestSeller && (
          <span className="bg-accent text-primary text-[10px] font-black px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> الأكثر مبيعاً
          </span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse text-white",
            product.stock <= 2 ? "bg-red-500" : "bg-orange-500"
          )}>
            {product.stock <= 2 ? `🏃 آخر ${product.stock} قطع!` : `⚠️ فقط ${product.stock} قطع`}
          </span>
        )}
      </div>

      <button 
        onClick={() => toggleWishlist(product.id)}
        className={cn(
          "absolute top-3 left-3 z-10 p-2 rounded-full shadow-md transition-all wishlist-trigger",
          isWishlisted ? "bg-red-50 text-red-500" : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500"
        )}
      >
        <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
      </button>

      <button 
        onClick={(e) => {
          e.preventDefault();
          isCompared ? removeFromCompare(product.id) : addToCompare(product);
        }}
        className={cn(
          "absolute top-3 left-14 z-10 p-2 rounded-full shadow-md transition-all compare-trigger",
          isCompared ? "bg-blue-50 text-blue-500 ring-2 ring-blue-500/20" : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-blue-500"
        )}
        title="أضف للمقارنة"
      >
        <LayoutGrid className={cn("w-5 h-5", isCompared && "fill-current")} />
      </button>

      {/* Image Overlay on Hover */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        <img 
          src={product.images[0] || 'https://via.placeholder.com/400x400/f5f5f5/1A237E?text=📱'} 
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 p-6 product-image"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300/f5f5f5/1A237E?text=📱';
          }}
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white text-black px-4 py-2 rounded-lg font-black text-sm rotate-[-10deg]">نفذ المخزون</span>
          </div>
        )}
        
        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/20 to-transparent add-to-cart-overlay">
          <button 
            disabled={product.stock === 0}
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 add-to-cart-btn"
          >
            <ShoppingBag className="w-5 h-5" /> <span className="hidden sm:inline">إضافة للسلة</span><span className="sm:hidden">🛒</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <Link to={`/product/${product.id}`} className="p-4 block">
        <div className="mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.brand}</span>
          <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 name">{product.name}</h3>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            {product.discount > 0 && (
              <span className="text-xs text-gray-400 line-through mb--1">{formatPrice(product.price)}</span>
            )}
            <span className="text-lg font-black text-primary leading-none price">{formatPrice(discountedPrice)}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold bg-gray-50 px-2 py-1 rounded-md viewers">
            <Eye className="w-3 h-3 text-blue-500" /> {viewers} يشاهدون الآن
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400 sales-count">
          <span className="flex items-center gap-1">🔥 تم بيع {product.soldCount || 0} جهاز</span>
          {product.isNewArrival && <span className="text-blue-500">وصل حديثاً ✨</span>}
        </div>
      </Link>
    </motion.div>
  );
}
