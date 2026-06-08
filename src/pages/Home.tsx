import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, StoreConfig } from '../types';
import { ProductCard } from '../components/ProductCard';
import { db, ensureAuth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { DEMO_PRODUCTS } from '../constants';

const CATEGORY_ICONS: Record<string, string> = {
  'إلكترونيات': '📱',
  'ملابس وأزياء': '👗',
  'منزل ومطبخ': '🏠',
  'جمال وعناية': '💄',
  'رياضة': '⚽',
  'أطفال': '🧸',
  'ألعاب': '🎮',
};

const categories = [
  { id: '1', name: 'إلكترونيات', slug: 'إلكترونيات' },
  { id: '2', name: 'ملابس وأزياء', slug: 'ملابس وأزياء' },
  { id: '3', name: 'منزل ومطبخ', slug: 'منزل ومطبخ' },
  { id: '4', name: 'جمال وعناية', slug: 'جمال وعناية' },
  { id: '5', name: 'رياضة', slug: 'رياضة' },
  { id: '6', name: 'أطفال', slug: 'أطفال' },
  { id: '7', name: 'ألعاب', slug: 'ألعاب' },
];

export function Home({ products }: { products: Product[] }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const navigate = useNavigate();

  // Hover state for the sidebar items
  const [hoveredSidebarIndex, setHoveredSidebarIndex] = useState<number | null>(null);

  // Shuffled "More to love" state to prevent changing on every render
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);

  useEffect(() => {
    ensureAuth();
    const unsubscribe = onSnapshot(doc(db, 'mt_settings', 'general'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
    return () => unsubscribe();
  }, []);

  const displayProducts = products.length > 0 ? products : DEMO_PRODUCTS;

  // 7. DATA SETUP
  const deals = displayProducts
    .filter(p => p.discount !== undefined && p.discount > 5 && p.discount < 90 && (p as any).active !== false)
    .slice(0, 8);

  const newProducts = [...displayProducts]
    .sort((a, b) => {
      const secondsA = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() / 1000 : 0);
      const secondsB = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() / 1000 : 0);
      return secondsB - secondsA;
    })
    .slice(0, 12);

  useEffect(() => {
    const shuffled = [...displayProducts]
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
    setShuffledProducts(shuffled);
  }, [displayProducts]);

  return (
    <div style={{ background: '#F5F6FA', minHeight: '100vh' }}>
      {/* 4. MAIN CONTENT AREA */}
      <div className="max-w-[1280px] mx-auto px-4 py-6 flex gap-6" style={{ direction: 'rtl' }}>
        
        {/* LEFT SIDEBAR - categories (Visible only on desktop md or larger) */}
        <aside className="hidden md:block w-[180px] shrink-0">
          <div style={{
            background:'#FFFFFF',
            borderRadius:10,
            border:'1px solid #E8E8E8',
            overflow:'hidden',
          }}>
            <div style={{
              background:'#0C3299', color:'white',
              padding:'12px 16px',
              fontFamily:'Cairo', fontWeight:'bold', fontSize:14,
            }}>
              الأقسام
            </div>
            {categories.map((cat, i) => {
              const isHovered = hoveredSidebarIndex === i;
              return (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
                  style={{
                    padding:'11px 16px',
                    fontFamily:'Cairo', fontSize:13,
                    color:'#333', cursor:'pointer',
                    borderBottom: i < categories.length - 1 ? '1px solid #F0F0F0' : 'none',
                    display:'flex',
                    alignItems:'center',
                    gap:8,
                    background: isHovered ? '#F0F4FF' : 'transparent',
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={() => setHoveredSidebarIndex(i)}
                  onMouseLeave={() => setHoveredSidebarIndex(null)}
                >
                  <span style={{color:'#0C3299', fontSize:16}}>
                    {CATEGORY_ICONS[cat.name] || '📦'}
                  </span>
                  <span>{cat.name}</span>
                  <svg style={{marginRight:'auto'}} width="14" height="14"
                    viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </div>
              );
            })}
          </div>
        </aside>

        {/* MAIN COLUMN */}
        <div style={{flex:1, minWidth:0}}>

          {/* HERO BANNER */}
          <div style={{
            background:'linear-gradient(135deg, #0C3299 0%, #1565C0 60%, #0C3299 100%)',
            borderRadius:12,
            padding:'32px 28px',
            direction:'rtl',
            display:'flex',
            flexWrap: 'wrap',
            justifyContent:'space-between',
            alignItems:'center',
            marginBottom:16,
            position:'relative',
            overflow:'hidden',
            gap: 24,
          }}>
            {/* Left side info */}
            <div style={{zIndex:1, flex: '1 1 300px'}}>
              <div style={{
                display:'flex', gap:8, marginBottom:12, flexWrap:'wrap',
              }}>
                {['AliExpress','Amazon','Temu','Shein'].map((p) => (
                  <span key={p} style={{
                    background:'rgba(255,255,255,0.15)',
                    color:'white', padding:'3px 10px',
                    borderRadius:20, fontSize:11,
                    fontWeight:'bold', border:'1px solid rgba(255,255,255,0.3)',
                  }}>{p}</span>
                ))}
              </div>
              <h1 style={{
                fontFamily:'Cairo', fontWeight:900,
                fontSize:28, color:'#FFFFFF',
                margin:'0 0 8px', lineHeight:1.3,
              }}>
                🐼 Panda Store
              </h1>
              <p style={{
                fontFamily:'Cairo', fontSize:14,
                color:'#BBDEFB', margin:'0 0 20px',
              }}>
                اطلب أي منتج من العالم — نوصله لبابك في موريتانيا
              </p>
              <div style={{display:'flex', gap:10}}>
                <button 
                  onClick={() => navigate('/products')}
                  style={{
                    background:'#C9A84C',
                    color:'white', padding:'11px 24px',
                    borderRadius:8, fontFamily:'Cairo',
                    fontWeight:'bold', fontSize:14,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow:'0 4px 12px rgba(201,168,76,0.4)',
                  }}
                >
                  تسوق الآن ←
                </button>
                <button 
                  onClick={() => navigate('/custom-order')}
                  style={{
                    background:'rgba(255,255,255,0.12)',
                    color:'white', padding:'11px 24px',
                    borderRadius:8, fontFamily:'Cairo',
                    fontWeight:'bold', fontSize:14,
                    border:'1px solid rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                  }}
                >
                  طلب مخصص
                </button>
              </div>
            </div>

            {/* Stats widget */}
            <div style={{
              background:'rgba(255,255,255,0.1)',
              borderRadius:12, padding:'16px 20px',
              direction:'rtl', flexShrink:0,
              border:'1px solid rgba(255,255,255,0.2)',
              backdropFilter:'blur(10px)',
              width: '100%',
              maxWidth: '240px',
            }}>
              <div style={{
                fontFamily:'Cairo', fontSize:12,
                color:'#BBDEFB', marginBottom:12,
              }}>
                👋 أهلاً بك في Panda
              </div>
              {[
                {icon:'📦', label:'منتج متوفر', val: `${displayProducts.length}+`},
                {icon:'🚚', label:'توصيل للباب', val:'موريتانيا'},
                {icon:'💬', label:'واتساب', val:'22236096100'},
              ].map(s => (
                <div key={s.label} style={{
                  display:'flex', gap:8,
                  alignItems:'center', marginBottom:8,
                }}>
                  <span style={{fontSize:16}}>{s.icon}</span>
                  <div>
                    <div style={{
                      fontFamily:'Cairo', fontSize:13,
                      color:'white', fontWeight:'bold',
                    }}>{s.val}</div>
                    <div style={{
                      fontFamily:'Cairo', fontSize:10,
                      color:'#BBDEFB',
                    }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FLASH DEALS - countdown */}
          {deals.length >= 3 && (
            <div style={{
              background:'#FFFFFF',
              borderRadius:12,
              border:'1px solid #E8E8E8',
              padding:'16px',
              marginBottom:16,
            }}>
              <div style={{
                display:'flex', alignItems:'center',
                justifyContent:'space-between',
                marginBottom:14, direction:'rtl',
              }}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{
                    background:'#E53935', color:'white',
                    padding:'4px 12px', borderRadius:6,
                    fontFamily:'Cairo', fontWeight:'bold', fontSize:14,
                  }}>
                    ⚡ عروض سريعة
                  </div>
                  <FlashTimer />
                </div>
                <button 
                  onClick={() => navigate('/products')}
                  style={{
                    fontFamily:'Cairo', fontSize:12,
                    color:'#0C3299', background:'none', border:'none', cursor:'pointer'
                  }}
                >
                  عرض الكل ←
                </button>
              </div>
              <div style={{
                display:'flex', gap:12,
                overflowX:'auto', paddingBottom:4,
                scrollbarWidth:'none',
              }} className="no-scrollbar">
                {deals.map(p => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </div>
            </div>
          )}

          {/* NEW ARRIVALS GRID */}
          <div style={{
            background:'#FFFFFF',
            borderRadius:12,
            border:'1px solid #E8E8E8',
            padding:'16px',
            marginBottom:16,
          }}>
            <div style={{
              display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:14, direction:'rtl',
            }}>
              <h2 style={{
                fontFamily:'Cairo', fontSize:16, fontWeight:'bold',
                color:'#1A1A1A', margin:0,
                display:'flex', alignItems:'center', gap:6,
              }}>
                <span style={{
                  width:4, height:20, background:'#0C3299',
                  display:'inline-block', borderRadius:2,
                }}/>
                ✨ وصل حديثاً
              </h2>
              <button 
                onClick={() => navigate('/products')}
                style={{
                  fontFamily:'Cairo', fontSize:12,
                  color:'#0C3299', background:'none', border:'none', cursor:'pointer'
                }}
              >
                عرض الكل ←
              </button>
            </div>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))',
              gap:12,
            }}>
              {newProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>

          {/* MORE TO LOVE */}
          <div style={{
            background:'#FFFFFF',
            borderRadius:12,
            border:'1px solid #E8E8E8',
            padding:'16px',
          }}>
            <h2 style={{
              fontFamily:'Cairo', fontSize:16, fontWeight:'bold',
              color:'#1A1A1A', margin:'0 0 14px',
              direction:'rtl', display:'flex', alignItems:'center', gap:6,
            }}>
              <span style={{
                width:4, height:20, background:'#C9A84C',
                display:'inline-block', borderRadius:2,
              }}/>
              🛍️ قد يعجبك أيضاً
            </h2>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))',
              gap:12,
            }}>
              {shuffledProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// 6. FLASH TIMER COMPONENT
function FlashTimer() {
  const [time, setTime] = React.useState({ h: 5, m: 42, s: 17 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{display:'flex', gap:4, alignItems:'center'}}>
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <React.Fragment key={i}>
          <span style={{
            background:'#1A1A1A', color:'white',
            padding:'3px 7px', borderRadius:5,
            fontFamily:'monospace', fontWeight:'bold',
            fontSize:14,
          }}>{v}</span>
          {i < 2 && <span style={{color:'#E53935', fontWeight:'bold'}}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
