import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, MessageCircle, Music, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StoreConfig } from '../types';

export function Footer() {
  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'mt_settings', 'general'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
    return () => unsub();
  }, []);

  const socialPlatforms = [
    { key: 'facebook', icon: Facebook, color: '#1877F2', label: 'فيسبوك' },
    { key: 'instagram', icon: Instagram, color: '#E1306C', label: 'إنستغرام' },
    { key: 'tiktok', icon: Music, color: '#000000', label: 'تيك توك' },
    { key: 'whatsapp', icon: MessageCircle, color: '#25D366', label: 'واتساب', prefix: 'https://wa.me/222' },
    { key: 'twitter', icon: Twitter, color: '#000000', label: 'تويتر' },
    { key: 'youtube', icon: Youtube, color: '#FF0000', label: 'يوتيوب' },
    { key: 'other', icon: Globe, color: 'var(--primary)', label: 'موقع' },
  ];

  return (
    <footer className="bg-primary text-white pt-16 pb-8 border-t-8 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="flex flex-col gap-4 text-right" dir="rtl">
            <Link to="/" className="text-3xl font-black tracking-tighter">{config?.storeName || 'MAURI TICK'}</Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              {config?.footerText || 'وجهتكم الأولى لأحدث الهواتف الذكية والإكسسوارات في موريتانيا. جودة مضمونة وأسعار تنافسية.'}
            </p>
            <div className="flex gap-3 mt-2 flex-wrap">
              {socialPlatforms.map((platform) => {
                const url = (config?.socialLinks as any)?.[platform.key];
                if (!url) return null;

                const finalUrl = platform.prefix ? `${platform.prefix}${url}` : url;

                return (
                  <a 
                    key={platform.key}
                    href={finalUrl.startsWith('http') ? finalUrl : `https://${finalUrl}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-white rounded-2xl hover:scale-110 transition-all shadow-lg group"
                    style={{ color: platform.color }}
                    title={platform.label}
                  >
                    <platform.icon className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-accent font-bold mb-6">روابط سريعة</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-300">
              <li><Link to="/products" className="hover:text-white transition-colors">جميع المنتجات</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">من نحن</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">تواصل معنا</Link></li>
              <li><Link to="/policy" className="hover:text-white transition-colors">سياسة الإرجاع</Link></li>
              <li><Link to="/copyright" className="hover:text-white transition-colors">حقوق الملكية</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-accent font-bold mb-6">خدماتنا</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-300">
              <li><Link to="/track" className="hover:text-white transition-colors">تتبع طلبك</Link></li>
              <li><Link to="/tradein" className="hover:text-white transition-colors">استبدال جهازك</Link></li>
              <li><Link to="/sell" className="hover:text-white transition-colors">بيع جهازك المستعمل</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">قائمة الأمنيات</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">سلة التسوق</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-right" dir="rtl">
            <h4 className="text-accent font-bold mb-6">اتصل بنا</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-300">
              <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-accent" /> {config?.whatsappNumber || '36096100'}</li>
              <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-accent" /> info@mauritick.com</li>
              <li className="flex items-center gap-3"><MapPin className="w-5 h-5 text-accent" /> نواكشوط، موريتانيا</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>{config?.copyrightText || `© ${new Date().getFullYear()} Mauri Tick — جميع الحقوق محفوظة`}</p>
          <div className="flex gap-6">
            <Link to="/policy" className="hover:text-white text-[10px]">سياسة الإرجاع</Link>
            <Link to="/copyright" className="hover:text-white text-[10px]">الملكية الفكرية</Link>
          </div>
          <p>تم التطوير بواسطة Mauri Tick</p>
        </div>
      </div>
    </footer>
  );
}
