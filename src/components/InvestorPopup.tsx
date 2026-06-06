import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, X, Phone, User, DollarSign, Send, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { StoreConfig } from '../types';
import toast from 'react-hot-toast';

export function InvestorPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<StoreConfig['investorPopup'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    amount: '',
    message: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'mt_config', 'settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as StoreConfig;
        setConfig(data.investorPopup || null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!config?.isActive) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'mt_investors'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      
      // WhatsApp notification
      const message = `طلب استثمار جديد! 🚀%0Aالاسم: ${formData.name}%0Aالهاتف: ${formData.phone}%0Aالمبلغ: ${formData.amount}%0Aالرسالة: ${formData.message}`;
      window.open(`https://wa.me/22236096100?text=${message}`);
      
      toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.');
      setIsOpen(false);
      setFormData({ name: '', phone: '', amount: '', message: '' });
    } catch (e) {
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-tr from-yellow-600 to-yellow-400 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 group"
      >
        <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20 group-hover:hidden" />
        <Briefcase className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black text-sm whitespace-nowrap">
          فرصة استثمارية 💼
        </span>
      </motion.button>

      {/* Popup Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-yellow-500 p-12 text-center text-white relative">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Briefcase className="w-32 h-32" />
                 </div>
                 <h2 className="text-3xl font-black mb-2">{config.title || '🚀 انضم لنجاح Panda'}</h2>
                 <p className="font-bold opacity-90">{config.description || 'نحن نبحث عن شركاء استراتيجيين للتوسع في السوق الموريتانية'}</p>
                 <div className="mt-6 bg-white/20 backdrop-blur-md rounded-2xl p-4 inline-block">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">الحد الأدنى للاستثمار</p>
                    <p className="text-2xl font-black">{config.minInvestment || '50,000 أوقية'}</p>
                 </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 md:p-12 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 mr-2 uppercase">الاسم بالكامل</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 font-bold outline-none focus:ring-2 ring-yellow-500/20" 
                      placeholder="محمد محمود"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 mr-2 uppercase">رقم الهاتف</label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input 
                        required
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 font-bold outline-none focus:ring-2 ring-yellow-500/20" 
                        placeholder="3XXXXXXX"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 mr-2 uppercase">مبلغ الاستثمار المقترح</label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input 
                        required
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 font-bold outline-none focus:ring-2 ring-yellow-500/20" 
                        placeholder="100,000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 mr-2 uppercase">رسالة إضافية</label>
                  <textarea 
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-yellow-500/20 h-24 resize-none" 
                    placeholder="هل لديك أي استفسارات؟"
                  />
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-yellow-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-yellow-300 shadow-xl shadow-yellow-500/20"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  إرسال عبر واتساب
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
