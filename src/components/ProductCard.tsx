import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { proxyImage, getDisplayPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const price = getDisplayPrice(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('تمت الإضافة إلى السلة! 🛒');
  };

  const calculatedOriginalPrice = product.originalPrice ?? (
    product.originalPriceUSD 
      ? Math.round(product.originalPriceUSD * (product.usdToMru || 37) * (product.profitMargin || 1.3)) 
      : undefined
  );

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      style={{
        background:'#FFFFFF',
        borderRadius:10,
        border:'1px solid #E8E8E8',
        cursor:'pointer',
        overflow:'hidden',
        flexShrink: compact ? 0 : undefined,
        width: compact ? 150 : 'auto',
        transition:'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform='translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow='none';
        e.currentTarget.style.transform='translateY(0)';
      }}
    >
      {/* Image */}
      <div style={{
        height: compact ? 150 : 180,
        background:'#F8F8F8',
        position:'relative', overflow:'hidden',
      }}>
        <img
          src={proxyImage(product.mainImage || product.images?.[0]) || undefined}
          alt={product.name}
          style={{
            width:'100%', height:'100%',
            objectFit:'cover',
          }}
          onError={e => {
            const tgt = e.target as HTMLImageElement;
            tgt.onerror = null;
            tgt.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f5f5f5"/><text x="50" y="55" font-family="Cairo" font-size="10" fill="%230C3299" text-anchor="middle">Panda 🐼</text></svg>';
          }}
          referrerPolicy="no-referrer"
        />
        {product.discount > 0 && (
          <div style={{
            position:'absolute', top:6, left:6,
            background:'#E53935', color:'white',
            fontSize:10, fontWeight:'bold',
            padding:'2px 6px', borderRadius:4,
            fontFamily:'Cairo',
          }}>
            -{product.discount}%
          </div>
        )}
        {/* Add to cart button */}
        <div
          onClick={handleAddToCart}
          style={{
            position:'absolute', bottom:6, left:6,
            background:'#0C3299', color:'white',
            width:28, height:28, borderRadius:'50%',
            display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer',
            boxShadow:'0 2px 6px rgba(12,50,153,0.4)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      </div>
      {/* Info */}
      <div style={{padding:'10px 10px 12px'}}>
        <p style={{
          fontFamily:'Cairo', fontSize:12,
          color:'#333', margin:'0 0 6px',
          lineHeight:1.5, direction:'rtl',
          display:'-webkit-box',
          WebkitLineClamp:2,
          WebkitBoxOrient:'vertical',
          overflow:'hidden',
          minHeight:36,
        }}>
          {product.name}
        </p>
        {/* Stars placeholder */}
        <div style={{
          display:'flex', alignItems:'center',
          gap:3, marginBottom:5, direction:'ltr',
        }}>
          {[1,2,3,4,5].map(s => (
            <svg key={s} width="10" height="10" viewBox="0 0 24 24"
              fill={s <= 4 ? '#FFC107' : '#E0E0E0'}>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          ))}
          <span style={{fontSize:10, color:'#999', fontFamily:'Cairo'}}>(24)</span>
        </div>
        {/* Price */}
        <div style={{direction:'rtl'}}>
          <span style={{
            fontFamily:'Cairo', fontSize:15,
            fontWeight:'bold', color:'#0C3299',
          }}>
            {price > 0
              ? `${Math.round(price).toLocaleString()} MRU`
              : 'السعر عند الطلب'
            }
          </span>
          {calculatedOriginalPrice !== undefined && calculatedOriginalPrice > price && (
            <div style={{
              fontFamily:'Cairo', fontSize:11,
              color:'#999',
              textDecoration:'line-through',
            }}>
              {Math.round(calculatedOriginalPrice).toLocaleString()} MRU
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
