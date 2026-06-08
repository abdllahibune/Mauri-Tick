import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer style={{
      background:'#0C3299', color:'white',
      padding:'32px 20px', direction:'rtl',
      fontFamily:'Cairo', marginTop:40,
    }}>
      <div style={{
        maxWidth:1200, margin:'0 auto',
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))',
        gap:32,
      }}>
        <div>
          <h3 style={{fontSize:18,marginBottom:12, fontWeight: 'bold'}}>🐼 Panda Store</h3>
          <p style={{fontSize:13,color:'#DBDBDB',lineHeight:1.8}}>
            متجرك الموريتاني لاستيراد المنتجات من العالم بأفضل الأسعار
          </p>
        </div>
        <div>
          <h4 style={{marginBottom:12, fontWeight: 'bold'}}>روابط سريعة</h4>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <Link to="/" style={{color:'#DBDBDB',fontSize:13,textDecoration:'none'}}>الرئيسية</Link>
            <Link to="/products" style={{color:'#DBDBDB',fontSize:13,textDecoration:'none'}}>المنتجات</Link>
            <Link to="/custom-order" style={{color:'#DBDBDB',fontSize:13,textDecoration:'none'}}>طلب مخصص</Link>
            <Link to="/contact" style={{color:'#DBDBDB',fontSize:13,textDecoration:'none'}}>تواصل معنا</Link>
          </div>
        </div>
        <div>
          <h4 style={{marginBottom:12, fontWeight: 'bold'}}>تواصل معنا</h4>
          <p style={{fontSize:13,color:'#DBDBDB', marginBottom: 6}}>واتساب: 22236096100</p>
          <a 
            href="https://wa.me/22236096100" 
            target="_blank" 
            rel="noreferrer" 
            style={{ 
              display: 'inline-block', 
              background: '#C9A84C', 
              color: 'white', 
              fontSize: 12, 
              padding: '6px 12px', 
              borderRadius: '6px', 
              textDecoration: 'none',
              fontWeight: 'bold',
              marginTop: '4px'
            }}
          >
            تواصل عبر واتساب 💬
          </a>
        </div>
      </div>
      <div style={{
        textAlign:'center', marginTop:24,
        paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.2)',
        fontSize:12, color:'#DBDBDB',
      }}>
        © 2026 Panda Store — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
