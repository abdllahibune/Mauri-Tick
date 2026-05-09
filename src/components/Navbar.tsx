import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Search, Menu, X, User, Shield, Languages, LayoutGrid, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCompare } from '../context/CompareContext';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart, wishlist } = useCart();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { compareList } = useCompare();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(collection(db, 'mt_notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const allNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const userNotifs = allNotifs.filter(n => n.targetUserIds === 'all' || n.targetUserIds.includes(user.id));
      setNotifications(userNotifs);
    });

    return unsub;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.readBy?.includes(user?.id)).length;

  const markAsRead = async (notifId: string) => {
    if (!user) return;
    const notif = notifications.find(n => n.id === notifId);
    if (notif?.readBy?.includes(user.id)) return;

    try {
      await updateDoc(doc(db, 'mt_notifications', notifId), {
        readBy: arrayUnion(user.id)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
    
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    
    clickTimerRef.current = setTimeout(() => {
      setLogoClicks(0);
    }, 500);

    if (logoClicks >= 2) { // 3rd click
      setLogoClicks(0);
      navigate('/mt-2025-admin');
    }
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.products'), path: '/products' },
    { name: 'تتبع الطلب', path: '/track' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 navbar-inner">
          {/* Mobile Left: Menu Toggle */}
          <div className="navbar-left">
            <button 
              className="p-2 text-gray-500 burger-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo */}
          <div onClick={handleLogoClick} className="flex flex-col cursor-pointer select-none navbar-logo">
            <span className="text-xl font-black text-primary tracking-tighter">MAURI TICK</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 md:z-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  "text-sm font-bold transition-colors hover:text-primary",
                  location.pathname === link.path ? "text-primary" : "text-gray-500"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Icons / Right Side */}
          <div className="flex items-center gap-2 navbar-right">
            <Link to="/products" className="p-2 text-gray-500 hover:text-primary transition-colors search-btn flex">
              <Search className="w-6 h-6" />
            </Link>

            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-primary transition-colors relative notifications-btn hidden md:flex"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white" />
              )}
            </button>

            <Link to="/wishlist" className="p-2 text-gray-500 hover:text-primary transition-colors relative wishlist-btn hidden md:flex">
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="p-2 text-gray-500 hover:text-primary transition-colors relative cart-btn flex">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="cart-badge">
                  {cart.length}
                </span>
              )}
            </Link>

            <Link to="/compare" className="p-2 text-gray-500 hover:text-primary transition-colors relative compare-btn hidden md:flex">
               <LayoutGrid className="w-6 h-6" />
               {compareList.length > 0 && (
                 <span className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                   {compareList.length}
                 </span>
               )}
            </Link>

            <button 
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="p-2 text-gray-500 hover:text-primary transition-colors flex items-center gap-1 font-bold text-xs lang-switcher hidden md:flex"
            >
              <Languages className="w-5 h-5" />
              {language === 'ar' ? 'EN' : 'العربية'}
            </button>
            
            {user ? (
               <Link to="/account" className="flex items-center gap-2 bg-primary/5 px-2 py-2 rounded-xl text-primary hover:bg-primary/10 transition-all user-btn">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-black hidden lg:block">{user.name || user.phone}</span>
               </Link>
            ) : (
               <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-sm user-btn">
                 <User className="w-5 h-5" /> <span className="hidden sm:inline">{t('nav.login')}</span>
               </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 mobile-menu">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "text-lg font-bold p-2 rounded-xl",
                location.pathname === link.path ? "bg-primary text-white" : "text-gray-700"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="grid grid-cols-2 gap-2 border-t pt-4">
            <Link 
              to="/wishlist" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-700"
            >
              <Heart className="w-5 h-5 text-red-500" /> المفضلة ({wishlist.length})
            </Link>
            <Link 
              to="/compare" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-700"
            >
              <LayoutGrid className="w-5 h-5 text-blue-500" /> المقارنة ({compareList.length})
            </Link>
          </div>

          <button 
            onClick={() => { setLanguage(language === 'ar' ? 'en' : 'ar'); setIsMenuOpen(false); }}
            className="flex items-center justify-between p-3 bg-primary/5 rounded-xl text-sm font-bold text-primary"
          >
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5" /> اللغة
            </div>
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {user ? (
            <Link to="/account" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold p-2 text-primary border-t pt-4 flex items-center gap-2">
              <User className="w-5 h-5" /> حسابي
            </Link>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold p-2 text-primary border-t pt-4 flex items-center gap-2">
              <LogIn className="w-5 h-5" /> تسجيل الدخول
            </Link>
          )}
        </div>
      )}

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifications(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-24 left-4 md:left-auto md:right-[20%] w-[calc(100%-32px)] md:w-80 bg-white border border-gray-100 rounded-[32px] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[500px]"
              dir="rtl"
            >
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-black text-primary flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" /> تنبيهاتك
                </h3>
                {unreadCount > 0 && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">جديد</span>}
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-4">
                     <div className="bg-gray-50 p-4 rounded-full text-gray-300"><Bell className="w-8 h-8" /></div>
                     <p className="text-xs font-bold text-gray-400">لا توجد إشعارات حالياً</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); setShowNotifications(false); }}
                        className={cn(
                          "p-6 cursor-pointer transition-all border-b border-gray-50 hover:bg-gray-50 group flex flex-col gap-1",
                          !n.readBy?.includes(user?.id) ? "bg-primary/[0.02]" : "opacity-60"
                        )}
                      >
                         <h4 className="font-black text-sm text-primary group-hover:text-accent transition-colors">{n.title}</h4>
                         <p className="text-xs font-bold text-gray-500 leading-relaxed">{n.message}</p>
                         <span className="text-[9px] font-black text-gray-300 mt-2">{n.createdAt?.toDate().toLocaleDateString('ar-MA')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                   <button onClick={() => setShowNotifications(false)} className="text-[10px] font-black text-gray-400 hover:text-primary transition-colors">إغلاق القائمة</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
