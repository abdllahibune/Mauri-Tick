import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function LiveViewers({ productId }: { productId: string }) {
  const [count, setCount] = useState(() => Math.floor(Math.random() * (18 - 4 + 1)) + 4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        if (next < 2) return 2;
        if (next > 25) return 25;
        return next;
      });
    }, (Math.floor(Math.random() * (20 - 8 + 1)) + 8) * 1000);

    return () => clearInterval(interval);
  }, [productId]);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
      <Eye className="w-4 h-4 text-primary" />
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -5, opacity: 0 }}
          className="font-bold"
        >
          {count}
        </motion.span>
      </AnimatePresence>
      <span>شخص يشاهد الآن</span>
    </div>
  );
}
