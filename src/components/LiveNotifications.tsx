import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ShoppingCart, Zap, Eye } from 'lucide-react';

export function LiveNotifications() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentNotification, setCurrentNotification] = useState<{
    type: 'sold' | 'order' | 'stock' | 'viewing';
    productName: string;
    count?: number;
    location?: string;
  } | null>(null);

  useEffect(() => {
    const pq = query(collection(db, 'mt_products'), limit(20));
    const unsubProducts = onSnapshot(pq, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const oq = query(collection(db, 'mt_orders'), orderBy('createdAt', 'desc'), limit(10));
    const unsubOrders = onSnapshot(oq, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    const locations = ['نواكشوط', 'نواذيبو', 'روصو', 'أطار', 'تفرغ زينة', 'عرفات', 'لكصر', 'تيارت'];

    const showNotification = () => {
      const types: ('sold' | 'order' | 'stock' | 'viewing')[] = ['sold', 'order', 'stock', 'viewing'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let productName = '';
      let count = 0;
      let location = locations[Math.floor(Math.random() * locations.length)];

      if (type === 'sold' || type === 'order') {
        if (orders.length > 0 && Math.random() > 0.3) {
          const order = orders[Math.floor(Math.random() * orders.length)];
          productName = order.items[0]?.name || products[0].name;
          location = order.city || location;
        } else {
          productName = products[Math.floor(Math.random() * products.length)].name;
        }
      } else if (type === 'stock') {
        const lowStockProducts = products.filter(p => p.stock > 0);
        const p = lowStockProducts[Math.floor(Math.random() * lowStockProducts.length)] || products[0];
        productName = p.name;
        count = Math.floor(Math.random() * 3) + 1;
      } else {
        productName = products[Math.floor(Math.random() * products.length)].name;
        count = Math.floor(Math.random() * 15) + 3;
      }

      setCurrentNotification({ type, productName, count, location });

      setTimeout(() => {
        setCurrentNotification(null);
      }, 6000);
    };

    const interval = setInterval(() => {
      showNotification();
    }, (Math.floor(Math.random() * 30) + 20) * 1000);

    const timer = setTimeout(showNotification, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [products, orders]);

  return (
    <div className="fixed bottom-24 left-4 z-50 pointer-events-none" dir="rtl">
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ x: -100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -100, opacity: 0, scale: 0.8 }}
            className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 border border-gray-100 max-w-[320px] pointer-events-auto"
          >
            <div className={`p-3 rounded-2xl shrink-0 ${
              currentNotification.type === 'sold' ? 'bg-green-100 text-green-600' :
              currentNotification.type === 'order' ? 'bg-blue-100 text-blue-600' :
              currentNotification.type === 'stock' ? 'bg-red-100 text-red-600' :
              'bg-orange-100 text-orange-600'
            }`}>
              {currentNotification.type === 'sold' && <CheckCircle className="w-5 h-5" />}
              {currentNotification.type === 'order' && <ShoppingCart className="w-5 h-5" />}
              {currentNotification.type === 'stock' && <Zap className="w-5 h-5" />}
              {currentNotification.type === 'viewing' && <Eye className="w-5 h-5" />}
            </div>
            
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-black text-gray-800 leading-tight">
                {currentNotification.type === 'sold' && `تم شراء [${currentNotification.productName}]`}
                {currentNotification.type === 'order' && `طلب جديد على [${currentNotification.productName}]`}
                {currentNotification.type === 'stock' && `تبقت ${currentNotification.count} قطع فقط من [${currentNotification.productName}]`}
                {currentNotification.type === 'viewing' && `${currentNotification.count} أشخاص يشاهدون [${currentNotification.productName}] الآن`}
              </p>
              <p className="text-[10px] font-bold text-gray-400">
                {currentNotification.type === 'sold' || currentNotification.type === 'order' 
                  ? `منذ قليل في ${currentNotification.location}` 
                  : 'مطلوب جداً الآن 🔥'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
