import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Info, Target, TrendingUp, Users } from 'lucide-react';
import { db, ensureAuth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { StoreConfig } from '../types';

export default function About() {
  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    ensureAuth();
    return onSnapshot(doc(db, 'mt_config', 'settings'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-16"
      >
        {/* Hero Section */}
        <div className="text-center flex flex-col gap-6">
          <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter">قصتنا</h1>
          <p className="text-xl font-bold text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {config?.tagline || 'نحن نغير الطريقة التي تشتري بها الهواتف في موريتانيا.'}
          </p>
        </div>

        {/* Story Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-video md:aspect-square rounded-[40px] overflow-hidden shadow-2xl">
            <img 
              src={config?.heroImage || "https://picsum.photos/seed/store/800/800"} 
              alt="Our Store"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
          </div>
          <div className="flex flex-col gap-8">
            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
              <p className="text-lg font-bold text-gray-700 leading-loose whitespace-pre-wrap">
                {config?.aboutUs || 'نحن في Mauri Tick نسعى لتوفير أفضل الأجهزة الذكية بأفضل الأسعار الممكنة، مع ضمان الجودة وخدمة ما بعد البيع. بدأنا كفكرة بسيطة تهدف إلى تسهيل عملية الشراء لجميع الموريتانيين.'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-6 rounded-3xl text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <span className="block text-2xl font-black text-primary">5000+</span>
                <span className="text-xs font-bold text-gray-400">عميل سعيد</span>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl text-center">
                <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2" />
                <span className="block text-2xl font-black text-accent">100%</span>
                <span className="text-xs font-bold text-gray-400">نمو سنوي</span>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-2 border-gray-100 p-10 rounded-[40px] flex flex-col gap-4">
            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-500">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-primary">رؤيتنا</h3>
            <p className="font-bold text-gray-500 leading-relaxed">أن نكون الوجهة رقم 1 لكل من يبحث عن هاتف ذكي في موريتانيا، من خلال الابتكار والشفافية التامة.</p>
          </div>
          <div className="bg-white border-2 border-gray-100 p-10 rounded-[40px] flex flex-col gap-4">
            <div className="bg-accent/10 w-12 h-12 rounded-2xl flex items-center justify-center text-accent">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-primary">مهمتنا</h3>
            <p className="font-bold text-gray-500 leading-relaxed">توفير تجربة تسوق آمنة وسهلة، مع ضمان أفضل قيمة مقابل المال وسرعة توصيل خيالية.</p>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
