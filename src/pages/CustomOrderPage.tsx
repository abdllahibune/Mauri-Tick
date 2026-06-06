import React, { useState } from 'react';
import { db, ensureAuth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Link2, FileText, Phone, MapPin, Hash, Clipboard, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomOrderPage() {
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('نواكشوط');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !desc || !qty || !phone || !city) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة ⚠️');
      return;
    }

    setLoading(true);

    try {
      await ensureAuth();

      // 1. Save to Firestore
      const docData = {
        productUrl: url,
        description: desc,
        quantity: Number(qty),
        phone,
        city,
        notes,
        status: 'pending',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'panda_custom_orders'), docData);

      // 2. Format and open WhatsApp message
      const msg = `طلب مخصص جديد 📦\nالرابط: ${url}\nالمنتج: ${desc}\nالكمية: ${qty}\nالهاتف: ${phone}\nالمدينة: ${city}${notes ? `\nملاحظات: ${notes}` : ''}`;
      
      toast.success('تم تسجيل طلبك بنجاح ✅ جاري توجيهك إلى واتساب...');
      setSuccess(true);

      // Timeout key operation to allow user to see success state
      setTimeout(() => {
        window.open(`https://wa.me/22236096100?text=${encodeURIComponent(msg)}`, '_blank');
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ الطلب، يرجى المحاولة لاحقاً ❌');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setDesc('');
    setQty('1');
    setPhone('');
    setCity('نواكشوط');
    setNotes('');
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-6 flex items-center justify-center" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-gray-100 max-w-lg w-full p-8 md:p-10 rounded-[40px] text-center flex flex-col items-center gap-6 shadow-2xl"
        >
          <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center text-green-500 mb-2">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-primary">تم إرسال طلبك بنجاح!</h2>
          <p className="font-bold text-gray-500 leading-relaxed">
            تم تسجيل طلبك المخصص في سيستم المتجر. سنقوم بالتواصل معك عبر الواتساب لتأكيد السعر وموعد التوصيل ومتابعة إجراءات الاستيراد.
          </p>
          <div className="flex flex-col gap-3 w-full mt-4">
            <button
              onClick={() => {
                const msg = `طلب مخصص جديد 📦\nالرابط: ${url}\nالمنتج: ${desc}\nالكمية: ${qty}\nالهاتف: ${phone}\nالمدينة: ${city}${notes ? `\nملاحظات: ${notes}` : ''}`;
                window.open(`https://wa.me/22236096100?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="w-full bg-[#25D366] text-white py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <MessageSquare className="w-5 h-5 animate-bounce" />
              <span>فتح محادثة واتساب الآن</span>
            </button>
            <button
              onClick={handleReset}
              className="w-full bg-gray-50 text-gray-500 py-4 px-6 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all border border-gray-100"
            >
              تقديم طلب مخصص آخر
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-4xl mx-auto" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-12 text-right"
      >
        {/* Header */}
        <div className="text-center flex flex-col gap-4">
          <span className="bg-primary/5 text-primary border border-primary/10 px-4 py-1.5 rounded-full text-xs font-black inline-block mx-auto">
            خدمة الاستيراد بالطلب ✈️
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter leading-tight">طلب منتج مخصص</h1>
          <p className="text-base md:text-lg font-bold text-gray-500 max-w-2xl mx-auto leading-relaxed">
            هل أعجبك منتج على Amazon أو AliExpress أو Temu؟ الصقه هنا وسنتولى استيراده وشحنه حتى باب منزلك في موريتانيا بأقل تكلفة ممكنة!
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border-2 border-gray-100 p-6 md:p-10 rounded-[40px] shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Link Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-700 flex items-center gap-2 mr-1">
                <Link2 className="w-4 h-4 text-primary" />
                <span>رابط المنتج من (Temu, AliExpress, Amazon) <span className="text-red-500">*</span></span>
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.temu.com/..."
                required
                className="bg-gray-50/50 rounded-2xl p-4 md:p-5 outline-none font-bold text-sm border border-gray-100 focus:border-primary shadow-sm focus:bg-white transition-all text-left"
                dir="ltr"
              />
              <span className="text-xs text-gray-400 font-bold mr-1">الصق الرابط الكامل للمنتج لتسهيل الوصول إليه وحساب التكلفة بدقة.</span>
            </div>

            {/* Description Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-700 flex items-center gap-2 mr-1">
                <FileText className="w-4 h-4 text-primary" />
                <span>وصف المنتج أو المواصفات المطلوبة <span className="text-red-500">*</span></span>
              </label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="مثال: سماعة بلوتوث لاسلكية مقاومة للماء، اللون أسود..."
                required
                rows={3}
                className="bg-gray-50/50 rounded-2xl p-5 outline-none font-bold text-sm border border-gray-100 focus:border-primary shadow-sm focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantity Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black text-gray-700 flex items-center gap-2 mr-1">
                  <Hash className="w-4 h-4 text-primary" />
                  <span>الكمية المطلوبة <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder="1"
                  required
                  className="bg-gray-50/50 rounded-2xl p-4 md:p-5 outline-none font-bold text-sm border border-gray-100 focus:border-primary shadow-sm focus:bg-white transition-all"
                />
              </div>

              {/* Phone Number Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black text-gray-700 flex items-center gap-2 mr-1">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>رقم الهاتف (الواتساب) <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="مثال: 36000000"
                  required
                  className="bg-gray-50/50 rounded-2xl p-4 md:p-5 outline-none font-bold text-sm border border-gray-100 focus:border-primary shadow-sm focus:bg-white transition-all text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black text-gray-700 flex items-center gap-2 mr-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>المدينة الحالية <span className="text-red-500">*</span></span>
                </label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="bg-gray-50/50 rounded-2xl p-4 md:p-5 outline-none font-black text-sm border border-gray-100 focus:border-primary shadow-sm focus:bg-white transition-all cursor-pointer"
                >
                  <option value="نواكشوط">نواكشوط</option>
                  <option value="نواذيبو">نواذيبو</option>
                  <option value="روصو">روصو</option>
                  <option value="كيهيدي">كيهيدي</option>
                  <option value="النعمة">النعمة</option>
                  <option value="اتار">أطار</option>
                  <option value="اكجوجت">أكجوجت</option>
                  <option value="تجريت">تجكجة</option>
                  <option value="كيفة">كيفة</option>
                  <option value="لعيون">لعيون</option>
                  <option value="سيلبابي">سيلبابي</option>
                  <option value="أخرى">أخرى (اذكر في الملاحظات)</option>
                </select>
              </div>

              {/* Extra Notes Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black text-gray-700 flex items-center gap-2 mr-1">
                  <Clipboard className="w-4 h-4 text-primary" />
                  <span>ملاحظات إضافية</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="اللون المفضّل، المقاس، أو أي متطلبات خاصة..."
                  className="bg-gray-50/50 rounded-2xl p-4 md:p-5 outline-none font-bold text-sm border border-gray-100 focus:border-primary shadow-sm focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-primary text-white p-5 rounded-2xl font-black text-base hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-75 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تسجيل طلبك...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  <span>تقديم الطلب والتوجيه للواتساب</span>
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
