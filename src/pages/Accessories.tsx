import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const Accessories: React.FC<{ products: Product[] }> = ({ products }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedBrand, setSelectedBrand] = useState('الكل');
  const [showFilters, setShowFilters] = useState(false);

  const accessoryProducts = useMemo(() => {
    return products.filter(p => 
      p.category === 'إكسسوارات' || p.category.toLowerCase() === 'accessories'
    );
  }, [products]);

  const brands = useMemo(() => {
    const b = new Set(accessoryProducts.map(p => p.brand));
    return ['الكل', ...Array.from(b)];
  }, [accessoryProducts]);

  const types = ['الكل', 'كفرات', 'شواحن', 'سماعات', 'حماية شاشة', 'أخرى'];

  const filteredProducts = useMemo(() => {
    return accessoryProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'الكل' || p.name.includes(selectedType);
      const matchesBrand = selectedBrand === 'الكل' || p.brand === selectedBrand;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];

      return matchesSearch && matchesType && matchesBrand && matchesPrice;
    });
  }, [accessoryProducts, searchQuery, selectedType, selectedBrand, priceRange]);

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-20 pt-10 px-4 md:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-2">إكسسوارات هواتف</h1>
            <p className="text-gray-500 font-bold">أفضل الإضافات لهاتفك بأفضل الأسعار في موريتانيا</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group flex-1 md:w-80">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن كفر، شاحن، سماعة..."
                className="w-full bg-white border-2 border-transparent focus:border-primary/20 rounded-2xl px-12 py-4 font-bold text-sm shadow-sm outline-none transition-all"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-4 bg-white rounded-2xl shadow-sm text-primary md:hidden"
            >
              <Filter className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className={cn(
            "lg:w-72 flex flex-col gap-8",
            !showFilters && "hidden lg:flex"
          )}>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 italic">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="font-black text-primary text-lg">تصفية النتائج</h3>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">نوع الإكسسوار</label>
                  <div className="flex flex-col gap-2">
                    {types.map(t => (
                      <label key={t} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="type" 
                          checked={selectedType === t}
                          onChange={() => setSelectedType(t)}
                          className="w-5 h-5 accent-primary" 
                        />
                        <span className={cn(
                          "text-sm font-bold transition-colors",
                          selectedType === t ? "text-primary" : "text-gray-500 group-hover:text-gray-900"
                        )}>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">الماركة</label>
                  <select 
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none border border-transparent focus:border-primary/20"
                  >
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">نطاق السعر</label>
                  <div className="space-y-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="50000" 
                      step="500"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                    />
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>{priceRange[1].toLocaleString()} أوقية</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 flex flex-col items-center gap-6">
                <Search className="w-16 h-16 text-gray-200" />
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-black text-primary">لا توجد نتائج</h2>
                  <p className="text-gray-500 font-bold">عذراً، لم نتمكن من العثور على أي إكسسوار يطابق معاييرك.</p>
                </div>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('الكل');
                    setPriceRange([0, 50000]);
                    setSelectedBrand('الكل');
                  }}
                  className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                  إعادة ضبط جميع الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
