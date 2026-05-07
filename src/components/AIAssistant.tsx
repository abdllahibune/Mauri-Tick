import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Smartphone, DollarSign, Package, Phone, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order } from '../types';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, safeWrite } from '../lib/firebase';
import { formatPrice, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

type Message = {
  text: string;
  isBot: boolean;
  options?: { label: string; action: () => void; icon?: any }[];
  products?: Product[];
};

export function AIAssistant({ products }: { products: Product[] }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [flow, setFlow] = useState<'initial' | 'support' | 'track' | 'search' | 'budget'>('initial');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      showInitialOptions();
    }
    // Auto scroll
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, user]);

  const addBotMessage = (text: string, options?: Message['options'], suggestedProducts?: Product[]) => {
    setMessages(prev => [...prev, { text, isBot: true, options, products: suggestedProducts }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { text, isBot: false }]);
  };

  const showInitialOptions = () => {
    const userName = user?.name;
    const greeting = userName ? `أهلاً بك يا ${userName} في Mauri Tick! 👋` : "أهلاً بك في Mauri Tick! 👋";
    addBotMessage(`${greeting}\nكيف أساعدك اليوم؟`, [
      { label: '🔍 أبحث عن هاتف', icon: Search, action: () => handleFlow('search') },
      { label: '💰 عندي ميزانية محددة', icon: DollarSign, action: () => handleFlow('budget') },
      { label: '📦 تتبع طلبي', icon: Package, action: () => handleFlow('track') },
      { label: '📞 التحدث مع الدعم', icon: Phone, action: () => handleFlow('support') }
    ]);
  };

  const handleFlow = (newFlow: typeof flow) => {
    setFlow(newFlow);
    if (newFlow === 'search') {
      addUserMessage('أبحث عن هاتف');
      addBotMessage("ما الماركة التي تفضل؟", [
        { label: 'iPhone', action: () => showProductsByBrand('Apple') },
        { label: 'Samsung', action: () => showProductsByBrand('Samsung') },
        { label: 'Xiaomi', action: () => showProductsByBrand('Xiaomi') },
        { label: 'Huawei', action: () => showProductsByBrand('Huawei') },
        { label: 'أي ماركة', action: () => showProductsByBrand('all') }
      ]);
    } else if (newFlow === 'budget') {
      addUserMessage('عندي ميزانية محددة');
      addBotMessage("كم ميزانيتك بالأوقية؟", [
        { label: 'أقل من 20,000', action: () => showProductsByBudget(0, 20000) },
        { label: '20,000 - 50,000', action: () => showProductsByBudget(20000, 50000) },
        { label: '50,000 - 100,000', action: () => showProductsByBudget(50000, 100000) },
        { label: 'أكثر من 100,000', action: () => showProductsByBudget(100000, 9999999) }
      ]);
    } else if (newFlow === 'track') {
      addUserMessage('تتبع طلبي');
      addBotMessage("أدخل رقم هاتفك لنجد طلباتك 📱");
    } else if (newFlow === 'support') {
      addUserMessage('التحدث مع الدعم');
      addBotMessage("من فضلك أدخل رقم هاتفك لنتمكن من التواصل معك 📱");
    }
  };

  const showProductsByBrand = (brand: string) => {
    addUserMessage(brand === 'all' ? 'أي ماركة' : brand);
    const filtered = brand === 'all' ? products : products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    const slice = filtered.slice(0, 3);
    if (slice.length > 0) {
      addBotMessage(`إليك أفضل ما لدينا من ${brand === 'all' ? 'الهواتف' : brand}:`, undefined, slice);
      addBotMessage("هل تريد إضافته للسلة؟ 🛒", [
        { label: 'نعم، أريد التسوق', action: () => { addUserMessage('نعم'); addBotMessage('رائع! يمكنك النقر على المنتج لإضافته للسلة.'); } },
        { label: 'الرجوع للقائمة', action: showInitialOptions }
      ]);
    } else {
      addBotMessage("عذراً، لا نملك حالياً أجهزة من هذه الماركة.");
      showInitialOptions();
    }
  };

  const showProductsByBudget = (min: number, max: number) => {
    addUserMessage(`ميزانيتي بين ${min} و ${max}`);
    const filtered = products.filter(p => p.price >= min && p.price <= max);
    const slice = filtered.slice(0, 3);
    if (slice.length > 0) {
      addBotMessage(`إليك ما يناسب ميزانيتك:`, undefined, slice);
      addBotMessage("هل تريد إضافته للسلة؟ 🛒", [
        { label: 'نعم، شكراً', action: () => { addUserMessage('نعم'); addBotMessage('تفضل بالتسوق، نحن بانتظار خدمتك!'); } },
        { label: 'عرض ميزانيات أخرى', action: () => handleFlow('budget') }
      ]);
    } else {
      addBotMessage("عذراً، لا يوجد ما يناسب هذه الميزانية حالياً.");
      showInitialOptions();
    }
  };

  const handleManualInput = async () => {
    if (!input.trim()) return;
    const val = input.trim();
    addUserMessage(val);
    setInput('');

    if (flow === 'support') {
      // Save support request (instantly)
      safeWrite(() => addDoc(collection(db, 'support_requests'), {
        phone: val,
        createdAt: serverTimestamp(),
        status: 'pending'
      }));
      
      addBotMessage(`شكراً! سيتواصل معك فريق الدعم على الرقم: ${val}\n\nللتواصل الفوري الآن:`, [
        { label: 'ابدأ محادثة واتساب 💬', action: () => window.open(`https://wa.me/22236096100?text=مرحباً، أحتاج مساعدة (الهاتف: ${val})`), icon: MessageCircle }
      ]);
      setFlow('initial');
    } else if (flow === 'track') {
      // Fetch orders instantly
      const fetchOrders = async () => {
        const q = query(collection(db, 'orders'), where('phone', '==', val), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (snap.empty) {
          addBotMessage(`لم نجد أي طلبات مسجلة برقم الهاتف: ${val}`);
        } else {
          const order = snap.docs[0].data() as Order;
          addBotMessage(`وجدنا طلبك الأخير!\nرقم الطلب: ${order.orderNumber}\nالحالة: ${order.status}\nالمجموع: ${formatPrice(order.total)}`);
        }
        addBotMessage('كيف أساعدك مرة أخرى؟', [
           { label: 'العودة للقائمة الرئيسية', action: showInitialOptions }
        ]);
      };
      fetchOrders();
      setFlow('initial');
    } else {
      addBotMessage("عذراً، أنا حالياً مبرمج للرد على الخيارات السريعة فقط.");
      showInitialOptions();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            className="bg-white rounded-[40px] shadow-2xl w-[350px] sm:w-[400px] overflow-hidden border-4 border-gray-100/50 flex flex-col mb-4 max-h-[600px] relative"
          >
            {/* Header */}
            <div className="bg-primary p-6 text-white flex justify-between items-center bg-gradient-to-br from-primary to-primary/80">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-2xl"><Bot className="w-6 h-6" /></div>
                <div className="flex flex-col">
                  <span className="font-black text-lg">Mauri Bot</span>
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">الدعم الذكي</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F8F9FE] scroll-smooth min-h-[300px]"
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex flex-col gap-4 max-w-[85%]",
                  msg.isBot ? "self-start" : "self-end"
                )}>
                  <div className={cn(
                    "p-5 rounded-[32px] font-bold text-sm leading-relaxed",
                    msg.isBot ? "bg-white text-gray-800 shadow-xl shadow-gray-100/50" : "bg-primary text-white shadow-xl shadow-primary/20"
                  )}>
                    {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>

                  {/* Product Suggestions */}
                  {msg.products && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                       {msg.products.map(p => (
                         <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                            <img src={p.images[0]} className="w-full h-20 object-contain rounded-xl" />
                            <span className="text-[10px] font-black text-primary truncate">{p.name}</span>
                            <span className="text-[10px] font-black text-accent">{formatPrice(p.price)}</span>
                         </div>
                       ))}
                    </div>
                  )}

                  {/* Options / Buttons */}
                  {msg.options && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={opt.action}
                          className="bg-white border-2 border-primary/10 text-primary py-3 px-5 rounded-2xl text-xs font-black hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2 group"
                        >
                          {opt.icon && <opt.icon className="w-3.5 h-3.5 group-hover:scale-110" />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-100 flex gap-2 bg-white">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
                placeholder="اكتب هنا..."
                className="flex-1 bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none border-2 border-transparent focus:border-primary/20 transition-all"
              />
              <button 
                onClick={handleManualInput}
                className="bg-primary text-white p-4 rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-primary/30"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-white p-5 rounded-full shadow-2xl flex items-center gap-3 hover:scale-110 active:scale-95 transition-all group overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500 skew-x-[-45deg]" />
        <span className="hidden sm:inline font-black tracking-tight">مساعد التسوق</span>
        <div className="relative">
          <MessageCircle className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-primary animate-pulse" />
        </div>
      </button>
    </div>
  );
}
