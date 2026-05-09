import { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../lib/utils';
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ensureAuth, db } from '../lib/firebase';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';

import { DEMO_PRODUCTS } from '../constants';

export function Products({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedBrand, setSelectedBrand] = useState('الكل');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    ensureAuth();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedBrand]);

  async function loadProducts() {
    setLoading(true);
    try {
      let q = collection(db, 'mt_products');
      const conditions: any[] = [];

      if (selectedCategory !== 'الكل') {
        conditions.push(where('category', '==', selectedCategory));
      }
      if (selectedBrand !== 'الكل') {
        // Normalize brand to matching case in DB
        conditions.push(where('brand', '==', selectedBrand.toUpperCase()));
      }

      const queryConstraints = [...conditions];
      
      // Only limit when no specific filter is active
      if (conditions.length === 0) {
        queryConstraints.push(limit(20));
      }

      const productsQuery = query(q, ...queryConstraints);
      const snap = await getDocs(productsQuery);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      
      // Fallback to initialProducts if DB is empty or demo data
      setProducts(fetched.length > 0 ? fetched : initialProducts);
    } catch (e) {
      console.error('Filtering error:', e);
      setProducts(initialProducts);
    } finally {
      setLoading(false);
    }
  }

  // Categories and Brands lists should ideally be fetched from a dedicated collection or pre-defined
  // For now, let's use a hardcoded list of common brands and categories for Mauritania market
  const categories = ['الكل', 'هواتف ذكية', 'لابتوب وحاسوب', 'سماعات وصوتيات', 'أجهزة لوحية', 'إكسسوارات'];
  const brands = ['الكل', 'APPLE', 'SAMSUNG', 'XIAOMI', 'HUAWEI', 'INFINIX', 'TECNO', 'OTHER'];

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                              p.brand.toLowerCase().includes(search.toLowerCase());
        const matchesPrice = p.price * (1 - (p.discount || 0) / 100) <= maxPrice;
        return matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        const priceA = a.price * (1 - (a.discount || 0) / 100);
        const priceB = b.price * (1 - (b.discount || 0) / 100);
        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        if (sortBy === 'best-selling') return (b.soldCount || 0) - (a.soldCount || 0);
        return (new Date(b.createdAt?.toDate?.() || 0)).getTime() - (new Date(a.createdAt?.toDate?.() || 0)).getTime();
      });
  }, [products, search, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-primary">تصفح المنتجات</h1>
          <p className="text-gray-500 font-medium">وجدنا لك {filteredProducts.length} منتج يناسب بحثك</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className="md:hidden flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-100 font-bold shadow-sm"
           >
             <SlidersHorizontal className="w-5 h-5" /> الفلاتر
           </button>
           <div className="relative flex-1 md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الماركة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl py-3 pr-12 pl-4 outline-none focus:ring-2 ring-primary/20 shadow-sm"
              />
           </div>
        </div>
      </div>

      {/* Mobile Scrolling Categories (Facebook Style) */}
      <div className="md:hidden categories-row -mx-4">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "category-chip",
              selectedCategory === cat && "active"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
        {/* Sidebar Filters Desktop */}
        <aside className="hidden lg:flex flex-col gap-8 sticky top-32 h-fit">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h4 className="font-black text-primary">الفئة</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-black text-primary">الماركة</h4>
              <div className="flex flex-wrap gap-2">
                {brands.map(brand => (
                  <button 
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedBrand === brand ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-primary">الميزانية</h4>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{maxPrice} أوقية</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="500000" 
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-gray-400">
                <span>0</span>
                <span>500,000</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-black text-primary">ترتيب حسب</h4>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-primary/20"
              >
                <option value="newest">وصل حديثاً</option>
                <option value="price-low">السعر: من الأقل</option>
                <option value="price-high">السعر: من الأعلى</option>
                <option value="best-selling">الأكثر مبيعاً</option>
              </select>
            </div>
          </div>
          
          <div className="bg-primary p-8 rounded-[32px] text-white overflow-hidden relative group cursor-pointer">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[60px] -mr-16 -mt-16" />
             <h4 className="text-xl font-black mb-2 relative z-10">تحتاج مساعدة؟</h4>
             <p className="text-gray-300 text-xs mb-4 relative z-10">تواصل مع خبير موري تيك لاختيار هاتفك المثالي عبر الواتساب.</p>
             <a href="https://wa.me/22236096100" className="bg-accent text-primary px-4 py-2 rounded-lg font-bold text-xs inline-block relative z-10">تواصل الآن</a>
          </div>
        </aside>

        {/* Mobile Filters Overlay */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm lg:hidden"
            >
              <motion.div 
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                exit={{ x: 300 }}
                className="absolute left-0 top-0 bottom-0 w-72 bg-white p-8 flex flex-col gap-8 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-xl font-black text-primary">الفلاتر</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2"><X className="w-6 h-6" /></button>
                </div>
                {/* Same filter items as sidebar */}
                <div className="flex flex-col gap-8 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                      <h4 className="font-bold text-sm">الماركة</h4>
                      <div className="flex flex-wrap gap-2">
                        {brands.map(brand => (
                          <button key={brand} onClick={() => { setSelectedBrand(brand); setShowFilters(false); }} className={`px-3 py-2 rounded-lg text-xs font-bold ${selectedBrand === brand ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{brand}</button>
                        ))}
                      </div>
                    </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex flex-col gap-8">
           {loading ? (
             <div className="flex justify-center items-center py-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
             </div>
           ) : filteredProducts.length === 0 ? (
             <div className="bg-white p-20 rounded-[40px] text-center flex flex-col items-center gap-6 border border-dashed border-gray-300">
                <Search className="w-16 h-16 text-gray-200" />
                <h3 className="text-2xl font-black text-gray-400">عذراً، لم نجد ما تبحث عنه</h3>
                <button onClick={() => { setSearch(''); setSelectedBrand('الكل'); setMaxPrice(500000); }} className="text-primary font-bold underline">إعادة ضبط البحث</button>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 products-grid">
               {filteredProducts.map(product => (
                 <ProductCard key={product.id} product={product} />
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
