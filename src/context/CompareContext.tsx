import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import toast from 'react-hot-toast';

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<Product[]>([]);

  const addToCompare = (product: Product) => {
    if (compareList.length >= 2) {
      toast.error('يمكنك مقارنة منتجين فقط كحد أقصى');
      return;
    }
    if (compareList.find(p => p.id === product.id)) {
      toast.error('المنتج موجود بالفعل في قائمة المقارنة');
      return;
    }
    setCompareList([...compareList, product]);
    toast.success('تمت الإضافة للمقارنة');
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(compareList.filter(p => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (productId: string) => {
    return compareList.some(p => p.id === productId);
  };

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
};
