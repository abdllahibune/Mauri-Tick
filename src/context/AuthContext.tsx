import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, safeWrite } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
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
    const saved = localStorage.getItem('mauri_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mauri_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mauri_user');
    }
  }, [user]);

  const login = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone), where('password', '==', password));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
      }
      const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile;
      if (data.isBlocked) {
        throw new Error('تم حظر هذا الحساب، يرجى التواصل مع الدعم');
      }
      setUser(data);
      toast.success('مرحباً بك مجدداً! 👋');
    } finally {
      setLoading(false);
    }
  };

  const register = async (phone: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Check if exists
      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('هذا الرقم مسجل مسبقاً');
      }

      const docRef = await safeWrite(() => addDoc(collection(db, 'users'), {
        phone,
        password,
        name,
        totalSpent: 0,
        ordersCount: 0,
        isBlocked: false,
        createdAt: serverTimestamp()
      }));

      if (docRef) {
        const newUser = { id: docRef.id, phone, name, totalSpent: 0, ordersCount: 0, createdAt: new Date() } as UserProfile;
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
      await safeWrite(() => updateDoc(doc(db, 'users', user.id), data));
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
