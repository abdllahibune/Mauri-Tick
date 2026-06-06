import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, Loader2 } from 'lucide-react';
import { db, safeWrite, ensureAuth } from '../lib/firebase';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { StoreConfig } from '../types';
import toast from 'react-hot-toast';

export default function Contact() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  useEffect(() => {
    ensureAuth();
    return onSnapshot(doc(db, 'mt_settings', 'general'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) return toast.error('يرجى ملء جميع الحقول');
    
    setLoading(true);
    await safeWrite(async () => {
      await addDoc(collection(db, 'mt_support_requests'), {
        ...form,
        type: 'contact_form',
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
      setForm({ name: '', phone: '', message: '' });
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-12"
      >
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter mb-4">تواصل معنا</h1>
          <p className="text-xl font-bold text-gray-400">نحن هنا للإجابة على استفساراتك 24/7</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a 
                href={`https://wa.me/222${config?.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="bg-green-50 p-8 rounded-[40px] flex flex-col gap-4 border border-green-100 hover:scale-105 transition-transform"
              >
                <div className="bg-green-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-green-900">واتساب</h3>
                  <p className="font-bold text-green-700" dir="ltr">222 {config?.whatsappNumber}</p>
                </div>
              </a>

              <div className="bg-blue-50 p-8 rounded-[40px] flex flex-col gap-4 border border-blue-100">
                <div className="bg-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-900">ساعات العمل</h3>
                  <p className="font-bold text-blue-700 whitespace-pre-line">{config?.workingHours || '24/7'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-[40px] flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl text-primary shadow-sm"><MapPin className="w-5 h-5" /></div>
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">الموقع</h4>
                  <p className="font-bold text-primary">نواكشوط، موريتانيا</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl text-primary shadow-sm"><Mail className="w-5 h-5" /></div>
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">البريد الإلكتروني</h4>
                  <p className="font-bold text-primary">contact@panda-store.com</p>
                </div>
              </div>
            </div>

            {/* Simple Map Placeholder */}
            <div className="aspect-video bg-gray-100 rounded-[40px] overflow-hidden relative">
              <img src="https://picsum.photos/seed/map/800/400" className="w-full h-full object-cover grayscale opacity-50" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-white p-4 rounded-3xl shadow-xl flex items-center gap-3">
                    <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
                    <span className="font-black text-primary text-sm tracking-tight">مقرنا الرئيسي في نواكشوط</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white border-2 border-gray-100 p-10 rounded-[40px] shadow-sm">
            <h2 className="text-3xl font-black text-primary mb-8">أرسل لنا رسالة</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 mr-2">الاسم الكامل</label>
                <input 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20 font-bold"
                  placeholder="محمد فال"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 mr-2">رقم الهاتف</label>
                <input 
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20 font-bold"
                  placeholder="36000000"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 mr-2">رسالتك</label>
                <textarea 
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                  className="bg-gray-50 rounded-2xl p-4 outline-none border-none focus:ring-2 ring-primary/20 font-bold h-40 resize-none"
                  placeholder="كيف يمكننا مساعدتك؟"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-primary text-white p-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال الاستفسار
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
