import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, User, MessageCircle, Search } from 'lucide-react';

export function Navbar() {
  const { cart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // 3-clicks logo shortcut to admin dashboard
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    setLogoClicks((prev) => prev + 1);
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    clickTimerRef.current = setTimeout(() => {
      setLogoClicks(0);
    }, 500);

    if (logoClicks >= 2) {
      setLogoClicks(0);
      navigate('/mt-2025-admin');
    } else {
      navigate('/');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  // Synchronize search query with URL search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || params.get('q') || '';
    setSearchQuery(q);
  }, [location.search]);

  // Categories list for Row 2
  const navCategories = [
    { name: 'الكل', path: '/products' },
    { name: 'إلكترونيات', path: '/products?category=إلكترونيات' },
    { name: 'ملابس وأزياء', path: '/products?category=ملابس' },
    { name: 'منزل ومطبخ', path: '/products?category=منزل' },
    { name: 'جمال وعناية', path: '/products?category=جمال' },
    { name: 'رياضة', path: '/products?category=رياضة' },
    { name: 'أطفال', path: '/products?category=أطفال' },
    { name: 'ألعاب', path: '/products?category=ألعاب' },
    { name: 'طلب مخصص', path: '/custom-order' },
  ];

  // Detect which category/tab is currently active
  const getCurrentActiveTab = () => {
    if (location.pathname === '/custom-order') {
      return 'طلب مخصص';
    }
    if (location.pathname === '/products' || location.pathname === '/offers') {
      const params = new URLSearchParams(location.search);
      const cat = params.get('category');
      if (!cat) return 'الكل';
      if (cat.includes('إلكترونيات')) return 'إلكترونيات';
      if (cat.includes('ملابس')) return 'ملابس وأزياء';
      if (cat.includes('منزل')) return 'منزل ومطبخ';
      if (cat.includes('جمال')) return 'جمال وعناية';
      if (cat.includes('رياضة')) return 'رياضة';
      if (cat.includes('أطفال')) return 'أطفال';
      if (cat.includes('ألعاب')) return 'ألعاب';
      return 'الكل';
    }
    return '';
  };

  const activeTab = getCurrentActiveTab();

  return (
    <header className="w-full sticky top-0 z-50 shadow-sm border-b border-[#DBDBDB] bg-white select-none" style={{ direction: 'rtl' }}>
      
      {/* Row 1 - dark bar (#0C3299) */}
      <div style={{ background: '#0C3299', padding: '12px 16px' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand Right */}
          <div 
            onClick={handleLogoClick} 
            className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
          >
            <span style={{ 
              color: '#FFFFFF', 
              fontFamily: 'Cairo, sans-serif', 
              fontSize: '20px', 
              fontWeight: 'bold' 
            }}>
              Panda 🐼
            </span>
          </div>

          {/* Search Bar Center */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex-grow max-w-2xl relative"
          >
            <input
              type="text"
              placeholder="ابحث عن أي منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-900 text-sm font-semibold rounded-full py-2 pr-11 pl-4 outline-none border-none transition-shadow focus:shadow-md"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            />
            <button 
              type="submit" 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#0C3299] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Icons Left */}
          <div className="flex items-center gap-4">
            
            {/* WhatsApp Contact */}
            <a 
              href="https://wa.me/22236096100" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 text-white hover:text-green-400 transition-colors rounded-full hover:bg-white/10"
              title="تواصل عبر واتساب"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            {/* User Profile */}
            <Link 
              to={user ? '/account' : '/login'} 
              className="p-2 text-white hover:text-amber-400 transition-colors rounded-full hover:bg-white/10"
              title="حسابي"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Shopping Cart */}
            <Link 
              to="/cart" 
              className="p-2 text-white hover:text-amber-400 transition-colors rounded-full hover:bg-white/10 relative"
              title="سلة التسوق"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {cart.length}
                </span>
              )}
            </Link>

          </div>

        </div>
      </div>

      {/* Row 2 - Category Tabs (Horizontally scrollable with white bg) */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #DBDBDB' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center overflow-x-auto no-scrollbar gap-2" style={{ scrollbarWidth: 'none' }}>
            {navCategories.map((cat) => {
              const isActive = activeTab === cat.name;
              return (
                <Link
                  key={cat.name}
                  to={cat.path}
                  style={{
                    padding: '12px 20px',
                    fontFamily: 'Cairo, sans-serif',
                    fontSize: '14px',
                    color: isActive ? '#0C3299' : '#1A1A1A',
                    borderBottom: isActive ? '2px solid #0C3299' : '2px solid transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 'bold' : 'normal',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#0C3299';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#1A1A1A';
                  }}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

    </header>
  );
}
