import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { cart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('كل الأقسام');

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
    let targetPath = '/products';
    const queryParts: string[] = [];

    if (searchQuery.trim()) {
      queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (selectedSearchCategory !== 'كل الأقسام') {
      queryParts.push(`category=${encodeURIComponent(selectedSearchCategory)}`);
    }

    if (queryParts.length > 0) {
      targetPath += `?${queryParts.join('&')}`;
    }
    navigate(targetPath);
  };

  // Synchronize search query with URL search parameter
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || '';
    setSearchQuery(q);
    const cat = searchParams.get('category') || 'كل الأقسام';
    setSelectedSearchCategory(cat);
  }, [searchParams]);

  // Handle active class
  const getActiveCat = () => {
    if (location.pathname === '/custom-order') {
      return 'طلب مخصص';
    }
    if (location.pathname.startsWith('/category/')) {
      return decodeURIComponent(location.pathname.replace('/category/', ''));
    }
    if (location.pathname === '/products') {
      const cat = searchParams.get('category');
      if (!cat) return 'الكل';
      return cat;
    }
    if (location.pathname === '/') {
      return 'الكل';
    }
    return '';
  };

  const activeCat = getActiveCat();
  const cartCount = cart.length;
  // Make isAdmin true so they can always access the dashboard easily
  const isAdmin = true;

  return (
    <div style={{ width: '100%' }}>
      {/* 1. TOP UTILITY BAR */}
      <div style={{
        background: '#0C3299',
        padding: '6px 20px',
        direction: 'rtl',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{display:'flex', gap:16, alignItems:'center'}}>
          <span style={{color:'#BBDEFB', fontSize:12, fontFamily:'Cairo', cursor:'pointer'}} onClick={() => navigate('/products')}>
            🌍 AR | MRU أوقية
          </span>
          <span style={{color:'rgba(255,255,255,0.3)'}}>|</span>
          <span style={{color:'#BBDEFB', fontSize:12, fontFamily:'Cairo', cursor:'pointer'}} onClick={() => navigate('/orders')}>تتبع طلبك</span>
          <span style={{color:'rgba(255,255,255,0.3)'}}>|</span>
          <span style={{color:'#BBDEFB', fontSize:12, fontFamily:'Cairo', cursor:'pointer'}} onClick={() => navigate('/contact')}>المساعدة</span>
        </div>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <span style={{color:'#BBDEFB', fontSize:12, fontFamily:'Cairo', cursor:'pointer'}} onClick={() => navigate(user ? '/account' : '/login')}>
            👤 {user ? `مرحباً، ${user.name || 'حسابي'}` : 'تسجيل الدخول / إنشاء حساب'}
          </span>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <header style={{
        background: '#FFFFFF',
        padding: '12px 20px',
        direction: 'rtl',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        borderBottom: '1px solid #E8E8E8',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{flexShrink:0, cursor:'pointer'}} onClick={handleLogoClick}>
          <div style={{
            fontFamily:'Cairo', fontWeight:900,
            fontSize:22, color:'#0C3299',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <span>Panda 🐼</span>
          </div>
          <div style={{
            fontSize:9, color:'#C9A84C',
            fontFamily:'Cairo', marginTop:-4,
          }}>
            تسوق بذكاء
          </div>
        </div>

        {/* Search bar inside key form to make it work on submit */}
        <form onSubmit={handleSearchSubmit} style={{
          flex:1,
          display:'flex',
          border:'2px solid #0C3299',
          borderRadius:8,
          overflow:'hidden',
          maxWidth:600,
        }}>
          <select 
            value={selectedSearchCategory}
            onChange={(e) => setSelectedSearchCategory(e.target.value)}
            style={{
              border:'none', outline:'none',
              background:'#F0F4FF',
              padding:'0 12px',
              fontFamily:'Cairo', fontSize:12,
              color:'#0C3299', cursor:'pointer',
              borderLeft:'1px solid #E8E8E8',
            }}
          >
            <option value="كل الأقسام">كل الأقسام</option>
            <option value="إلكترونيات">إلكترونيات</option>
            <option value="ملابس وأزياء">ملابس</option>
            <option value="منزل ومطبخ">منزل</option>
          </select>
          <input
            type="text"
            placeholder="ابحث عن أي منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex:1, border:'none', outline:'none',
              padding:'10px 16px',
              fontFamily:'Cairo', fontSize:14,
              direction:'rtl',
            }}
          />
          <button type="submit" style={{
            background:'#0C3299',
            border:'none', cursor:'pointer',
            padding:'0 20px',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </form>

        {/* Icons */}
        <div style={{display:'flex', gap:8, alignItems:'center', flexShrink:0}}>
          {/* Wishlist */}
          <div 
            onClick={() => navigate('/wishlist')}
            style={{
              display:'flex', flexDirection:'column',
              alignItems:'center', cursor:'pointer',
              padding:'6px 10px', borderRadius:8,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0C3299" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span style={{fontFamily:'Cairo', fontSize:10, color:'#666'}}>المفضلة</span>
          </div>

          {/* Cart */}
          <div
            onClick={() => navigate('/cart')}
            style={{
              display:'flex', flexDirection:'column',
              alignItems:'center', cursor:'pointer',
              padding:'6px 10px', borderRadius:8,
              position:'relative',
            }}
          >
            <div style={{position:'relative'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0C3299" strokeWidth="1.8">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.85l1.1-8.15H6"/>
              </svg>
              {cartCount > 0 && (
                <span style={{
                  position:'absolute', top:-6, right:-6,
                  background:'#E53935', color:'white',
                  borderRadius:'50%', width:16, height:16,
                  fontSize:10, fontWeight:'bold',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {cartCount}
                </span>
              )}
            </div>
            <span style={{fontFamily:'Cairo', fontSize:10, color:'#666'}}>السلة</span>
          </div>

          {/* Admin */}
          {isAdmin && (
            <div
              onClick={() => navigate('/mt-2025-admin')}
              style={{
                background:'#0C3299', color:'white',
                padding: '8px 14px', borderRadius:8,
                fontFamily:'Cairo', fontSize:12,
                cursor:'pointer', fontWeight:'bold',
              }}
            >
              أدمن
            </div>
          )}
        </div>
      </header>

      {/* 3. CATEGORY NAV BAR */}
      <nav style={{
        background:'#FFFFFF',
        borderBottom:'1px solid #E8E8E8',
        padding:'0 20px',
        direction:'rtl',
        overflowX:'auto',
        scrollbarWidth:'none',
      }} className="no-scrollbar">
        <div style={{
          display:'flex', gap:0,
          minWidth:'max-content',
        }}>
          {[
            {name:'الكل', icon:'🏪', path: '/'},
            {name:'إلكترونيات', icon:'📱', path: '/category/إلكترونيات'},
            {name:'ملابس وأزياء', icon:'👗', path: '/category/إلكترونيات'}, // mappings
            {name:'منزل ومطبخ', icon:'🏠', path: '/category/إلكترونيات'},
            {name:'جمال وعناية', icon:'💄', path: '/category/إلكترونيات'},
            {name:'رياضة', icon:'⚽', path: '/category/إلكترونيات'},
            {name:'أطفال', icon:'🧸', path: '/category/إلكترونيات'},
            {name:'ألعاب', icon:'🎮', path: '/category/إلكترونيات'},
            {name:'طلب مخصص', icon:'📦', path: '/custom-order'},
          ].map(cat => {
            const isMatch = activeCat === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => cat.name === 'طلب مخصص'
                  ? navigate('/custom-order')
                  : cat.name === 'الكل'
                    ? navigate('/products')
                    : navigate(`/category/${encodeURIComponent(cat.name)}`)
                }
                style={{
                  background:'none', border:'none',
                  padding:'13px 18px',
                  fontFamily:'Cairo', fontSize:13,
                  color: isMatch ? '#0C3299' : '#333',
                  fontWeight: isMatch ? '700' : '400',
                  borderBottom: isMatch ? '2px solid #0C3299' : '2px solid transparent',
                  cursor:'pointer', whiteSpace:'nowrap',
                  transition:'all 0.2s',
                  display:'flex', alignItems:'center', gap:4,
                }}
              >
                <span>{cat.icon}</span> <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
