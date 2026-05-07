import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      return toast.error('يرجى إدخال الاسم بالكامل');
    }
    if (password !== confirmPassword) {
      return toast.error('كلمات المرور غير متطابقة');
    }
    if (password.length < 8) {
      return toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    if ((!phone.startsWith('2') && !phone.startsWith('3')) || phone.length !== 8) {
      return toast.error('يرجى إدخال رقم هاتف موريتاني صحيح (2XXXXXXX أو 3XXXXXXX)');
    }

    try {
      await register(phone, password, name);
      navigate('/account');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
            إنشاء حساب
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
