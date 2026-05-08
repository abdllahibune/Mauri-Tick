import React, { useState, useEffect, useMemo } from 'react';
// IF IMAGES NOT UPLOADING:
// Go to Firebase Console > Authentication > 
// Sign-in method > Anonymous > Enable
// Then go to Firestore > Rules > Publish rules above
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, limit, getDocs, setDoc } from 'firebase/firestore';
import { db, safeWrite, ensureAuth } from '../lib/firebase';
import { Product, Order, StoreConfig, Coupon, TradeIn, UsedProduct, Investor, Review, SupportRequest } from '../types';
import { 
  Facebook, Instagram, Twitter, Youtube, MessageCircle, Music, Globe,
  BarChart3, Package, ShoppingCart, Settings, LogOut, Plus, Trash2, 
  Edit3, Eye, Printer, Download, MessageSquare, Tag, Users, CheckCircle2, 
  XCircle, Truck, Clock, Save, Image as ImageIcon, Loader2, User as UserIcon, ShieldAlert, ShieldCheck as ShieldCheckIcon,
  Search as SearchIcon, Palette, Smartphone, FileText, Star, Send, Gift
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

    const unsubProducts = onSnapshot(query(collection(db, 'mt_products'), orderBy('createdAt', 'desc')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    const unsubOrders = onSnapshot(query(collection(db, 'mt_orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });
    const unsubCoupons = onSnapshot(collection(db, 'mt_coupons'), (snap) => {
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    });
    const unsubConfig = onSnapshot(doc(db, 'mt_settings', 'general'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
    const unsubUsers = onSnapshot(query(collection(db, 'mt_users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });
    const unsubTradeIns = onSnapshot(query(collection(db, 'mt_tradein'), orderBy('createdAt', 'desc')), (snap) => {
      setTradeIns(snap.docs.map(d => ({ id: d.id, ...d.data() } as TradeIn)));
    });
    const unsubUsedProducts = onSnapshot(query(collection(db, 'mt_sell_listings'), orderBy('createdAt', 'desc')), (snap) => {
      setUsedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as UsedProduct)));
    });
    const unsubInvestors = onSnapshot(query(collection(db, 'mt_investors'), orderBy('createdAt', 'desc')), (snap) => {
      setInvestors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Investor)));
    });
    const unsubReviews = onSnapshot(query(collection(db, 'mt_reviews'), orderBy('createdAt', 'desc')), (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    });
    const unsubSupport = onSnapshot(query(collection(db, 'mt_support_requests'), orderBy('createdAt', 'desc')), (snap) => {
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
    <div className="max-w-[1600px] mx-auto px-4 py-8 md:py-12 pb-32 md:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-12">
        {/* Sidebar / Bottom Nav */}
        <aside className="fixed bottom-0 left-0 right-0 bg-primary text-accent lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:bg-white lg:p-6 lg:rounded-[40px] lg:shadow-lg lg:border lg:border-gray-100 lg:h-fit lg:sticky lg:top-32 z-[1000] lg:z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] lg:shadow-lg">
           <div className="hidden lg:flex flex-col gap-2 mb-12 px-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">موري تيك</span>
              <h2 className="text-2xl font-black text-primary leading-none">مدير المتجر</h2>
           </div>

           <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible p-2 lg:p-0">
              {[
                { id: 'stats', name: 'إحصائيات', icon: BarChart3 },
                { id: 'products', name: 'منتجات', icon: Package },
                { id: 'orders', name: 'طلبات', icon: ShoppingCart },
                { id: 'coupons', name: 'كوبونات', icon: Tag },
                { id: 'customers', name: 'عملاء', icon: Users },
                { id: 'notifications', name: 'إشعارات', icon: MessageSquare },
                { id: 'trade-ins', name: 'استبدال', icon: Smartphone },
                { id: 'used', name: 'مستعمل', icon: Package },
                { id: 'reviews', name: 'تقييمات', icon: Star },
                { id: 'support', name: 'دعم', icon: MessageCircle },
                { id: 'investors', name: 'مستثمرون', icon: BarChart3 },
                { id: 'settings', name: 'إعدادات', icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-3 lg:p-4 rounded-xl lg:rounded-2xl font-bold transition-all min-w-[70px] lg:min-w-0 transition-all",
                    activeTab === item.id 
                      ? "bg-accent text-primary lg:bg-primary lg:text-accent shadow-lg" 
                      : "text-white/60 lg:text-gray-500 hover:bg-white/10 lg:hover:bg-gray-50"
                  )}
                >
                  <item.icon className="w-5 h-5" /> 
                  <span className="text-[10px] lg:text-sm whitespace-nowrap">{item.name}</span>
                </button>
              ))}
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="hidden lg:flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-red-400 hover:bg-red-50 mt-12"
              >
                <LogOut className="w-5 h-5" /> تسجيل خروج
              </button>
           </nav>
        </aside>

        {/* Content */}
        <main className="bg-white rounded-3xl lg:rounded-[40px] shadow-lg border border-gray-100 p-4 md:p-8 lg:p-12 min-h-screen lg:min-h-[800px] overflow-hidden">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
             >
                {activeTab === 'stats' && <StatsSection orders={orders} products={products} />}
                {activeTab === 'products' && <ProductsSection products={products} />}
                {activeTab === 'orders' && <OrdersSection orders={orders} />}
                {activeTab === 'coupons' && <CouponsSection coupons={coupons} />}
                {activeTab === 'settings' && <SettingsSection config={config} />}
                {activeTab === 'customers' && <UsersSection users={users} orders={orders} />}
                {activeTab === 'notifications' && <NotificationsSection users={users} />}
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
    await safeWrite(() => deleteDoc(doc(db, 'mt_products', id)));
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-primary">إدارة المنتجات</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full md:w-auto bg-primary text-white px-6 py-4 md:py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" /> إضافة منتج جديد
        </button>
      </div>

      <div className="admin-table-container">
        <table className="w-full text-right min-w-[800px]">
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
                    <button onClick={() => setEditingProduct(p)} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-primary"><Edit3 className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
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
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  const categories = [
    { id: 'هواتف ذكية', name: 'هواتف ذكية', specs: ['screen', 'processor', 'RAM', 'storage', 'battery', 'camera', 'OS', 'colors'] },
    { id: 'لابتوب وحاسوب', name: 'لابتوب وحاسوب', specs: ['screen size', 'processor', 'RAM', 'storage', 'battery', 'OS', 'GPU', 'ports'] },
    { id: 'سماعات وصوتيات', name: 'سماعات وصوتيات', specs: ['type', 'connectivity', 'battery life', 'frequency response'] },
    { id: 'شاشات وتلفزيونات', name: 'شاشات وتلفزيونات', specs: ['size', 'resolution', 'panel type', 'refresh rate', 'ports', 'smart/not'] },
    { id: 'إكسسوارات', name: 'إكسسوارات', specs: ['compatibility', 'material', 'dimensions'] },
    { id: 'قطع غيار', name: 'قطع غيار', specs: ['compatibility', 'material', 'dimensions'] },
    { id: 'أجهزة لوحية', name: 'أجهزة لوحية', specs: ['screen', 'processor', 'RAM', 'storage', 'battery', 'camera', 'OS'] },
    { id: 'كاميرات', name: 'كاميرات', specs: ['sensor', 'resolution', 'lens', 'battery', 'weight'] },
    { id: 'أخرى', name: 'أخرى', specs: ['details'] },
  ];

  const [form, setForm] = useState<Partial<Product>>(initial || {
    name: '',
    category: 'هواتف ذكية',
    brand: '',
    price: 0,
    discount: 0,
    stock: 0,
    description: '',
    images: [],
    suggestedAccessories: [],
    bundleAccessoryIds: [],
    specifications: {}
  });

  const currentCategory = categories.find(c => c.id === form.category) || categories[0];

  useEffect(() => {
    getDocs(collection(db, 'mt_products')).then(snap => {
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
  }, []);

  const handleAddImageUrl = () => {
    if (!imageUrlInput) return;
    if ((form.images?.length || 0) >= 5) {
      toast.error('الحد الأقصى هو 5 صور');
      return;
    }
    setForm(prev => ({ ...prev, images: [...(prev.images || []), imageUrlInput] }));
    setImageUrlInput('');
    toast.success('تمت إضافة رابط الصورة بنجاح');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || (form.images?.length || 0) === 0) {
      toast.error('يرجى ملء جميع الحقول ورفع صورة واحدة على الأقل');
      return;
    }

    setLoading(true);
    await safeWrite(async () => {
      const productData = {
        ...form,
        price: Number(form.price),
        discount: Number(form.discount) || 0,
        stock: Number(form.stock) || 0,
        updatedAt: serverTimestamp()
      };

      if (initial) {
        await updateDoc(doc(db, 'mt_products', initial.id), productData);
        toast.success('تم تحديث المنتج بنجاح ✅');
      } else {
        await addDoc(collection(db, 'mt_products'), { 
          ...productData, 
          soldCount: 0, 
          viewCount: 0, 
          createdAt: serverTimestamp(),
          featured: form.isFeatured || false
        });
        toast.success('تم حفظ المنتج بنجاح ✅');
      }
      onClose();
    });
    setLoading(false);
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ('files' in e.target && e.target.files) {
        files = e.target.files;
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
        files = e.dataTransfer.files;
    }
    
    if (!files) return;

    const remainingSpots = 5 - (form.images?.length || 0);
    const filesToUpload = Array.from(files).slice(0, remainingSpots);

    if (filesToUpload.length === 0 && files.length > 0) {
        toast.error('الحد الأقصى هو 5 صور للمنتج الواحد');
        return;
    }

    for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        const fileId = Math.random().toString(36).substring(7);
        try {
            const url = await uploadToCloudinary(file, (progress) => {
                setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
            });

            if (url) {
                setForm(prev => ({ ...prev, images: [...(prev.images || []), url] }));
            }

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

  const toggleAccessory = (id: string, isBundle: boolean = false) => {
    setForm(prev => {
        const key = isBundle ? 'bundleAccessoryIds' : 'suggestedAccessories';
        const current = (prev as any)[key] || [];
        if (current.includes(id)) {
            return { ...prev, [key]: current.filter((x: string) => x !== id) };
        } else {
            return { ...prev, [key]: [...current, id] };
        }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center lg:p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full lg:max-w-6xl h-full lg:h-auto lg:max-h-[90vh] overflow-y-auto rounded-none lg:rounded-[40px] shadow-2xl p-6 md:p-12 relative"
      >
        <button onClick={onClose} className="absolute top-6 left-6 p-4 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors z-10"><XCircle className="w-6 h-6" /></button>
        <h3 className="text-2xl md:text-3xl font-black text-primary mb-8 md:mb-12 mt-4 md:mt-0">{initial ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-right" dir="rtl">
            <div className="flex flex-col gap-6">
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">فئة المنتج</label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value, specifications: {}})} 
                    className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">اسم المنتج</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px]" />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">الماركة</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} required className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px]" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">السعر</label>
                    <input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} required className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px]" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الخصم %</label>
                    <input type="number" value={form.discount} onChange={e => setForm({...form, discount: parseFloat(e.target.value)})} className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px]" />
                 </div>
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">المخزون</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} required className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px]" />
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">الوصف</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm h-32 resize-none" />
               </div>
               
               <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col gap-4">
                  <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">إكسسوارات مقترحة (للعرض فقط)</h4>
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

               <div className="bg-primary/5 p-6 rounded-[32px] flex flex-col gap-4 border border-primary/10">
                  <h4 className="font-black text-primary text-[10px] uppercase tracking-widest">إكسسوارات الباقة (Bundle Offers) 🎁</h4>
                  <p className="text-[10px] font-bold text-gray-400 -mt-2">اختر المنتجات التي ستؤلف "باقة" مع هذا المنتج للحصول على خصم إضافي</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                     {allProducts.filter(p => p.id !== initial?.id).map(p => (
                       <button 
                        key={p.id}
                        type="button"
                        onClick={() => toggleAccessory(p.id, true)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold transition-all",
                          form.bundleAccessoryIds?.includes(p.id) ? "bg-accent text-primary" : "bg-white text-gray-400 hover:bg-gray-100"
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
                  <label className="text-xs font-bold text-gray-500 mr-2">صور المنتج (الحد الأقصى 5)</label>
                  <div className="flex flex-col gap-4">
                    {/* Upload Area */}
                    {(form.images?.length || 0) < 5 && (
                      <label 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleImgUpload(e as any);
                        }}
                        className="w-full h-48 md:h-64 border-4 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="bg-white p-4 rounded-2xl shadow-sm text-gray-400 group-hover:text-primary transition-colors">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <div className="text-center px-4">
                          <p className="font-black text-gray-600 text-sm">اضغط للرفع أو اسحب الصور هنا</p>
                          <p className="text-[10px] font-bold text-gray-400">جميع الصيغ مدعومة (Max 10MB)</p>
                        </div>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImgUpload} />
                      </label>
                    )}

                    {/* Add by URL */}
                    {(form.images?.length || 0) < 5 && (
                      <div className="flex gap-2">
                        <input 
                          value={imageUrlInput}
                          onChange={e => setImageUrlInput(e.target.value)}
                          placeholder="أو أضف رابط الصورة مباشرة..."
                          className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-xs font-bold outline-none border border-transparent focus:border-primary/30"
                        />
                        <button 
                          type="button"
                          onClick={handleAddImageUrl}
                          className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm"
                        >
                          إضافة رابط
                        </button>
                      </div>
                    )}

                    {/* Progress Bars */}
                    {Object.entries(uploadProgress).map(([id, prog]) => (
                      <div key={id} className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-primary text-[10px]">جاري الرفع... {prog}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all" 
                            style={{ width: `${prog}%` }} 
                          />
                        </div>
                      </div>
                    ))}

                    {/* Previews */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {form.images?.map((url, i) => (
                        <div key={i} className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative group border-2 border-transparent hover:border-primary/20 transition-all shadow-sm">
                           <img src={url} className="w-full h-full object-cover" />
                           {i === 0 && (
                             <div className="absolute top-2 right-2 bg-primary text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">صورة رئيسية</div>
                           )}
                           <button 
                            type="button" 
                            onClick={() => setForm(prev => ({...prev, images: prev.images?.filter((_, idx)=>idx!==i)}))} 
                            className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                           >
                            <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="bg-gray-100/50 p-6 rounded-[32px] grid grid-cols-2 gap-4">
                  <h4 className="col-span-2 font-black text-gray-400 text-[10px] uppercase tracking-widest mb-2">المواصفات التقنية</h4>
                  {currentCategory.specs.map((key) => {
                    const labelMap: any = {
                      'screen': 'الشاشة',
                      'processor': 'المعالج',
                      'RAM': 'الرام',
                      'storage': 'التخزين',
                      'battery': 'البطارية',
                      'camera': 'الكاميرا',
                      'OS': 'نظام التشغيل',
                      'colors': 'الألوان',
                      'screen size': 'حجم الشاشة',
                      'GPU': 'كرت الشاشة',
                      'ports': 'المنافذ',
                      'type': 'النوع',
                      'connectivity': 'الاتصال',
                      'battery life': 'عمر البطارية',
                      'frequency response': 'استجابة التردد',
                      'size': 'المقاس',
                      'resolution': 'الدقة',
                      'panel type': 'نوع اللوحة',
                      'refresh rate': 'معدل التحديث',
                      'smart/not': 'ذكي / عادي',
                      'compatibility': 'التوافق',
                      'material': 'المادة',
                      'dimensions': 'الأبعاد',
                      'sensor': 'المستشعر',
                      'lens': 'العدسة',
                      'weight': 'الوزن',
                      'details': 'تفاصيل أخرى'
                    };
                    
                    return (
                      <div key={key} className={cn("flex flex-col gap-1", key === 'details' ? "col-span-2" : "col-span-1")}>
                        <label className="text-[10px] font-black text-gray-400 uppercase">{labelMap[key] || key}</label>
                        {key === 'details' ? (
                          <textarea 
                            value={(form.specifications as any)?.[key] || ''} 
                            onChange={e => setForm({...form, specifications: {...form.specifications, [key]: e.target.value}})} 
                            className="bg-white rounded-lg p-3 text-xs outline-none min-h-[100px] font-bold"
                            placeholder="اكتب مواصفات المنتج هنا..."
                          />
                        ) : (
                          <input 
                            value={(form.specifications as any)?.[key] || ''} 
                            onChange={e => setForm({...form, specifications: {...form.specifications, [key]: e.target.value}})} 
                            className="bg-white rounded-lg p-2 text-xs outline-none font-bold" 
                            placeholder={labelMap[key] || key}
                          />
                        )}
                      </div>
                    );
                  })}
               </div>

               <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl">
                 <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} id="isFeatured" className="w-5 h-5 accent-primary" />
                 <label htmlFor="isFeatured" className="text-sm font-bold text-primary">تمييز المنتج كـ "Featured"</label>
               </div>
            </div>

            <button type="submit" disabled={loading} className="md:col-span-2 bg-primary text-white p-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 mt-4 shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50">
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
      await updateDoc(doc(db, 'mt_orders', id), { status });
      toast.success('تم تحديث حالة الطلب');
    });
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-primary">إدارة الطلبات</h2>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['الكل', 'قيد الانتظار', 'تم التأكيد', 'تم الشحن', 'تم التسليم'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap", filter === f ? "bg-primary text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {filtered.map((order) => (
           <div key={order.id} className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
              <div className="flex flex-col gap-2 min-w-[200px] w-full md:w-auto">
                 <div className="flex items-center gap-3">
                    <div className="bg-primary/5 text-primary w-12 h-12 rounded-xl flex items-center justify-center font-black shrink-0" dir="ltr">#{order.orderNumber.slice(-4)}</div>
                    <div className="flex flex-col overflow-hidden">
                       <span className="text-sm font-black text-primary truncate">{order.customerName}</span>
                       <span className="text-xs font-bold text-gray-400" dir="ltr">{order.phone}</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 flex flex-col gap-4 w-full">
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

              <div className="flex flex-row md:flex-col gap-4 items-center md:items-end w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                 <div className="flex items-center gap-2 flex-1 md:flex-none">
                    <button onClick={() => window.open(order.paymentProofUrl)} className="text-xs font-bold text-primary underline flex items-center gap-1 hover:text-accent transition-colors"><ImageIcon className="w-4 h-4" /> الإيصال</button>
                    <a href={`https://wa.me/222${order.phone}`} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white p-3 rounded-xl"><MessageSquare className="w-5 h-5" /></a>
                 </div>
                 <select 
                   value={order.status} 
                   onChange={(e) => updateStatus(order.id, e.target.value)}
                   className={cn(
                     "border-none rounded-xl px-4 py-3 md:py-2 text-xs font-black outline-none min-h-[48px] flex-1 md:flex-none",
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
    socialLinks: { 
      facebook: '', 
      instagram: '', 
      tiktok: '',
      whatsapp: '',
      twitter: '',
      youtube: '',
      other: ''
    }
  });

  const handleSave = async () => {
    await safeWrite(async () => {
      // Use mt_settings/general as requested
      await setDoc(doc(db, 'mt_settings', 'general'), { ...form }, { merge: true });
      toast.success('تم حفظ الإعدادات وتطبيق الألوان بنجاح ✅');
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

          {/* Lucky Wheel Settings */}
           <section id="lucky-wheel-settings" className="flex flex-col gap-8 md:col-span-2 shadow-2xl shadow-gray-200/50 bg-white p-8 md:p-12 rounded-[48px]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-accent/10 p-2 rounded-xl text-accent"><Gift className="w-5 h-5" /></div>
                    <h3 className="font-black text-gray-700">إعدادات عجلة الحظ</h3>
                 </div>
                 <button 
                   onClick={() => setForm({...form, wheelSettings: { 
                     isActive: !form.wheelSettings?.isActive,
                     prizes: form.wheelSettings?.prizes || [
                       { text: 'خصم 5%', type: 'percent', value: 5, probability: 35, color: '#FF6B6B' },
                       { text: 'خصم 10%', type: 'percent', value: 10, probability: 25, color: '#4ECDC4' },
                       { text: 'شحن مجاني', type: 'shipping', value: 0, probability: 20, color: '#45B7D1' },
                       { text: 'خصم 15%', type: 'percent', value: 15, probability: 12, color: '#96CEB4' },
                       { text: 'هدية مفاجئة', type: 'gift', value: 0, probability: 5, color: '#FFEAA7' },
                       { text: 'خصم 20%', type: 'percent', value: 20, probability: 3, color: '#DDA0DD' }
                     ],
                     totalSpins: form.wheelSettings?.totalSpins || 0,
                     totalCodesUsed: form.wheelSettings?.totalCodesUsed || 0
                   }})}
                   className={cn(
                     "w-12 h-6 rounded-full relative transition-all",
                     form.wheelSettings?.isActive ? "bg-green-500" : "bg-gray-200"
                   )}
                 >
                   <div className={cn(
                     "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                     form.wheelSettings?.isActive ? (isRTL ? "right-1" : "left-7") : (isRTL ? "right-7" : "left-1")
                   )} />
                 </button>
              </div>

              {form.wheelSettings?.isActive && (
                <div className="flex flex-col gap-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                         <span className="text-[10px] font-bold text-gray-400 block uppercase">إجمالي الدورات</span>
                         <span className="text-xl font-black text-primary">{form.wheelSettings.totalSpins}</span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                         <span className="text-[10px] font-bold text-gray-400 block uppercase">أكواد مستخدمة</span>
                         <span className="text-xl font-black text-accent">{form.wheelSettings.totalCodesUsed}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {form.wheelSettings.prizes.map((prize, idx) => (
                        <div key={idx} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-4 relative">
                           <div className="w-4 h-4 rounded-full absolute top-4 left-4" style={{ backgroundColor: prize.color }} />
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase">نص الجائزة</label>
                              <input 
                                value={prize.text} 
                                onChange={e => {
                                  const newPrizes = [...form.wheelSettings!.prizes];
                                  newPrizes[idx] = { ...prize, text: e.target.value };
                                  setForm({ ...form, wheelSettings: { ...form.wheelSettings!, prizes: newPrizes } });
                                }}
                                className="bg-white rounded-xl p-3 text-sm font-bold outline-none"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-400">القيمة</label>
                                <input 
                                  type="number"
                                  value={prize.value} 
                                  onChange={e => {
                                    const newPrizes = [...form.wheelSettings!.prizes];
                                    newPrizes[idx] = { ...prize, value: parseFloat(e.target.value) || 0 };
                                    setForm({ ...form, wheelSettings: { ...form.wheelSettings!, prizes: newPrizes } });
                                  }}
                                  className="bg-white rounded-xl p-2 text-xs font-bold outline-none"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-400">الاحتمالية %</label>
                                <input 
                                  type="number"
                                  value={prize.probability} 
                                  onChange={e => {
                                    const newPrizes = [...form.wheelSettings!.prizes];
                                    newPrizes[idx] = { ...prize, probability: parseFloat(e.target.value) || 0 };
                                    setForm({ ...form, wheelSettings: { ...form.wheelSettings!, prizes: newPrizes } });
                                  }}
                                  className="bg-white rounded-xl p-2 text-xs font-bold outline-none"
                                />
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </section>

           {/* Social Media Links */}
          <section className="flex flex-col gap-8 md:col-span-2">
             <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Globe className="w-5 h-5" /></div>
                <h3 className="font-black text-gray-700">روابط التواصل الاجتماعي</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-8 rounded-[40px]">
                {[
                  { label: 'فيسبوك', key: 'facebook', icon: Facebook, placeholder: 'رابط صفحة فيسبوك', color: 'text-[#1877F2]' },
                  { label: 'إنستغرام', key: 'instagram', icon: Instagram, placeholder: 'رابط حساب إنستغرام', color: 'text-[#E1306C]' },
                  { label: 'تيك توك', key: 'tiktok', icon: Music, placeholder: 'رابط حساب تيك توك', color: 'text-black' },
                  { label: 'واتساب', key: 'whatsapp', icon: MessageCircle, placeholder: 'رقم واتساب بدون +', color: 'text-[#25D366]' },
                  { label: 'تويتر / X', key: 'twitter', icon: Twitter, placeholder: 'رابط حساب تويتر', color: 'text-black' },
                  { label: 'يوتيوب', key: 'youtube', icon: Youtube, placeholder: 'رابط قناة يوتيوب', color: 'text-[#FF0000]' },
                  { label: 'موقع آخر', key: 'other', icon: Globe, placeholder: 'رابط موقع خارجي', color: 'text-primary' },
                ].map((social) => (
                  <div key={social.key} className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-2">
                      <social.icon className={cn("w-4 h-4", social.color)} />
                      {social.label}
                    </label>
                    <input 
                      value={(form.socialLinks as any)?.[social.key] || ''} 
                      onChange={e => setForm({
                        ...form, 
                        socialLinks: { ...form.socialLinks, [social.key]: e.target.value } 
                      })} 
                      placeholder={social.placeholder}
                      className="bg-white rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20 font-bold text-sm"
                      dir={social.key === 'whatsapp' ? 'ltr' : 'auto'}
                    />
                  </div>
                ))}
                <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-4">
                  <button onClick={handleSave} className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">حفظ روابط التواصل</button>
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
      await updateDoc(doc(db, 'mt_tradein', id), { status, updatedAt: serverTimestamp() });
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
      await updateDoc(doc(db, 'mt_sell_listings', id), { status, updatedAt: serverTimestamp() });
      toast.success('تم تحديث حالة العرض');
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-3xl font-black text-primary">سوق المستعمل (C2C)</h2>
      <div className="admin-table-container">
        <table className="w-full text-right min-w-[800px]">
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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const toggleBlock = async (id: string, isBlocked: boolean) => {
    await safeWrite(async () => {
      await setDoc(doc(db, 'mt_users', id), { isBlocked: !isBlocked }, { merge: true });
      toast.success(isBlocked ? 'تم فك حظر المستخدم' : 'تم حظر المستخدم');
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-primary">إدارة العملاء</h2>
        <button 
          onClick={() => setShowNotificationModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <MessageSquare className="w-5 h-5" /> إرسال إشعار للكل
        </button>
      </div>

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
                      onClick={() => { setSelectedUser(u); setShowNotificationModal(true); }}
                      className="p-2 text-primary hover:bg-primary/5 rounded-lg"
                      title="إرسال إشعار"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toggleBlock(u.id, !!u.isBlocked)} 
                      className={cn("p-2 rounded-lg transition-colors", u.isBlocked ? "text-green-500 hover:bg-green-50" : "text-red-400 hover:bg-red-50")}
                      title={u.isBlocked ? "إلغاء الحظر" : "حظر المستخدم"}
                    >
                      {u.isBlocked ? <ShieldCheckIcon className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </button>
                    <a href={`https://wa.me/222${u.phone}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-[#25D366] transition-colors"><MessageCircle className="w-5 h-5" /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNotificationModal && (
        <NotificationModal 
          targetUser={selectedUser} 
          onClose={() => { setShowNotificationModal(false); setSelectedUser(null); }} 
        />
      )}
    </div>
  );
}

function NotificationModal({ targetUser, onClose }: { targetUser: UserProfile | null, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    link: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error('يرجى إدخال العنوان والرسالة');

    setLoading(true);
    await safeWrite(async () => {
      await addDoc(collection(db, 'mt_notifications'), {
        title: form.title,
        message: form.message,
        link: form.link || '',
        targetUserIds: targetUser ? [targetUser.id] : 'all',
        readBy: [],
        createdAt: serverTimestamp()
      });
      toast.success(targetUser ? `تم إرسال الإشعار لـ ${targetUser.name}` : 'تم إرسال الإشعار للجميع');
      onClose();
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 flex flex-col gap-8 relative">
        <button onClick={onClose} className="absolute top-8 left-8 text-gray-400 hover:text-red-500"><XCircle className="w-8 h-8" /></button>
        <div className="text-center">
          <h3 className="text-2xl font-black text-primary mb-2">إرسال إشعار</h3>
          <p className="text-sm font-bold text-gray-400">
             المستهدف: {targetUser ? <span className="text-primary">{targetUser.name}</span> : <span className="text-accent underline">جميع العملاء</span>}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-right">
           <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-500 mr-2 text-right">عنوان الإشعار</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="مثلاً: خصم جديد!" className="bg-gray-50 rounded-2xl p-4 font-bold outline-none" required />
           </div>
           <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-500 mr-2 text-right">محتوى الرسالة</label>
              <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="اكتب تفاصيل الإشعار هنا..." className="bg-gray-50 rounded-2xl p-4 font-bold outline-none h-32 resize-none" required />
           </div>
           <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-500 mr-2 text-right">الرابط (اختياري)</label>
              <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://example.com" className="bg-gray-50 rounded-2xl p-4 font-bold outline-none placeholder:font-normal" dir="ltr" />
           </div>
           
           <button 
             disabled={loading}
             className="bg-primary text-white p-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-105 transition-all disabled:bg-gray-200 shadow-xl shadow-primary/20"
           >
             {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
             إرسال الآن
           </button>
        </form>
      </motion.div>
    </div>
  );
}

function NotificationsSection({ users }: { users: UserProfile[] }) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'mt_notifications'), orderBy('createdAt', 'desc')), (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('حذف هذا الإشعار؟')) return;
    await safeWrite(() => deleteDoc(doc(db, 'mt_notifications', id)));
  };

  return (
    <div className="flex flex-col gap-8">
       <h2 className="text-3xl font-black text-primary">تاريخ الإشعارات</h2>
       <div className="flex flex-col gap-4">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm flex flex-col md:flex-row justify-between gap-6">
               <div className="flex flex-col gap-2">
                  <h4 className="font-black text-primary">{n.title}</h4>
                  <p className="text-sm font-bold text-gray-500">{n.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                     <span className="text-[10px] font-black bg-primary/5 text-primary px-2 py-1 rounded">
                        المقروء بواسطة: {n.readBy?.length || 0} شخص
                     </span>
                     <span className="text-[10px] font-bold text-gray-400">
                        المؤلف من: {n.targetUserIds === 'all' ? 'الكل' : `${n.targetUserIds.length} مستخدم`}
                     </span>
                  </div>
               </div>
               <button onClick={() => handleDelete(n.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl self-end md:self-center transition-colors"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
          {notifications.length === 0 && <div className="text-center py-20 text-gray-400 font-bold">لا توجد إشعارات مرسلة بعد</div>}
       </div>
    </div>
  );
}

function SupportSection({ requests }: { requests: SupportRequest[] }) {
  const updateStatus = async (id: string, status: string) => {
    await safeWrite(async () => {
      await updateDoc(doc(db, 'mt_support_requests', id), { status });
      toast.success('تم تحديث الحالة');
    });
  };

  const deleteRequest = async (id: string) => {
    if (!window.confirm('حذف الطلب؟')) return;
    await safeWrite(async () => {
      await deleteDoc(doc(db, 'mt_support_requests', id));
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
      await updateDoc(doc(db, 'mt_reviews', id), { isHidden: !isHidden });
      toast.success(isHidden ? 'تم إظهار التقييم' : 'تم إخفاء التقييم');
    });
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    await safeWrite(async () => {
      await deleteDoc(doc(db, 'mt_reviews', id));
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
