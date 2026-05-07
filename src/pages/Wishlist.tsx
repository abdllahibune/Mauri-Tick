import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Wishlist({ products }: { products: Product[] }) {
  const { wishlist } = useCart();
  
  const wishlistedItems = products.filter(p => wishlist.includes(p.id));

  if (wishlistedItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 text-center flex flex-col items-center gap-8">
        <div className="bg-red-50 p-12 rounded-full">
           <Heart className="w-20 h-20 text-red-200" />
        </div>
        <h2 className="text-4xl font-black text-primary">قائمة الأمنيات فارغة</h2>
        <p className="text-gray-500 max-w-sm">أضف المنتجات التي تعجبك لتجدها هنا لاحقاً.</p>
        <Link to="/products" className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xl hover:scale-105 transition-transform">تصفح المنتجات</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col gap-12">
      <div className="flex items-center gap-4">
        <div className="bg-red-500 p-3 rounded-2xl text-white">
           <Heart className="w-8 h-8 fill-current" />
        </div>
        <h1 className="text-4xl font-black text-primary">قائمة أمنياتي</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {wishlistedItems.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
