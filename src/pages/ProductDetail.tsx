import React, { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, getDocs, query, where, limit, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { contactWhatsApp } from '../lib/utils';
import { MessageCircle } from 'lucide-react';
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

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetchProduct();
  }, [id]);

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
      // 1. Try Same Brand
      const brandQ = query(
        collection(db, 'mt_products'),
        where('brand', '==', currentProduct.brand),
        limit(7) // Fetch 7 to filter out current
      );
      const brandSnap = await getDocs(brandQ);
      let relatedItems = brandSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Product))
        .filter(p => p.id !== currentProduct.id)
        .slice(0, 6);

      // 2. Fallback to Same Category if not enough found
      if (relatedItems.length < 4) {
        const catQ = query(
          collection(db, 'mt_products'),
          where('category', '==', currentProduct.category),
          limit(10)
        );
        const catSnap = await getDocs(catQ);
        const catItems = catSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => p.id !== currentProduct.id && !relatedItems.find(r => r.id === p.id));
        
        relatedItems = [...relatedItems, ...catItems].slice(0, 6);
      }

      setRelated(relatedItems);
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

  const discountedPrice = product.discount > 0
    ? Math.round(product.price * (1 - product.discount/100))
    : product.price;

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
          
          <div style={{margin:'24px 0', background: '#F8F9FF', padding: '20px', borderRadius: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
               <span style={{fontSize:'36px', fontWeight:'900', color:'#1A237E'}}>
                {discountedPrice.toLocaleString()} أوقية
              </span>
              {product.discount > 0 && (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <span style={{textDecoration:'line-through', color:'#999', fontSize:'16px'}}>
                    {product.price?.toLocaleString()} أوقية
                  </span>
                  <span style={{color: '#E53935', fontSize: '12px', fontWeight: 'bold'}}>
                    وفر {Math.round(product.price - discountedPrice).toLocaleString()} أوقية
                  </span>
                </div>
              )}
            </div>
          </div>

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
              whiteSpace: 'pre-wrap'
          }}>
            {product.description}
          </div>

          {/* Add to cart */}
          <button
            onClick={() => {
                addToCart(product, 1);
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
         <div style={{marginTop:'60px'}}>
            <div style={{borderBottom: '3px solid #FFD700', width: 'fit-content', paddingBottom: '5px', marginBottom: '24px'}}>
                 <h2 style={{fontSize:'24px', fontWeight: '900', color: '#1A237E'}}>منتجات مشابهة من {product.brand}</h2>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 1024 ? (window.innerWidth < 640 ? '1fr' : '1fr 1fr') : 'repeat(4, 1fr)',
                gap: '20px'
            }}>
                {related.map(p => (
                    <Link to={`/product/${p.id}`} key={p.id} style={{textDecoration: 'none', color: 'inherit'}}>
                        <div style={{
                            background: '#fff', borderRadius: '20px', padding: '15px', 
                            border: '1px solid #eee', height: '100%', 
                            display: 'flex', flexDirection: 'column', gap: '10px'
                        }}>
                            <div style={{height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                <img src={p.images?.[0]} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                            </div>
                            <span style={{fontSize: '12px', color: '#666'}}>{p.brand}</span>
                            <h3 style={{fontSize: '16px', fontWeight: 'bold', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{p.name}</h3>
                            <span style={{fontSize: '18px', fontWeight: '900', color: '#1A237E'}}>
                                {p.discount > 0 
                                    ? Math.round(p.price * (1 - p.discount/100)).toLocaleString() 
                                    : p.price.toLocaleString()} أوقية
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
         </div>
      )}
    </div>
  );
}
