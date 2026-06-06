import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { db, safeWrite, ensureAuth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { formatPrice, generateOrderNumber } from '../lib/utils';
import { ShieldCheck, Upload, Loader2, CheckCircle2, User, LogIn, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  {
    id: 'bankily',
    name: 'بنكيلي',
    nameEn: 'Bankily',
    color: '#004B9B',
    bgColor: '#E8F0FE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bankily_logo.png/200px-Bankily_logo.png',
    description: 'الدفع عبر تطبيق بنكيلي BPM'
  },
  {
    id: 'masrvi',
    name: 'مصرفي',
    nameEn: 'Masrvi',
    color: '#00A651',
    bgColor: '#E8F5E9',
    logo: 'https://play-lh.googleusercontent.com/YWGzCdGhZEGMfYLh9tYZZELsXK7BN_0EYwg3JF8JvQBiYY0EB8TXHetEf4nNKhUFKg=w240',
    description: 'الدفع عبر تطبيق مصرفي BVCI'
  },
  {
    id: 'sedad',
    name: 'السداد',
    nameEn: 'Sedad Bank',
    color: '#1B3F7B',
    bgColor: '#E8EAF6',
    logo: 'https://play-lh.googleusercontent.com/Lk1ESYSMZv_jZSSt1aXRWH1a7FJmPSHxgHJiDqmIY9H_kxfgPRi5XfnkxBGi15YAXA=w240',
    description: 'الدفع عبر بنك السداد BMI'
  }
];

const PAYMENT_INSTRUCTIONS: Record<string, string> = {
  bankily: `
    <div style="background:#E8F0FE; border-radius:12px; padding:16px; direction:rtl; font-family:Cairo; margin-top:12px;">
      <h4 style="color:#004B9B; margin:0 0 10px;">📱 خطوات الدفع عبر بنكيلي</h4>
      <ol style="margin:0; padding-right:20px; color:#333; line-height:2;">
        <li>افتح تطبيق بنكيلي BPM</li>
        <li>اختر "تحويل" أو "دفع"</li>
        <li>أدخل الرقم: <strong>36096100</strong></li>
        <li>أدخل المبلغ المطلوب</li>
        <li>أرسل صورة الإيصال</li>
      </ol>
    </div>
  `,
  masrvi: `
    <div style="background:#E8F5E9; border-radius:12px; padding:16px; direction:rtl; font-family:Cairo; margin-top:12px;">
      <h4 style="color:#00A651; margin:0 0 10px;">📱 خطوات الدفع عبر مصرفي</h4>
      <ol style="margin:0; padding-right:20px; color:#333; line-height:2;">
        <li>افتح تطبيق مصرفي BVCI</li>
        <li>اختر "تحويل أموال"</li>
        <li>أدخل الرقم: <strong>36096100</strong></li>
        <li>أدخل المبلغ المطلوب</li>
        <li>أرسل صورة الإيصال</li>
      </ol>
    </div>
  `,
  sedad: `
    <div style="background:#E8EAF6; border-radius:12px; padding:16px; direction:rtl; font-family:Cairo; margin-top:12px;">
      <h4 style="color:#1B3F7B; margin:0 0 10px;">🏦 خطوات الدفع عبر السداد</h4>
      <ol style="margin:0; padding-right:20px; color:#333; line-height:2;">
        <li>افتح تطبيق بنك السداد BMI</li>
        <li>اختر "تحويل"</li>
        <li>أدخل الرقم: <strong>36096100</strong></li>
        <li>أدخل المبلغ المطلوب</li>
        <li>أرسل صورة الإيصال</li>
      </ol>
    </div>
  `
};

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
    ensureAuth();
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

      const docRef = await safeWrite(() => addDoc(collection(db, 'mt_orders'), orderData)) as any;
      
      // Update user stats
      if (user) {
        await safeWrite(() => setDoc(doc(db, 'mt_users', user.id), {
          totalSpent: increment(subtotal),
          ordersCount: increment(1)
        }, { merge: true }));
      }

      // 3. WhatsApp Integration
      const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
      const message = `طلب جديد Panda! 📱%0Aالرقم: ${orderNumber}%0Aالاسم: ${formData.name}%0Aالهاتف: ${formData.phone}%0Aالمبلغ: ${subtotal} أوقية%0Aطريقة الدفع: ${selectedMethod?.name || paymentMethod}`;
      const waLink = `https://wa.me/22236096100?text=${message}`;

      // 4. Clear cart and redirect
      clearCart();
      toast.success('تم استلام طلبك بنجاح! 🎉');
      
      // Delay to show toast
      setTimeout(() => {
        window.open(waLink, '_blank');
        navigate('/confirmation', { state: { orderNumber, total: subtotal, paymentMethod: selectedMethod?.name || paymentMethod, orderId: docRef.id } });
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إتمام الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

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
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    border: `2px solid ${paymentMethod === method.id ? method.color : '#e0e0e0'}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    background: paymentMethod === method.id ? method.bgColor : 'white',
                    transition: 'all 0.2s',
                    direction: 'rtl',
                    marginBottom: '10px',
                    textAlign: 'right',
                    width: '100%'
                  }}
                >
                  {/* Logo with custom design */}
                  {method.id === 'bankily' && (
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: '#004B9B',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.8, letterSpacing: '1px' }}>BPM</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '1px', fontFamily: 'Cairo' }}>بنكيلي</span>
                    </div>
                  )}
                  {method.id === 'masrvi' && (
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: '#00A651',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.8, letterSpacing: '1px' }}>BVCI</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '1px', fontFamily: 'Cairo' }}>مصرفي</span>
                    </div>
                  )}
                  {method.id === 'sedad' && (
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: 'linear-gradient(135deg,#1B3F7B,#2E5FA3)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.8, letterSpacing: '1px' }}>BMI</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '1px', fontFamily: 'Cairo' }}>السداد</span>
                    </div>
                  )}
                  
                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#1A1A1A',
                      fontFamily: 'Cairo',
                    }}>{method.name}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      fontFamily: 'Cairo',
                      marginTop: '2px',
                    }}>{method.description}</div>
                  </div>
                  
                  {/* Radio indicator */}
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: `2px solid ${paymentMethod === method.id ? method.color : '#ccc'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {paymentMethod === method.id && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: method.color,
                      }}></div>
                    )}
                  </div>
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
                  className="bg-white/10 rounded-3xl p-6 border border-white/10 flex flex-col gap-6"
                >
                  <div className="flex flex-col items-center py-4 border-b border-white/5">
                     <span className="text-sm font-bold text-gray-400">المبلغ المطلوب</span>
                     <span className="text-4xl font-black text-accent">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div dangerouslySetInnerHTML={{ __html: PAYMENT_INSTRUCTIONS[paymentMethod] }} />

                  <div className="flex flex-col gap-4 mt-4">
                     <p className="font-bold text-sm text-white/90 mr-1">📎 أرفق إيصال الدفع</p>
                     <label className="cursor-pointer group">
                        <div className="bg-[#F8F9FF] border-2 border-accent border-dashed text-primary min-h-[120px] rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:brightness-105 transition-all p-4">
                           <div className="text-3xl">🧾</div>
                           <span className="font-black text-sm">{proofImage ? 'تغيير صورة الإثبات' : 'اضغط لرفع صورة الإيصال'}</span>
                           <span className="text-[10px] text-gray-500 font-bold">JPG, PNG — حتى 5MB</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                     </label>
                     
                     {proofPreview && (
                       <div className="relative rounded-2xl overflow-hidden border-2 border-accent/20">
                          <img src={proofPreview} className="w-full h-full object-contain max-h-[300px] bg-black/20" />
                          <div className="absolute bottom-2 right-2 bg-green-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ✅ تم رفع الإيصال
                          </div>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setProofImage(null); 
                              setProofPreview(null);
                            }} 
                            className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform"
                          >
                             <Trash2 className="w-4 h-4" />
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
