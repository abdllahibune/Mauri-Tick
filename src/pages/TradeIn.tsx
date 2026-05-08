import React, { useState, useEffect } from 'react';
import { db, safeWrite, ensureAuth } from '../lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Product, TradeIn } from '../types';
import { uploadToCloudinary } from '../lib/cloudinary';
import { formatPrice } from '../lib/utils';
import { 
  Smartphone, Calculator, Image as ImageIcon, CheckCircle2, 
  ArrowRight, ArrowLeft, Loader2, ShieldCheck, Upload, Trash2,
  Laptop, Tablet, Headphones, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const CONDITIONS = [
  { id: 'excellent', label: 'ممتاز', multiplier: 0.8, color: 'text-green-500', bg: 'bg-green-50', desc: 'مثل الجديد تماماً، لا يوجد أي خدوش' },
  { id: 'good', label: 'جيد', multiplier: 0.6, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'خدوش بسيطة جداً وغير مؤثرة' },
  { id: 'fair', label: 'مقبول', multiplier: 0.4, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'خدوش واضحة أو عيوب بسيطة' },
  { id: 'broken', label: 'به أعطال', multiplier: 0.2, color: 'text-red-500', bg: 'bg-red-50', desc: 'مشاكل في القطع أو كسر واضح' }
];

const CATEGORIES = [
  { id: 'هاتف', label: 'هاتف ذكي', icon: Smartphone, brands: ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei', 'Other'] },
  { id: 'لابتوب', label: 'لابتوب', icon: Laptop, brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Other'] },
  { id: 'تابلت', label: 'تابلت', icon: Tablet, brands: ['Apple', 'Samsung', 'Lenovo', 'Other'] },
  { id: 'سماعات', label: 'سماعات', icon: Headphones, brands: ['Apple', 'Samsung', 'Bose', 'Sony', 'Other'] },
  { id: 'أخرى', label: 'أخرى', icon: Globe, brands: ['Other'] },
];

export function TradeInPage() {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    category: 'هاتف',
    brand: 'Apple',
    oldPhoneModel: '',
    storage: '',
    condition: 'good',
    photos: [] as string[],
    targetPhoneId: '',
    basePrice: 150000 // In Ouguiya (MRU)
  });

  useEffect(() => {
    ensureAuth();
    const unsubscribe = onSnapshot(collection(db, 'mt_products'), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsubscribe();
  }, []);

  const currentCategory = CATEGORIES.find(c => c.id === formData.category) || CATEGORIES[0];
  const currentCondition = CONDITIONS.find(c => c.id === formData.condition);
  const estimatedValue = formData.basePrice * (currentCondition?.multiplier || 0);
  const targetPhone = products.find(p => p.id === formData.targetPhoneId);

  // Update base price based on category/brand/model (simulated)
  useEffect(() => {
    let base = 150000;
    if (formData.category === 'لابتوب') base = 250000;
    if (formData.category === 'تيبلت') base = 100000;
    if (formData.category === 'سماعات') base = 40000;
    if (formData.brand === 'Apple') base *= 1.2;
    setFormData(prev => ({ ...prev, basePrice: base }));
  }, [formData.category, formData.brand]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newPhotos = [...formData.photos];

    for (let i = 0; i < files.length; i++) {
        try {
            const url = await uploadToCloudinary(files[i], (p) => setProgress(p));
            if (url) newPhotos.push(url);
        } catch (err) {
            toast.error('فشل رفع إحدى الصور');
        }
    }

    setFormData({ ...formData, photos: newPhotos.slice(0, 5) });
    setUploading(false);
    setProgress(0);
  };

  const removePhoto = (index: number) => {
    setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.customerPhone) {
        return toast.error('يرجى إكمال بيانات الاتصال');
    }
    
    setLoading(true);
    await safeWrite(async () => {
        await addDoc(collection(db, 'mt_tradein'), {
            ...formData,
            estimatedValue,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // WhatsApp notification
        const message = `طلب استبدال جديد! 🔄%0Aالاسم: ${formData.customerName}%0Aالهاتف: ${formData.customerPhone}%0Aالفئة: ${formData.category}%0Aالجهاز القديم: ${formData.brand} ${formData.oldPhoneModel} (${currentCondition?.label})%0Aالقيمة المقدرة: ${formatPrice(estimatedValue)}%0Aالجهاز المنشود: ${targetPhone?.name || 'لم يحدد'}`;
        window.open(`https://wa.me/22236096100?text=${message}`);

        setStep(4);
        toast.success('تم إرسال طلبك بنجاح! 🎉');
    });
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12" dir="rtl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-primary mb-4">خدمة الاستبدال الاحترافية</h1>
        <p className="text-gray-500 font-bold">حول جهازك القديم إلى رصيد لشراء جهازك الجديد في دقائق</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-4 mb-16 px-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-3 transition-all ${step >= s ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform ${
                step === s ? 'bg-primary text-white scale-110 rotate-3' : 
                step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              <span className={`hidden md:block font-black text-sm ${step >= s ? 'text-primary' : 'text-gray-400'}`}>
                {s === 1 ? 'تفاصيل جهازك' : s === 2 ? 'القيمة والمقترح' : 'تأكيد الطلب'}
              </span>
            </div>
            {s < 3 && <div className={`w-12 md:w-20 h-1 rounded-full ${step > s ? 'bg-green-500' : 'bg-gray-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-primary/5 border border-gray-100 p-8 md:p-12 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col gap-10"
            >
              <div className="flex flex-col gap-4">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">اختر فئة الجهاز</label>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFormData({...formData, category: cat.id, brand: cat.brands[0]})}
                        className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden group ${
                          formData.category === cat.id ? 'border-primary bg-primary text-white shadow-xl scale-105' : 'border-gray-50 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                         <cat.icon className={`w-8 h-8 ${formData.category === cat.id ? 'text-accent' : 'text-primary'}`} />
                         <span className="font-black text-sm">{cat.label}</span>
                         {formData.category === cat.id && <motion.div layoutId="glow" className="absolute inset-0 bg-white/10" />}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-gray-400 mr-2">الماركة</label>
                    <select 
                      value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                      className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                    >
                      {currentCategory.brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-black text-gray-400 mr-2">الموديل (مثلاً: MacBook Air M2)</label>
                    <input 
                      value={formData.oldPhoneModel}
                      onChange={e => setFormData({...formData, oldPhoneModel: e.target.value})}
                      placeholder="اكتب الموديل هنا..."
                      className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                    />
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-gray-400 mr-2">المواصفات (التخزين/الرام)</label>
                  <input 
                    value={formData.storage}
                    onChange={e => setFormData({...formData, storage: e.target.value})}
                    placeholder="مثال: 256GB / 8GB RAM"
                    className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                  />
              </div>

              <div className="flex flex-col gap-4">
                 <label className="text-xs font-black text-gray-400 mr-2">حالة الجهاز (كن دقيقاً)</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CONDITIONS.map((cond) => (
                      <button
                        key={cond.id}
                        onClick={() => setFormData({...formData, condition: cond.id})}
                        className={`p-6 rounded-3xl border-2 text-right transition-all flex items-center gap-4 ${
                          formData.condition === cond.id 
                            ? `border-primary ${cond.bg}` 
                            : 'border-gray-50 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${cond.color} ${cond.bg} border-2 border-current shadow-sm`}>
                            {cond.multiplier * 100}%
                         </div>
                         <div className="flex-1">
                            <h4 className={`font-black ${cond.color} text-lg`}>{cond.label}</h4>
                            <p className="text-xs font-bold text-gray-400 leading-tight">{cond.desc}</p>
                         </div>
                         {formData.condition === cond.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <label className="text-xs font-black text-gray-400 mr-2">صور من جهازك (3 صور على الأقل)</label>
                 <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {formData.photos.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 group">
                         <img src={url} className="w-full h-full object-cover" alt="Device" />
                         <button 
                           onClick={() => removePhoto(i)}
                           className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                    {formData.photos.length < 5 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                         <Upload className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
                         <span className="text-[10px] font-black mt-1 text-gray-400">إضافة</span>
                         <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    )}
                 </div>
                 {uploading && (
                   <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-center text-[10px] font-black text-primary">
                        <span>جاري الرفع...</span>
                        <span>{Math.round(progress)}%</span>
                     </div>
                     <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                     </div>
                   </div>
                 )}
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!formData.oldPhoneModel || !formData.storage || formData.photos.length < 1}
                className="bg-primary text-white py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-[0.98] transition-all disabled:bg-gray-200 shadow-xl shadow-primary/20"
              >
                المرحلة التالية: حساب السعر <ArrowLeft className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col gap-10"
            >
              <div className="bg-primary rounded-[48px] p-12 flex flex-col items-center text-center text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                 <p className="text-accent font-black uppercase tracking-[0.2em] text-sm mb-4">القيمة التقديرية لجهازك</p>
                 <h3 className="text-6xl font-black mb-6 flex items-baseline gap-2">
                    {formatPrice(estimatedValue)}
                    <span className="text-sm text-gray-300 font-bold opacity-70">(أوقية)</span>
                 </h3>
                 <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-accent font-black text-sm border border-white/5 inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> تم الحساب بناءً على حالة {currentCondition?.label}
                 </div>
                 <p className="mt-8 text-xs text-gray-300 max-w-sm font-bold opacity-80 leading-relaxed italic border-t border-white/10 pt-6">السعر النهائي سيتم تحديده بعد الفحص الفني داخل أحد فروع موري تيك.</p>
              </div>

              <div className="flex flex-col gap-6">
                 <div className="flex justify-between items-end">
                    <h2 className="text-2xl font-black text-primary">اختر جهازك الجديد</h2>
                    <p className="text-xs font-bold text-gray-400 italic">مقترحات بناءً على جهازك القديم</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto p-2">
                    {products.filter(p => !formData.targetPhoneId || p.id === formData.targetPhoneId).concat(products.filter(p => p.id !== formData.targetPhoneId)).slice(0, 10).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setFormData({...formData, targetPhoneId: p.id})}
                        className={`p-6 rounded-[32px] border-2 text-right transition-all flex items-start gap-4 relative ${
                          formData.targetPhoneId === p.id 
                            ? 'border-primary bg-primary/5 shadow-xl ring-4 ring-primary/5' 
                            : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                        }`}
                      >
                         <img src={p.images[0]} className="w-20 h-20 rounded-2xl object-cover bg-white p-2 shadow-sm" alt={p.name} />
                         <div className="flex-1">
                            <h4 className="font-black text-gray-900">{p.name}</h4>
                            <div className="flex flex-col gap-1 mt-1">
                               <p className="text-xs font-bold text-gray-400">سعر المتجر: {formatPrice(p.price)}</p>
                               <div className="text-primary font-black text-sm flex items-center gap-1">
                                  باقي لك: {formatPrice(p.price - estimatedValue)}
                                  <span className="text-[10px] bg-accent/20 text-accent px-1 rounded">فقط!</span>
                               </div>
                            </div>
                         </div>
                         {formData.targetPhoneId === p.id && <div className="absolute top-4 left-4 bg-primary text-white p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>}
                      </button>
                    ))}
                 </div>
              </div>

              {targetPhone && (
                <div className="bg-gray-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center gap-10">
                   <div className="flex-1 text-center md:text-right">
                      <p className="text-accent font-black text-xs mb-2">الملخص المالي</p>
                      <div className="flex flex-col gap-4">
                         <div className="flex justify-between items-center opacity-60">
                            <span className="font-bold">سعر {targetPhone.name}:</span>
                            <span className="font-black">{formatPrice(targetPhone.price)}</span>
                         </div>
                         <div className="flex justify-between items-center text-accent">
                            <span className="font-bold">قيمة جهازك الجديد:</span>
                            <span className="font-black">- {formatPrice(estimatedValue)}</span>
                         </div>
                         <div className="h-px bg-white/10 my-2" />
                         <div className="flex justify-between items-center">
                            <span className="font-black text-2xl">المطلوب دفعه:</span>
                            <span className="font-black text-4xl text-accent">{formatPrice(targetPhone.price - estimatedValue)}</span>
                         </div>
                      </div>
                   </div>
                   <div className="w-1 bg-white/10 h-32 hidden md:block" />
                   <div className="flex-1 flex flex-col gap-4 items-center">
                      <div className="bg-white/10 p-4 rounded-3xl text-xs font-bold leading-relaxed text-center opacity-80">
                         توجه بالهاتف القديم لأقرب فرع، ادفع الفرق نقداً أو عبر البنك، واستلم هاتفك الجديد فوراً!
                      </div>
                   </div>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-50 text-gray-400 py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 transition-colors hover:bg-gray-100"
                >
                  <ArrowRight className="w-6 h-6" /> رجوع
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!formData.targetPhoneId}
                  className="flex-[2] bg-primary text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-[0.98] transition-all disabled:bg-gray-100 shadow-xl shadow-primary/20"
                >
                  الخطوة الأخيرة: بياناتي <ArrowLeft className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-10"
            >
              <div className="flex items-center gap-4 bg-green-50 p-6 rounded-3xl border border-green-100">
                 <ShieldCheck className="w-8 h-8 text-green-600" />
                 <div>
                    <h2 className="text-xl font-black text-green-800">بيانات الاتصال والتأكيد</h2>
                    <p className="text-xs font-bold text-green-600">سيقوم فريق المبيعات بالتواصل معك فور إتمام الطلب</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-gray-400 mr-2">الاسم بالكامل</label>
                  <input 
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    placeholder="الاسم الثلاثي"
                    className="bg-gray-50 border-none rounded-2xl p-5 font-bold outline-none focus:ring-2 ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-gray-400 mr-2">رقم هاتف واتساب (بدون رمز الدولة)</label>
                  <input 
                    value={formData.customerPhone}
                    onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                    placeholder="36096100"
                    className="bg-gray-50 border-none rounded-2xl p-5 font-bold outline-none focus:ring-2 ring-primary/20"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="bg-gray-100/50 p-8 rounded-[40px] flex flex-col gap-6">
                 <h4 className="font-black text-gray-400 text-xs uppercase tracking-widest border-b border-gray-200 pb-4">مراجعة سريعة</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black text-gray-400">الجهاز القديم:</span>
                       <span className="font-bold text-sm">{formData.brand} {formData.oldPhoneModel}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black text-gray-400">حالة الجهاز:</span>
                       <span className="font-bold text-sm text-primary">{currentCondition?.label}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black text-gray-400">القيمة المقدرة:</span>
                       <span className="font-black text-sm text-green-600">{formatPrice(estimatedValue)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black text-gray-400">الجهاز الجديد:</span>
                       <span className="font-bold text-sm">{targetPhone?.name}</span>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-500 py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3"
                >
                  <ArrowRight className="w-6 h-6" /> مراجعة العرض
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] bg-green-600 text-white py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-[0.98] transition-all shadow-xl shadow-green-500/20 disabled:bg-green-100"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                  تأكيد وإرسال لواتساب
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-16"
            >
              <div className="w-32 h-32 bg-green-100 text-green-600 rounded-[40px] flex items-center justify-center mb-10 rotate-12 shadow-2xl shadow-green-500/20">
                 <CheckCircle2 className="w-16 h-16" />
              </div>
              <h2 className="text-4xl font-black text-primary mb-6">تهانينا، تم تأكيد الطلب!</h2>
              <p className="text-xl font-bold text-gray-400 mb-10 max-w-lg leading-relaxed">
                 لقد استلمنا بيانات استبدالك يا {formData.customerName}. الرجاء التأكد من وصول رسالة الواتساب لنا لنقوم بالرد عليك وتحديد أقرب فرع للفحص.
              </p>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <button 
                    onClick={() => window.location.href = '/products'}
                    className="bg-primary text-white px-12 py-5 rounded-[24px] font-black text-lg hover:scale-105 transition-all shadow-xl"
                >
                    تصفح المزيد
                </button>
                <button 
                    onClick={() => window.open(`https://wa.me/22236096100`)}
                    className="bg-green-500 text-white px-12 py-5 rounded-[24px] font-black text-lg hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                >
                    متابعة عبر واتساب
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
