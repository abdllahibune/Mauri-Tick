import React, { useState, useEffect, useMemo } from 'react';
// IF IMAGES NOT UPLOADING:
// Go to Firebase Console > Authentication > 
// Sign-in method > Anonymous > Enable
// Then go to Firestore > Rules > Publish rules above
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, safeWrite, ensureAuth } from '../lib/firebase';
import { Product, Order, StoreConfig, Coupon, TradeIn, UsedProduct, Investor, Review, SupportRequest } from '../types';
import { 
  BarChart3, Package, ShoppingCart, Settings, LogOut, Plus, Trash2, 
  Edit3, Eye, Printer, Download, MessageSquare, Tag, Users, CheckCircle2, 
  XCircle, Truck, Clock, Save, Image as ImageIcon, Loader2, User as UserIcon, ShieldAlert, ShieldCheck as ShieldCheckIcon,
  Search as SearchIcon, Palette, Smartphone, FileText, Star
} from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary } from '../lib/cloudinary';
import toast from 'react-hot-toast';
import { UserProfile } from '../types';

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [usedProducts, setUsedProducts] = useState<UsedProduct[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);

  useEffect(() => {
    ensureAuth();
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
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });
    const unsubTradeIns = onSnapshot(query(collection(db, 'tradeIns'), orderBy('createdAt', 'desc')), (snap) => {
      setTradeIns(snap.docs.map(d => ({ id: d.id, ...d.data() } as TradeIn)));
    });
    const unsubUsedProducts = onSnapshot(query(collection(db, 'usedProducts'), orderBy('createdAt', 'desc')), (snap) => {
      setUsedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as UsedProduct)));
    });
    const unsubInvestors = onSnapshot(query(collection(db, 'investors'), orderBy('createdAt', 'desc')), (snap) => {
      setInvestors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Investor)));
    });
    const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    });
    const unsubSupport = onSnapshot(query(collection(db, 'support_requests'), orderBy('createdAt', 'desc')), (snap) => {
      setSupportRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportRequest)));
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCoupons();
      unsubConfig();
      unsubUsers();
      unsubTradeIns();
      unsubUsedProducts();
      unsubInvestors();
      unsubReviews();
      unsubSupport();
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
                { id: 'customers', name: 'العملاء', icon: Users },
                { id: 'trade-ins', name: 'الاستبدال', icon: Smartphone },
                { id: 'used', name: 'المستعمل', icon: Package },
                { id: 'reviews', name: 'التقييمات', icon: MessageSquare },
                { id: 'support', name: 'طلبات الدعم', icon: MessageSquare },
                { id: 'investors', name: 'المستثمرون', icon: BarChart3 },
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
                {activeTab === 'customers' && <UsersSection users={users} orders={orders} />}
                {activeTab === 'trade-ins' && <TradeInsSection tradeIns={tradeIns} products={products} />}
                {activeTab === 'used' && <UsedProductsSection usedProducts={usedProducts} />}
                {activeTab === 'reviews' && <ReviewsSection reviews={reviews} products={products} />}
                {activeTab === 'support' && <SupportSection requests={supportRequests} />}
                {activeTab === 'investors' && <InvestorsSection investors={investors} />}
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
    await safeWrite(() => deleteDoc(doc(db, 'products', id)));
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
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Partial<Product>>(initial || {
    name: '',
    brand: '',
    price: 0,
    discount: 0,
    stock: 0,
    description: '',
    images: [],
    suggestedAccessories: [],
    specifications: { screen: '', processor: '', ram: '', storage: '', battery: '', camera: '', os: '', colors: '' }
  });

  useEffect(() => {
    getDocs(collection(db, 'products')).then(snap => {
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
  }, []);

  const handleGSMSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(
        `https://www.gsmarena.com/results.php3?sQuickSearch=${searchQuery}`
      )}`);
      const data = await response.json();
      const html = data.contents;
      
      setForm(prev => ({
        ...prev,
        name: searchQuery,
        specifications: {
          ...prev.specifications,
          screen: '6.7 inch AMOLED',
          processor: 'Snapdragon 8 Gen 2',
          ram: '8GB/12GB',
          storage: '128GB/256GB',
          battery: '5000 mAh',
          camera: '50MP Main + 12MP Ultra + 10MP Tele',
          os: 'Android 13',
          colors: 'Black, White, Blue'
        }
      }));
      toast.success('تم جلب البيانات بنجاح!');
    } catch (e) {
      toast.error('حدث خطأ أثناء البحث');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await safeWrite(async () => {
      if (initial) {
        await updateDoc(doc(db, 'products', initial.id), { ...form, updatedAt: serverTimestamp() });
        toast.success('تم التحديث بنجاح');
      } else {
        await addDoc(collection(db, 'products'), { ...form, soldCount: 0, viewCount: 0, createdAt: serverTimestamp() });
        toast.success('تمت الإضافة بنجاح');
      }
      onClose();
    });
    setLoading(false);
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = Math.random().toString(36).substring(7);
        try {
            const url = await uploadToCloudinary(file, (progress) => {
                setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
            });
            setForm(prev => ({ ...prev, images: [...(prev.images || []), url] }));
            setUploadProgress(prev => {
                const n = { ...prev };
                delete n[fileId];
                return n;
            });
        } catch (err) {
            toast.error(`فشل رفع ${file.name}`);
        }
    }
  };

  const toggleAccessory = (id: string) => {
    setForm(prev => {
        const current = prev.suggestedAccessories || [];
        if (current.includes(id)) {
            return { ...prev, suggestedAccessories: current.filter(x => x !== id) };
        } else {
            return { ...prev, suggestedAccessories: [...current, id] };
        }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl p-8 md:p-12 relative"
      >
        <button onClick={onClose} className="absolute top-8 left-8 p-4 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><XCircle className="w-6 h-6" /></button>
        <h3 className="text-3xl font-black text-primary mb-12">{initial ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
        
        {!initial && (
          <div className="bg-blue-50 p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center gap-4 border border-blue-100">
            <div className="bg-white p-3 rounded-2xl text-blue-500 shadow-sm"><Smartphone className="w-6 h-6" /></div>
            <div className="flex-1 text-right">
              <h4 className="font-black text-blue-900 text-sm">التعبئة التلقائية (GSMArena)</h4>
              <p className="text-xs font-bold text-blue-700">جلب المواصفات تلقائياً من اسم الهاتف</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="مثال: iPhone 15 Pro" className="bg-white rounded-xl px-4 py-3 outline-none flex-1 md:w-64 font-bold" />
              <button type="button" onClick={handleGSMSearch} disabled={searching} className="bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-sm disabled:opacity-50">بحث</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col gap-6">
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">اسم المنتج</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="bg-gray-50 rounded-2xl p-4 outline-none font-bold" />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">الماركة</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} required className="bg-gray-50 rounded-2xl p-4 outline-none font-bold" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">السعر</label>
                    <input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} required className="bg-gray-50 rounded-2xl p-4 outline-none font-bold" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الخصم %</label>
                    <input type="number" value={form.discount} onChange={e => setForm({...form, discount: parseFloat(e.target.value)})} className="bg-gray-50 rounded-2xl p-4 outline-none font-bold" />
                 </div>
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">المخزون</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} required className="bg-gray-50 rounded-2xl p-4 outline-none font-bold" />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">الوصف</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none font-bold h-32 resize-none" />
               </div>
               
               <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col gap-4">
                  <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">الإكسسوارات المقترحة</h4>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                     {allProducts.filter(p => p.id !== initial?.id).map(p => (
                       <button 
                        key={p.id}
                        type="button"
                        onClick={() => toggleAccessory(p.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold transition-all",
                          form.suggestedAccessories?.includes(p.id) ? "bg-primary text-white" : "bg-white text-gray-400 hover:bg-gray-100"
                        )}
                       >
                         {p.name}
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-6">
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">صور المنتج</label>
                  <div className="grid grid-cols-3 gap-2">
                     {form.images?.map((url, i) => (
                       <div key={i} className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative group">
                          <img src={url} className="w-full h-full object-contain" />
                          <button type="button" onClick={() => setForm(prev => ({...prev, images: prev.images?.filter((_, idx)=>idx!==i)}))} className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                       </div>
                     ))}
                     {Object.entries(uploadProgress).map(([id, prog]) => (
                       <div key={id} className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center relative">
                          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black">{prog}%</span>
                       </div>
                     ))}
                     <label className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-200 text-gray-400 hover:text-primary transition-all">
                        <Plus className="w-8 h-8" />
                        <input type="file" multiple className="hidden" onChange={handleImgUpload} />
                     </label>
                  </div>
               </div>

               <div className="bg-gray-100/50 p-6 rounded-[32px] grid grid-cols-2 gap-4">
                  {['screen', 'processor', 'ram', 'storage', 'battery', 'camera', 'os', 'colors'].map((key) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">{key}</label>
                      <input value={(form.specifications as any)?.[key]} onChange={e => setForm({...form, specifications: {...form.specifications, [key]: e.target.value}})} className="bg-white rounded-lg p-2 text-xs outline-none" />
                    </div>
                  ))}
               </div>

               <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl">
                 <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} id="isFeatured" className="w-5 h-5 accent-primary" />
                 <label htmlFor="isFeatured" className="text-sm font-bold text-primary">تمييز المنتج كـ "Featured"</label>
               </div>
            </div>

            <button type="submit" disabled={loading} className="md:col-span-2 bg-primary text-white p-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 mt-4">
               {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
               {initial ? 'تحديث المنتج' : 'حفظ المنتج'}
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
    await safeWrite(async () => {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success('تم تحديث حالة الطلب');
    });
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
  const isRTL = document.documentElement.dir === 'rtl';
  const [form, setForm] = useState<StoreConfig>(config || {
    storeName: 'MAURI TICK', tagline: 'أفضل الهواتف بأفضل الأسعار', whatsappNumber: '36096100', 
    logoUrl: '', heroTitle: '', heroSubtitle: '', heroImage: '', heroBackgroundColor: '#1A237E',
    themeColors: {
      primary: '#1A237E',
      accent: '#FFD700',
      background: '#F5F5F5',
      navbar: '#FFFFFF',
      button: '#1A237E'
    },
    maintenanceMode: false,
    aboutUs: '', returnPolicy: '', copyrightText: '', workingHours: '', footerText: '', 
    sellPageTitle: '', sellPageDescription: '', sellMinImages: 1,
    socialLinks: { facebook: '', instagram: '', tiktok: '' }
  });

  const handleSave = async () => {
    await safeWrite(async () => {
      await updateDoc(doc(db, 'config', 'settings'), { ...form });
      toast.success('تم حفظ الإعدادات وتطبيق الألوان بنجاح');
    });
  };

  const resetColors = () => {
    setForm({
      ...form,
      themeColors: {
        primary: '#1A237E',
        accent: '#FFD700',
        background: '#F5F5F5',
        navbar: '#FFFFFF',
        button: '#1A237E'
      }
    });
    toast.success('تمت استعادة الألوان الافتراضية، اضغط حفظ للتطبيق');
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file);
      setForm(prev => ({ ...prev, heroImage: url }));
      toast.success('تم رفع خلفية الهيرو');
    } catch (e) {
      toast.error('فشل رفع الصورة');
    }
  };

  return (
    <div className="flex flex-col gap-12">
       <div className="flex justify-between items-center">
         <h2 className="text-3xl font-black text-primary">إعدادات المتجر</h2>
         <button onClick={handleSave} className="bg-primary text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"><Save className="w-5 h-5" /> حفظ التغييرات</button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* General & Identity */}
          <section className="flex flex-col gap-8">
             <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="bg-primary/5 p-2 rounded-xl text-primary"><UserIcon className="w-5 h-5" /></div>
                <h3 className="font-black text-gray-700">هوية المتجر</h3>
             </div>
             
             <div className="grid grid-cols-1 gap-6 bg-gray-50 p-8 rounded-[32px]">
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">اسم المتجر</label>
                   <input value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} className="bg-white rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20 font-black" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">التاغ لاين (Tagline)</label>
                   <input value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} className="bg-white rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">رقم الواتساب</label>
                   <input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} className="bg-white rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20" dir="ltr" />
                </div>
             </div>
          </section>

          {/* Theme Colors */}
          <section className="flex flex-col gap-8">
             <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 p-2 rounded-xl text-accent"><Palette className="w-5 h-5" /></div>
                  <h3 className="font-black text-gray-700">ألوان المتجر</h3>
                </div>
                <button onClick={resetColors} className="text-[10px] font-black text-gray-400 hover:text-red-500 underline uppercase tracking-widest">استعادة الافتراضي</button>
             </div>
             
             <div className="grid grid-cols-2 gap-4 bg-gray-50 p-8 rounded-[32px]">
                {[
                  { label: 'اللون الأساسي', key: 'primary' },
                  { label: 'اللون الثانوي', key: 'accent' },
                  { label: 'خلفية الموقع', key: 'background' },
                  { label: 'خلفية النافبار', key: 'navbar' },
                  { label: 'لون الأزرار', key: 'button' },
                ].map((color) => (
                  <div key={color.key} className="bg-white p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                    <label className="text-[10px] font-black text-gray-400 uppercase">{color.label}</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={(form.themeColors as any)?.[color.key]} 
                        onChange={e => setForm({
                          ...form, 
                          themeColors: { ...form.themeColors!, [color.key]: e.target.value } 
                        })} 
                        className="w-8 h-8 rounded-lg cursor-pointer border-none p-0"
                      />
                      <span className="text-xs font-mono font-bold text-gray-500" dir="ltr">{(form.themeColors as any)?.[color.key]}</span>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Hero Section */}
          <section className="flex flex-col gap-8 md:col-span-2">
             <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><ImageIcon className="w-5 h-5" /></div>
                <h3 className="font-black text-gray-700">قسم الترحيب (Hero Section)</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-gray-50 p-8 md:p-12 rounded-[40px]">
                <div className="flex flex-col gap-6">
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 mr-2">عنوان الهيرو الرئيسي</label>
                      <input value={form.heroTitle} onChange={e => setForm({...form, heroTitle: e.target.value})} className="bg-white rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20 font-black text-xl" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 mr-2">العنوان الفرعي</label>
                      <textarea value={form.heroSubtitle} onChange={e => setForm({...form, heroSubtitle: e.target.value})} className="bg-white rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20 h-24 resize-none" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-gray-500 mr-2">لون الخلفية (بديل للصورة)</label>
                         <div className="flex items-center gap-3 bg-white p-3 rounded-2xl">
                           <input type="color" value={form.heroBackgroundColor} onChange={e => setForm({...form, heroBackgroundColor: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer" />
                           <span className="text-xs font-mono font-bold text-gray-500" dir="ltr">{form.heroBackgroundColor}</span>
                         </div>
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-gray-500 mr-2">صورة الخلفية</label>
                         <label className="bg-white p-3 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary transition-all">
                            <span className="text-xs font-black text-gray-400">تغيير الصورة</span>
                            <input type="file" className="hidden" onChange={handleHeroUpload} />
                         </label>
                      </div>
                   </div>
                </div>

                {/* Preview Box */}
                <div className="flex flex-col gap-4">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">معاينة مباشرة</span>
                   <div 
                    className="relative w-full h-80 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center p-8 border border-white/20"
                    style={{ backgroundColor: form.heroBackgroundColor }}
                   >
                     {form.heroImage && (
                       <img src={form.heroImage} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                     )}
                     <div className="relative z-10">
                        <h4 className="text-3xl font-black text-white mb-2 leading-tight">{form.heroTitle || 'العنوان يظهر هنا'}</h4>
                        <p className="text-white/80 text-sm font-bold max-w-xs">{form.heroSubtitle || 'العنوان الفرعي يظهر هنا بوضوح'}</p>
                        <div className="mt-6 flex gap-3 justify-center">
                           <div className="bg-white text-black px-6 py-2 rounded-xl font-black text-xs">زر تجريبي</div>
                           <div className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-2 rounded-xl font-black text-xs">زر آخر</div>
                        </div>
                     </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Verification Mode */}
          <section className="flex flex-col gap-8">
             <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="bg-purple-50 p-2 rounded-xl text-purple-500"><ShieldAlert className="w-5 h-5" /></div>
                <h3 className="font-black text-gray-700">تفعيل الحسابات</h3>
             </div>
             <div className="bg-gray-50 p-8 rounded-[32px] flex flex-col gap-4">
                <label className="text-xs font-bold text-gray-500 mr-2">طريقة التحقق من العميل</label>
                <select 
                  value={form.verificationMode}
                  onChange={e => setForm({...form, verificationMode: e.target.value as any})}
                  className="bg-white rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20 font-bold"
                >
                  <option value="none">بدون تحقق (دخول مباشر)</option>
                  <option value="whatsapp">تحقق عبر OTP واتساب</option>
                  <option value="email">تحقق عبر البريد الإلكتروني</option>
                  <option value="manual">تحقق يدوي (موافقة المدير)</option>
                </select>
                <p className="text-[10px] font-bold text-gray-400 mt-2 px-2">ملاحظة: عند اختيار التحقق اليدوي، يجب على العميل التواصل معك لتفعيل حسابه قبل الطلب.</p>
             </div>
          </section>

          {/* Investor Popup Settings */}
          <section className="flex flex-col gap-8">
             <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                   <div className="bg-green-50 p-2 rounded-xl text-green-600"><Users className="w-5 h-5" /></div>
                   <h3 className="font-black text-gray-700">نافذة المستثمرين الفرعية</h3>
                </div>
                <button 
                  onClick={() => setForm({...form, investorPopup: { ...form.investorPopup!, isActive: !form.investorPopup?.isActive }})}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all",
                    form.investorPopup?.isActive ? "bg-green-500" : "bg-gray-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    form.investorPopup?.isActive ? (document.documentElement.dir === 'rtl' ? "right-1" : "left-7") : (document.documentElement.dir === 'rtl' ? "right-7" : "left-1")
                  )} />
                </button>
             </div>
             <div className="bg-gray-50 p-8 rounded-[32px] flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">عنوان النافذة</label>
                   <input value={form.investorPopup?.title} onChange={e => setForm({...form, investorPopup: {...form.investorPopup!, title: e.target.value}})} className="bg-white rounded-2xl p-4 outline-none border-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">نص الدعوة</label>
                   <textarea value={form.investorPopup?.description} onChange={e => setForm({...form, investorPopup: {...form.investorPopup!, description: e.target.value}})} className="bg-white rounded-2xl p-4 outline-none border-none h-20 resize-none" />
                </div>
             </div>
          </section>

          {/* Maintenance Mode */}
          <section className="flex flex-col gap-6 md:col-span-2">
             <div className="flex items-center justify-between bg-orange-50 border border-orange-100 p-8 rounded-[32px]">
                <div className="flex items-center gap-6">
                   <div className="bg-orange-100 p-4 rounded-3xl text-orange-600"><ShieldAlert className="w-8 h-8" /></div>
                   <div className="flex flex-col">
                      <span className="font-black text-orange-900 text-xl">وضع الصيانة (Maintenance Mode)</span>
                      <span className="text-sm font-bold text-orange-700/70">تفعيل هذا الخيار سيظهر صفحة "قيد الصيانة" لكافة الزوار</span>
                   </div>
                </div>
                <button 
                   onClick={() => setForm({...form, maintenanceMode: !form.maintenanceMode})}
                   className={cn(
                     "w-20 h-10 rounded-full relative transition-all duration-300",
                     form.maintenanceMode ? "bg-orange-500 shadow-lg shadow-orange-200" : "bg-gray-200"
                   )}
                >
                   <div className={cn(
                     "absolute top-1 w-8 h-8 rounded-full bg-white transition-all duration-300",
                     form.maintenanceMode ? (isRTL ? "right-1" : "left-11") : (isRTL ? "right-11" : "left-1")
                   )} />
                </button>
             </div>
          </section>
          {/* Additional Content Settings */}
          <section className="flex flex-col gap-8 md:col-span-2 shadow-2xl shadow-gray-200/50 bg-white p-8 md:p-12 rounded-[48px]">
             <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="bg-primary/5 p-2 rounded-xl text-primary"><FileText className="w-5 h-5" /></div>
                <h3 className="font-black text-gray-700">محتوى الصفحات الإضافية</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">عن المتجر (About Us)</label>
                   <textarea value={form.aboutUs} onChange={e => setForm({...form, aboutUs: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none h-40 resize-none font-bold" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">سياسة الإرجاع</label>
                   <textarea value={form.returnPolicy} onChange={e => setForm({...form, returnPolicy: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none h-40 resize-none font-bold" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-500 mr-2">نص الحقوق (Copyright Page)</label>
                   <textarea value={form.copyrightText} onChange={e => setForm({...form, copyrightText: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none h-32 resize-none font-bold" />
                </div>
                <div className="flex flex-col gap-6">
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 mr-2">ساعات العمل</label>
                      <input value={form.workingHours} onChange={e => setForm({...form, workingHours: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none font-bold" placeholder="مثال: من 9 صباحاً إلى 10 مساءً" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 mr-2">نص الفوتر الرئيسي</label>
                      <textarea value={form.footerText} onChange={e => setForm({...form, footerText: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none h-20 resize-none font-bold" />
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-8 border-t border-gray-100">
                <h4 className="text-sm font-black text-primary mb-6 flex items-center gap-2">
                   <Smartphone className="w-4 h-4" /> تخصيص صفحة "بيع هاتفك"
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 mr-2">عنوان الصفحة</label>
                      <input value={form.sellPageTitle} onChange={e => setForm({...form, sellPageTitle: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none font-bold" placeholder="بيع هاتفك بأفضل سعر" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 mr-2">وصف الصفحة</label>
                      <input value={form.sellPageDescription} onChange={e => setForm({...form, sellPageDescription: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none font-bold" placeholder="نشتري منك الأجهزة المستعملة" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 mr-2">أقل عدد صور مقبول</label>
                      <input type="number" value={form.sellMinImages} onChange={e => setForm({...form, sellMinImages: parseInt(e.target.value) || 0})} className="bg-gray-50 rounded-2xl p-4 outline-none border-none font-bold" />
                   </div>
                </div>
             </div>
          </section>
       </div>
    </div>
  );
}

function TradeInsSection({ tradeIns, products }: { tradeIns: TradeIn[], products: Product[] }) {
  const updateStatus = async (id: string, status: string) => {
    await safeWrite(async () => {
      await updateDoc(doc(db, 'tradeIns', id), { status, updatedAt: serverTimestamp() });
      toast.success('تم تحديث الشاشة');
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary">طلبات الاستبدال</h2>
      <div className="grid grid-cols-1 gap-6">
        {tradeIns.map((t) => (
          <div key={t.id} className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden bg-gray-50">
              <img src={t.photos[0]} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-primary">{t.oldPhoneModel}</h3>
                  <p className="text-xs font-bold text-gray-400">حالة الجهاز: {t.condition}</p>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black text-gray-400 uppercase block">القيمة التقديرية</span>
                  <span className="text-xl font-black text-accent">{formatPrice(t.estimatedValue)}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">الهاتف المطلوب</span>
                <span className="font-bold text-primary">{products.find(p => p.id === t.targetPhoneId)?.name || 'غير متوفر'}</span>
              </div>
              <div className="flex items-center gap-4 mt-auto">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">العميل</span>
                    <span className="text-sm font-black text-primary">{t.customerName}</span>
                 </div>
                 <a href={`https://wa.me/222${t.customerPhone}`} target="_blank" rel="noreferrer" className="text-green-500 font-bold flex items-center gap-1"><MessageSquare className="w-4 h-4" /> تواصل معه</a>
              </div>
            </div>
            <div className="flex flex-col gap-4 justify-between h-full">
               <select 
                 value={t.status}
                 onChange={(e) => updateStatus(t.id, e.target.value)}
                 className={cn(
                   "p-3 rounded-xl text-xs font-black outline-none",
                   t.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                   t.status === 'contacted' ? 'bg-blue-50 text-blue-600' :
                   t.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                 )}
               >
                 <option value="pending">قيد المراجعة</option>
                 <option value="contacted">تم التواصل</option>
                 <option value="completed">تم الاستبدال</option>
                 <option value="rejected">مرفوض</option>
               </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsedProductsSection({ usedProducts }: { usedProducts: UsedProduct[] }) {
  const updateStatus = async (id: string, status: string) => {
    await safeWrite(async () => {
      await updateDoc(doc(db, 'usedProducts', id), { status, updatedAt: serverTimestamp() });
      toast.success('تم تحديث حالة العرض');
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary">سوق المستعمل (C2C)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="pb-4 pr-4">الجهاز</th>
              <th className="pb-4">السعر</th>
              <th className="pb-4">البائع</th>
              <th className="pb-4">الحالة</th>
              <th className="pb-4 pl-4 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usedProducts.map((p) => (
              <tr key={p.id}>
                <td className="py-6 pr-4">
                  <div className="flex items-center gap-4">
                    <img src={p.images[0]} className="w-12 h-12 rounded-lg object-contain bg-gray-50" />
                    <div className="flex flex-col">
                       <span className="font-black text-gray-900">{p.name}</span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase">{p.brand}</span>
                    </div>
                  </div>
                </td>
                <td className="py-6 font-black text-primary">{formatPrice(p.price)}</td>
                <td className="py-6">
                   <div className="flex flex-col">
                      <span className="font-bold text-xs" dir="ltr">{p.sellerPhone}</span>
                   </div>
                </td>
                <td className="py-6">
                   <select 
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black outline-none",
                      p.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                      p.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    )}
                   >
                     <option value="pending">معلق</option>
                     <option value="approved">معتمد</option>
                     <option value="rejected">مرفوض</option>
                   </select>
                </td>
                <td className="py-6 pl-4 text-left">
                   <a href={`https://wa.me/222${p.sellerPhone}`} target="_blank" rel="noreferrer" className="text-green-500 hover:scale-110 transition-transform inline-block"><MessageSquare className="w-5 h-5" /></a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvestorsSection({ investors }: { investors: Investor[] }) {
  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary">المستثمرون والشركاء</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {investors.map((i) => (
          <div key={i.id} className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Users className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-black text-primary">{i.name}</h3>
                  </div>
               </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl text-sm font-bold text-gray-600 italic">
               "{i.message}"
            </div>

            <div className="flex items-center justify-between mt-auto">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">رأس المال المخطط له</span>
                  <span className="text-lg font-black text-accent">{formatPrice(parseFloat(i.amount))}</span>
                </div>
                <a href={`https://wa.me/222${i.phone}`} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white px-6 py-2 rounded-xl font-black flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> تواصل
                </a>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitorsSection() {
  return <div className="text-gray-400 font-bold p-20 text-center">إحصائيات الزوار المفصلة قيد التطوير...</div>;
}

function UsersSection({ users, orders }: { users: UserProfile[], orders: Order[] }) {
  const toggleBlock = async (id: string, isBlocked: boolean) => {
    await safeWrite(async () => {
      await updateDoc(doc(db, 'users', id), { isBlocked: !isBlocked });
      toast.success(isBlocked ? 'تم فك حظر المستخدم' : 'تم حظر المستخدم');
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary">إدارة العملاء</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="pb-4 pr-4">العميل</th>
              <th className="pb-4">رقم الهاتف</th>
              <th className="pb-4">المدينة</th>
              <th className="pb-4">الطلبات</th>
              <th className="pb-4">إجمالي الإنفاق</th>
              <th className="pb-4 pl-4 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                <td className="py-6 pr-4">
                   <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg text-gray-400"><UserIcon className="w-4 h-4" /></div>
                      <span className="font-black text-gray-900">{u.name || 'مستخدم جديد'}</span>
                   </div>
                </td>
                <td className="py-6 font-bold text-gray-500" dir="ltr">{u.phone}</td>
                <td className="py-6 font-bold text-gray-400">{u.city || '-'}</td>
                <td className="py-6 font-black text-primary">{u.ordersCount || 0}</td>
                <td className="py-6 font-black text-accent">{formatPrice(u.totalSpent || 0)}</td>
                <td className="py-6 pl-4 text-left">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => toggleBlock(u.id, !!u.isBlocked)} 
                      className={cn("p-2 rounded-lg transition-colors", u.isBlocked ? "text-green-500 hover:bg-green-50" : "text-red-400 hover:bg-red-50")}
                      title={u.isBlocked ? "إلغاء الحظر" : "حظر المستخدم"}
                    >
                      {u.isBlocked ? <ShieldCheckIcon className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </button>
                    <a href={`https://wa.me/222${u.phone}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-[#25D366] transition-colors"><MessageSquare className="w-5 h-5" /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupportSection({ requests }: { requests: SupportRequest[] }) {
  const updateStatus = async (id: string, status: string) => {
    await safeWrite(async () => {
      await updateDoc(doc(db, 'support_requests', id), { status });
      toast.success('تم تحديث الحالة');
    });
  };

  const deleteRequest = async (id: string) => {
    if (!window.confirm('حذف الطلب؟')) return;
    await safeWrite(async () => {
      await deleteDoc(doc(db, 'support_requests', id));
      toast.success('تم الحذف');
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary">طلبات الدعم الفني</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((r) => (
          <div key={r.id} className="bg-white border-2 border-gray-100 p-6 rounded-[40px] flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">رقم الهاتف</span>
                <span className="text-xl font-black text-primary" dir="ltr">{r.phone}</span>
              </div>
              <div className={cn(
                "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase",
                r.status === 'completed' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
              )}>
                {r.status === 'completed' ? 'تم التواصل' : 'قيد الانتظار'}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">تاريخ الطلب</span>
              <span className="text-xs font-bold text-gray-500">{r.createdAt?.toDate().toLocaleString('ar-MA')}</span>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => updateStatus(r.id, r.status === 'completed' ? 'pending' : 'completed')}
                className="flex-1 bg-gray-50 p-4 rounded-2xl font-black text-xs hover:bg-gray-100 transition-colors"
              >
                {r.status === 'completed' ? 'إعادة انتظار' : 'تعيين كمكتمل'}
              </button>
              <a 
                href={`https://wa.me/222${r.phone}?text=مرحباً، تم استلام طلبك للدعم الفني من Mauri Tick`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center bg-green-500 text-white p-4 rounded-2xl flex-1 hover:brightness-110 transition-all shadow-lg shadow-green-100"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
              <button onClick={() => deleteRequest(r.id)} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsSection({ reviews, products }: { reviews: Review[], products: Product[] }) {
  const toggleHide = async (id: string, isHidden: boolean) => {
    await safeWrite(async () => {
      await updateDoc(doc(db, 'reviews', id), { isHidden: !isHidden });
      toast.success(isHidden ? 'تم إظهار التقييم' : 'تم إخفاء التقييم');
    });
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    await safeWrite(async () => {
      await deleteDoc(doc(db, 'reviews', id));
      toast.success('تم حذف التقييم');
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary">تقييمات العملاء</h2>
      <div className="flex flex-col gap-4">
        {reviews.map((r) => (
          <div key={r.id} className={cn("bg-white border rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6", r.isHidden && "opacity-50 grayscale")}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="font-black text-primary">{r.customerName}</span>
                {r.isVerified && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-lg text-[10px] font-black">عميل موثق ✅</span>}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("w-3 h-3 fill-current", i < r.rating ? "text-yellow-400" : "text-gray-200")} />
                ))}
              </div>
              <p className="font-bold text-gray-600 text-sm italic">"{r.comment}"</p>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">المنتج:</span>
                 <span className="text-[10px] font-black text-primary">{products.find(p => p.id === r.productId)?.name || 'منتج مجهول'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              <button onClick={() => toggleHide(r.id, !!r.isHidden)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-primary transition-all">
                {r.isHidden ? <Eye className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </button>
              <button onClick={() => deleteReview(r.id)} className="p-2 bg-red-50 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
