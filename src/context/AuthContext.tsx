import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth, safeWrite } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'mt_customers', fbUser.uid));
          if (userDoc.exists()) {
            setUser({ id: fbUser.uid, ...userDoc.data() } as UserProfile);
          } else {
            // Profile doesn't exist yet, might be new registration
            // Set basic info until registration completes profile
            setUser({ id: fbUser.uid, email: fbUser.email || '', phone: '', totalSpent: 0, ordersCount: 0, createdAt: new Date() } as UserProfile);
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success('مرحباً بك مجدداً! 👋');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') throw new Error('❌ البريد الإلكتروني غير مسجل');
      if (error.code === 'auth/wrong-password') throw new Error('❌ كلمة المرور غير صحيحة');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, phone: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      await safeWrite(() => setDoc(doc(db, 'mt_customers', fbUser.uid), {
        phone: phone.trim(),
        email: email.trim(),
        name,
        totalSpent: 0,
        ordersCount: 0,
        isBlocked: false,
        createdAt: serverTimestamp()
      }));

      toast.success('تم إنشاء الحساب بنجاح! 🎉');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') throw new Error('❌ هذا البريد الإلكتروني مسجل مسبقاً');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    toast.success('تم تسجيل الخروج');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!auth.currentUser) return;
    await safeWrite(() => setDoc(doc(db, 'mt_customers', auth.currentUser!.uid), data, { merge: true }));
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
