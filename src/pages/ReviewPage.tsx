import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, Send, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { db, safeWrite, ensureAuth } from '../lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Order } from '../types';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    ensureAuth();
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, 'mt_orders', orderId));
        if (snap.exists()) {
          const data = snap.data() as Order;
          if (data.status !== 'تم التسليم') {
            toast.error('يمكنك تقييم الطلب فقط بعد التسليم');
            navigate('/');
          } else {
            setOrder({ ...data, id: snap.id });
          }
        } else {
          toast.error('الطلب غير موجود');
          navigate('/');
        }
      } catch (err) {
        toast.error('خطأ في جلب بيانات الطلب');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!comment) return toast.error('يرجى كتابة تعليق');

    setSubmitting(true);
    await safeWrite(async () => {
      // Add a review for each product in the order
      const promises = order.items.map(item => 
        addDoc(collection(db, 'mt_reviews'), {
          orderId,
          productId: item.id,
          customerName: order.customerName,
          rating,
          comment,
          isVerified: true,
          isHidden: false,
          createdAt: serverTimestamp()
        })
      );
      
      await Promise.all(promises);
      setSubmitted(true);
      toast.success('شكرًا لتقييمك الرائع!');
    });
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[50px] shadow-2xl text-center max-w-lg border-4 border-green-50"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-green-100">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-primary mb-4">شكرًا لك!</h2>
          <p className="text-gray-500 font-bold text-lg mb-10 leading-relaxed">
            تقييمك يساعدنا على تقديم خدمة أفضل وتسهيل الاختيار للعملاء الآخرين.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary text-white px-12 py-5 rounded-2xl font-black text-xl w-full shadow-lg hover:scale-105 transition-transform"
          >
            العودة للرئيسية
          </button>
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-black text-primary mb-4">لم نتمكن من العثور على طلبك</h2>
        <p className="text-gray-500 font-bold mb-8">يرجى استخدام الرابط الذي وصلك عبر واتساب.</p>
        <button onClick={() => navigate('/')} className="bg-primary text-white px-8 py-3 rounded-xl font-bold">العودة للرئيسية</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-10"
      >
        <div className="text-center">
          <h1 className="text-5xl font-black text-primary tracking-tight mb-2">كيف كانت تجربتك؟</h1>
          <p className="text-gray-400 font-bold">نقدر جداً رأيك في Mauri Tick</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl border-2 border-gray-50">
          <div className="flex items-center gap-4 mb-10 bg-gray-50 p-4 rounded-3xl">
             <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary"><MessageSquare /></div>
             <div>
               <h3 className="font-black text-primary">{order.customerName}</h3>
               <p className="text-xs font-bold text-gray-400">طلب رقم: {order.orderNumber}</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-4 text-center">
              <label className="text-sm font-black text-gray-400 uppercase tracking-widest">تقييمك العام</label>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="transition-all hover:scale-125"
                  >
                    <Star 
                      className={cn(
                        "w-12 h-12 fill-current",
                        s <= rating ? "text-yellow-400" : "text-gray-200"
                      )} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 mr-2">أخبرنا بالتفاصيل</label>
              <textarea 
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="bg-gray-50 rounded-[32px] p-6 outline-none border-none focus:ring-2 ring-primary/20 font-bold h-40 resize-none text-lg"
                placeholder="الجودة، التوصيل، التعامل..."
              />
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl flex items-start gap-4">
               <div className="bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 mt-1">
                 <CheckCircle2 className="w-4 h-4" />
               </div>
               <p className="text-xs font-bold text-blue-900 leading-relaxed">
                 سيظهر تعليقك بجانبه علامة "عميل موثق ✅" لأنك قمت بالشراء الفعلي لهذا المنتج.
               </p>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="bg-primary text-white p-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
              إرسال التقييم
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
