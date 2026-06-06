import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Grid, 
  Tag, 
  Star, 
  Package, 
  Handshake, 
  Search, 
  Bell, 
  Heart, 
  ShoppingCart, 
  User, 
  LogIn, 
  Menu, 
  X, 
  ChevronDown 
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, arrayUnion, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart, wishlist } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const FALLBACK_CATEGORIES = [
    { id: '1', name: 'إلكترونيات', href: '/products?category=إلكترونيات' },
    { id: '2', name: 'ملابس وأزياء', href: '/products?category=ملابس' },
    { id: '3', name: 'منزل ومطبخ', href: '/products?category=منزل' },
    { id: '4', name: 'جمال وعناية', href: '/products?category=جمال' },
    { id: '5', name: 'رياضة', href: '/products?category=رياضة' },
    { id: '6', name: 'أطفال', href: '/products?category=أطفال' },
    { id: '7', name: 'ألعاب وترفيه', href: '/products?category=ألعاب' },
  ];

  const [displayCategories, setDisplayCategories] = useState<any[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    let active = true;
    async function seedAndFetchCategories() {
      try {
        const snap = await getDocs(collection(db, 'panda_categories'));
        if (!active) return;

        if (snap.size === 0) {
          const defaults = [
            { name: 'إلكترونيات', nameEn: 'Electronics', icon: 'Smartphone', order: 1, active: true },
            { name: 'ملابس وأزياء', nameEn: 'Fashion', icon: 'Shirt', order: 2, active: true },
            { name: 'منزل ومطبخ', nameEn: 'Home', icon: 'Home', order: 3, active: true },
            { name: 'جمال وعناية', nameEn: 'Beauty', icon: 'Sparkles', order: 4, active: true },
            { name: 'رياضة', nameEn: 'Sports', icon: 'Trophy', order: 5, active: true },
            { name: 'أطفال', nameEn: 'Kids', icon: 'Baby', order: 6, active: true },
            { name: 'ألعاب وترفيه', nameEn: 'Gaming', icon: 'Gamepad2', order: 7, active: true },
          ];
          
          for (const cat of defaults) {
            await addDoc(collection(db, 'panda_categories'), {
              ...cat,
              createdAt: new Date()
            });
          }
          
          if (!active) return;
          const freshSnap = await getDocs(collection(db, 'panda_categories'));
          const freshList = freshSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          
          const uniqueCats: any[] = [];
          const seen = new Set();
          for (const item of freshList) {
            if (item.active !== false && !seen.has(item.name)) {
              seen.add(item.name);
              uniqueCats.push(item);
            }
          }
          uniqueCats.sort((a, b) => (a.order || 0) - (b.order || 0));
          if (uniqueCats.length > 0) {
            setDisplayCategories(uniqueCats);
          }
        } else {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          
          const uniqueCats: any[] = [];
          const seen = new Set();
          for (const item of list) {
            if (item.active !== false && !seen.has(item.name)) {
              seen.add(item.name);
              uniqueCats.push(item);
            }
          }
          uniqueCats.sort((a, b) => (a.order || 0) - (b.order || 0));
          if (uniqueCats.length > 0) {
            setDisplayCategories(uniqueCats);
          }
        }
      } catch (err) {
        console.error("Error with panda_categories Firestore execution:", err);
      }
    }
    seedAndFetchCategories();
    return () => {
      active = false;
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm navbar" style={{ direction: 'rtl' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 navbar-inner">
          
          {/* Left Side: Logo */}
          <div onClick={handleLogoClick} className="flex flex-col cursor-pointer select-none navbar-logo flex-shrink-0">
            <span className="text-2xl font-black text-primary tracking-tighter hover:scale-105 transition-transform">
              Panda
            </span>
          </div>

          {/* Center Side: Desktop Menu Link with SVG Icons & Dropdown (No Emojis) */}
          <div className="hidden lg:flex items-center gap-6 z-10 mx-4">
            
            {/* 1. الرئيسية */}
            <Link 
              to="/" 
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-primary py-2 px-1",
                location.pathname === "/" ? "text-primary" : "text-gray-500"
              )}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </Link>

            {/* 2. الأقسام Dropdown Link */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-primary py-2 px-1",
                  location.pathname === "/products" ? "text-primary" : "text-gray-500"
                )}
              >
                <Grid className="w-4 h-4" />
                <span>الأقسام</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    {displayCategories.map((cat: any) => (
                      <div
                        key={cat.id || cat.name}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate(`/products?category=${encodeURIComponent(cat.name)}`);
                        }}
                        className="hover:bg-[#f8f9fc] transition-colors text-right text-gray-700 hover:text-primary"
                        style={{
                          padding: '12px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontFamily: 'Cairo, sans-serif',
                          fontSize: '14px',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{cat.name}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. العروض */}
            <Link 
              to="/offers" 
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-primary py-2 px-1",
                location.pathname === "/offers" ? "text-primary" : "text-gray-500"
              )}
            >
              <Tag className="w-4 h-4" />
              <span>العروض</span>
            </Link>

            {/* 4. طلب مخصص */}
            <Link 
              to="/custom-order" 
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-primary py-2 px-1",
                location.pathname === "/custom-order" ? "text-primary" : "text-gray-500"
              )}
            >
              <Star className="w-4 h-4" />
              <span>طلب مخصص</span>
            </Link>

            {/* 5. تتبع الطلب */}
            <Link 
              to="/track" 
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-primary py-2 px-1",
                location.pathname === "/track" ? "text-primary" : "text-gray-500"
              )}
            >
              <Package className="w-4 h-4" />
              <span>تتبع الطلب</span>
            </Link>

            {/* 6. انضم كشريك */}
            <Link 
              to="/partners" 
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold transition-colors hover:text-primary py-2 px-1",
                location.pathname === "/partners" ? "text-primary" : "text-gray-500"
              )}
            >
              <Handshake className="w-4 h-4" />
              <span>انضم كشريك</span>
            </Link>

          </div>

          {/* Right Side Icons: Search, Notifications, Wishlist, Cart, Account (No Emojis) */}
          <div className="flex items-center gap-1 md:gap-2 navbar-right">
            
            {/* Search */}
            <Link to="/products" className="p-2 text-gray-500 hover:text-primary transition-colors flex" title="بحث">
              <Search className="w-5.5 h-5.5 md:w-6 md:h-6" />
            </Link>

            {/* Notifications */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-primary transition-colors relative flex"
              title="التنبيهات"
            >
              <Bell className="w-5.5 h-5.5 md:w-6 md:h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 w-2.5 h-2.5 rounded-full border border-white" />
              )}
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="p-2 text-gray-500 hover:text-primary transition-colors relative flex" title="المفضلة">
              <Heart className="w-5.5 h-5.5 md:w-6 md:h-6" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-accent text-primary text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="p-2 text-gray-500 hover:text-primary transition-colors relative flex" title="السلة">
              <ShoppingCart className="w-5.5 h-5.5 md:w-6 md:h-6" />
              {cart.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-accent text-primary text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Account / User */}
            {user ? (
               <Link to="/account" className="flex items-center gap-1.5 bg-primary/5 p-2 rounded-xl text-primary hover:bg-primary/10 transition-all user-btn" title="حسابي">
                  <User className="w-5 h-5" />
                  <span className="text-xs font-black hidden lg:block max-w-[80px] truncate">{user.name || user.phone}</span>
               </Link>
            ) : (
               <Link to="/login" className="p-2 text-gray-500 hover:text-primary transition-colors flex" title="تسجيل الدخول">
                 <User className="w-5.5 h-5.5 md:w-6 md:h-6" />
               </Link>
            )}

            {/* Mobile Menu Toggle button */}
            <button 
              className="p-2 text-gray-500 burger-btn lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu Container (Matching links, SVG-only, cleanly rendered) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-lg"
          >
            <div className="p-4 flex flex-col gap-3">
              
              {/* 1. الرئيسية */}
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl font-bold text-base transition-colors",
                  location.pathname === "/" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Home className="w-5 h-5" />
                <span>الرئيسية</span>
              </Link>

              {/* 2. الأقسام */}
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl font-bold text-base transition-colors text-right",
                    isMobileCategoryOpen ? "bg-gray-50 text-primary" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Grid className="w-5 h-5 text-primary" />
                    <span className="font-bold text-gray-800 text-sm">الأقسام</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isMobileCategoryOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isMobileCategoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col overflow-hidden"
                    >
                      {displayCategories.map((cat: any) => (
                        <div
                          key={cat.id || cat.name}
                          onClick={() => {
                            setIsMobileCategoryOpen(false);
                            setIsMenuOpen(false);
                            navigate(`/products?category=${encodeURIComponent(cat.name)}`);
                          }}
                          className="hover:bg-[#f8f9fc] transition-colors text-right text-gray-700 hover:text-primary"
                          style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontFamily: 'Cairo, sans-serif',
                            fontSize: '14px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{cat.name}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. العروض */}
              <Link 
                to="/offers" 
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl font-bold text-base transition-colors",
                  location.pathname === "/offers" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Tag className="w-5 h-5" />
                <span>العروض</span>
              </Link>

              {/* 4. طلب مخصص */}
              <Link 
                to="/custom-order" 
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl font-bold text-base transition-colors",
                  location.pathname === "/custom-order" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Star className="w-5 h-5" />
                <span>طلب مخصص</span>
              </Link>

              {/* 5. تتبع الطلب */}
              <Link 
                to="/track" 
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl font-bold text-base transition-colors",
                  location.pathname === "/track" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Package className="w-5 h-5" />
                <span>تتبع الطلب</span>
              </Link>

              {/* 6. انضم كشريك */}
              <Link 
                to="/partners" 
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl font-bold text-base transition-colors",
                  location.pathname === "/partners" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Handshake className="w-5 h-5" />
                <span>انضم كشريك</span>
              </Link>

              {/* Login / Actions */}
              <div className="border-t pt-3 mt-1">
                {user ? (
                  <Link 
                    to="/account" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl font-bold text-base text-primary hover:bg-primary/5 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>حسابي</span>
                  </Link>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl font-bold text-base text-primary hover:bg-primary/5 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>تسجيل الدخول</span>
                  </Link>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifications(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-24 left-4 lg:left-auto lg:right-[20%] w-[calc(100%-32px)] lg:w-80 bg-white border border-gray-100 rounded-[32px] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[500px]"
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
                         <span className="text-[9px] font-black text-gray-300 mt-2">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString('ar-MA') : new Date(n.createdAt).toLocaleDateString('ar-MA')}</span>
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
