import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LiveNotifications } from './components/LiveNotifications';
import { AIAssistant } from './components/AIAssistant';
import { useEffect, useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CompareProvider } from './context/CompareContext';
import { doc, getDoc, collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db, ensureAuth } from './lib/firebase';
import { Product, StoreConfig } from './types';

// Pages
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Confirmation } from './pages/Confirmation';
import { Wishlist } from './pages/Wishlist';
import { TrackOrder } from './pages/TrackOrder';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { ComparePage } from './pages/ComparePage';
import { TradeInPage } from './pages/TradeIn';
import { Sell } from './pages/Sell';
import { Accessories } from './pages/Accessories';
import { UsedPage } from './pages/Used';
import About from './pages/About';
import Contact from './pages/Contact';
import ReturnPolicy from './pages/ReturnPolicy';
import Copyright from './pages/Copyright';
import ReviewPage from './pages/ReviewPage';
import { NotFound } from './pages/NotFound';
import { ComparisonBar } from './components/ComparisonBar';
import { InvestorPopup } from './components/InvestorPopup';
import { LuckyWheel } from './components/LuckyWheel';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

import { useLocation } from 'react-router-dom';

function MainApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const { language } = useLanguage();

  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    let unsubConfig: (() => void) | undefined;

    const init = async () => {
      try {
        await ensureAuth();
        
        // 1. Fetch Products
        const q = query(collection(db, 'mt_products'), limit(100));
        unsubProducts = onSnapshot(q, (snapshot) => {
          setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        }, (err) => console.error("Products fallback:", err));

        // 2. Fetch Theme Colors from 'mt_settings/general' as requested
        unsubConfig = onSnapshot(doc(db, 'mt_settings', 'general'), (snapshot) => {
          if (snapshot.exists()) {
            const config = snapshot.data() as StoreConfig;
            if (config.themeColors) {
              const root = document.documentElement;
              root.style.setProperty('--primary', config.themeColors.primary);
              root.style.setProperty('--accent', config.themeColors.accent);
              root.style.setProperty('--bg-main', config.themeColors.background);
              root.style.setProperty('--nav-bg', config.themeColors.navbar);
              root.style.setProperty('--btn-bg', config.themeColors.button);
            }
          }
        }, (err) => console.error("Config fallback:", err));
      } catch (e) {
        console.error("Initialization error:", e);
      }
    };

    init();

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubConfig) unsubConfig();
    };
  }, []);

  return (
    <div className={`flex flex-col min-h-screen ${language === 'ar' ? 'font-arabic' : 'font-sans'}`} style={{ backgroundColor: 'var(--bg-main)' }}>
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home products={products} />} />
          <Route path="/products" element={<Products products={products} />} />
          <Route path="/product/:id" element={<ProductDetail allProducts={products} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/wishlist" element={<Wishlist products={products} />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account products={products} />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/tradein" element={<TradeInPage />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/accessories" element={<Accessories products={products} />} />
          <Route path="/used" element={<UsedPage products={products} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/policy" element={<ReturnPolicy />} />
          <Route path="/copyright" element={<Copyright />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/mt-2025-admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      
      <ComparisonBar />
      <InvestorPopup />
      <LuckyWheel />
      
      {/* Floating Elements */}
      <a 
        href="https://wa.me/22236096100" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-4 left-4 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      <LiveNotifications />
      <AIAssistant products={products} />
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <CompareProvider>
            <Router>
              <ScrollToTop />
              <MainApp />
            </Router>
          </CompareProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

