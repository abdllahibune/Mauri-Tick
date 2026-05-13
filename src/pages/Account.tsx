import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { User, ShoppingCart, Heart, RefreshCw, Ticket, LogOut, Loader2, ChevronRight, MapPin, Phone, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export function Account() {
  const { user, loading, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [localUser, setLocalUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  async function loadUserData() {
    // Try localStorage first as a fallback/initial state
    const stored = localStorage.getItem('mt_user');
    if (stored && !localUser) {
      try {
        const parsed = JSON.parse(stored);
        setLocalUser(parsed);
        setName(parsed.name || '');
        setPhone(parsed.phone || '');
        setCity(parsed.city || '');
        setAddress(parsed.address || '');
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    // If we have a user from AuthContext, prioritize it and load full profile
    if (user) {
      setLocalUser(user);
      setName(user.name || '');
      setPhone(user.phone || '');
      setCity(user.city || '');
      setAddress(user.address || '');
      
      // Update localStorage to keep in sync
      localStorage.setItem('mt_user', JSON.stringify(user));

      // Fetch fresh data from Firebase specifically for point-in-time accuracy
      try {
        const snap = await getDoc(doc(db, 'mt_customers', user.id));
        if (snap.exists()) {
          const data = snap.data();
          setLocalUser((prev: any) => ({ ...prev, ...data }));
          setName(data.name || '');
          setPhone(data.phone || '');
          setCity(data.city || '');
          setAddress(data.address || '');
        }
      } catch (e) {
        console.error('Profile load error:', e);
      }
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('mt_user');
    sessionStorage.removeItem('mt_user');
    await logout();
    navigate('/');
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({
        name,
        phone,
        city,
        address
      });
      
      // Update localStorage
      const updated = { ...localUser, name, phone, city, address };
      localStorage.setItem('mt_user', JSON.stringify(updated));
      
      toast.success('✅ تم حفظ المعلومات');
    } catch (e: any) {
      toast.error('خطأ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !localUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-gray-400">جاري تحميل بياناتك...</p>
      </div>
    );
  }

  // If NOT logged in, show login prompt
  if (!user && !loading) {
    return (
      <div className="text-center py-20 px-4 font-cairo" dir="rtl">
        <div className="text-6xl mb-6">👤</div>
        <h2 className="text-2xl font-black text-primary mb-2">مرحباً بك!</h2>
        <p className="text-gray-400 font-bold mb-8">سجل دخولك للوصول لحسابك</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link 
            to="/login" 
            className="bg-primary text-white py-4 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            تسجيل الدخول
          </Link>
          <Link 
            to="/register" 
            className="text-primary font-black py-2 hover:underline"
          >
            ليس لديك حساب؟ سجل الآن
          </Link>
        </div>
      </div>
    );
  }

  // If logged in, show profile
  if (!localUser) return null;

  return (
    <div className="max-w-[600px] mx-auto px-4 py-8 font-cairo" dir="rtl">
      {/* Profile header */}
      <div className="bg-gradient-to-br from-primary to-blue-900 rounded-[32px] p-8 text-center mb-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full -ml-12 -mb-12 blur-xl" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black">
            {localUser.name?.[0]?.toUpperCase() || '👤'}
          </div>
          <h2 className="text-2xl font-black mb-1">{localUser.name || 'مستخدم'}</h2>
          <p className="text-white/70 font-bold mb-4">{localUser.phone || localUser.email || ''}</p>
          
          {localUser.points > 0 && (
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-5 py-2 text-sm font-black text-accent drop-shadow-sm">
              ⭐ {localUser.points || 0} نقطة
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { icon: <ShoppingCart className="w-7 h-7" />, label: 'طلباتي', link: '/orders', color: 'bg-blue-50 text-blue-600' },
          { icon: <Heart className="w-7 h-7" />, label: 'المفضلة', link: '/wishlist', color: 'bg-red-50 text-red-600' },
          { icon: <RefreshCw className="w-7 h-7" />, label: 'استبدالاتي', link: '/account?tab=tradein', color: 'bg-indigo-50 text-indigo-600' },
          { icon: <Ticket className="w-7 h-7" />, label: 'كوبوناتي', link: '/account?tab=coupons', color: 'bg-orange-50 text-orange-600' },
        ].map((item, idx) => (
          <Link 
            key={idx}
            to={item.link}
            className="bg-white rounded-3xl p-6 text-center flex flex-col items-center gap-3 shadow-md border border-gray-50 hover:shadow-lg transition-all active:scale-95 group"
          >
            <div className={`p-4 rounded-2xl ${item.color} group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <span className="text-sm font-black text-primary">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Edit profile form */}
      <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-50 mb-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-primary">تعديل المعلومات</h3>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 mr-2 uppercase tracking-widest">الاسم الكامل</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="أدخل اسمك"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl py-4 px-5 font-bold outline-none transition-all focus:bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 mr-2 uppercase tracking-widest">رقم الهاتف</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="رقم هاتفك"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl py-4 px-5 font-bold outline-none transition-all focus:bg-white"
              />
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 mr-2 uppercase tracking-widest">المدينة</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="مثال: نواكشوط"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl py-4 px-5 font-bold outline-none transition-all focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 mr-2 uppercase tracking-widest">العنوان</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="عنوانك"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl py-4 px-5 font-bold outline-none transition-all focus:bg-white"
              />
            </div>
          </div>
          
          <button 
            onClick={saveProfile}
            disabled={saving}
            className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 hover:bg-blue-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <SaveIcon className="w-6 h-6" />}
            حفظ التغييرات
          </button>
        </div>
      </div>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 py-5 rounded-[24px] font-black text-lg hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-3"
      >
        <LogOut className="w-5 h-5" /> تسجيل الخروج
      </button>
    </div>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}
