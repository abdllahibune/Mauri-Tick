import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ShoppingCart, Zap } from 'lucide-react';

export function LiveNotifications() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentNotification, setCurrentNotification] = useState<{
    type: 1 | 2 | 3;
    productName: string;
    count?: number;
  } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    const showNotification = () => {
      const type = (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;
      const product = products[Math.floor(Math.random() * products.length)];
      
      setCurrentNotification({
        type,
        productName: product.name,
        count: Math.floor(Math.random() * 5) + 2
      });

      setTimeout(() => {
        setCurrentNotification(null);
      }, 5000);
    };

    const interval = setInterval(() => {
      showNotification();
    }, (Math.floor(Math.random() * 45) + 25) * 1000);

    // Initial show
    const timer = setTimeout(showNotification, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [products]);

  return (
    <div className="fixed bottom-24 left-4 z-50 pointer-events-none">
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="bg-white p-4 rounded-xl shadow-2xl flex items-center gap-3 border-r-4 border-primary max-w-sm"
          >
            <div className="bg-primary/10 p-2 rounded-full">
              {currentNotification.type === 1 && <CheckCircle className="w-5 h-5 text-primary" />}
              {currentNotification.type === 2 && <ShoppingCart className="w-5 h-5 text-primary" />}
              {currentNotification.type === 3 && <Zap className="w-5 h-5 text-accent" />}
            </div>
            <div>
              <p className="text-sm font-medium">
                {currentNotification.type === 1 && `✅ تم شراء 1 من [${currentNotification.productName}] للتو`}
                {currentNotification.type === 2 && `🛒 طلب جديد على [${currentNotification.productName}]`}
                {currentNotification.type === 3 && `⚡ تبقى ${currentNotification.count} قطعة فقط من [${currentNotification.productName}]`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
