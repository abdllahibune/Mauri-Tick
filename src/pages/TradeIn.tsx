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
  { id: 'excellent', label: 'ممتاز', color: 'text-green-500', bg: 'bg-green-50', icon: '⭐', desc: 'لا خدوش تماماً', statusText: 'حالة ممتازة' },
  { id: 'good', label: 'جيد', color: 'text-blue-500', bg: 'bg-blue-50', icon: '👍', desc: 'خدوش بسيطة', statusText: 'حالة جيدة' },
  { id: 'fair', label: 'مقبول', color: 'text-orange-500', bg: 'bg-orange-50', icon: '👌', desc: 'خدوش واضحة', statusText: 'حالة مستعملة' },
  { id: 'broken', label: 'به أعطال', color: 'text-red-500', bg: 'bg-red-50', icon: '🔧', desc: 'يحتاج إصلاح', statusText: 'للقطع أو الإصلاح' }
];

const PHONE_BASE_PRICES: Record<string, number> = {
  // Apple
  'iphone 15 pro max': 450000,
  'iphone 15 pro': 380000,
  'iphone 15': 320000,
  'iphone 14 pro max': 380000,
  'iphone 14 pro': 320000,
  'iphone 14': 260000,
  'iphone 13 pro max': 320000,
  'iphone 13 pro': 270000,
  'iphone 13': 220000,
  'iphone 12 pro max': 260000,
  'iphone 12 pro': 210000,
  'iphone 12': 170000,
  'iphone 11 pro max': 200000,
  'iphone 11 pro': 170000,
  'iphone 11': 130000,
  'iphone xr': 90000,
  'iphone x': 80000,
  'iphone xs': 85000,
  
  // Samsung Galaxy A series
  'galaxy a55': 120000,
  'galaxy a54': 100000,
  'galaxy a35': 85000,
  'galaxy a34': 75000,
  'galaxy a25': 65000,
  'galaxy a24': 60000,
  'galaxy a15': 50000,
  'galaxy a14': 45000,
  'galaxy a13': 40000,
  
  // Samsung Galaxy S series
  'galaxy s24 ultra': 450000,
  'galaxy s24+': 350000,
  'galaxy s24': 280000,
  'galaxy s23 ultra': 380000,
  'galaxy s23': 220000,
  'galaxy s22 ultra': 300000,
  'galaxy s22': 170000,
  'galaxy s21': 130000,
  
  // Redmi/Xiaomi
  'redmi note 13 pro': 90000,
  'redmi note 13': 70000,
  'redmi note 12': 60000,
  'redmi note 11': 50000,
  'redmi 13c': 45000,
  'redmi 12c': 38000,
  'xiaomi 14': 250000,
  'xiaomi 13': 200000,
  
  // Huawei
  'huawei p60 pro': 280000,
  'huawei p50 pro': 220000,
  'huawei nova 11': 120000,
  'huawei nova 10': 100000,
  'huawei y9s': 60000,
};

function estimateTradeInValue(brand: string, model: string, storage: string, condition: string) {
  const searchKey = (brand + ' ' + model).toLowerCase().trim();
  let basePrice = 0;
  
  for (const [key, price] of Object.entries(PHONE_BASE_PRICES)) {
    if (searchKey.includes(key) || key.includes(model.toLowerCase())) {
      basePrice = price;
      break;
    }
  }
  
  if (basePrice === 0) {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('apple') || brandLower.includes('iphone')) {
      basePrice = 150000;
    } else if (brandLower.includes('samsung')) {
      basePrice = 80000;
    } else if (brandLower.includes('huawei')) {
      basePrice = 90000;
    } else if (brandLower.includes('xiaomi') || brandLower.includes('redmi')) {
      basePrice = 60000;
    } else {
      basePrice = 50000;
    }
  }
  
  const storageMultiplier: Record<string, number> = {
    '64GB': 0.85,
    '128GB': 1.0,
    '256GB': 1.15,
    '512GB': 1.3,
    '1TB': 1.5
  };
  basePrice *= (storageMultiplier[storage] || 1.0);
  
  const conditionMultiplier: Record<string, number> = {
    'excellent': 0.55,
    'good': 0.40,
    'fair': 0.25,
    'broken': 0.10
  };
  
  const tradeValue = Math.round(basePrice * (conditionMultiplier[condition] || 0.3));
  return Math.round(tradeValue / 1000) * 1000;
}

