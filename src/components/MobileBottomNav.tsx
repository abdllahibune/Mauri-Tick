import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, Repeat, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';

export function MobileBottomNav() {
  const location = useLocation();
  const { cart } = useCart();
  const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const page = location.pathname;

  const tabs = [
    { id: 'home', label: 'الرئيسية', path: '/', icon: Home },
    { id: 'products', label: 'المنتجات', path: '/products', icon: Grid },
    { id: 'cart', label: 'السلة', path: '/cart', icon: ShoppingCart },
    { id: 'trade', label: 'تبديل', path: '/tradein', icon: Repeat },
    { id: 'account', label: 'حسابي', path: '/account', icon: User },
  ];

  return (
    <nav className="mobile-bottom-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = page === tab.path || (tab.id === 'home' && page === '/') || (tab.id === 'products' && page.startsWith('/products'));
        
        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn("tab-item", isActive && "active")}
          >
            <div className="relative">
              <Icon strokeWidth={isActive ? 2.5 : 2} />
              {tab.id === 'cart' && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 border border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
