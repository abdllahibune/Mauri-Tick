import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, onSnapshot, limit } from 'firebase/firestore';

interface Subcategory {
  id: string;
  name: string;
  image: string;
  useAutoImage: boolean;
  order: number;
  active: boolean;
}

export function getFirstProductImage(categoryName: string, subName: string): Promise<string | null> {
  const db = getFirestore();
  return getDocs(
    query(
      collection(db, 'panda_products'),
      where('category', '==', categoryName),
      where('subcategory', '==', subName),
      where('active', '==', true),
      limit(1)
    )
  ).then(snap => {
    if (!snap.empty) {
      const p = snap.docs[0].data();
      return p.mainImage || p.images?.[0] || null;
    }
    // Try mt_products next
    return getDocs(
      query(
        collection(db, 'mt_products'),
        where('category', '==', categoryName),
        where('subcategory', '==', subName),
        where('active', '==', true),
        limit(1)
      )
    );
  }).then(resOrStr => {
    if (typeof resOrStr === 'string' || resOrStr === null) {
      return resOrStr;
    }
    const snap = resOrStr as any;
    if (!snap.empty) {
      const p = snap.docs[0].data();
      return p.mainImage || p.images?.[0] || null;
    }
    return null;
  }).catch((err) => {
    console.error('Error in getFirstProductImage:', err);
    return null;
  });
}

export function SubcategoriesGrid({ category }: { category: string }) {
  const [subs, setSubs] = useState<Subcategory[]>([]);
  const [subImages, setSubImages] = useState<Record<string, string>>({});
  const [searchParams] = useSearchParams();
  const activeSubParam = searchParams.get('sub') || '';

  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, 'panda_categories'), where('name', '==', category));
    
    const unsub = onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        const catDoc = snap.docs[0].data();
        const rawSubs = (catDoc.subcategories || []) as Subcategory[];
        const sorted = [...rawSubs].sort((a, b) => (a.order || 0) - (b.order || 0));
        setSubs(sorted);

        // Fetch images
        const images: Record<string, string> = {};
        for (const sub of sorted) {
          if (sub.active) {
            if (sub.useAutoImage) {
              const img = await getFirstProductImage(category, sub.name);
              images[sub.id] = img || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=150&auto=format&fit=crop&q=60';
            } else {
              images[sub.id] = sub.image || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=150&auto=format&fit=crop&q=60';
            }
          }
        }
        setSubImages(images);
      } else {
        setSubs([]);
      }
    });

    return () => unsub();
  }, [category]);

  const activeSubs = subs.filter(s => s.active);
  if (activeSubs.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6 font-cairo" id="subcategories-grid-section">
      <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-4 mr-1 text-right">الفروع المتاحة</h3>
      <div className="flex overflow-x-auto scrollbar-hide py-2 gap-5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 justify-start" dir="rtl">
        {activeSubs.map(sub => {
          const isSelected = activeSubParam === sub.name;
          return (
            <Link 
              to={`/products?category=${encodeURIComponent(category)}${isSelected ? '' : `&sub=${encodeURIComponent(sub.name)}`}`}
              key={sub.id}
              className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer focus:outline-none w-20"
              id={`subcategory-link-${sub.id}`}
            >
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center p-0.5 border-2 transition-all ${isSelected ? 'border-primary ring-4 ring-primary/10' : 'border-gray-100 group-hover:border-primary/40'}`}>
                <img 
                  src={subImages[sub.id] || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=150&auto=format&fit=crop&q=60'} 
                  alt={sub.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className={`text-[11px] font-black tracking-tight text-center truncate w-full transition-colors ${isSelected ? 'text-primary font-extrabold' : 'text-gray-600 group-hover:text-primary'}`}>
                {sub.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
