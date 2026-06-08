import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { proxyImage, getDisplayPrice } from '../lib/utils';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const displayPrice = getDisplayPrice(product);
  
  // Calculate original price in MRU from USD or direct value
  const originalPrice = product.originalPrice || (product.originalPriceUSD ? Math.round(product.originalPriceUSD * (product.usdToMru || 37) * (product.profitMargin || 1.3)) : null);

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => navigate(`/product/${product.id}`)}
      style={{
        background:'#FFFFFF',
        borderRadius:12,
        overflow:'hidden',
        border:'1px solid #DBDBDB',
        cursor:'pointer',
        transition:'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform='translateY(-3px)';
        e.currentTarget.style.boxShadow='0 8px 20px rgba(12,50,153,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform='translateY(0)';
        e.currentTarget.style.boxShadow='none';
      }}
    >
      {/* Image */}
      <div style={{
        height:180, background:'#f5f5f5',
        position:'relative', overflow:'hidden',
      }}>
        <img
          src={proxyImage(product.mainImage || product.images?.[0] || '')}
          style={{width:'100%',height:'100%',objectFit:'cover'}}
          onError={(e: any)=>{e.target.onerror=null;e.target.style.opacity='0.2'}}
          referrerPolicy="no-referrer"
        />
        {product.discount > 0 && (
          <div style={{
            position:'absolute', top:8, left:8,
            background:'#e53935',
            color:'white', fontSize:11,
            fontWeight:'bold', fontFamily:'Cairo',
            padding:'2px 7px', borderRadius:6,
          }}>
            -{product.discount}%
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{padding:'10px 12px', direction: 'rtl', textAlign: 'right'}}>
        <p style={{
          fontFamily:'Cairo', fontSize:12,
          color:'#333', margin:'0 0 6px',
          lineHeight:1.5,
          display:'-webkit-box',
          WebkitLineClamp:2,
          WebkitBoxOrient:'vertical',
          overflow:'hidden',
          minHeight:36,
        }}>
          {product.name}
        </p>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{
            fontFamily:'Cairo', fontSize:15,
            fontWeight:'bold', color:'#0C3299',
          }}>
            {displayPrice > 0
              ? `${displayPrice.toLocaleString()} أوقية`
              : 'السعر عند الطلب'}
          </span>
        </div>
        {originalPrice && originalPrice > displayPrice && (
          <span style={{
            fontFamily:'Cairo', fontSize:11,
            color:'#999',
            textDecoration:'line-through',
          }}>
            {originalPrice.toLocaleString()} أوقية
          </span>
        )}
      </div>
    </div>
  );
};
