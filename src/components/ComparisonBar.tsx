import React from 'react';
import { useCompare } from '../context/CompareContext';
import { useLanguage } from '../context/LanguageContext';
import { X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function ComparisonBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { isRTL } = useLanguage();

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-primary/10 shadow-2xl rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {compareList.map((product) => (
              <div key={product.id} className="flex items-center gap-4 bg-gray-50 pr-4 pl-2 py-2 rounded-2xl border border-gray-100 flex-shrink-0 group">
                <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-contain" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.brand}</span>
                  <span className="text-sm font-black text-primary">{product.name}</span>
                </div>
                <button 
                  onClick={() => removeFromCompare(product.id)}
                  className="p-1 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {compareList.length === 1 && (
              <div className="flex items-center gap-4 bg-gray-50/50 px-6 py-4 rounded-2xl border border-dashed border-gray-200 flex-shrink-0">
                <span className="text-xs font-bold text-gray-400">أضف منتجاً آخر للمقارنة</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={clearCompare}
              className="text-gray-400 hover:text-red-500 font-bold text-sm px-4"
            >
              إلغاء الكل
            </button>
            <Link 
              to="/compare"
              className="flex-grow md:flex-grow-0 bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              قارن الآن ( {compareList.length} / 2 )
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
