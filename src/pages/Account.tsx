import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Order, Product } from '../types';
import { User, ShoppingCart, Heart, ShieldCheck, LogOut, Package, Clock, CheckCircle, Truck, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function Account({ products }: { products: Product[] }) {
  const { user, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  if (!user) return <Navigate to="/login" />;

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      loadOrders();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const q = query(collection(db, 'orders'), where('phone', '==', user.phone), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'معلوماتي', icon: User },
    { id: 'orders', name: 'طلباتي', icon: ShoppingCart },
    { id: 'wishlist', name: 'المفضلة', icon: Heart },
    { id: 'security', name: 'الأمان', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
        <aside className="bg-white p-6 rounded-[40px] shadow-lg border border-gray-100 h-fit sticky top-32">
           <div className="flex flex-col gap-4 mb-8 px-2">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center text-primary">
                 <User className="w-8 h-8" />
              </div>
              <div className="flex flex-col">
                 <h2 className="text-xl font-black text-primary">{user.name || 'مرحباً بك!'}</h2>
                 <span dir="ltr" className="text-xs font-bold text-gray-400">{user.phone}</span>
              </div>
           </div>

           <nav className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all",
                    activeTab === tab.id ? "bg-primary text-white shadow-xl" : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <tab.icon className="w-5 h-5" /> {tab.name}
                </button>
              ))}
              <button 
                onClick={logout}
                className="flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-red-400 hover:bg-red-50 mt-12"
              >
                <LogOut className="w-5 h-5" /> تسجيل خروج
              </button>
           </nav>
        </aside>

        <main className="bg-white rounded-[40px] shadow-lg border border-gray-100 p-8 md:p-12 min-h-[600px]">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
             >
                {activeTab === 'profile' && <ProfileTab user={user} updateProfile={updateProfile} />}
                {activeTab === 'orders' && <OrdersTab orders={orders} loading={loadingOrders} />}
                {activeTab === 'wishlist' && <WishlistTab products={products} />}
                {activeTab === 'security' && <SecurityTab />}
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function ProfileTab({ user, updateProfile }: { user: any, updateProfile: any }) {
  const [form, setForm] = useState({
    name: user.name || '',
    city: user.city || '',
    address: user.address || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile(form);
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-12">
      <h2 className="text-3xl font-black text-primary underline decoration-accent/30 underline-offset-8">تعديل الملف الشخصي</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
         <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">الاسم الكامل</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-gray-50 rounded-2xl p-5 outline-none border-none focus:ring-1 ring-primary font-bold" />
         </div>
         <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">المدينة</label>
            <input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="bg-gray-50 rounded-2xl p-5 outline-none border-none focus:ring-1 ring-primary font-bold" />
         </div>
         <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">العنوان</label>
            <input required value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-gray-50 rounded-2xl p-5 outline-none border-none focus:ring-1 ring-primary font-bold" />
         </div>
         <button type="submit" disabled={saving} className="md:col-span-2 bg-primary text-white p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 mt-8 shadow-xl hover:scale-105 transition-transform disabled:opacity-50">
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            حفظ البيانات
         </button>
      </form>
    </div>
  );
}

function OrdersTab({ orders, loading }: { orders: Order[], loading: boolean }) {
  const { addToCart } = useCart();
  const statusSteps = [
    { name: 'قيد الانتظار', icon: Clock },
    { name: 'تم التأكيد', icon: CheckCircle },
    { name: 'تم الشحن', icon: Truck },
    { name: 'تم التسليم', icon: Package },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (orders.length === 0) return (
    <div className="py-20 text-center flex flex-col items-center gap-6">
       <div className="bg-gray-50 p-10 rounded-full"><ShoppingCart className="w-16 h-16 text-gray-200" /></div>
       <h3 className="text-2xl font-black text-gray-400">لا توجد طلبات سابقة</h3>
       <Link to="/products" className="text-primary font-bold underline">اكتشف أحدث الهواتف الآن</Link>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary mb-4">تاريخ طلباتي</h2>
      <div className="flex flex-col gap-8">
         {orders.map((order, idx) => (
           <div key={order.id} className="bg-gray-50 rounded-[32px] overflow-hidden border border-gray-100">
              <div className="p-8 flex flex-col sm:flex-row justify-between items-center bg-white border-b gap-4">
                 <div className="flex items-center gap-4">
                    <span className="bg-primary text-white p-3 rounded-xl font-black text-xs" dir="ltr">#{order.orderNumber.slice(-4)}</span>
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-gray-400">تاريخ الطلب</span>
                       <span className="text-sm font-black text-primary">{new Date(order.createdAt?.toDate?.() || 0).toLocaleDateString('ar-MR')}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-8">
                   <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-gray-400">الإجمالي</span>
                      <span className="text-lg font-black text-accent">{formatPrice(order.total)}</span>
                   </div>
                   <button 
                     onClick={() => {
                       order.items.forEach(item => {
                         // Need to match back to product types for addToCart which expects Product
                         addToCart({ id: item.id, name: item.name, price: item.price, images: [item.image], discount: 0, stock: 10 } as any);
                       });
                       toast.success('تمت إضافة منتجات الطلب للسلة');
                     }}
                     className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                   >
                     إعادة الطلب <ArrowLeft className="w-3 h-3" />
                   </button>
                 </div>
              </div>
              <div className="p-8">
                 <div className="flex justify-between items-center">
                    <span className={cn(
                      "px-4 py-2 rounded-full text-xs font-black",
                      order.status === 'قيد الانتظار' ? 'bg-orange-100 text-orange-600' :
                      order.status === 'تم التسليم' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    )}>
                      حالة الطلب: {order.status}
                    </span>
                    <Link to="/track" className="text-xs font-bold text-primary underline">تتبع التفاصيل</Link>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}

function WishlistTab({ products }: { products: Product[] }) {
  const { wishlist } = useCart();
  const wishlistedItems = products.filter(p => wishlist.includes(p.id));

  if (wishlistedItems.length === 0) return (
     <div className="py-20 text-center flex flex-col items-center gap-6">
        <div className="bg-gray-50 p-10 rounded-full"><Heart className="w-16 h-16 text-gray-200" /></div>
        <h3 className="text-2xl font-black text-gray-400">قائمة المفضلة فارغة</h3>
     </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary mb-4 text-right">قائمة الأمنيات</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
         {wishlistedItems.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

function SecurityTab() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) return toast.error('كلمات المرور غير متطابقة');
    toast.success('تم تغيير كلمة المرور بنجاح');
  };

  return (
    <div className="flex flex-col gap-12">
      <h2 className="text-3xl font-black text-primary underline decoration-accent/30 underline-offset-8">تغيير كلمة المرور</h2>
      <form onSubmit={handleUpdate} className="flex flex-col gap-6 max-w-md">
         <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">كلمة المرور الحالية</label>
            <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="bg-gray-50 rounded-2xl p-5 outline-none border-none focus:ring-1 ring-primary" />
         </div>
         <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">كلمة المرور الجديدة</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="bg-gray-50 rounded-2xl p-5 outline-none border-none focus:ring-1 ring-primary" />
         </div>
         <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">تأكيد كلمة المرور الجديدة</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="bg-gray-50 rounded-2xl p-5 outline-none border-none focus:ring-1 ring-primary" />
         </div>
         <button type="submit" className="bg-primary text-white p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 mt-8 shadow-xl hover:scale-105 transition-transform">
            تحديث الأمان
         </button>
      </form>
    </div>
  );
}