const PHONE_BRANDS = [
  'Apple / iPhone',
  'Samsung',
  'Huawei',
  'Xiaomi / Redmi',
  'OPPO',
  'Realme',
  'Vivo',
  'Nokia',
  'OnePlus',
  'Tecno',
  'Infinix',
  'itel',
  'أخرى'
];

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export function TradeInPage() {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestedPhones, setSuggestedPhones] = useState<Product[]>([]);
  const [suggestedAccessories, setSuggestedAccessories] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    category: 'هواتف ذكية',
    brand: '',
    oldPhoneModel: '',
    storage: '',
    condition: '',
    problems: '',
    photos: [] as string[],
    targetPhoneId: '',
    desiredPhoneManual: '',
    basePrice: 150000 
  });

  useEffect(() => {
    ensureAuth();
    const unsubscribe = onSnapshot(collection(db, 'mt_products'), (snap) => {
      const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(allProducts);
      
      // Suggestions
      setSuggestedPhones(allProducts.filter(p => p.category === 'هواتف ذكية').sort((a, b) => a.price - b.price).slice(0, 6));
      setSuggestedAccessories(allProducts.filter(p => p.category === 'إكسسوارات').slice(0, 4));
    });
    return () => unsubscribe();
  }, []);

  const currentCondition = CONDITIONS.find(c => c.id === formData.condition);
  const tradeValue = estimateTradeInValue(formData.brand, formData.oldPhoneModel, formData.storage, formData.condition);
  const minValue = Math.round(tradeValue * 0.9 / 1000) * 1000;
  const maxValue = Math.round(tradeValue * 1.1 / 1000) * 1000;
  const targetPhone = products.find(p => p.id === formData.targetPhoneId);

  // Update base price based on model/brand (simulated)
  useEffect(() => {
    let base = 150000;
    if (formData.brand === 'Apple / iPhone') base = 250000;
    if (formData.brand === 'Samsung') base = 180000;
    setFormData(prev => ({ ...prev, basePrice: base }));
  }, [formData.brand, formData.oldPhoneModel]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newPhotos = [...formData.photos];

    for (let i = 0; i < files.length; i++) {
        try {
            const url = await uploadToCloudinary(files[i]);
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
            estimatedValue: tradeValue,
            minValue,
            maxValue,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // WhatsApp notification
        const desiredText = formData.targetPhoneId === 'other' || !formData.targetPhoneId
          ? formData.desiredPhoneManual || 'لم يحدد'
          : products.find(p => p.id === formData.targetPhoneId)?.name || 'لم يحدد';

        const message = encodeURIComponent(
          `مرحباً Mauri Tick 👋\n` +
          `طلب استبدال جديد:\n\n` +
          `📱 هاتفي الحالي:\n` +
          `   الماركة: ${formData.brand}\n` +
          `   الموديل: ${formData.oldPhoneModel}\n` +
          `   السعة: ${formData.storage}\n` +
          `   الحالة: ${currentCondition?.label}\n\n` +
          `✨ الهاتف المطلوب:\n` +
          `   ${desiredText}\n\n` +
          `💰 القيمة التقديرية: ` +
          `${minValue.toLocaleString()} — ${maxValue.toLocaleString()} أوقية\n\n` +
          `📞 رقمي: ${formData.customerPhone}`
        );
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
        <h1 className="text-4xl font-black text-primary mb-4">🔄 تبديل هاتفك القديم بجديد</h1>
        <p className="text-gray-500 font-bold">سلّم هاتفك القديم وادفع الفرق فقط</p>
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
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-black text-primary">معلومات هاتفك الحالي</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-gray-400 mr-2">الماركة</label>
                    <select 
                      value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                      className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                    >
                      <option value="">اختر الماركة</option>
                      {PHONE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-gray-400 mr-2">الموديل</label>
                    <input 
                      value={formData.oldPhoneModel}
                      onChange={e => setFormData({...formData, oldPhoneModel: e.target.value})}
                      placeholder="مثال: iPhone 12, Samsung S21"
                      className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-gray-400 mr-2">السعة</label>
                  <div className="flex flex-wrap gap-2">
                    {STORAGE_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => setFormData({...formData, storage: s})}
                        className={`px-4 py-2 rounded-xl transition-all font-bold ${
                          formData.storage === s ? 'bg-primary text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-gray-400 mr-2">حالة الهاتف</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CONDITIONS.map((cond) => (
                      <div
                        key={cond.id}
                        onClick={() => setFormData({...formData, condition: cond.id})}
                        className={`p-4 border-2 rounded-2xl cursor-pointer text-center transition-all flex flex-col gap-1 items-center ${
                          formData.condition === cond.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-50 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-2xl">{cond.icon}</div>
                        <div className="font-black text-sm">{cond.label}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{cond.desc}</div>
                        <div className={`text-[10px] font-black mt-1 ${cond.color}`}>{cond.statusText}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.condition === 'broken' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-gray-400 mr-2">وصف المشاكل</label>
                    <textarea 
                      value={formData.problems}
                      onChange={e => setFormData({...formData, problems: e.target.value})}
                      placeholder="اذكر المشاكل الموجودة..."
                      className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20 h-24 resize-none"
                    />
                  </div>
                )}

                {/* Desired Phone Field */}
                <div className="bg-[#F8F9FF] rounded-[24px] p-6 border border-[#E8EAF6] mt-4">
                  <h3 className="text-primary font-black text-lg mb-4 flex items-center gap-2">
                    📱 ما الهاتف الذي تريد؟
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 mr-2">اختر من متجرنا</label>
                      <select 
                        value={formData.targetPhoneId}
                        onChange={e => setFormData({...formData, targetPhoneId: e.target.value})}
                        className="bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                      >
                        <option value="">-- اختر هاتفاً --</option>
                        {products
                          .filter(p => p.category === 'هواتف ذكية' && (p.stock ?? 0) > 0)
                          .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0) || a.price - b.price)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.brand} {p.name} — {p.price.toLocaleString()} أوقية
                            </option>
                          ))
                        }
                        <option value="other">هاتف غير موجود في المتجر</option>
                      </select>
                    </div>

                    <div className="relative py-2 text-center">
                      <span className="bg-[#F8F9FF] px-4 relative z-10 text-xs font-black text-gray-300">أو</span>
                      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-100" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 mr-2">اكتب اسم الهاتف الذي تريده</label>
                      <input 
                        value={formData.desiredPhoneManual}
                        onChange={e => setFormData({...formData, desiredPhoneManual: e.target.value})}
                        placeholder="مثال: iPhone 15, Samsung S24..."
                        className="bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-4 leading-relaxed">
                    ℹ️ إذا كان الهاتف المطلوب غير متوفر حالياً، سنتواصل معك عند توفره
                  </p>
                </div>
                
                <div className="flex flex-col gap-4">
                  <label className="text-xs font-black text-gray-400 mr-2">صور الهاتف (3 صور على الأقل)</label>
                  <div className="flex flex-wrap gap-4">
                    {formData.photos.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 group">
                        <img src={url} className="w-full h-full object-cover" alt="Phone" />
                        <button 
                          onClick={() => removePhoto(i)}
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {formData.photos.length < 5 && (
                      <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                        <Upload className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                        <span className="text-[8px] font-black mt-1 text-gray-400">إضافة</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>
                  {uploading && (
                    <div className="flex flex-col gap-2 max-w-xs">
                      <div className="flex justify-between items-center text-[10px] font-black text-primary">
                        <span>جاري الرفع...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!formData.brand || !formData.oldPhoneModel || !formData.storage || !formData.condition || formData.photos.length < 3}
                className="bg-primary text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-[0.98] transition-all disabled:bg-gray-200 shadow-xl shadow-primary/20"
              >
                احسب قيمة هاتفك ←
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col gap-8"
            >
              {/* Trade Value Card */}
              <div className="bg-gradient-to-br from-[#1A237E] to-[#283593] rounded-[32px] p-10 flex flex-col items-center text-center text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <p className="text-white/70 font-bold uppercase tracking-wider text-xs mb-2">القيمة التقديرية لهاتفك</p>
                <div className="flex flex-col items-center">
                  <h3 className="text-4xl font-black mb-2">
                    {minValue.toLocaleString()} — {maxValue.toLocaleString()}
                  </h3>
                  <span className="text-2xl font-black text-accent mb-4">أوقية</span>
                </div>
                <p className="text-xs text-white/60 italic">* السعر النهائي بعد الفحص الفعلي</p>
              </div>

              {/* Suggested Phones */}
              <div>
                <h3 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
                  <Smartphone className="w-6 h-6" /> هواتف مقترحة لك
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {suggestedPhones.map(p => {
                    const diff = p.price - tradeValue;
                    return (
                      <div 
                        key={p.id}
                        onClick={() => window.location.href = `/product/${p.id}`}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                      >
                        <div className="aspect-square bg-gray-50 p-4">
                          <img src={p.mainImage || p.images?.[0]} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{p.brand}</p>
                          <h4 className="text-xs font-black text-gray-900 line-clamp-1 mb-1">{p.name}</h4>
                          <p className="text-xs font-black text-primary">{formatPrice(p.price)}</p>
                          <p className={`text-[10px] font-bold mt-1 ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {diff > 0 ? `تدفع ${formatPrice(diff)}` : `توفر ${formatPrice(Math.abs(diff))}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Accessories */}
              {suggestedAccessories.length > 0 && (
                <div>
                  <h3 className="text-xl font-black text-primary mb-4">🎧 إكسسوارات مقترحة مع هاتفك الجديد</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {suggestedAccessories.map(a => (
                      <div 
                        key={a.id}
                        onClick={() => window.location.href = `/product/${a.id}`}
                        className="flex-shrink-0 w-36 bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer"
                      >
                        <div className="aspect-square bg-gray-50 p-3">
                          <img src={a.mainImage || a.images?.[0]} className="w-full h-full object-contain" />
                        </div>
                        <div className="p-2">
                          <h4 className="text-xs font-black text-gray-900 line-clamp-1">{a.name}</h4>
                          <p className="text-xs font-black text-primary mt-1">{formatPrice(a.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp CTA */}
              <button 
                onClick={() => {
                  const desiredText = formData.targetPhoneId === 'other' || !formData.targetPhoneId
                    ? formData.desiredPhoneManual || 'لم يحدد'
                    : products.find(p => p.id === formData.targetPhoneId)?.name || 'لم يحدد';

                  const message = encodeURIComponent(
                    `مرحباً Mauri Tick 👋\n` +
                    `طلب استبدال جديد:\n\n` +
                    `📱 هاتفي الحالي:\n` +
                    `   الماركة: ${formData.brand}\n` +
                    `   الموديل: ${formData.oldPhoneModel}\n` +
                    `   السعة: ${formData.storage}\n` +
                    `   الحالة: ${currentCondition?.label}\n\n` +
                    `✨ الهاتف المطلوب:\n` +
                    `   ${desiredText}\n\n` +
                    `💰 القيمة التقديرية: ` +
                    `${minValue.toLocaleString()} — ${maxValue.toLocaleString()} أوقية\n\n` +
                    `📞 رقمي: ${formData.customerPhone}`
                  );
                  window.open(`https://wa.me/22236096100?text=${message}`, '_blank');
                }}
                className="bg-[#25D366] text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-[0.98] transition-all shadow-xl shadow-green-500/20"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                تواصل معنا لإتمام التبديل
              </button>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-50 text-gray-400 py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-colors hover:bg-gray-100"
                >
                  <ArrowRight className="w-5 h-5" /> رجوع
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex-[2] bg-primary text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                >
                  الخطوة التالية: تأكيد الطلب <ArrowLeft className="w-5 h-5" />
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
                       <span className="font-black text-sm text-green-600">{minValue.toLocaleString()} — {maxValue.toLocaleString()} أوقية</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black text-gray-400">الجهاز الجديد:</span>
                       <span className="font-bold text-sm">
                        {formData.targetPhoneId === 'other' || !formData.targetPhoneId
                          ? formData.desiredPhoneManual || 'لم يحدد'
                          : products.find(p => p.id === formData.targetPhoneId)?.name || 'لم يحدد'}
                       </span>
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
