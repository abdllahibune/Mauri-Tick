import { useLocation, Link, Navigate } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';
import { CheckCircle, ShoppingBag, MessageSquare, ArrowRight } from 'lucide-react';

export function Confirmation() {
  const location = useLocation();
  const state = location.state as { orderNumber: string; total: number; paymentMethod: string; orderId: string } | null;

  if (!state) return <Navigate to="/" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center text-center gap-12">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10 }}
        className="bg-green-100 p-8 rounded-full text-green-600"
      >
        <CheckCircle className="w-24 h-24" />
      </motion.div>

      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-black text-primary">تم استلام طلبك!</h1>
        <p className="text-gray-500 text-xl font-medium">رقم الطلب الخاص بك هو <span className="text-primary font-black ml-1" dir="ltr">#{state.orderNumber}</span></p>
      </div>

      <div className="w-full bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-8">
        <div className="flex flex-col gap-4 pb-8 border-b border-gray-50">
           <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-gray-400">طريقة الدفع:</span>
              <span className="font-black text-primary">{state.paymentMethod}</span>
           </div>
           <div className="flex justify-between items-center text-2xl">
              <span className="font-bold text-gray-400">الإجمالي المدفوع:</span>
              <span className="font-black text-primary text-accent">{formatPrice(state.total)}</span>
           </div>
        </div>

        <div className="flex flex-col gap-4 text-right">
           <h4 className="font-black text-primary text-lg">شكراً لثقتك بنا 🙏</h4>
           <p className="text-gray-500 leading-relaxed font-bold">
             سيقوم فريق موري تيك بمراجعة عملية التحويل وتأكيد طلبك خلال مدة لا تتجاوز 24 ساعة. 
             سنقوم بالتواصل معك عبر رقم الواتساب لتنسيق موعد التوصيل.
           </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
         <Link to="/track" className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-xl flex items-center gap-3 hover:scale-105 transition-transform flex-1 justify-center shadow-xl">
           <ShoppingBag className="w-6 h-6" /> تتبع الطلب
         </Link>
         <a 
           href={`https://wa.me/22236096100`}
           target="_blank"
           rel="noreferrer"
           className="bg-[#25D366] text-white px-10 py-5 rounded-2xl font-black text-xl flex items-center gap-3 hover:scale-105 transition-transform flex-1 justify-center shadow-xl"
         >
           <MessageSquare className="w-6 h-6" /> تواصل واتساب
         </a>
      </div>

      <Link to="/" className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all">
         <ArrowRight className="w-5 h-5" /> العودة للرئيسية
      </Link>
    </div>
  );
}
