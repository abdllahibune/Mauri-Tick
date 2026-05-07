import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

export function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-40 text-center flex flex-col items-center gap-8">
      <div className="relative">
        <span className="text-[200px] font-black text-gray-100 leading-none">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
           <h1 className="text-6xl font-black text-primary">أوبس!</h1>
        </div>
      </div>
      <h2 className="text-3xl font-black text-gray-500">الصفحة التي تبحث عنها غير موجودة</h2>
      <p className="text-gray-400 max-w-sm">ربما تم تغيير الرابط أو تم حذف الصفحة. يرجى التأكد من العنوان أو العودة للرئيسية.</p>
      <div className="flex gap-4">
        <Link to="/" className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform">العودة للرئيسية</Link>
        <Link to="/products" className="bg-gray-100 text-primary px-10 py-4 rounded-2xl font-black text-lg hover:bg-gray-200 transition-colors">ابحث عن هاتف</Link>
      </div>
    </div>
  );
}
