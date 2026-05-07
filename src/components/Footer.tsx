import { Mail, Phone, MapPin, Facebook, Instagram, Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8 border-t-8 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="text-3xl font-black tracking-tighter">MAURI TICK</Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              وجهتكم الأولى لأحدث الهواتف الذكية والإكسسوارات في موريتانيا. جودة مضمونة وأسعار تنافسية.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-accent hover:text-primary transition-all"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-accent hover:text-primary transition-all"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-accent hover:text-primary transition-all"><Music2 className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-accent font-bold mb-6">روابط سريعة</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-300">
              <li><Link to="/products" className="hover:text-white transition-colors">جميع المنتجات</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">تتبع طلبك</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">قائمة الأمنيات</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">سلة التسوق</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-accent font-bold mb-6">اتصل بنا</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-300">
              <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-accent" /> 36096100</li>
              <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-accent" /> info@mauritick.com</li>
              <li className="flex items-center gap-3"><MapPin className="w-5 h-5 text-accent" /> نواكشوط، موريتانيا</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-accent font-bold mb-6">النشرة الإخبارية</h4>
            <p className="text-sm text-gray-300 mb-4">اشترك للحصول على آخر العروض والخصومات.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="بريدك الإلكتروني" className="bg-white/10 border-none rounded-lg px-4 py-2 text-sm w-full outline-none focus:ring-1 ring-accent" />
              <button className="bg-accent text-primary font-bold px-4 py-2 rounded-lg hover:brightness-110">اشترك</button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>تم التطوير بواسطة موري تيك | واتساب: 36096100</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white">الشروط والأحكام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
