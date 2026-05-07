import React, { useState, useEffect } from 'react';
import { db, safeWrite, ensureAuth } from '../lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Product, TradeIn } from '../types';
import { uploadToCloudinary } from '../lib/cloudinary';
import { formatPrice } from '../lib/utils';
import { 
  Smartphone, Calculator, Image as ImageIcon, CheckCircle2, 
  ArrowRight, ArrowLeft, Loader2, ShieldCheck, Upload, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const CONDITIONS = [
  { id: 'excellent', label: 'ممتاز', multiplier: 0.8, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'good', label: 'جيد', multiplier: 0.6, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'fair', label: 'مقبول', multiplier: 0.4, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'broken', label: 'به أعطال', multiplier: 0.2, color: 'text-red-500', bg: 'bg-red-50' }
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
    oldPhoneModel: '',
    storage: '',
    condition: 'good',
    photos: [] as string[],
    targetPhoneId: '',
    basePrice: 10000 // Admin would ideally set this, defaulting for demo
  });

  useEffect(() => {
    ensureAuth();
    const unsubscribe = onSnapshot(collection(db, 'mt_products'), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsubscribe();
  }, []);

  const currentCondition = CONDITIONS.find(c => c.id === formData.condition);
  const estimatedValue = formData.basePrice * (currentCondition?.multiplier || 0);
  const targetPhone = products.find(p => p.id === formData.targetPhoneId);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newPhotos = [...formData.photos];

    for (let i = 0; i < files.length; i++) {
        try {
            const url = await uploadToCloudinary(files[i], (p) => setProgress(p));
            newPhotos.push(url);
        } catch (err) {
            toast.error('فشل رفع إحدى الصور');
        }
    }

    setFormData({ ...formData, photos: newPhotos });
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
        const message = `طلب استبدال جديد! 📱%0Aالاسم: ${formData.customerName}%0Aالهاتف: ${formData.customerPhone}%0Aالهاتف القديم: ${formData.oldPhoneModel} (${currentCondition?.label})%0Aالقيمة المقدرة: ${estimatedValue} أوقية%0Aالهاتف الجديد: ${targetPhone?.name || 'لم يحدد'}`;
        window.open(`https://wa.me/22236096100?text=${message}`);

        setStep(4);
        toast.success('تم إرسال طلبك بنجاح!');
    });
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-primary mb-4">استبدل هاتفك الآن</h1>
        <p className="text-gray-500 font-bold">قم بتبديل هاتفك القديم بهاتف جديد من موري تيك بكل سهولة</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
              step >= s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-gray-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-primary/5 p-8 md:p-12 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                 <div className="bg-primary/5 p-3 rounded-2xl text-primary"><Smartphone className="w-6 h-6" /></div>
                 <h2 className="text-2xl font-black">تفاصيل الهاتف القديم</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase mr-2">الماركة والموديل</label>
                    <input 
                      value={formData.oldPhoneModel}
                      onChange={e => setFormData({...formData, oldPhoneModel: e.target.value})}
                      placeholder="iPhone 13 Pro Max"
                      className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                    />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase mr-2">السعة (GB)</label>
                    <select 
                      value={formData.storage}
                      onChange={e => setFormData({...formData, storage: e.target.value})}
                      className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20 appearance-none"
                    >
                      <option value="">اختر السعة</option>
                      <option value="64">64GB</option>
                      <option value="128">128GB</option>
                      <option value="256">256GB</option>
                      <option value="512">512GB</option>
                      <option value="1024">1TB</option>
                    </select>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <label className="text-xs font-bold text-gray-400 uppercase mr-2">حالة الجهاز</label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CONDITIONS.map((cond) => (
                      <button
                        key={cond.id}
                        onClick={() => setFormData({...formData, condition: cond.id})}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          formData.condition === cond.id 
                            ? `border-primary ${cond.bg}` 
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                         <span className={`text-lg font-black ${cond.color}`}>{cond.label}</span>
                         <span className="text-[10px] font-bold text-gray-400">قيمة {cond.multiplier * 100}%</span>
                      </button>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <label className="text-xs font-bold text-gray-400 uppercase mr-2">صور الهاتف (3 صور على الأقل)</label>
                 <div className="flex flex-wrap gap-4">
                    {formData.photos.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 group">
                         <img src={url} className="w-full h-full object-cover" alt="Phone" />
                         <button 
                           onClick={() => removePhoto(i)}
                           className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                       <Upload className="w-6 h-6 text-gray-300" />
                       <input type="file" multiple className="hidden" onChange={handlePhotoUpload} />
                    </label>
                 </div>
                 {uploading && (
                   <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                   </div>
                 )}
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!formData.oldPhoneModel || !formData.storage || formData.photos.length < 1}
                className="bg-primary text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-300"
              >
                الخطوة التالية <ArrowLeft className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                 <div className="bg-yellow-50 p-3 rounded-2xl text-yellow-600"><Calculator className="w-6 h-6" /></div>
                 <h2 className="text-2xl font-black">حساب القيمة المقدرة</h2>
              </div>

              <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center text-center">
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">قيمة هاتفك القديم التقريبية</p>
                 <h3 className="text-5xl font-black text-primary mb-4">{formatPrice(estimatedValue)}</h3>
                 <div className="bg-white px-4 py-2 rounded-xl text-green-600 font-bold text-sm border border-green-100">
                    بناءً على حالة: {currentCondition?.label}
                 </div>
                 <p className="mt-6 text-xs text-gray-400 max-w-sm">هذا السعر تقديري بناءً على البيانات المقدمة، سيتم تأكيد القيمة النهائية بعد الفحص المباشر في المتجر.</p>
              </div>

              <div className="flex flex-col gap-4">
                 <label className="text-xs font-bold text-gray-400 uppercase mr-2">اختر الهاتف الجديد الذي ترغب به</label>
                 <select 
                    value={formData.targetPhoneId}
                    onChange={e => setFormData({...formData, targetPhoneId: e.target.value})}
                    className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20 appearance-none"
                 >
                    <option value="">اختر من المتوفر</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {formatPrice(p.price)}</option>
                    ))}
                 </select>
              </div>

              {targetPhone && (
                <div className="bg-primary/5 rounded-3xl p-6 border-2 border-primary/10">
                   <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-500">سعر الهاتف الجديد:</span>
                      <span className="font-black text-xl">{formatPrice(targetPhone.price)}</span>
                   </div>
                   <div className="flex justify-between items-center mb-4 text-green-600">
                      <span className="font-bold">خصم هاتفك القديم:</span>
                      <span className="font-black text-xl">- {formatPrice(estimatedValue)}</span>
                   </div>
                   <div className="h-px bg-primary/10 my-4" />
                   <div className="flex justify-between items-center">
                      <span className="font-black text-primary text-xl">تدفع فقط:</span>
                      <span className="font-black text-3xl text-primary">{formatPrice(targetPhone.price - estimatedValue)}</span>
                   </div>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3"
                >
                  <ArrowRight className="w-6 h-6" /> السابق
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!formData.targetPhoneId}
                  className="flex-[2] bg-primary text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-300"
                >
                  الخطوة التالية <ArrowLeft className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                 <div className="bg-green-50 p-3 rounded-2xl text-green-600"><ShieldCheck className="w-6 h-6" /></div>
                 <h2 className="text-2xl font-black">بيانات الاتصال</h2>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase mr-2">الاسم بالكامل</label>
                  <input 
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    placeholder="محمد محمود"
                    className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase mr-2">رقم الهاتف (واتساب)</label>
                  <input 
                    value={formData.customerPhone}
                    onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                    placeholder="3XXXXXXX"
                    className="bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                 <p className="text-sm font-bold text-blue-700 leading-relaxed">
                    بإرسالك لهذا الطلب، أنت توافق على أن القيمة مقدرة وسيقوم فريقنا بالتواصل معك عبر واتساب لتحديد موعد فحص الجهاز في أحد فروعنا.
                 </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3"
                >
                  <ArrowRight className="w-6 h-6" /> السابق
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] bg-green-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-green-300"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                  إتمام الطلب وبدء المعالجة
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-12"
            >
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
                 <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-primary mb-4">تم استلام طلبك!</h2>
              <p className="text-xl font-bold text-gray-500 mb-8 max-w-md">
                 شكراً لك {formData.customerName}، لقد تم إرسال طلب استبدال هاتفك بنجاح. سيقوم فريقنا بمراجعته والتواصل معك عبر واتساب خلال 24 ساعة.
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-primary text-white px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform"
              >
                العودة للرئيسية
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
