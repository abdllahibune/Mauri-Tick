import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Smartphone, DollarSign, Package, Phone, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order } from '../types';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, safeWrite } from '../lib/firebase';
import { formatPrice, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

type Message = {
  text: string;
  isBot: boolean;
  options?: { label: string; action: () => void; icon?: any }[];
  products?: Product[];
};

export function AIAssistant({ products: initialProducts }: { products: Product[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    const filtered = brand === 'all' ? initialProducts : initialProducts.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
    const slice = filtered.slice(0, 4);
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
    const filtered = initialProducts.filter(p => p.price >= min && p.price <= max);
    const slice = filtered.slice(0, 4);
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

  const getBotResponse = async (userMessage: string) => {
    const msg = userMessage.toLowerCase().trim();
    
    // ===== BUDGET SEARCH =====
    const budgetMatch = msg.match(/(\d[\d,\.]+)\s*(أوقية|ouguiya|مهم|ميزانية)?/);
    
    if (budgetMatch || msg.includes('ميزانية') || msg.includes('بسعر') || msg.includes('أقل من')) {
      let budget = 0;
      if (budgetMatch) {
        budget = parseInt(budgetMatch[1].replace(/[,\.]/g, ''));
      }
      
      if (budget > 0) {
        try {
          const q = query(
            collection(db, 'mt_products'),
            where('price', '<=', budget),
            orderBy('price', 'desc'),
            limit(4)
          );
          const snap = await getDocs(q);
          
          if (snap.empty) {
            const q2 = query(
              collection(db, 'mt_products'),
              where('price', '<=', budget * 1.2),
              orderBy('price', 'asc'),
              limit(4)
            );
            const snap2 = await getDocs(q2);
            
            if (snap2.empty) {
              return {
                text: `لم أجد منتجات بميزانية ${budget.toLocaleString()} أوقية 😔\nهل تريد زيادة الميزانية قليلاً؟`,
                products: []
              };
            }
            
            const results = snap2.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            return {
              text: `أقرب ما وجدته لميزانيتك 💡`,
              products: results
            };
          }
          
          const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
          return {
            text: `وجدت ${results.length} منتج بميزانية ${budget.toLocaleString()} أوقية 🎯`,
            products: results
          };
        } catch (e) {
          console.error('Budget search error:', e);
        }
      }
    }
    
    // ===== BRAND SEARCH =====
    const brands = [
      'apple', 'iphone', 'سامسونج', 'samsung',
      'هواوي', 'huawei', 'شاومي', 'xiaomi',
      'ريدمي', 'redmi', 'اوبو', 'oppo',
      'ريلمي', 'realme', 'نوكيا', 'nokia',
      'ون بلس', 'oneplus', 'سوني', 'sony',
      'ال جي', 'lg', 'موتورولا', 'motorola'
    ];
    
    let detectedBrand = null;
    for (const brand of brands) {
      if (msg.includes(brand)) {
        const brandMap: any = {
          'iphone': 'Apple', 'apple': 'Apple',
          'samsung': 'Samsung', 'سامسونج': 'Samsung',
          'huawei': 'Huawei', 'هواوي': 'Huawei',
          'xiaomi': 'Xiaomi', 'شاومي': 'Xiaomi',
          'redmi': 'Redmi', 'ريدمي': 'Redmi',
          'oppo': 'OPPO', 'اوبو': 'OPPO',
          'realme': 'Realme', 'ريلمي': 'Realme',
          'nokia': 'Nokia', 'نوكيا': 'Nokia',
        };
        detectedBrand = brandMap[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
        break;
      }
    }
    
    if (detectedBrand) {
      try {
        const allQ = query(collection(db, 'mt_products'), limit(50));
        const allSnap = await getDocs(allQ);
        const brandProducts = allSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => 
            p.brand?.toLowerCase() === detectedBrand?.toLowerCase() ||
            p.name?.toLowerCase().includes(detectedBrand?.toLowerCase() || '')
          )
          .slice(0, 4);
        
        if (brandProducts.length === 0) {
          return {
            text: `لا توجد منتجات ${detectedBrand} حالياً 😔\nسيتم إضافتها قريباً!`,
            products: []
          };
        }
        
        return {
          text: `هذه منتجات ${detectedBrand} المتوفرة لدينا 📱`,
          products: brandProducts
        };
      } catch (e) {
        console.error('Brand search error:', e);
      }
    }
    
    // ===== CATEGORY SEARCH =====
    const categoryMap: any = {
      'سماعة': 'سماعات وصوتيات',
      'سماعات': 'سماعات وصوتيات',
      'headphone': 'سماعات وصوتيات',
      'كفر': 'إكسسوارات',
      'شاحن': 'إكسسوارات',
      'لابتوب': 'لابتوب وحاسوب',
      'حاسوب': 'لابتوب وحاسوب',
      'laptop': 'لابتوب وحاسوب',
      'تابلت': 'أجهزة لوحية',
      'شاشة': 'شاشات وتلفزيونات',
      'تلفزيون': 'شاشات وتلفزيونات',
    };
    
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (msg.includes(keyword)) {
        try {
          const q = query(
            collection(db, 'mt_products'),
            where('category', '==', category),
            limit(4)
          );
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            return {
              text: `هذه ${category} المتوفرة لدينا 🎧`,
              products: snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
            };
          }
        } catch (e) {}
      }
    }
    
    // ===== SPECIFIC PRODUCT SEARCH =====
    if (msg.length > 3) {
      try {
        const allQ = query(collection(db, 'mt_products'), limit(100));
        const allSnap = await getDocs(allQ);
        const matched = allSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p =>
            p.name?.toLowerCase().includes(msg) ||
            p.brand?.toLowerCase().includes(msg) ||
            p.description?.toLowerCase().includes(msg)
          )
          .slice(0, 4);
        
        if (matched.length > 0) {
          return {
            text: `وجدت هذه النتائج لـ "${userMessage}" 🔍`,
            products: matched
          };
        }
      } catch (e) {}
    }
    
    // ===== DEFAULT RESPONSES =====
    if (msg.includes('مرحبا') || msg.includes('اهلا') || msg.includes('السلام')) {
      return {
        text: 'أهلاً وسهلاً! 👋\nأنا Mauri Bot، كيف أساعدك؟\n\nيمكنني مساعدتك في:\n🔍 البحث عن منتج\n💰 العثور على أفضل سعر\n📦 تتبع طلبك',
        products: []
      };
    }
    
    if (msg.includes('طلب') || msg.includes('تتبع')) {
      return {
        text: 'لتتبع طلبك، اذهب إلى صفحة "تتبع الطلب" من القائمة العلوية، أو تواصل معنا على واتساب 📦',
        products: [],
        whatsapp: true
      };
    }
    
    // Show random products as suggestions
    try {
      const q = query(collection(db, 'mt_products'), limit(4));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return {
          text: 'لم أفهم طلبك جيداً 😅\nإليك بعض منتجاتنا المميزة:',
          products: snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
        };
      }
    } catch (e) {}
    
    return {
      text: 'كيف يمكنني مساعدتك؟ 🤖\nاكتب اسم الجهاز أو الميزانية أو الماركة',
      products: []
    };
  };

  const handleManualInput = async () => {
    if (!input.trim()) return;
    const val = input.trim();
    addUserMessage(val);
    setInput('');

    if (flow === 'support') {
      safeWrite(() => addDoc(collection(db, 'mt_support_requests'), {
        phone: val,
        createdAt: serverTimestamp(),
        status: 'pending'
      }));
      
      addBotMessage(`شكراً! سيتواصل معك فريق الدعم على الرقم: ${val}\n\nللتواصل الفوري الآن:`, [
        { label: 'ابدأ محادثة واتساب 💬', action: () => window.open(`https://wa.me/22236096100?text=مرحباً، أحتاج مساعدة (الهاتف: ${val})`), icon: MessageCircle }
      ]);
      setFlow('initial');
    } else if (flow === 'track') {
      const q = query(collection(db, 'mt_orders'), where('phone', '==', val), orderBy('createdAt', 'desc'));
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
      setFlow('initial');
    } else {
      const response = await getBotResponse(val);
      const options = response.whatsapp ? [
        { label: 'تواصل واتساب 💬', action: () => window.open('https://wa.me/22236096100'), icon: MessageCircle }
      ] : undefined;
      
      addBotMessage(response.text, options, response.products);
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
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {msg.products.map(p => {
                        const price = p.discount > 0
                          ? Math.round(p.price * (1 - p.discount / 100))
                          : p.price;
                        return (
                          <div 
                            key={p.id}
                            onClick={() => { setIsOpen(false); navigate(`/product/${p.id}`); }}
                            className="bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100 transition-transform hover:-translate-y-0.5 shadow-sm"
                          >
                            <div className="bg-[#f8f8f8] aspect-[5/3] flex items-center justify-center p-2">
                              <img 
                                src={p.images?.[0] || ''} 
                                className="w-full h-full object-contain"
                                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150/f5f5f5/1A237E?text=📱')}
                              />
                            </div>
                            <div className="p-2">
                              <p className="text-[9px] text-gray-400 font-bold m-0 leading-none">
                                {p.brand || ''}
                              </p>
                              <p className="text-[11px] font-bold m-0 mt-0.5 line-clamp-2 leading-tight text-gray-800">
                                {p.name}
                              </p>
                              <p className="text-primary font-black text-xs m-0 mt-1">
                                {price.toLocaleString()} أوقية
                              </p>
                            </div>
                          </div>
                        );
                      })}
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
