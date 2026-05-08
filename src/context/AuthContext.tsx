import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, safeWrite } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: UserProfile | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mt_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mt_user');
    }
  }, [user]);

  const login = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'mt_customers'), where('phone', '==', phone.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error('❌ رقم الهاتف غير مسجل');
      }
      
      const userDoc = snap.docs[0];
      const userData = userDoc.data();
      
      if (userData.password !== btoa(password)) {
        throw new Error('❌ كلمة المرور غير صحيحة');
      }

      if (userData.isBlocked) {
        throw new Error('تم حظر هذا الحساب، يرجى التواصل مع الإدارة');
      }

      const data = { id: userDoc.id, ...userData } as UserProfile;
      setUser(data);
      toast.success('مرحباً بك مجدداً! 👋');
    } finally {
      setLoading(false);
    }
  };

  const register = async (phone: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Check if exists in customers
      const q = query(collection(db, 'mt_customers'), where('phone', '==', phone.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('هذا الرقم مسجل مسبقاً');
      }

      const hashedPassword = btoa(password);

      const customerRef = await safeWrite(() => addDoc(collection(db, 'mt_customers'), {
        phone: phone.trim(),
        password: hashedPassword,
        name,
        totalSpent: 0,
        ordersCount: 0,
        isBlocked: false,
        createdAt: serverTimestamp()
      })) as any;

      if (customerRef) {
        // Also save to mt_users for internal use if needed, but mt_customers is primary now
        await safeWrite(() => setDoc(doc(db, 'mt_users', customerRef.id), {
          phone: phone.trim(),
          password: hashedPassword,
          name,
          totalSpent: 0,
          ordersCount: 0,
          isBlocked: false,
          createdAt: serverTimestamp()
        }));

        const newUser = { 
          id: customerRef.id, 
          phone: phone.trim(), 
          name, 
          totalSpent: 0, 
          ordersCount: 0, 
          createdAt: new Date() 
        } as UserProfile;
        
        setUser(newUser);
        toast.success('تم إنشاء الحساب بنجاح! 🎉');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    toast.success('تم تسجيل الخروج');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
      await safeWrite(() => setDoc(doc(db, 'mt_users', user.id), data, { merge: true }));
      setUser(prev => prev ? { ...prev, ...data } : null);
      toast.success('تم تحديث البيانات');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
