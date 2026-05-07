import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatNumber: (num: number | string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    'nav.home': 'الرئيسية',
    'nav.products': 'المنتجات',
    'nav.about': 'من نحن',
    'nav.contact': 'اتصل بنا',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'إنشاء حساب',
    'nav.myAccount': 'حسابي',
    'nav.cart': 'السلة',
    'hero.shopNow': 'تسوق الآن',
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ ما',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'cart.empty': 'سلة المشتريات فارغة',
    'cart.checkout': 'إتمام الطلب',
    'product.addToCart': 'أضف للسلة',
    'product.outOfStock': 'نفذت الكمية',
    'product.specs': 'المواصفات',
    'footer.rights': 'جميع الحقوق محفوظة',
  },
  en: {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.myAccount': 'My Account',
    'nav.cart': 'Cart',
    'hero.shopNow': 'Shop Now',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'cart.empty': 'Your cart is empty',
    'cart.checkout': 'Checkout',
    'product.addToCart': 'Add to Cart',
    'product.outOfStock': 'Out of Stock',
    'product.specs': 'Specifications',
    'footer.rights': 'All rights reserved',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  // Ensure Western Arabic numerals (0-9)
  const formatNumber = (num: number | string) => {
    return num.toString().replace(/[٠-٩]/g, (d) => 
      (d.charCodeAt(0) - 1632).toString()
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatNumber, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
