import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, TrendingUp, Timer, MessageCircle, Smartphone, ArrowLeftRight } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { formatPrice, cn, contactWhatsApp, getProductTier, proxyImage } from '../lib/utils';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

const ImageWithPlaceholder: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      {(!isLoaded || !isInView) && !error && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <Smartphone className="w-10 h-10 text-gray-200" />
        </div>
      )}
      {isInView && (
        <img
          src={proxyImage(src)}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={(e: any) => {
            setError(true);
            e.target.onerror = null;
            e.target.style.opacity = '0.3';
          }}
          className={cn(
            className,
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
};

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

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeFromCompare(product.id);
      toast.success('تمت الإزالة من المقارنة');
    } else {
      addToCompare(product);
    }
  };

  const { price: displayPrice, hasVariants } = (() => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price).filter(p => p > 0);
      if (prices.length > 0) {
        return { price: Math.min(...prices), hasVariants: true };
      }
    }
    const finalPrice = product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : (product.usedPrice || product.price);
    return { price: finalPrice, hasVariants: false };
  })();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 product-card"
    >
      {/* Mobile Card Header (Social App Style) */}
      <div className="md:hidden flex items-center p-2.5 gap-2 product-card-header">
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-primary font-black text-sm border border-indigo-100 flex-shrink-0">
          {product.brand.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-black text-gray-900 leading-tight truncate">{product.brand}</span>
          <span className="text-[9px] font-bold text-indigo-500/80">مميز • {timeLeft}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-3 right-3 z-10 hidden md:flex flex-col gap-2">
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
        {product.isUsed && (
          <div className="flex flex-col gap-1 items-end">
            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
              مستعمل
            </span>
            {product.condition && (
              <span className={cn(
                "text-[9px] font-bold px-2 py-1 rounded-full shadow-sm border",
                product.condition === 'ممتاز' ? "bg-green-50 text-green-600 border-green-200" :
                product.condition === 'جيد' ? "bg-blue-50 text-blue-600 border-blue-200" :
                "bg-orange-50 text-orange-600 border-orange-200"
              )}>
                {product.condition}
              </span>
            )}
          </div>
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

      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <button 
          onClick={() => toggleWishlist(product.id)}
          className={cn(
            "p-2 rounded-full shadow-md transition-all wishlist-trigger",
            isWishlisted ? "bg-red-50 text-red-500" : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500"
          )}
          title={isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
        </button>

        <button 
          onClick={handleCompare}
          className={cn(
            "p-2 rounded-full shadow-md transition-all compare-trigger",
            isCompared ? "bg-blue-50 text-blue-500 ring-2 ring-blue-500/20" : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-blue-500"
          )}
          title={isCompared ? "إزالة من المقارنة" : "إضافة للمقارنة"}
        >
          <ArrowLeftRight className={cn("w-5 h-5", isCompared && "fill-current")} />
        </button>
      </div>

      {/* Image Overlay on Hover */}
      <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        <ImageWithPlaceholder 
          src={product.images[0] || 'https://via.placeholder.com/400x400/f5f5f5/1A237E?text=📱'} 
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-4 sm:p-6 product-image"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-white/90 text-red-600 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-tighter shadow-lg">انتهى 🔥</span>
          </div>
        )}
        
        {/* Quick Add Overlay - Desktop Only */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/30 to-transparent hidden md:block add-to-cart-overlay">
          <button 
            disabled={product.stock === 0}
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-full bg-white text-primary font-black py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-accent transition-all shadow-xl disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" /> إضافة للسلة
          </button>
        </div>
        
        {/* Mobile Price Badge Overlay */}
        <div className="md:hidden absolute bottom-2 right-2 z-10">
           <div className="bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded-lg font-black text-[10px] shadow-sm flex items-center gap-1.5 flex-wrap justify-end" dir="rtl">
              <span>{formatPrice(displayPrice)}</span>
              {product.priceUSD && <span className="text-[9px] text-gray-300 font-bold" dir="ltr">(${product.priceUSD})</span>}
           </div>
        </div>
      </div>

      {/* Info */}
      <Link to={`/product/${product.id}`} className="p-3 sm:p-5 flex flex-col flex-1">
        <div className="mb-2">
          {product.tier && (() => {
            const tier = getProductTier(product);
            return (
              <span 
                className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-black font-cairo shadow-sm"
                style={{ 
                  background: tier.color, 
                  color: tier.textColor, 
                  border: `1px solid ${tier.border}`,
                }}
              >
                {tier.label}
              </span>
            );
          })()}
          <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-xs sm:text-base leading-snug min-h-[2.5rem] name">{product.name}</h3>
        </div>

        {/* Action Buttons Row (Always Visible Icon Style) */}
        <div className="mt-auto flex items-center justify-between pt-3 gap-2">
           <div className="flex flex-col">
             {hasVariants && (
                <span className="text-[9px] text-gray-400 font-bold leading-none mb-0.5">من</span>
             )}
             <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
               <span className="text-sm sm:text-lg font-black text-primary leading-none price">{formatPrice(displayPrice)}</span>
               {product.priceUSD && (
                 <span className="text-[10px] text-gray-400 font-bold" dir="ltr">(${product.priceUSD})</span>
               )}
             </div>
             {product.originalPriceUSD && (
               <div className="flex items-center gap-1 mt-1" dir="rtl">
                 <span className="line-through text-gray-300 text-[10px] font-bold">
                   {formatPrice(Math.round(product.originalPriceUSD * (product.usdToMru || 37) * (product.profitMargin || 1.3)))}
                 </span>
                 {product.discount > 0 && (
                   <span className="bg-red-500 text-white text-[8px] font-bold px-1 rounded">
                     -{product.discount}%
                   </span>
                 )}
               </div>
             )}
           </div>

           <div className="flex gap-1">
              <button 
                onClick={handleCompare}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0",
                  isCompared ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                )}
                title={isCompared ? "إزالة من المقارنة" : "إضافة للمقارنة"}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                className="w-8 h-8 rounded-full bg-indigo-50 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm flex-shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); contactWhatsApp(product); }}
                className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all shadow-sm flex-shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Social Proof Line */}
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 sales-count">
          <span className="flex items-center gap-1">🔥 {product.soldCount || 0} مبيعة</span>
          <div className="flex items-center gap-1 text-blue-500">
            <Eye className="w-3 h-3" /> {viewers}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
