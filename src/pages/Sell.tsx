import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { Smartphone, DollarSign, Upload, Trash2, CheckCircle2, Loader2, Phone, User, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export function Sell() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    brand: '',
    price: '',
    sellerName: '',
    sellerPhone: '',
    condition: 'ممتاز',
    description: '',
    images: [] as string[]
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newImages = [...form.images];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadToCloudinary(files[i], (p) => setProgress(p));
        newImages.push(url);
      } catch (err) {
        toast.error('فشل رفع إحدى الصور');
      }
    }

    setForm({ ...form, images: newImages });
    setUploading(false);
    setProgress(0);
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.images.length === 0) return toast.error('يرجى إضافة صورة واحدة على الأقل');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'usedProducts'), {
        ...form,
        price: Number(form.price),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Notify admin
      const message = `إعلان بيع مستعمل جديد! 🛍️%0Aالمنتج: ${form.name}%0Aالسعر: ${form.price}%0Aالبائع: ${form.sellerName}%0Aالهاتف: ${form.sellerPhone}`;
      window.open(`https://wa.me/22236096100?text=${message}`);

      setSubmitted(true);
      toast.success('تم إرسال إعلانك للمراجعة!');
    } catch (err) {
      toast.error('حدث خطأ أثناء إرسال الإعلان');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-primary mb-4">تم إرسال إعلانك بنجاح!</h1>
          <p className="text-xl text-gray-500 font-bold mb-8">
            شكراً لثقتك بـ موري تيك. سيقوم فريقنا بمراجعة إعلانك خلال 24 ساعة، وإذا تمت الموافقة سيظهر في قسم المستعمل.
          </p>
          <button onClick={() => window.location.href = '/products'} className="bg-primary text-white px-12 py-4 rounded-2xl font-black text-lg">
            تصفح المنتجات
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-primary mb-4">هل لديك هاتف للبيع؟</h1>
        <p className="text-gray-500 font-bold">أعرض هاتفك لآلاف المشترين في موريتانيا مجاناً عبر منصتنا</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Product Details */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b pb-4 mb-2">
            <div className="bg-primary/5 p-2 rounded-xl text-primary"><Smartphone className="w-5 h-5" /></div>
            <h2 className="font-black text-lg">تفاصيل المنتج</h2>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">اسم الهاتف والموديل</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20" placeholder="مثال: iPhone 14 Pro" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">الماركة</label>
              <input required value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20" placeholder="Apple" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">الحالة</label>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20 appearance-none">
                <option>جديد</option>
                <option>ممتاز</option>
                <option>جيد</option>
                <option>مقبول</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">السعر المطلوب (MRO)</label>
            <div className="relative">
              <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 pr-12 pl-4 font-bold outline-none focus:ring-2 ring-primary/20" placeholder="0" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">وصف إضافي</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20 h-32 resize-none" placeholder="اكتب تفاصيل أخرى (التخزين، البطارية، إلخ)" />
          </div>
        </div>

        {/* Seller & Images */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b pb-4 mb-2">
            <div className="bg-orange-50 p-2 rounded-xl text-orange-500"><User className="w-5 h-5" /></div>
            <h2 className="font-black text-lg">بيانات البائع</h2>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">اسمك بالكامل</label>
            <input required value={form.sellerName} onChange={e => setForm({...form, sellerName: e.target.value})} className="bg-gray-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/20" placeholder="اسمك" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">رقم الهاتف (واتساب)</label>
            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input required value={form.sellerPhone} onChange={e => setForm({...form, sellerPhone: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 pr-12 pl-4 font-bold outline-none focus:ring-2 ring-primary/20" placeholder="3XXXXXXX" dir="ltr" />
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><Upload className="w-5 h-5" /></div>
              <h2 className="font-black text-lg">صور المنتج</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                  <img src={url} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Upload className="w-5 h-5 text-gray-300" />
                <input type="file" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {uploading && (
                <div className="flex flex-col gap-1">
                   <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
                   </div>
                   <span className="text-[10px] font-black text-primary text-center">جاري الرفع... {progress}%</span>
                </div>
            )}
          </div>

          <button 
            disabled={loading || uploading}
            className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-300 shadow-xl shadow-primary/20 pointer-events-auto"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Package className="w-6 h-6" />}
            نشر الإعلان الآن
          </button>
        </div>
      </form>
    </div>
  );
}
