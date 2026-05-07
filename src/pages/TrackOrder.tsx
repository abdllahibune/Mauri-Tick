import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, ensureAuth } from '../lib/firebase';
import { Order } from '../types';
import { Search, Loader2, Phone, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function TrackOrder() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    ensureAuth();
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'mt_orders'), 
        where('phone', '==', phoneNumber),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(results);
      setHasSearched(true);
    } catch (error) {
      console.error('Track error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { name: 'قيد الانتظار', icon: Clock },
    { name: 'تم التأكيد', icon: CheckCircle },
    { name: 'تم الشحن', icon: Truck },
    { name: 'تم التسليم', icon: Package },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col gap-16">
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-5xl font-black text-primary tracking-tighter">تتبع طلبك 📦</h1>
        <p className="text-gray-500 font-bold">أدخل رقم الهاتف الذي استخدمته في الطلب لمتابعة حالته.</p>
      </div>

      <form onSubmit={handleTrack} className="bg-white p-4 rounded-[32px] shadow-2xl border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Phone className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300" />
          <input 
            type="text" 
            placeholder="مثال: 36096100"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl py-6 pr-16 pl-6 text-xl font-black outline-none focus:ring-2 ring-primary/20"
            dir="ltr"
            required
          />
        </div>
        <button 
          disabled={loading}
          className="bg-primary text-white px-12 py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          تتبع الآن
        </button>
      </form>

      <div className="flex flex-col gap-8">
        <AnimatePresence mode="wait">
          {hasSearched && orders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-16 rounded-[40px] text-center flex flex-col items-center gap-6 shadow-sm border border-dashed"
            >
               <Package className="w-16 h-16 text-gray-200" />
               <h3 className="text-2xl font-black text-gray-400">عذراً، لم نجد أي طلبات مرتبطة بهذا الرقم</h3>
            </motion.div>
          ) : (
            orders.map((order, idx) => {
              const currentStepIdx = statusSteps.findIndex(s => s.name === order.status);
              
              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-[40px] shadow-lg border border-gray-100 overflow-hidden"
                >
                  <div className="bg-gray-50 p-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
                     <div className="flex items-center gap-6">
                        <div className="bg-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">#{idx + 1}</div>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-gray-400">رقم الطلب</span>
                           <span className="text-xl font-black text-primary" dir="ltr">#{order.orderNumber}</span>
                        </div>
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-400">الإجمالي</span>
                        <span className="text-xl font-black text-accent">{formatPrice(order.total)}</span>
                     </div>
                  </div>

                  <div className="p-8 md:p-12">
                     {/* Timeline */}
                     <div className="relative flex justify-between items-center w-full mb-12">
                        {/* Progress Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 z-0 -translate-y-1/2" />
                        <div 
                          className="absolute top-1/2 right-0 h-1 bg-primary z-0 -translate-y-1/2 transition-all duration-1000" 
                          style={{ width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%` }}
                        />
                        
                        {statusSteps.map((step, sIdx) => {
                          const Icon = step.icon;
                          const isCompleted = sIdx <= currentStepIdx;
                          const isCurrent = sIdx === currentStepIdx;
                          
                          return (
                            <div key={sIdx} className="relative z-10 flex flex-col items-center gap-3">
                               <div className={cn(
                                 "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                                 isCompleted ? "bg-primary text-white shadow-lg scale-110" : "bg-white text-gray-300 border-2 border-gray-100"
                               )}>
                                  <Icon className="w-6 h-6" />
                               </div>
                               <span className={cn(
                                 "text-[10px] sm:text-xs font-black whitespace-nowrap",
                                 isCompleted ? "text-primary" : "text-gray-300"
                               )}>
                                 {step.name}
                               </span>
                            </div>
                          );
                        })}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                        <div className="bg-gray-50 p-6 rounded-2xl flex flex-col gap-4">
                           <h4 className="font-black text-primary border-b border-gray-200 pb-2 flex items-center gap-2">
                             <Package className="w-4 h-4" /> تفاصيل المنتجات
                           </h4>
                           <ul className="flex flex-col gap-3">
                              {order.items.map((item, iIdx) => (
                                <li key={iIdx} className="flex justify-between items-center font-bold text-gray-500">
                                   <span>{item.name} × {item.quantity}</span>
                                   <span>{formatPrice(item.price * item.quantity)}</span>
                                </li>
                              ))}
                           </ul>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl flex flex-col gap-4">
                           <h4 className="font-black text-primary border-b border-gray-200 pb-2 flex items-center gap-2">
                             <Phone className="w-4 h-4" /> معلومات التوصيل
                           </h4>
                           <div className="flex flex-col gap-2 text-gray-500 font-bold">
                              <p>{order.customerName}</p>
                              <p>{order.city}, {order.address}</p>
                              <p dir="ltr">{order.phone}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
