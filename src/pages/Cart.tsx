import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';

export function Cart() {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 text-center flex flex-col items-center gap-8">
        <div className="bg-gray-100 p-12 rounded-full">
           <ShoppingBag className="w-20 h-20 text-gray-300" />
        </div>
        <h2 className="text-4xl font-black text-primary">سلة التسوق فارغة</h2>
        <p className="text-gray-500 max-w-sm">يبدو أنك لم تضف أي منتج بعد. استكشف أحدث الهواتف وابدأ التسوق الآن.</p>
        <Link to="/products" className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xl hover:scale-105 transition-transform">تصفح المنتجات</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-12">
      <h1 className="text-4xl font-black text-primary">سلة التسوق</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
        {/* Items */}
        <div className="flex flex-col gap-6">
          {cart.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-6"
            >
              <img src={item.image} alt={item.name} className="w-24 h-24 object-contain" />
              <div className="flex-1 text-center sm:text-right">
                <h3 className="font-black text-lg text-primary">{item.name}</h3>
                <p className="text-accent font-bold">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 text-primary hover:bg-white rounded-lg"><Minus className="w-4 h-4" /></button>
                <span className="w-8 text-center font-black">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-primary hover:bg-white rounded-lg"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="text-left">
                <p className="font-black text-primary mb-2">{formatPrice(item.price * item.quantity)}</p>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-primary rounded-[40px] p-8 text-white h-fit sticky top-32">
           <h3 className="text-2xl font-black mb-8 underline decoration-accent/30 underline-offset-8">ملخص الطلب</h3>
           <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center text-gray-300 font-bold">
                 <span>المجموع الفرعي</span>
                 <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-300 font-bold">
                 <span>التوصيل</span>
                 <span className="text-accent">مجاني</span>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div className="flex justify-between items-center text-2xl font-black">
                 <span>الإجمالي</span>
                 <span className="text-accent">{formatPrice(subtotal)}</span>
              </div>
              <Link to="/checkout" className="bg-accent text-primary p-5 rounded-2xl font-black text-xl text-center hover:scale-105 transition-transform mt-4">إتمام الطلب</Link>
           </div>
           
           <div className="mt-12 flex flex-col gap-4 text-xs font-bold text-gray-400 border-t border-white/5 pt-8">
              <div className="flex items-center gap-3">
                 <div className="bg-white/10 p-2 rounded-lg text-accent">✅</div>
                 <span>الدفع آمن ومضمون</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-white/10 p-2 rounded-lg text-accent">🚚</div>
                 <span>موريتانيا - توصيل خلال 24 ساعة</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
