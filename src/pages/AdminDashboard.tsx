import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Order, StoreConfig, Coupon } from '../types';
import { 
  BarChart3, Package, ShoppingCart, Settings, LogOut, Plus, Trash2, 
  Edit3, Eye, Printer, Download, MessageSquare, Tag, Users, CheckCircle2, 
  XCircle, Truck, Clock, Save, Image as ImageIcon, Loader2
} from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary } from '../lib/cloudinary';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });
    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snap) => {
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    });
    const unsubConfig = onSnapshot(doc(db, 'config', 'settings'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCoupons();
      unsubConfig();
    };
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default password as per request
    if (password === 'admin123') {
      setIsLoggedIn(true);
      toast.success('مرحباً بك في لوحة التحكم! 🛡️');
    } else {
      toast.error('كلمة المرور غير صحيحة');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-40 px-4">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col gap-8 text-center">
          <div className="bg-primary text-white w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl">
             <Settings className="w-10 h-10 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-primary mb-2">لوحة التحكم</h1>
            <p className="text-gray-400 font-bold">يرجى إدخال كلمة المرور للمتابعة</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-right">
             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 mr-2">كلمة المرور</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border-none rounded-2xl p-5 text-center text-2xl font-black outline-none focus:ring-2 ring-primary/20"
                  required
                />
             </div>
             <button type="submit" className="bg-primary text-white p-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform mt-4">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
        {/* Sidebar */}
        <aside className="bg-white p-6 rounded-[40px] shadow-lg border border-gray-100 h-fit sticky top-32">
           <div className="flex flex-col gap-2 mb-12 px-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">موري تيك</span>
              <h2 className="text-2xl font-black text-primary leading-none">مدير المتجر</h2>
           </div>

           <nav className="flex flex-col gap-2">
              {[
                { id: 'stats', name: 'الإحصائيات', icon: BarChart3 },
                { id: 'products', name: 'المنتجات', icon: Package },
                { id: 'orders', name: 'الطلبات', icon: ShoppingCart },
                { id: 'coupons', name: 'الكوبونات', icon: Tag },
                { id: 'visitors', name: 'الزوار', icon: Users },
                { id: 'settings', name: 'الإعدادات', icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all",
                    activeTab === item.id ? "bg-primary text-accent shadow-xl" : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="w-5 h-5" /> {item.name}
                </button>
              ))}
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-red-400 hover:bg-red-50 mt-12"
              >
                <LogOut className="w-5 h-5" /> تسجيل خروج
              </button>
           </nav>
        </aside>

        {/* Content */}
        <main className="bg-white rounded-[40px] shadow-lg border border-gray-100 p-8 md:p-12 min-h-[800px]">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
             >
                {activeTab === 'stats' && <StatsSection orders={orders} products={products} />}
                {activeTab === 'products' && <ProductsSection products={products} />}
                {activeTab === 'orders' && <OrdersSection orders={orders} />}
                {activeTab === 'coupons' && <CouponsSection coupons={coupons} />}
                {activeTab === 'settings' && <SettingsSection config={config} />}
                {activeTab === 'visitors' && <VisitorsSection />}
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// Sub-sections
function StatsSection({ orders, products }: { orders: Order[], products: Product[] }) {
  const stats = useMemo(() => {
    const totalRevenue = orders.filter(o => o.status !== 'قيد الانتظار').reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'قيد الانتظار').length;
    const totalVisits = products.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    return { totalRevenue, pendingOrders, totalVisits };
  }, [orders, products]);

  const cards = [
    { name: 'إجمالي المبيعات', value: formatPrice(stats.totalRevenue), color: 'bg-green-50 text-green-600', icon: BarChart3 },
    { name: 'طلبات جديدة', value: stats.pendingOrders, color: 'bg-orange-50 text-orange-600', icon: ShoppingCart },
    { name: 'إجمالي المشاهدات', value: stats.totalVisits, color: 'bg-blue-50 text-blue-600', icon: Eye },
    { name: 'عدد المنتجات', value: products.length, color: 'bg-purple-50 text-purple-600', icon: Package },
  ];

  return (
    <div className="flex flex-col gap-12">
      <h2 className="text-3xl font-black text-primary">نظرة عامة على الإحصائيات</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {cards.map((card, idx) => (
           <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col gap-4 shadow-sm">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", card.color)}>
                <card.icon className="w-6 h-6" />
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400">{card.name}</span>
                <span className="text-2xl font-black text-primary">{card.value}</span>
             </div>
           </div>
         ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-gray-50 p-8 rounded-[32px] flex flex-col gap-6">
            <h3 className="font-black text-gray-700">الأكثر مبيعاً</h3>
            <div className="flex flex-col gap-4">
               {products.sort((a,b) => (b.soldCount||0) - (a.soldCount||0)).slice(0, 5).map(p => (
                 <div key={p.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                    <span className="font-bold text-sm">{p.name}</span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black">{p.soldCount || 0} مبيع</span>
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-gray-50 p-8 rounded-[32px] flex flex-col gap-6">
            <h3 className="font-black text-gray-700">أحدث الطلبات</h3>
            <div className="flex flex-col gap-4">
               {orders.slice(0, 5).map(o => (
                 <div key={o.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                    <span className="font-bold text-sm">{o.customerName}</span>
                    <span className="text-accent font-black text-xs">{formatPrice(o.total)}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function ProductsSection({ products }: { products: Product[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('تم حذف المنتج بنجاح');
    } catch (e) {
      toast.error('خطأ في الحذف');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-primary">إدارة المنتجات</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" /> إضافة منتج جديد
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="pb-4 pr-4">المنتج</th>
              <th className="pb-4">الماركة</th>
              <th className="pb-4">السعر</th>
              <th className="pb-4">المخزون</th>
              <th className="pb-4">المبيعات</th>
              <th className="pb-4 pl-4 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                <td className="py-6 pr-4">
                  <div className="flex items-center gap-4">
                    <img src={p.images[0]} className="w-12 h-12 rounded-lg object-contain bg-gray-50" />
                    <span className="font-black text-gray-900">{p.name}</span>
                  </div>
                </td>
                <td className="py-6 font-bold text-gray-500 uppercase">{p.brand}</td>
                <td className="py-6 font-black text-primary">{formatPrice(p.price)}</td>
                <td className="py-6">
                   <span className={cn("px-3 py-1 rounded-full text-xs font-black", p.stock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                     {p.stock} قطعة
                   </span>
                </td>
                <td className="py-6 font-bold text-gray-400">{p.soldCount || 0}</td>
                <td className="py-6 pl-4 text-left">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditingProduct(p)} className="p-2 text-gray-400 hover:text-primary"><Edit3 className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showAdd || editingProduct) && (
        <ProductForm 
          onClose={() => { setShowAdd(false); setEditingProduct(null); }} 
          initial={editingProduct} 
        />
      )}
    </div>
  );
}

function ProductForm({ onClose, initial }: { onClose: () => void, initial?: Product | null }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>(initial || {
    name: '',
    brand: '',
    price: 0,
    discount: 0,
    stock: 0,
    description: '',
    images: [],
    specifications: { ram: '', storage: '', battery: '', camera: '' }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial) {
        await updateDoc(doc(db, 'products', initial.id), { ...form, updatedAt: serverTimestamp() });
        toast.success('تم التحديث بنجاح');
      } else {
        await addDoc(collection(db, 'products'), { ...form, soldCount: 0, viewCount: 0, createdAt: serverTimestamp() });
        toast.success('تمت الإضافة بنجاح');
      }
      onClose();
    } catch (e) {
      toast.error('حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file);
      setForm(prev => ({ ...prev, images: [...(prev.images || []), url] }));
    } catch (e) {
      toast.error('فشل رفع الصورة');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl p-8 md:p-12 relative"
      >
        <button onClick={onClose} className="absolute top-8 left-8 p-4 bg-gray-50 rounded-full"><XCircle className="w-6 h-6" /></button>
        <h3 className="text-3xl font-black text-primary mb-12">{initial ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-500 mr-2">اسم المنتج</label>
                 <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary" />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-500 mr-2">الماركة</label>
                 <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} required className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">السعر الأصلي</label>
                   <input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} required className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">نسبة الخصم %</label>
                   <input type="number" value={form.discount} onChange={e => setForm({...form, discount: parseFloat(e.target.value)})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-500 mr-2">الكمية في المخزن</label>
                 <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} required className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary" />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-500 mr-2">الوصف</label>
                 <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary h-32 resize-none" />
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-500 mr-2">صور المنتج</label>
                 <div className="grid grid-cols-3 gap-2">
                    {form.images?.map((url, i) => (
                      <div key={i} className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative group">
                         <img src={url} className="w-full h-full object-contain" />
                         <button onClick={() => setForm(prev => ({...prev, images: prev.images?.filter((_, idx)=>idx!==i)}))} className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <label className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-200 text-gray-400 hover:text-primary hover:border-primary transition-all">
                       <Plus className="w-8 h-8" />
                       <input type="file" className="hidden" onChange={handleImgUpload} />
                    </label>
                 </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col gap-4">
                 <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-2">المواصفات التقنية</h4>
                 <div className="grid grid-cols-2 gap-4">
                    {['ram', 'storage', 'battery', 'camera'].map((key) => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mr-1">{key === 'ram' ? 'الرام' : key === 'storage' ? 'التخزين' : key === 'battery' ? 'البطارية' : 'الكاميرا'}</label>
                        <input value={(form.specifications as any)?.[key]} onChange={e => setForm({...form, specifications: {...form.specifications, [key]: e.target.value}})} className="bg-white rounded-lg p-2 text-xs outline-none focus:ring-1 ring-primary" />
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl">
                 <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} id="isFeatured" className="w-5 h-5 accent-primary" />
                 <label htmlFor="isFeatured" className="text-sm font-bold text-primary">تمييز المنتج كـ "Featured"</label>
              </div>
           </div>

           <button type="submit" disabled={loading} className="md:col-span-2 bg-primary text-white p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 mt-8 shadow-2xl">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {initial ? 'تحديث البيانات' : 'حفظ المنتج'}
           </button>
        </form>
      </motion.div>
    </div>
  );
}

function OrdersSection({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState('الكل');

  const filtered = orders.filter(o => filter === 'الكل' || o.status === filter);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success('تم تحديث حالة الطلب');
    } catch (e) {
      toast.error('خطأ في التحديث');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-black text-primary">إدارة الطلبات</h2>
        <div className="flex gap-2">
          {['الكل', 'قيد الانتظار', 'تم التأكيد', 'تم الشحن', 'تم التسليم'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", filter === f ? "bg-primary text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {filtered.map((order) => (
           <div key={order.id} className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="flex flex-col gap-2 min-w-[200px]">
                 <div className="flex items-center gap-3">
                    <div className="bg-primary/5 text-primary w-12 h-12 rounded-xl flex items-center justify-center font-black" dir="ltr">#{order.orderNumber.slice(-4)}</div>
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-primary">{order.customerName}</span>
                       <span className="text-xs font-bold text-gray-400" dir="ltr">{order.phone}</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                 <div className="flex flex-wrap gap-2">
                    {order.items.map((it, idx) => (
                      <span key={idx} className="bg-gray-50 px-3 py-1 rounded-lg text-[10px] font-bold text-gray-500">{it.name} × {it.quantity}</span>
                    ))}
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">الإجمالي</span>
                       <span className="text-lg font-black text-accent">{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">طريقة الدفع</span>
                       <span className="text-sm font-black text-primary">{order.paymentMethod}</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-4 items-end">
                 <div className="flex items-center gap-2">
                    <button onClick={() => window.open(order.paymentProofUrl)} className="text-xs font-bold text-primary underline flex items-center gap-1 hover:text-accent transition-colors"><ImageIcon className="w-4 h-4" /> عرض الإيصال</button>
                    <a href={`https://wa.me/222${order.phone}`} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white p-2 rounded-lg"><MessageSquare className="w-5 h-5" /></a>
                 </div>
                 <select 
                   value={order.status} 
                   onChange={(e) => updateStatus(order.id, e.target.value)}
                   className={cn(
                     "border-none rounded-xl px-4 py-2 text-xs font-black outline-none",
                     order.status === 'قيد الانتظار' ? 'bg-orange-50 text-orange-600' :
                     order.status === 'تم التأكيد' ? 'bg-blue-50 text-blue-600' :
                     order.status === 'تم الشحن' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'
                   )}
                 >
                   <option value="قيد الانتظار">قيد الانتظار</option>
                   <option value="تم التأكيد">تم التأكيد</option>
                   <option value="تم الشحن">تم الشحن</option>
                   <option value="تم التسليم">تم التسليم</option>
                 </select>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}

function CouponsSection({ coupons }: { coupons: Coupon[] }) {
  return <div className="text-gray-400 font-bold p-20 text-center">خدمة الكوبونات قيد التطوير...</div>;
}

function SettingsSection({ config }: { config: StoreConfig | null }) {
  const [form, setForm] = useState<StoreConfig>(config || {
    storeName: 'MAURI TICK', tagline: 'أفضل الهواتف بأفضل الأسعار', whatsappNumber: '36096100', 
    logoUrl: '', heroTitle: '', heroSubtitle: '', heroImage: '', maintenanceMode: false,
    aboutUs: '', footerText: '', socialLinks: { facebook: '', instagram: '', tiktok: '' }
  });

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'config', 'settings'), { ...form });
      toast.success('تم حفظ الإعدادات');
    } catch (e) {
      toast.error('خطأ في الحفظ');
    }
  };

  return (
    <div className="flex flex-col gap-12">
       <div className="flex justify-between items-center">
         <h2 className="text-3xl font-black text-primary">إعدادات المتجر</h2>
         <button onClick={handleSave} className="bg-primary text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl"><Save className="w-5 h-5" /> حفظ التغييرات</button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="flex flex-col gap-6">
             <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest border-b pb-2">الهوية البصرية</h3>
             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 mr-2">اسم المتجر</label>
                <input value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary font-black" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 mr-2">التاغ لاين (Tagline)</label>
                <input value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary" />
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 mr-2">رقم الواتساب</label>
                <input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-1 ring-primary" dir="ltr" />
             </div>
          </section>

          <section className="flex flex-col gap-6">
             <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest border-b pb-2">وضع الصيانة</h3>
             <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl">
                <div className="flex flex-col">
                   <span className="font-black text-primary text-sm">تفعيل وضع الصيانة</span>
                   <span className="text-[10px] text-gray-400 font-bold">سيتم إغلاق المتجر مؤقتاً في وجه الزوار</span>
                </div>
                <input type="checkbox" checked={form.maintenanceMode} onChange={e => setForm({...form, maintenanceMode: e.target.checked})} className="w-6 h-6 accent-primary" />
             </div>
          </section>
       </div>
    </div>
  );
}

function VisitorsSection() {
  return <div className="text-gray-400 font-bold p-20 text-center">إحصائيات الزوار المفصلة قيد التطوير...</div>;
}
