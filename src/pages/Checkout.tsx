import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { formatPrice, generateOrderNumber } from '../lib/utils';
import { ShieldCheck, Upload, Loader2, CheckCircle2, User, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        address: user.address || ''
      });
    }
  }, [user]);

  if (cart.length === 0) return <Navigate to="/cart" />;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('حجم الصورة كبير جداً. الحد الأقصى 1 ميجابايت.');
        return;
      }
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod || !proofImage) {
      toast.error('يرجى اختيار طريقة الدفع ورفع صورة الإثبات');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload proof to Cloudinary
      const proofUrl = await uploadToCloudinary(proofImage);

      const orderNumber = generateOrderNumber();

      // 2. Save order to Firebase
      const orderData = {
        userId: user?.id || null,
        orderNumber,
        customerName: formData.name,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        items: cart,
        subtotal,
        discount: 0,
        total: subtotal,
        paymentMethod,
        paymentProofUrl: proofUrl,
        status: 'قيد الانتظار',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update user stats
      if (user) {
        await updateDoc(doc(db, 'users', user.id), {
          totalSpent: increment(subtotal),
          ordersCount: increment(1)
        });
      }

      // 3. WhatsApp Integration
      const message = `طلب جديد موري تيك! 📱%0Aالرقم: ${orderNumber}%0Aالاسم: ${formData.name}%0Aالهاتف: ${formData.phone}%0Aالمبلغ: ${subtotal} أوقية%0Aطريقة الدفع: ${paymentMethod}`;
      const waLink = `https://wa.me/22236096100?text=${message}`;

      // 4. Clear cart and redirect
      clearCart();
      toast.success('تم استلام طلبك بنجاح! 🎉');
      
      // Delay to show toast
      setTimeout(() => {
        window.open(waLink, '_blank');
        navigate('/confirmation', { state: { orderNumber, total: subtotal, paymentMethod, orderId: docRef.id } });
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إتمام الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = [
    { name: 'بنكيلي', color: '#00A651', desc: 'تطبيق بنك موريتانيا الإسلامي' },
    { name: 'سداد', color: '#003087', desc: 'تطبيق البريد الموريتاني' },
    { name: 'مصرفي', color: '#FF6B00', desc: 'تطبيق بنك التجارة والصناعة' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-8">
      {!user && (
        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                 <User className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                 <h4 className="font-black text-primary">هل لديك حساب؟</h4>
                 <p className="text-xs font-bold text-gray-500">سجل دخولك لتعبئة بيانات التوصيل تلقائياً وكسب نقاط مكافآت.</p>
              </div>
           </div>
           <Link to="/login" className="bg-primary text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2">
              <LogIn className="w-4 h-4" /> سجل دخولك الآن
           </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="flex flex-col gap-12">
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-6">
            <h2 className="text-3xl font-black text-primary">معلومات التوصيل</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold text-gray-500 mr-2">الاسم الكامل</label>
                 <input 
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="bg-gray-50 border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/20" 
                 />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold text-gray-500 mr-2">رقم الهاتف (واتساب)</label>
                 <input 
                   required
                   value={formData.phone}
                   onChange={e => setFormData({...formData, phone: e.target.value})}
                   className="bg-gray-50 border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/20" 
                   dir="ltr"
                 />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold text-gray-500 mr-2">المدينة</label>
                 <input 
                   required
                   value={formData.city}
                   onChange={e => setFormData({...formData, city: e.target.value})}
                   className="bg-gray-50 border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/20" 
                 />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold text-gray-500 mr-2">العنوان بالتفصيل</label>
                 <input 
                   required
                   value={formData.address}
                   onChange={e => setFormData({...formData, address: e.target.value})}
                   className="bg-gray-50 border-none rounded-2xl p-4 outline-none focus:ring-2 ring-primary/20" 
                 />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-8">
            <h2 className="text-3xl font-black text-primary">اختر طريقة الدفع</h2>
            <div className="grid grid-cols-1 gap-4">
              {paymentOptions.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setPaymentMethod(opt.name)}
                  className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group ${paymentMethod === opt.name ? 'border-primary bg-primary/5' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-6">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: opt.color }}
                    >
                      {opt.name}
                    </div>
                    <div className="text-right">
                       <h4 className="font-black text-lg text-primary">{opt.name}</h4>
                       <p className="text-gray-400 text-xs font-bold">{opt.desc}</p>
                    </div>
                  </div>
                  {paymentMethod === opt.name && <CheckCircle2 className="text-primary w-8 h-8" />}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Order Summary & Payment Details */}
        <div className="flex flex-col gap-8">
          <div className="bg-primary rounded-[40px] p-8 text-white flex flex-col gap-8">
            <h3 className="text-2xl font-black">تفاصيل الدفع</h3>
            
            <AnimatePresence mode="wait">
              {paymentMethod ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/10 rounded-3xl p-8 border border-white/10 flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center text-accent">
                     <span className="font-bold underline">ادفع عبر {paymentMethod}</span>
                     <span className="text-sm">الرقم: 36096100</span>
                  </div>
                  <div className="flex flex-col items-center py-4 border-y border-white/5">
                     <span className="text-sm font-bold text-gray-400">المبلغ المطلوب</span>
                     <span className="text-4xl font-black text-accent">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="text-sm text-gray-300 font-bold leading-relaxed">
                     <p className="mb-2">خطوات الدفع:</p>
                     <ol className="list-decimal list-inside flex flex-col gap-1 pr-2">
                       <li>افتح تطبيق {paymentMethod}</li>
                       <li>اختر تحويل الأموال</li>
                       <li>أدخل الرقم: 36096100</li>
                       <li>أدخل المبلغ واضغط تأكيد</li>
                       <li>ارفع صورة إثبات الدفع هنا 👇</li>
                     </ol>
                  </div>

                  <div className="flex flex-col gap-4">
                     <label className="cursor-pointer group">
                        <div className="bg-accent text-primary h-16 rounded-2xl flex items-center justify-center gap-3 font-black group-hover:brightness-110 transition-all">
                           {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                           {proofImage ? 'تغيير صورة الإثبات' : 'ارفع صورة الإثبات'}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                     </label>
                     
                     {proofPreview && (
                       <div className="relative rounded-2xl overflow-hidden border-2 border-accent/20 aspect-video">
                          <img src={proofPreview} className="w-full h-full object-contain bg-black/20" />
                          <button 
                            type="button" 
                            onClick={() => {setProofImage(null); setProofPreview(null);}} 
                            className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full"
                          >
                             <Upload className="w-4 h-4 rotate-180" />
                          </button>
                       </div>
                     )}
                  </div>
                </motion.div>
              ) : (
                <div className="py-20 text-center text-white/50 font-bold border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-4">
                   <ShieldCheck className="w-12 h-12 opacity-20" />
                   <span>يرجى اختيار طريقة دفع لعرض التعليمات</span>
                </div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading || !paymentMethod || !proofImage}
              className="bg-white text-primary p-6 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-4"
            >
              {loading ? 'جاري المعالجة...' : 'تأكيد الطلب الآن 🛍️'}
              {!loading && <CheckCircle2 className="w-8 h-8 text-accent" />}
            </button>

            <p className="text-[10px] text-center text-gray-500 font-bold px-8">بالضغط على تأكيد، أنت توافق على شروط الخدمة. سيتم التواصل معك عبر الواتساب فور مراجعة التحويل.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
