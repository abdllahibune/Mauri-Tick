import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Search, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart, wishlist } = useCart();
  const location = useLocation();

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'المنتجات', path: '/products' },
    { name: 'تتبع الطلب', path: '/track' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex flex-col">
            <span className="text-2xl font-black text-primary tracking-tighter">MAURI TICK</span>
            <span className="text-[10px] text-accent font-bold mt--1 leading-none uppercase tracking-widest">أفضل الهواتف بأفضل الأسعار</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  "text-sm font-bold transition-colors hover:text-primary",
                  location.pathname === link.path ? "text-primary" : "text-gray-500"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <Link to="/products" className="p-2 text-gray-500 hover:text-primary transition-colors">
              <Search className="w-6 h-6" />
            </Link>
            <Link to="/wishlist" className="p-2 text-gray-500 hover:text-primary transition-colors relative">
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="p-2 text-gray-500 hover:text-primary transition-colors relative">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>
            <Link to="/admin" className="hidden sm:block p-2 text-gray-500 hover:text-primary transition-colors">
              <User className="w-6 h-6" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-gray-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "text-lg font-bold p-2 rounded-xl",
                location.pathname === link.path ? "bg-primary text-white" : "text-gray-700"
              )}
            >
              {link.name}
            </Link>
          ))}
          <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold p-2 text-gray-700 border-t pt-4">لوحة التحكم</Link>
        </div>
      )}
    </nav>
  );
}
