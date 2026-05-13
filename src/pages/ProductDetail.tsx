import React, { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, getDocs, query, where, limit, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { contactWhatsApp, getProductTier } from '../lib/utils';
import { MessageCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';

// Error Boundary as specifically requested
class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false };
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  render() {
    if (this.state.hasError)
      return (
        <div style={{padding:60,textAlign:'center',fontFamily:'Cairo',direction:'rtl'}}>
          <h2 style={{color:'#1A237E', fontSize: '24px', fontWeight: 'bold'}}>عذراً، حدث خطأ ما</h2>
          <p style={{color: '#666', marginTop: '10px'}}>يرجى المحاولة مرة أخرى أو العودة للقائمة الرئيسية.</p>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px'}}>
            <button 
              style={{padding:'12px 24px',background:'#1A237E',color:'white',border:'none',borderRadius:12,cursor:'pointer', fontWeight: 'bold'}}
              onClick={() => window.location.reload()}
            >
              إعادة تحميل الصفحة
            </button>
            <button 
              style={{padding:'12px 24px',background:'#eee',color:'#333',border:'none',borderRadius:12,cursor:'pointer', fontWeight: 'bold'}}
              onClick={() => window.history.back()}
            >
              رجوع
            </button>
          </div>
        </div>
      );
    return (this.props as any).children;
  }
}

export function ProductDetail({ allProducts }: { allProducts: Product[] }) {
  return (
    <ErrorBoundary>
       <ProductPageContent allProducts={allProducts} />
    </ErrorBoundary>
  );
}

