import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Order } from '../types';
import { formatPrice, proxyImage } from '../lib/utils';
import { ShoppingCart, Package, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadOrders = async () => {
    try {
      const q = query(
        collection(db, 'mt_orders'),
        where('userId', '==', user?.id),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (e) {
      console.error('Error loading orders:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-gray-400">جاري تحميل طلباتك...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 text-center flex flex-col items-center gap-8">
        <div className="bg-gray-100 p-12 rounded-full">
           <ShoppingCart className="w-20 h-20 text-gray-300" />
        </div>
        <h2 className="text-4xl font-black text-primary">سجل دخولك لرؤية طلباتك</h2>
        <Link to="/login" className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xl hover:scale-105 transition-transform">تسجيل الدخول</Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 text-center flex flex-col items-center gap-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-blue-50 p-12 rounded-full"
        >
           <Package className="w-20 h-20 text-blue-200" />
        </motion.div>
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black text-primary">ليس لديك طلبات بعد</h2>
          <p className="text-gray-500 max-w-sm mx-auto">يبدو أنك لم تقم بأي عملية شراء حتى الآن. استكشف متجرنا وابدأ بالتسوق!</p>
        </div>
        <Link to="/products" className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-xl shadow-primary/20">ابدأ التسوق الآن</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-12 font-cairo" dir="rtl">
      <div className="flex items-center gap-4">
        <div className="bg-primary p-3 rounded-2xl text-white">
           <Package className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-primary">طلباتي السابقة</h1>
      </div>

      <div className="flex flex-col gap-6">
        {orders.map((order) => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 pb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">رقم الطلب</span>
                <span className="text-xl font-black text-primary">#{order.orderNumber || order.id.slice(0, 8)}</span>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${
                order.status === 'تم التسليم' ? 'bg-green-100 text-green-600' : 
                order.status === 'تم الشحن' ? 'bg-blue-100 text-blue-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                {order.status}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-black text-gray-400 uppercase">المنتجات</span>
                <div className="flex flex-col gap-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl p-2 flex items-center justify-center">
                        <img src={proxyImage(item.image) || undefined} alt={item.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">{item.name}</span>
                        <span className="text-xs font-bold text-gray-400">الكمية: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">التاريخ</span>
                  <span className="text-primary font-black">{order.createdAt?.toDate?.()?.toLocaleDateString('ar-MA') || new Date(order.createdAt).toLocaleDateString('ar-MA')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">طريقة الدفع</span>
                  <span className="text-primary font-black">{order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between text-xl font-black">
                  <span className="text-primary">الإجمالي</span>
                  <span className="text-accent">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
               <Link to={`/track?order=${order.orderNumber || order.id}`} className="text-primary font-black text-sm flex items-center gap-2 hover:underline">
                  تتبع الشحنة <ExternalLink className="w-4 h-4" />
               </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
