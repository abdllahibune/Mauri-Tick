import React from 'react';
import { useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();

  const handleLinkClick = (l: string) => {
    if (l === 'الرئيسية') navigate('/');
    else if (l === 'جميع المنتجات') navigate('/products');
    else if (l === 'طلب مخصص') navigate('/custom-order');
    else if (l === 'تتبع طلبك') navigate('/orders');
    else if (l === 'تواصل معنا') navigate('/contact');
  };

  return (
    <footer style={{
      background:'#1A1A2E',
      color:'white',
      padding:'36px 20px 20px',
      direction:'rtl',
      fontFamily:'Cairo',
      marginTop:32,
    }}>
      <div style={{
        maxWidth:1280, margin:'0 auto',
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',
        gap:28, marginBottom:28,
      }}>
        <div>
          <div style={{fontSize:20, fontWeight:900, marginBottom:8}}>
            Panda Store
          </div>
          <p style={{fontSize:12, color:'#8888AA', lineHeight:1.8}}>
            متجرك الموريتاني لاستيراد المنتجات من العالم بأفضل الأسعار وأسرع التوصيل
          </p>
          <div style={{display:'flex', gap:8, marginTop:12}}>
            {['AliExpress','Amazon','Temu','Shein'].map(p => (
              <span key={p} style={{
                background:'rgba(255,255,255,0.1)',
                padding:'3px 8px', borderRadius:4,
                fontSize:10, color:'#BBBBCC',
              }}>{p}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{marginBottom:12, fontSize:14, fontWeight:'bold'}}>روابط سريعة</h4>
          {['الرئيسية','جميع المنتجات','طلب مخصص','تتبع طلبك','تواصل معنا'].map(l => (
            <div 
              key={l} 
              onClick={() => handleLinkClick(l)}
              style={{
                fontSize:12, color:'#8888AA',
                marginBottom:7, cursor:'pointer',
                transition: 'color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={e => e.currentTarget.style.color = '#8888AA'}
            >
              {l}
            </div>
          ))}
        </div>
        <div>
          <h4 style={{marginBottom:12, fontSize:14, fontWeight:'bold'}}>تواصل معنا</h4>
          <div style={{fontSize:12, color:'#8888AA', lineHeight:2}}>
            <div>واتساب: 22236096100</div>
            <div>متاح: 8 ص — 10 م</div>
            <div>نواكشوط، موريتانيا</div>
          </div>
        </div>
      </div>
      <div style={{
        borderTop:'1px solid rgba(255,255,255,0.1)',
        paddingTop:16, textAlign:'center',
        fontSize:11, color:'#666688',
      }}>
        © 2026 Panda Store — جميع الحقوق محفوظة | تسوق بذكاء
      </div>
    </footer>
  );
}