function ProductPageContent({ allProducts }: { allProducts: Product[] }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const DESC_LIMIT = 120;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        // Sort by price and select cheapest
        const sorted = [...product.variants].sort((a, b) => a.price - b.price);
        setSelectedVariant(sorted[0]);
      }
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      }
    }
  }, [product]);

  const handleVariantChange = (variant: any) => {
    setSelectedVariant(variant);
    
    const priceEl = document.getElementById('productPrice');
    if (priceEl) {
      priceEl.style.transform = 'scale(1.1)';
      priceEl.style.color = '#E53935';
      setTimeout(() => {
        priceEl.style.transform = 'scale(1)';
        priceEl.style.color = '#1A237E';
      }, 300);
    }
  };

  async function fetchProduct() {
    if (!id) return;
    try {
      setLoading(true);
      const ref = doc(db, 'mt_products', id);
      const snap = await getDoc(ref);
      
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Product;
        setProduct(data);
        setMainImage(data.images?.[0] || '');
        
        // Fetch related products after main product is loaded
        loadRelated(data);
      } else {
        setProduct(null);
      }
    } catch (e) {
      console.error('Product fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadRelated(currentProduct: Product) {
    try {
      // 1. Try same brand + same category
      const q1 = query(
        collection(db, 'mt_products'),
        where('brand', '==', currentProduct.brand),
        where('category', '==', currentProduct.category),
        limit(8)
      );
      const s1 = await getDocs(q1);
      let suggested = s1.docs
        .map(d => ({ id: d.id, ...d.data() } as Product))
        .filter(p => p.id !== currentProduct.id);

      // 2. Fill with same category if needed
      if (suggested.length < 4) {
        const q2 = query(
          collection(db, 'mt_products'),
          where('category', '==', currentProduct.category),
          limit(10)
        );
        const s2 = await getDocs(q2);
        const extra = s2.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => 
            p.id !== currentProduct.id && 
            !suggested.find(s => s.id === p.id)
          );
        suggested = [...suggested, ...extra].slice(0, 6);
      }

      // 3. Last fallback: any products
      if (suggested.length < 4) {
        const q3 = query(
          collection(db, 'mt_products'),
          limit(10)
        );
        const s3 = await getDocs(q3);
        const randomExtra = s3.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => 
            p.id !== currentProduct.id && 
            !suggested.find(s => s.id === p.id)
          );
        suggested = [...suggested, ...randomExtra].slice(0, 6);
      }

      setRelated(suggested);
    } catch (e) {
      console.error('Related products fetch error:', e);
    }
  }

  if (loading) return (
    <div style={{
      display:'flex', justifyContent:'center',
      alignItems:'center', height:'50vh',
      fontFamily:'Cairo', fontSize:'18px'
    }}>
      جاري التحميل...
    </div>
  );

  if (!product) return (
    <div style={{
      textAlign:'center', padding:'100px 20px',
      fontFamily:'Cairo'
    }}>
      <h2 style={{fontSize: '28px', fontWeight: '900', color: '#1A237E'}}>المنتج غير موجود</h2>
      <p style={{color: '#666', marginBottom: '20px'}}>عذراً، لم نتمكن من العثور على المنتج المطلوب.</p>
      <button 
        style={{padding: '12px 30px', background: '#1A237E', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}
        onClick={() => navigate('/products')}
      >
        العودة للمنتجات
      </button>
    </div>
  );

  const currentPrice = selectedVariant?.price 
    || (product.discount > 0
      ? Math.round(product.price * (1 - product.discount/100))
      : product.price);

  return (
    <div style={{
      maxWidth:'1200px', margin:'0 auto',
      padding:'40px 20px', fontFamily:'Cairo',
      direction:'rtl'
    }}>
      {/* Main product layout */}
      <div style={{
        display:'grid',
        gridTemplateColumns: window.innerWidth < 768 
          ? '1fr' : '1fr 1fr',
        gap:'40px',
        alignItems: 'start'
      }}>
        {/* Images */}
        <div>
          <div style={{
            background: '#fff', 
            borderRadius: '24px', 
            padding: '20px', 
            border: '1px solid #eee',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src={mainImage} 
              alt={product.name}
              style={{
                width:'100%',
                maxHeight:'500px',
                objectFit:'contain'
              }}
            />
          </div>
          <div style={{
            display:'flex', gap:'12px',
            marginTop:'20px', flexWrap:'wrap',
            justifyContent: 'center'
          }}>
            {product.images?.map((img, i) => (
              <div
                key={i}
                onClick={() => setMainImage(img)}
                style={{
                  width:'80px', height:'80px',
                  borderRadius:'12px',
                  cursor:'pointer', 
                  border: mainImage === img 
                    ? '3px solid #1A237E' : '1px solid #eee',
                  padding: '5px',
                  background: '#fff',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <img src={img} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{padding: '10px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
            <span style={{background:'#F5F5F5', color:'#666', fontSize:'12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px'}}>
              {product.brand}
            </span>
          </div>
          <h1 style={{fontSize:'32px', fontWeight: '900', color: '#1A237E', lineHeight: '1.2'}}>
            {product.name}
          </h1>
          
          <div style={{margin:'24px 0', background: '#F8F9FF', padding: '20px', borderRadius: '20px', border: '1px solid #EEF2FF'}}>
            {product.tier && (
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px'}}>
                {(() => {
                  const tier = getProductTier(product);
                  return (
                    <span 
                      className="tier-badge inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-sm"
                      style={{ background: tier.color, color: tier.textColor, borderColor: tier.border }}
                    >
                      {tier.label}
                    </span>
                  );
                })()}
              </div>
            )}
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
               <span 
                id="productPrice"
                className="product-price"
                style={{fontSize:'36px', fontWeight:'900', color:'#1A237E'}}
               >
                {currentPrice.toLocaleString()} أوقية
              </span>
              {product.discount > 0 && !selectedVariant && (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <span style={{textDecoration:'line-through', color:'#999', fontSize:'16px'}}>
                    {product.price?.toLocaleString()} أوقية
                  </span>
                </div>
              )}
            </div>
            {selectedVariant && (
              <div style={{fontSize: '13px', color: '#666', marginTop: '4px', fontWeight: 'bold'}}>
                سعر نسخة {selectedVariant.storage} {selectedColor ? ` — ${selectedColor}` : ''}
              </div>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (() => {
            const basePrice = Math.min(...product.variants.map(v => v.price));
            return (
              <div style={{marginTop:20, direction:'rtl'}}>
                <p style={{ fontWeight:'bold', marginBottom:10, fontSize: '14px' }}>💾 السعة:</p>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {product.variants.map(v => {
                    const diff = v.price - basePrice;
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVariantChange(v)}
                        style={{
                          padding:'10px 18px',
                          border: isSelected ? '2px solid #1A237E' : '1px solid #ddd',
                          borderRadius:10,
                          background: isSelected ? '#E8EAF6' : 'white',
                          color: isSelected ? '#1A237E' : '#333',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          cursor:'pointer',
                          transition:'all 0.2s',
                          textAlign: 'center',
                          minWidth: '100px'
                        }}
                      >
                        <div style={{fontSize:14, fontWeight: 'bold'}}>{v.storage}</div>
                        <div style={{fontSize:13, color:'#1A237E', fontWeight:'bold'}}>
                          {v.price.toLocaleString()} أوقية
                        </div>
                        {diff > 0 && (
                          <div style={{ fontSize: 11, color: '#E53935' }}>
                            +{diff.toLocaleString()}
                          </div>
                        )}
                        {diff === 0 && (
                          <div style={{ fontSize: 11, color: '#2E7D32' }}>
                            الأرخص
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Colors Selector */}
          {product.colors && product.colors.length > 0 && (
            <div style={{marginTop:16, direction:'rtl'}}>
              <p style={{ fontWeight:'bold', marginBottom:10, fontSize: '14px' }}>
                🎨 اللون: <span style={{fontWeight:'normal', color:'#666', marginRight:8}}>{selectedColor}</span>
              </p>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding:'8px 16px',
                      border: selectedColor === color ? '2px solid #1A237E' : '1px solid #ddd',
                      borderRadius:20,
                      background: selectedColor === color ? '#1A237E' : 'white',
                      color: selectedColor === color ? 'white' : '#333',
                      fontSize:13,
                      cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{margin: '20px 0'}}>
            <p style={{
              color: product.stock > 5 ? '#2E7D32' 
                : product.stock > 0 ? '#F57C00' : '#D32F2F',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {product.stock > 5 ? '✅ متوفر بالمخزون'
                : product.stock > 0 
                  ? `⚠️ متبقي ${product.stock} قطع فقط`
                  : '❌ نفذ المخزون'}
            </p>
          </div>

          <div style={{
              color: '#444', 
              fontSize: '15px', 
              lineHeight: '1.6', 
              margin: '20px 0', 
          }}>
            <p style={{ margin: 0 }}>
              {showFullDesc || (product.description || '').length <= DESC_LIMIT
                ? product.description
                : product.description.substring(0, DESC_LIMIT) + '...'
              }
            </p>
            {product.description && product.description.length > DESC_LIMIT && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                style={{
                  background:'none', border:'none',
                  color:'#1A237E', fontFamily:'Cairo',
                  fontSize:13, cursor:'pointer',
                  padding:'4px 0', fontWeight:'bold'
                }}
              >
                {showFullDesc ? '▲ عرض أقل' : '▼ المزيد'}
              </button>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={() => {
                const cartVariant = selectedVariant ? {
                  storage: selectedVariant.storage,
                  color: selectedColor || undefined,
                  price: currentPrice
                } : undefined;
                addToCart(product, 1, cartVariant);
                toast.success('✅ تمت الإضافة للسلة');
            }}
            disabled={product.stock === 0}
            style={{
              width:'100%', padding:'20px',
              background: product.stock === 0 
                ? '#ccc' : '#1A237E',
              color:'white', border:'none',
              borderRadius:'16px', fontSize:'20px',
              fontWeight: '900',
              cursor: product.stock === 0 
                ? 'not-allowed' : 'pointer',
              marginTop:'20px', fontFamily:'Cairo',
              boxShadow: product.stock > 0 ? '0 10px 20px rgba(26, 35, 126, 0.2)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {product.stock === 0 
              ? 'نفذ المخزون' : '🛒 أضف للسلة'}
          </button>

          <button
            onClick={() => contactWhatsApp(product)}
            style={{
              width:'100%', padding:'16px',
              background: '#25D366',
              color:'white', border:'none',
              borderRadius:'16px', fontSize:'18px',
              fontWeight: '900',
              cursor: 'pointer',
              marginTop:'12px', fontFamily:'Cairo',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: '0 5px 15px rgba(37, 211, 102, 0.2)'
            }}
          >
            <MessageCircle className="w-6 h-6" /> استفسر عبر واتساب
          </button>

          {/* Features */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '30px'}}>
             <div style={{background: '#fff', border: '1px solid #eee', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                 <span style={{fontSize: '20px'}}>🚚</span>
                 <div style={{display: 'flex', flexDirection: 'column'}}>
                    <span style={{fontSize: '12px', fontWeight: 'bold'}}>توصيل سريع</span>
                    <span style={{fontSize: '10px', color: '#666'}}>24 ساعة</span>
                 </div>
             </div>
             <div style={{background: '#fff', border: '1px solid #eee', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                 <span style={{fontSize: '20px'}}>🛡️</span>
                 <div style={{display: 'flex', flexDirection: 'column'}}>
                    <span style={{fontSize: '12px', fontWeight: 'bold'}}>ضمان موري تيك</span>
                    <span style={{fontSize: '10px', color: '#666'}}>أصلي 100%</span>
                 </div>
             </div>
          </div>
        </div>
      </div>

      {/* Specs */}
      {product.specifications && (
        <div style={{marginTop:'60px'}}>
           <div style={{borderBottom: '3px solid #FFD700', width: 'fit-content', paddingBottom: '5px', marginBottom: '24px'}}>
                <h2 style={{fontSize:'24px', fontWeight: '900', color: '#1A237E'}}>المواصفات التقنية</h2>
           </div>
          <div style={{
            display:'grid',
            gridTemplateColumns: window.innerWidth < 768
              ? '1fr' : '1fr 1fr',
            gap:'12px'
          }}>
            {Object.entries(product.specifications).map(([k, v]) => {
                const labels: any = {
                    screen: 'الشاشة',
                    processor: 'المعالج',
                    ram: 'الرام',
                    storage: 'التخزين',
                    battery: 'البطارية',
                    camera: 'الكاميرا',
                    os: 'النظام'
                };
                return v && <div key={k} style={{
                    display:'flex', justifyContent:'space-between',
                    padding:'16px 20px', background:'#F9F9F9',
                    borderRadius:'12px', border: '1px solid #eee'
                  }}>
                    <span style={{color:'#666', fontWeight: 'bold'}}>{labels[k] || k}</span>
                    <span style={{fontWeight:'900', color: '#1A237E'}}>{v as string}</span>
                  </div>;
            })}
          </div>
        </div>
      )}

      {/* Related Products */}
      {related.length > 0 && (
         <div style={{marginTop:'60px'}} id="productPageRoot">
            <div style={{
              borderRight: '4px solid #FFD700', 
              paddingRight: '12px', 
              marginBottom: '20px'
            }}>
                 <h2 style={{fontSize:'20px', fontWeight: '900', color: '#1A237E', fontFamily: 'Cairo'}}>قد يعجبك أيضاً 💡</h2>
            </div>
            <div 
              id="suggestedGrid" 
              style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: window.innerWidth < 768 ? '8px' : '20px'
              }}
            >
                {related.map(p => {
                    const price = p.discount > 0
                      ? Math.round(p.price * (1 - p.discount/100))
                      : (p.usedPrice || p.price);
                    
                    return (
                      <Link to={`/product/${p.id}`} key={p.id} className="suggested-card" style={{
                        textDecoration: 'none', 
                        color: 'inherit',
                        background: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                          <div style={{height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f8f8'}}>
                              <img 
                                src={p.images?.[0] || 'https://via.placeholder.com/300x300/f5f5f5/1A237E?text=📱'} 
                                style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '10px'}} 
                                onError={(e: any) => e.target.src = 'https://via.placeholder.com/300x300/f5f5f5/1A237E?text=📱'}
                              />
                          </div>
                          <div style={{padding: '10px'}}>
                            {(() => {
                              const tier = getProductTier(p);
                              return (
                                <span 
                                  style={{ 
                                    background: tier.color, 
                                    color: tier.textColor, 
                                    border: `1px solid ${tier.border}`,
                                    padding: '3px 10px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    fontFamily: 'Cairo',
                                    display: 'inline-block',
                                    marginBottom: '6px'
                                  }}
                                >
                                  {tier.label}
                                </span>
                              );
                            })()}
                            <p style={{fontSize: '11px', color: '#999', margin: '0'}}>{p.brand}</p>
                            <h3 style={{
                              fontSize: '13px', 
                              fontWeight: 'bold', 
                              margin: '4px 0', 
                              lineHeight: '1.3',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              height: '34px'
                            }}>{p.name}</h3>
                            {p.discount > 0 && (
                              <p style={{textDecoration: 'line-through', color: '#999', fontSize: '11px', margin: '0'}}>
                                {p.price.toLocaleString()} أوقية
                              </p>
                            )}
                            <p style={{color: '#1A237E', fontWeight: 'bold', fontSize: '14px', margin: '2px 0'}}>
                              {price.toLocaleString()} أوقية
                            </p>
                          </div>
                      </Link>
                    );
                })}
            </div>
         </div>
      )}
    </div>
  );
}
