import React, { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, getDocs, query, where, limit, collection, getFirestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { contactWhatsApp, getProductTier, proxyImage, getDisplayPrice } from '../lib/utils';
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
  const [activeImg, setActiveImg] = useState(0);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const DESC_LIMIT = 120;

  // Shipping and Settings States (Feature 3)
  const [shippingSettings, setShippingSettings] = useState<any>({});
  const DEFAULT_WEIGHTS = {
    'ملابس وأزياء': 0.5,
    'منزل ومطبخ': 1.5,
    'جمال وعناية': 0.3,
    'رياضة': 1.0,
    'أطفال': 0.5,
    'ألعاب وترفيه': 0.8,
    'إلكترونيات': 0, // manual
  };
  const [weights, setWeights] = useState<any>(DEFAULT_WEIGHTS);
  const [settings, setSettings] = useState<any>({ usdToMru: 37, profitMargin: 1.30 });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetchProduct();
  }, [id]);

  useEffect(() => {
    loadShippingSettings();
    loadSettings();
  }, []);

  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        const sorted = [...product.variants].sort((a, b) => a.price - b.price);
        setSelectedVariant(sorted[0]);
      }
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      }
    }
  }, [product]);

  async function loadShippingSettings() {
    const db_inst = getFirestore();
    const snap = await getDoc(doc(db_inst, 'panda_settings', 'shipping'));
    if (snap.exists()) {
      const data = snap.data();
      setShippingSettings(data);
      if (data.weights) setWeights(data.weights);
    }
  }

  async function loadSettings() {
    try {
      const snap = await getDoc(doc(db, 'panda_settings', 'general'));
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          usdToMru: parseFloat(data.usdToMru) || 37,
          profitMargin: parseFloat(data.profitMargin) || 1.30
        });
      }
    } catch (err) {
      console.error("Error loading general settings:", err);
    }
  }

  // Calculate shipping:
  function getShippingCost(prod: any) {
    if (!prod) return null;
    const weight = weights[prod.category] || 0;
    if (weight === 0) return null; // manual
    const usdToMru = settings.usdToMru || 37;
    const ratePerKg = shippingSettings.ratePerKg || 20;
    return Math.round(weight * ratePerKg * usdToMru);
  }

  const handleVariantChange = (variant: any) => {
    setSelectedVariant(variant);
    const priceEl = document.getElementById('productPrice');
    if (priceEl) {
      priceEl.style.transform = 'scale(1.1)';
      priceEl.style.color = '#FF6600';
      setTimeout(() => {
        priceEl.style.transform = 'scale(1)';
        priceEl.style.color = '#FF6600';
      }, 300);
    }
  };

  async function fetchProduct() {
    if (!id) return;
    try {
      setLoading(true);
      let snap = await getDoc(doc(db, 'mt_products', id));
      if (!snap.exists()) {
        snap = await getDoc(doc(db, 'panda_products', id));
      }
      
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Product;
        setProduct(data);
        setActiveImg(0);
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
      if (allProducts && allProducts.length > 0) {
        const matched = allProducts.filter(p => 
          p.id !== currentProduct.id && 
          (p.brand === currentProduct.brand || p.category === currentProduct.category)
        ).slice(0, 8);
        setRelated(matched);
        return;
      }

      // Legacy fallback
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

  const basePrice = getDisplayPrice(product);
  const currentPrice = selectedVariant?.price 
    || (product.discount > 0
      ? Math.round(basePrice * (1 - product.discount/100))
      : basePrice);

  const allImages = [
    product.mainImage,
    ...(product.images || [])
  ].filter((img, index, self) => 
    img && img.length > 10 && self.indexOf(img) === index
  );

  const shippingCost = getShippingCost(product);

  return (
    <div style={{
      maxWidth:1200, margin:'0 auto',
      padding:'20px 16px',
      direction:'rtl',
      fontFamily:'Cairo',
    }} id="productDetailRoot">
      
      <div style={{
        display:'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1.1fr 1fr',
        gap:32,
      }}>
        
        {/* LEFT - Images */}
        <div>
          {/* Main image */}
          <div style={{
            borderRadius:16,
            overflow:'hidden',
            marginBottom:12,
            background:'#f8f8f8',
            aspectRatio:'1',
            border: '1px solid #eee'
          }}>
            <img
              src={proxyImage(allImages[activeImg] || product.mainImage)}
              style={{
                width:'100%', height:'100%',
                objectFit:'contain',
              }}
              onError={(e: any) => {
                e.target.style.opacity='0.2';
              }}
            />
          </div>
          
          {/* Thumbnails */}
          <div style={{
            display:'flex', gap:8,
            overflowX:'auto',
            paddingBottom:4,
          }}>
            {allImages.map((img, i) => (
              <img
                key={i}
                src={proxyImage(img)}
                onClick={() => setActiveImg(i)}
                style={{
                  width:68, height:68, flexShrink:0,
                  objectFit:'cover', borderRadius:8,
                  cursor:'pointer',
                  border: activeImg === i
                    ? '2px solid #FF6600'
                    : '1px solid #eee',
                }}
                onError={(e: any) => {
                  e.target.style.display='none';
                }}
              />
            ))}
          </div>
        </div>
        
        {/* RIGHT - Details */}
        <div style={{ padding: '0 8px' }}>
          {/* Brand & Category badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ background: '#F5F5F5', color: '#666', fontSize: 11, fontWeight: 'bold', padding: '4px 12px', borderRadius: 20 }}>
              {product.brand}
            </span>
            <span style={{ background: '#FFF0F0', color: '#FF6600', fontSize: 11, fontWeight: 'bold', padding: '4px 12px', borderRadius: 20 }}>
              {product.category}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize:20, lineHeight:1.6,
            color:'#111', marginBottom:16,
            fontWeight:'bold',
          }}>
            {product.name}
          </h1>
          
          {/* Rating + Sales */}
          {((product as any).rating || (product as any).salesCount) && (
            <div style={{
              display:'flex', gap:16,
              marginBottom:16,
              fontSize:13, color:'#666',
              borderBottom:'1px solid #f0f0f0',
              paddingBottom:12,
            }}>
              {(product as any).rating && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>⭐ {(product as any).rating}</span>
              )}
              {(product as any).salesCount && (
                <span>{(product as any).salesCount}</span>
              )}
            </div>
          )}
          
          {/* Price box */}
          <div style={{
            background:'#FFF8F0',
            borderRadius:12,
            padding:'16px 20px',
            marginBottom:20,
            border: '1px solid #FFE8D6'
          }}>
            {product.originalPrice && 
             product.originalPrice > currentPrice && (
              <div style={{
                textDecoration:'line-through',
                color:'#999', fontSize:14,
                marginBottom:4,
              }}>
                {product.originalPrice.toLocaleString()} أوقية
              </div>
            )}
            
            <div style={{
              display:'flex',
              alignItems:'baseline',
              gap:10,
              flexWrap: 'wrap'
            }}>
              <span id="productPrice" style={{
                fontSize:32, fontWeight:'bold',
                color:'#FF6600',
                transition: 'all 0.2s'
              }}>
                {currentPrice > 0 ? `${currentPrice.toLocaleString()} أوقية` : 'السعر عند الطلب'}
              </span>
              {((product as any).priceUSD || (product as any).originalPriceUSD) && (
                <span style={{color:'#999', fontSize:14}} dir="ltr">
                  ($(${ ((product as any).priceUSD || Math.round(currentPrice / (settings.usdToMru || 37))).toFixed(2) }))
                </span>
              )}
              {product.discount > 0 && (
                <span style={{
                  background:'#FF6600',
                  color:'white',
                  padding:'2px 8px',
                  borderRadius:4,
                  fontSize:12,
                  fontWeight:'bold',
                }}>
                  -${product.discount}%
                </span>
              )}
            </div>
            {selectedVariant && (
              <div style={{fontSize: '12px', color: '#666', marginTop: '6px', fontWeight: 'bold'}}>
                سعر نسخة ${selectedVariant.storage} ${selectedColor ? ` — ${selectedColor}` : ''}
              </div>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (() => {
            const minVarPrice = Math.min(...product.variants.map(v => v.price));
            return (
              <div style={{marginTop:20, marginBottom: 20, direction:'rtl'}}>
                <p style={{ fontWeight:'bold', marginBottom:10, fontSize: '14px', color: '#444' }}>💾 السعة:</p>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {product.variants.map((v: any) => {
                    const diff = v.price - minVarPrice;
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVariantChange(v)}
                        style={{
                          padding:'10px 18px',
                          border: isSelected ? '2px solid #FF6600' : '1px solid #ddd',
                          borderRadius:10,
                          background: isSelected ? '#FFFDFB' : 'white',
                          color: isSelected ? '#FF6600' : '#333',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          cursor:'pointer',
                          transition:'all 0.2s',
                          textAlign: 'center',
                          minWidth: '100px'
                        }}
                      >
                        <div style={{fontSize:14, fontWeight: 'bold'}}>{v.storage}</div>
                        <div style={{fontSize:13, color:'#FF6600', fontWeight:'bold'}}>
                          {v.price.toLocaleString()} أوقية
                        </div>
                        {diff > 0 && (
                          <div style={{ fontSize: 11, color: '#E53935' }}>
                            +${diff.toLocaleString()}
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
            <div style={{marginTop:16, marginBottom: 20, direction:'rtl'}}>
              <p style={{ fontWeight:'bold', marginBottom:10, fontSize: '14px', color: '#444' }}>
                🎨 اللون: <span style={{fontWeight:'normal', color:'#666', marginRight:8}}>{selectedColor}</span>
              </p>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding:'8px 16px',
                      border: selectedColor === color ? '2px solid #FF6600' : '1px solid #ddd',
                      borderRadius:20,
                      background: selectedColor === color ? '#FF6600' : 'white',
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

          {/* Stock Display */}
          <div style={{marginBottom: 20}}>
            <p style={{
              color: product.stock > 5 ? '#2E7D32' 
                : product.stock > 0 ? '#F57C00' : '#D32F2F',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}>
              {product.stock > 5 ? '✅ متوفر بالمخزون للتوصيل الفوري'
                : product.stock > 0 
                  ? `⚠️ متبقي ${product.stock} قطع فقط`
                  : '❌ نفذ المخزون'}
            </p>
          </div>
          
          {/* Shipping info */}
          <div style={{
            border:'1px solid #f0f0f0',
            borderRadius:12,
            padding:'14px 16px',
            marginBottom:20,
          }}>
            <div style={{
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center',
              marginBottom:8,
            }}>
              <span style={{color:'#666', fontSize:13}}>
                🚚 الشحن إلى موريتانيا
              </span>
              <span style={{
                fontWeight:'bold',
                color: shippingCost ? '#0A1628' : '#999',
                fontSize:14,
              }}>
                {shippingCost 
                  ? `${shippingCost.toLocaleString()} أوقية`
                  : 'يُحدد عند الطلب'
                }
              </span>
            </div>
            
            <div style={{
              display:'flex',
              justifyContent:'space-between',
              fontSize:12, color:'#888',
            }}>
              <span>⏱️ مدة التوصيل</span>
              <span>15 - 30 يوم عمل</span>
            </div>
            
            {shippingCost && (
              <div style={{
                marginTop:10,
                padding:'8px 12px',
                background:'#F0F7FF',
                borderRadius:8,
                fontSize:12,
                color:'#0A1628',
              }}>
                💰 الإجمالي التقديري:{' '}
                <strong>
                  {(currentPrice + shippingCost)
                    .toLocaleString()} أوقية
                </strong>
              </div>
            )}
          </div>
          
          {/* Order button */}
          <a
            href={`https://wa.me/22236096100?text=${
              encodeURIComponent(
                `🛍️ أريد طلب هذا المنتج - Panda Store\n\n` +
                `📦 ${product.name}\n` +
                `💰 السعر: ${currentPrice?.toLocaleString()} أوقية\n` +
                `🚚 الشحن: ${shippingCost?.toLocaleString() || 'يُحدد'} أوقية\n` +
                `💵 الإجمالي: ${((currentPrice||0) + (shippingCost||0)).toLocaleString()} أوقية\n` +
                `🔗 ${product.sourceUrl || ''}`
              )
            }`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:10,
              width:'100%',
              padding:'16px',
              background:'#FF6600',
              color:'white',
              borderRadius:14,
              textDecoration:'none',
              fontSize:16,
              fontWeight:'bold',
              marginBottom:12,
              boxShadow:'0 4px 16px rgba(255,102,0,0.3)',
              textAlign: 'center'
            }}
          >
            اطلب الآن عبر واتساب 💬
          </a>

          {/* Add to Cart button */}
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
              display: 'block',
              width:'100%', padding:'14px',
              background: product.stock === 0 ? '#ccc' : '#ffffff',
              color: product.stock === 0 ? '#999' : '#1A237E',
              border: product.stock === 0 ? '1px solid #ccc' : '2px solid #1A237E',
              borderRadius:'14px', fontSize:'15px',
              fontWeight: 'bold',
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              marginBottom: 20,
              fontFamily:'Cairo',
              textAlign: 'center'
            }}
          >
            {product.stock === 0 ? 'نفذ المخزون' : '🛒 أضف إلى سلة المشتريات'}
          </button>
          
          {/* Guarantee badges */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr',
            gap:8,
          }}>
            {[
              {icon:'🛡️', text:'ضمان Panda 100%'},
              {icon:'📦', text:'تغليف آمن'},
              {icon:'↩️', text:'إرجاع مضمون'},
              {icon:'💬', text:'دعم على واتساب'},
            ].map((b, idx) => (
              <div style={{
                display:'flex',
                alignItems:'center',
                gap:8,
                padding:'10px 12px',
                background:'#f8f9fc',
                borderRadius:10,
                fontSize:12,
                color:'#444',
              }} key={idx}>
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Full description */}
          {product.description && (
            <div style={{ marginTop: 24, padding: '16px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #f0f0f0' }}>
              <p style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 8, color: '#333' }}>📝 وصف المنتج:</p>
              <p style={{ color: '#555', fontSize: 14, lineHeight: '1.6', margin: 0 }}>
                {showFullDesc || product.description.length <= DESC_LIMIT
                  ? product.description
                  : product.description.substring(0, DESC_LIMIT) + '...'
                }
              </p>
              {product.description.length > DESC_LIMIT && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  style={{
                    background:'none', border:'none',
                    color:'#FF6600', fontFamily:'Cairo',
                    fontSize:13, cursor:'pointer',
                    padding:'4px 0', fontWeight:'bold',
                    marginTop: 4
                  }}
                >
                  {showFullDesc ? '▲ عرض أقل' : '▼ المزيد'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Specs */}
      {product.specifications && Object.values(product.specifications).some(x => x) && (
        <div style={{marginTop:'40px'}}>
           <div style={{borderBottom: '3px solid #FF6600', width: 'fit-content', paddingBottom: '5px', marginBottom: '24px'}}>
                <h2 style={{fontSize:'20px', fontWeight: 'bold', color: '#111'}}>المواصفات التقنية</h2>
           </div>
          <div style={{
            display:'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
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
                    <span style={{fontWeight:'bold', color: '#111'}}>{v as string}</span>
                  </div>;
            })}
          </div>
        </div>
      )}

      {/* Related Products */}
      {related.length > 0 && (
         <div style={{marginTop:'40px'}} id="productPageRoot">
            <div style={{
              borderRight: '4px solid #FF6600', 
              paddingRight: '12px', 
              marginBottom: '20px'
            }}>
                 <h2 style={{fontSize:'18px', fontWeight: 'bold', color: '#111', fontFamily: 'Cairo'}}>قد يعجبك أيضاً 💡</h2>
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
                                src={proxyImage(p.images?.[0] || 'https://via.placeholder.com/300x300/f5f5f5/1A237E?text=📱')} 
                                style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '10px'}} 
                                onError={(e: any) => {
                                  e.target.onerror = null;
                                  e.target.style.opacity = '0.3';
                                }}
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
                            <p style={{color: '#FF6600', fontWeight: 'bold', fontSize: '14px', margin: '2px 0'}}>
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
