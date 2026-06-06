import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ensureAuth } from '../lib/firebase';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    ensureAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      setIsSuccess(true);
      // Small delay to show success state before navigating
      setTimeout(() => {
        const redirect = new URLSearchParams(window.location.search).get('redirect') || '/account';
        navigate(redirect);
      }, 1500);
    } catch (err: any) {
      const message = err.message || 'حدث خطأ أثناء تسجيل الدخول';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col gap-8 relative overflow-hidden"
      >
        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4 text-center p-6"
            >
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  <ShieldCheck className="w-12 h-12" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-black text-primary">تم تسجيل الدخول بنجاح!</h2>
              <p className="text-gray-400 font-bold">جاري تحويلك إلى حسابك...</p>
              <Loader2 className="w-6 h-6 animate-spin text-primary mt-2" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center">
          <h1 className="text-4xl font-black text-primary mb-2">تسجيل الدخول</h1>
          <p className="text-gray-400 font-bold">أهلاً بك مجدداً في Panda</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 text-red-500 p-4 rounded-2xl text-center text-sm font-bold border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">البريد الإلكتروني</label>
            <div className="relative">
              <LogIn className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                id="email"
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 text-lg font-bold outline-none focus:ring-2 ring-primary/20"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 mr-2">كلمة المرور</label>
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

          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="w-4 h-4 accent-primary" />
            <label htmlFor="remember" className="text-xs font-bold text-gray-500">تذكرني</label>
          </div>

          <button 
            type="submit" 
            id="loginBtn"
            disabled={loading}
            className="bg-primary text-white p-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-50">
           <p className="text-sm font-bold text-gray-400">
             ليس لديك حساب؟ <Link to="/register" className="text-primary hover:underline">سجل الآن</Link>
           </p>
        </div>
      </motion.div>
    </div>
  );
}
