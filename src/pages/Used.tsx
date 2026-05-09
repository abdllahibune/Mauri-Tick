import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Search, SlidersHorizontal, Camera, Smartphone, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useLocation } from 'react-router-dom';

export const UsedPage: React.FC<{ products: Product[] }> = ({ products }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'sell' ? 'sell' : 'browse';
  const [activeTab, setActiveTab] = useState<'browse' | 'sell'>(initialTab);

  const usedProducts = useMemo(() => {
    return products.filter(p => p.isUsed);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-20 pt-10 px-4 md:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-2 rounded-[32px] shadow-sm flex gap-2 border border-gray-100">
            <button 
              onClick={() => setActiveTab('browse')}
              className={cn(
                "px-8 py-4 rounded-[24px] font-black transition-all",
                activeTab === 'browse' ? "bg-primary text-white shadow-xl" : "text-gray-400 hover:text-primary"
              )}
            >
              تسوق المستعمل
            </button>
            <button 
              onClick={() => setActiveTab('sell')}
              className={cn(
                "px-8 py-4 rounded-[24px] font-black transition-all",
                activeTab === 'sell' ? "bg-primary text-white shadow-xl" : "text-gray-400 hover:text-primary"
              )}
            >
              بيع جهازك
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'browse' ? (
            <motion.div 
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-12 text-center italic">
                <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter mb-4">هواتف مستعملة مضمونة</h1>
                <p className="text-gray-500 font-bold max-w-2xl mx-auto">أجهزة تم فحصها بعناية من قبل تقنيينا. احصل على أداء ممتاز بنصف السعر.</p>
              </div>

              {usedProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                  {usedProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100">
                  <div className="text-6xl mb-6">📱</div>
                  <h2 className="text-2xl font-black text-primary mb-2">لا توجد أجهزة مستعملة حالياً</h2>
                  <p className="text-gray-500 font-bold">تابعنا باستمرار، الأجهزة تضاف بشكل يومي</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="sell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {!user ? (
                <div className="bg-white rounded-[40px] p-12 md:p-20 text-center shadow-sm">
                  <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-black text-primary mb-4">للزبائن فقط 🔒</h2>
                  <p className="text-gray-500 font-bold max-w-md mx-auto mb-10 leading-relaxed">
                    خدمة البيع والتبديل متاحة فقط لزبائن Mauri Tick الذين يملكون إثبات شراء من معرضنا.
                  </p>
                  <button 
                    onClick={() => navigate('/login?redirect=/used')}
                    className="bg-primary text-white px-12 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl"
                  >
                    تسجيل الدخول للمتابعة
                  </button>
                </div>
              ) : (
                <SellForm user={user} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SellForm: React.FC<{ user: any }> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    brand: '',
    model: '',
    storage: '',
    condition: 'ممتاز' as any,
    problems: '',
  });

  const brands = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei', 'Other'];
  const conditions = [
    { title: 'ممتاز', val: 'ممتاز', desc: 'مثل الجديد تماماً، لا توجد خدوش', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'جيد', val: 'جيد', desc: 'خدوش مرئية بسيطة، يعمل بكفاءة', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'مقبول', val: 'مقبول', desc: 'مستعمل بوضوح، صدمات أو خدوش عميقة', color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'به أعطال', val: 'به أعطال', desc: 'كسر في الشاشة أو عطل تقني داخلي', color: 'text-red-600', bg: 'bg-red-50' }
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    const files = Array.from(e.target.files).slice(0, 3);
    
    try {
      const urls = await Promise.all(files.map(file => uploadToCloudinary(file)));
      setImages(prev => [...prev, ...urls.filter(u => !!u)]);
      toast.success('تم رفع الصور بنجاح');
    } catch (err) {
      toast.error('فشل رفع الصور');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.storage) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (images.length === 0) {
      toast.error('يرجى رفع صورة واحدة على الأقل لجهازك');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        userId: user.id,
        userName: user.name || 'مجهول',
        userPhone: user.phone,
        ...form,
        images,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'mt_sell_requests'), requestData);
      
      const msg = `مرحباً Mauri Tick 👋\nأريد بيع جهازي:\n\n📱 الجهاز: ${form.brand} ${form.model}\n💾 السعة: ${form.storage}\n⭐ الحالة: ${form.condition}\n🔧 المشاكل: ${form.problems || 'لا توجد'}\n📞 رقمي: ${user.phone}`;
      
      toast.success('تم إرسال طلبك بنجاح ✅');
      window.open(`https://wa.me/22236096100?text=${encodeURIComponent(msg)}`, '_blank');
      
      // Reset form
      setForm({ brand: '', model: '', storage: '', condition: 'ممتاز', problems: '' });
      setImages([]);
    } catch (err) {
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100 max-w-4xl mx-auto italic font-sans">
      <div className="mb-10 text-right">
        <h2 className="text-3xl font-black text-primary mb-2">طلب تقييم جهاز 💰</h2>
        <p className="text-gray-400 font-bold">املأ البيانات بدقة للحصول على أفضل سعر تقريبي</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 text-right">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">ماركة الجهاز</label>
            <select 
              value={form.brand}
              onChange={e => setForm({...form, brand: e.target.value})}
              required
              className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px] border border-transparent focus:border-primary/20"
            >
              <option value="">اختر الماركة</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">موديل الجهاز</label>
            <input 
              value={form.model}
              onChange={e => setForm({...form, model: e.target.value})}
              required
              placeholder="مثال: iPhone 14 Pro Max"
              className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px] border border-transparent focus:border-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">سعة التخزين</label>
          <input 
            value={form.storage}
            onChange={e => setForm({...form, storage: e.target.value})}
            required
            placeholder="مثال: 128GB / 256GB"
            className="bg-gray-50 rounded-2xl p-4 outline-none font-bold text-sm min-h-[56px] border border-transparent focus:border-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">حالة الجهاز</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {conditions.map(c => (
              <div 
                key={c.val}
                onClick={() => setForm({...form, condition: c.val})}
                className={cn(
                  "p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col gap-2",
                  form.condition === c.val ? cn("border-primary", c.bg) : "border-gray-50 bg-gray-50 hover:border-gray-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <h4 className={cn("font-black text-lg", c.color)}>{c.title}</h4>
                  {form.condition === c.val && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
                <p className="text-gray-500 font-bold text-xs">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">وصف المشاكل (إن وجدت)</label>
          <textarea 
            value={form.problems}
            onChange={e => setForm({...form, problems: e.target.value})}
            placeholder="مثال: البطارية 80%، خدش في الزاوية اليمنى..."
            className="bg-gray-50 rounded-2xl p-6 outline-none font-bold text-sm h-32 resize-none border border-transparent focus:border-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">صور الجهاز (الحد الأقصى 3)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((url, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative group">
                <img src={url} className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                {uploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Camera className="w-6 h-6 text-gray-400" />}
                <span className="text-[10px] font-black text-gray-400">إضافة صورة</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
          <CheckCircle className="w-6 h-6 text-blue-500" />
          <div className="flex-1">
             <p className="text-[10px] md:text-sm font-bold text-blue-900 italic">سيتم التواصل معك عبر الهاتف: <span className="text-primary font-black underline">{user.phone}</span></p>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-primary text-white p-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : '🚀 أرسل طلب التقييم'}
        </button>
      </form>
    </div>
  );
};
