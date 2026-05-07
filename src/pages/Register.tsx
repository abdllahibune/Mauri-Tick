import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, UserPlus, Loader2, ShieldCheck, Mail, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, ensureAuth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { StoreConfig } from '../types';
import toast from 'react-hot-toast';

export function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    ensureAuth();
    const unsubscribe = onSnapshot(doc(db, 'config', 'settings'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate name is not empty
    if (!name.trim()) return toast.error('يرجى إدخال الاسم بالكامل');
    
    // Only validate phone format specifically
    const isMauriPhone = /^\d{8}$/.test(phone);
    if (!isMauriPhone) {
      return toast.error('يرجى إدخال رقم هاتف موريتاني صحيح (8 أرقام)');
    }

    // Only validate password length
    if (password.length < 8) return toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    
    // Only validate password match
    if (password !== confirmPassword) return toast.error('كلمات المرور غير متطابقة');

    try {
      await ensureAuth();
      if (config?.verificationMode === 'whatsapp') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOTP(otp);
        setIsVerifying(true);
        // Show for demo, as actual WhatsApp sending requires external API
        toast.success(`رمز التحقق المرسل لواتساب (للتجربة): ${otp}`, { duration: 8000 });
      } else if (config?.verificationMode === 'manual') {
        await register(phone, password, name);
        toast.success('تم إنشاء الحساب! سيتم تفعيله من قبل الإدارة قريباً.');
        navigate('/account');
      } else {
        await register(phone, password, name);
        navigate('/account');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode === generatedOTP) {
      try {
        await register(phone, password, name);
        toast.success('تم التحقق وإنشاء الحساب بنجاح! 🎉');
        navigate('/account');
      } catch (err: any) {
        toast.error(err.message);
      }
    } else {
      toast.error('رمز التحقق غير صحيح');
    }
  };

  if (isVerifying) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl text-center flex flex-col gap-8">
            <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary">
                <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-primary">تأكيد رقم الهاتف</h1>
            <p className="text-gray-400 font-bold">أدخل الرمز المرسل إلى {phone} عبر واتساب</p>
            
            <form onSubmit={handleVerify} className="flex flex-col gap-6">
                <input 
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl py-6 text-center text-4xl font-black tracking-[0.5em] outline-none focus:ring-4 ring-primary/10"
                    placeholder="000000"
                />
                <button 
                    disabled={loading || verificationCode.length < 6}
                    className="bg-primary text-white p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 disabled:bg-gray-200"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد التسجيل'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsVerifying(false)}
                  className="text-xs font-black text-primary uppercase tracking-widest underline"
                >
                  تغيير رقم الهاتف
                </button>
            </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col gap-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary mb-2">إنشاء حساب</h1>
          <p className="text-gray-400 font-bold">انضم لعائلة موري تيك اليوم</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">الاسم بالكامل</label>
            <div className="relative">
              <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="الاسم الثلاثي"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 text-lg font-bold outline-none focus:ring-2 ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">رقم الهاتف (2XXXXXXX أو 3XXXXXXX)</label>
            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type="text" 
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="رقم الهاتف"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 text-lg font-bold outline-none focus:ring-2 ring-primary/20"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">كلمة المرور (8 أحرف+)</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 text-lg font-bold outline-none focus:ring-2 ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">تأكيد كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 text-lg font-bold outline-none focus:ring-2 ring-primary/20"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-white p-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
            {config?.verificationMode === 'whatsapp' ? 'إرسال رمز التحقق' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-50">
           <p className="text-sm font-bold text-gray-400">
             لديك حساب بالفعل؟ <Link to="/login" className="text-primary hover:underline">سجل دخولك</Link>
           </p>
        </div>
      </motion.div>
    </div>
  );
}

