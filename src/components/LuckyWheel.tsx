import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Sparkles, Copy, ShoppingBag, Loader2 } from 'lucide-react';
import { db, safeWrite } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { StoreConfig, WheelPrize } from '../types';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export function LuckyWheel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<WheelPrize | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const checkWheel = async () => {
      const used = localStorage.getItem('mt_wheel_used');
      if (used === 'true') return;
      
      const lastClosed = localStorage.getItem('mt_wheel_closed_at');
      if (lastClosed) {
        const diff = Date.now() - parseInt(lastClosed);
        if (diff < 7 * 24 * 60 * 60 * 1000) return; // 7 days
      }

      // Fetch config to check if active
      const snap = await getDoc(doc(db, 'mt_settings', 'general'));
      if (snap.exists()) {
        const data = snap.data() as StoreConfig;
        setConfig(data);
        if (data.wheelSettings?.isActive) {
          setTimeout(() => setIsOpen(true), 8000);
        }
      }
    };

    checkWheel();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (!result) {
      localStorage.setItem('mt_wheel_closed_at', Date.now().toString());
    }
  };

  const spinWheel = async () => {
    if (isSpinning || !config?.wheelSettings) return;
    setIsSpinning(true);

    const prizes = config.wheelSettings.prizes;
    
    // Select prize based on probability
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selectedPrizeIndex = 0;
    
    for (let i = 0; i < prizes.length; i++) {
        cumulative += prizes[i].probability;
        if (rand <= cumulative) {
            selectedPrizeIndex = i;
            break;
        }
    }

    const prize = prizes[selectedPrizeIndex];
    const segmentAngle = 360 / prizes.length;
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const targetRotation = (extraSpins * 360) + (360 - (selectedPrizeIndex * segmentAngle)) - (segmentAngle / 2);
    
    setRotation(targetRotation);

    setTimeout(async () => {
      setResult(prize);
      setIsSpinning(false);
      localStorage.setItem('mt_wheel_used', 'true');

      // Generate Coupon
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      setCouponCode(code);

      try {
        await safeWrite(async () => {
          // Create coupon in DB
          await addDoc(collection(db, 'mt_coupons'), {
            code,
            discountType: prize.type === 'percent' ? 'percent' : 'fixed',
            value: prize.value,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
            usageLimit: 1,
            usageCount: 0,
            isActive: true,
            createdAt: serverTimestamp(),
            deviceId: localStorage.getItem('mt_device_id') || 'unknown'
          });

          // Update stats
          await updateDoc(doc(db, 'mt_settings', 'general'), {
            'wheelSettings.totalSpins': increment(1)
          });
        });
      } catch (e) {
        console.error("Error saving wheel results", e);
      }
    }, 5000);
  };

  const copyCode = () => {
    if (couponCode) {
      navigator.clipboard.writeText(couponCode);
      toast.success('تم نسخ الكود! 📋');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 relative overflow-hidden text-center flex flex-col items-center border border-white/50"
      >
        <button onClick={handleClose} className="absolute top-6 left-6 p-2 bg-gray-50 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
          <X className="w-5 h-5" />
        </button>

        {!result ? (
          <>
            <div className="mb-6">
                <div className="bg-accent/10 w-16 h-16 rounded-3xl flex items-center justify-center text-accent mx-auto mb-4 animate-bounce">
                    <Gift className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-primary mb-2 italic">جرب حظك مع موري تيك! 🎡</h2>
                <p className="text-sm font-bold text-gray-400">ادر العجلة للفوز بخصم حصري على مشترياتك القادمة</p>
            </div>

            <div className="relative w-64 h-64 mb-8">
                {/* Pointer */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 text-primary">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-white mt-1" />
                    </div>
                </div>

                {/* The Wheel */}
                <motion.div 
                   animate={{ rotate: rotation }}
                   transition={{ duration: 5, ease: [0.32, 0.94, 0.6, 1] }}
                   className="w-full h-full rounded-full border-8 border-primary shadow-2xl relative overflow-hidden bg-gray-100"
                >
                    {config?.wheelSettings?.prizes.map((p, i) => {
                        const count = config.wheelSettings?.prizes.length || 6;
                        const angle = 360 / count;
                        return (
                            <div 
                                key={i}
                                className="absolute top-0 left-1/2 h-1/2 origin-bottom flex items-center justify-center"
                                style={{ 
                                    width: `${Math.tan((angle / 2) * Math.PI / 180) * 100}%`,
                                    transform: `translateX(-50%) rotate(${i * angle}deg)`,
                                    backgroundColor: p.color,
                                    clipPath: `polygon(50% 100%, 0 0, 100% 0)`
                                }}
                            >
                                <span className="text-[10px] font-black text-white whitespace-nowrap rotate-90 mt-12 drop-shadow-sm">
                                    {p.text}
                                </span>
                            </div>
                        );
                    })}
                </motion.div>

                {/* Center Hub */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary rounded-full border-4 border-white shadow-lg z-20 flex items-center justify-center text-accent">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <button 
                onClick={spinWheel}
                disabled={isSpinning}
                className="w-full bg-primary text-accent py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSpinning ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ادر العجلة الآن! ✨'}
            </button>
          </>
        ) : (
          <AnimatePresence>
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="flex flex-col items-center"
            >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg animate-bounce">
                    <Sparkles className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-primary mb-2">مبروك! لقد فزت 🎉</h2>
                <p className="text-lg font-black text-green-600 mb-8">{result.text}</p>

                <div className="bg-gray-50 w-full p-6 rounded-3xl border-2 border-dashed border-gray-200 mb-8 relative group">
                    <span className="text-xs font-bold text-gray-400 block mb-2">كود الخصم الخاص بك (صالح لـ 48 ساعة):</span>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-black tracking-widest text-primary font-mono">{couponCode}</span>
                        <button onClick={copyCode} className="p-2 bg-white rounded-xl shadow-sm hover:text-primary transition-colors">
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button 
                        onClick={() => window.location.href = '/products'}
                        className="w-full bg-primary text-accent py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
                    >
                        <ShoppingBag className="w-5 h-5" /> تسوق الآن واستخدم الكود
                    </button>
                    <button 
                        onClick={handleClose}
                        className="text-xs font-bold text-gray-400 hover:text-primary transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Decorative elements */}
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
}
