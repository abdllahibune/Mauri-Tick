import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Clock, RefreshCcw, Package, AlertTriangle } from 'lucide-react';
import { db, ensureAuth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { StoreConfig } from '../types';

export default function ReturnPolicy() {
  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    ensureAuth();
    return onSnapshot(doc(db, 'mt_config', 'settings'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as StoreConfig);
    });
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-12"
      >
        <div className="text-center">
           <div className="bg-primary/10 w-20 h-20 rounded-[32px] flex items-center justify-center text-primary mx-auto mb-6">
              <ShieldCheck className="w-10 h-10" />
           </div>
           <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tighter mb-4">سياسة الإرجاع والضمان</h1>
           <p className="text-xl font-bold text-gray-400">نحن نضمن حقوقك بكل شفافية</p>
        </div>

        <div className="bg-white border-2 border-gray-100 p-10 rounded-[40px] shadow-sm flex flex-col gap-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-primary">
                <Clock className="w-6 h-6" />
                <h3 className="text-xl font-black">فترة الإرجاع</h3>
              </div>
              <p className="font-bold text-gray-500 leading-relaxed">
                يسمح بالإرجاع أو الاستبدال خلال <span className="text-accent font-black text-2xl mx-1">24 ساعة</span> فقط من تاريخ استلام الطلب.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-green-500">
                <Package className="w-6 h-6" />
                <h3 className="text-xl font-black">الشروط الأساسية</h3>
              </div>
              <ul className="flex flex-col gap-2 font-bold text-gray-500">
                <li className="flex items-center gap-2">• أن يكون الجهاز بحالته الأصلية</li>
                <li className="flex items-center gap-2">• وجود كامل الملحقات والكرتون</li>
                <li className="flex items-center gap-2">• وجود إيصال الشراء الأصلي</li>
              </ul>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-2xl font-black">حالات عدم قبول الإرجاع</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'مرور أكثر من 24 ساعة على الاستلام',
                'وجود أي خدش أو كسر في الجهاز أو الشاشة',
                'فتح كرتون الجهاز وإزالة الشرائط اللاصقة',
                'استخدام الجهاز أو تحميل برامج عليه',
                'ضياع أحد الملحقات أو تضرر الكرتون'
              ].map((text, i) => (
                <div key={i} className="bg-red-50 p-4 rounded-2xl flex items-center gap-3">
                   <div className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                   <span className="font-bold text-red-900 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 p-8 rounded-[32px] border border-primary/10">
            <h3 className="text-xl font-black text-primary mb-4 flex items-center gap-3">
              <RefreshCcw className="w-6 h-6" /> كيف تتم العملية؟
            </h3>
            <p className="font-bold text-gray-700 leading-loose whitespace-pre-wrap">
              {config?.returnPolicy || 'للبدء في عملية الإرجاع، يرجى التواصل معنا عبر واتساب على الرقم 36096100 خلال 24 ساعة من الاستلام. سيقوم فريقنا بمراجعة حالة الجهاز وإتمام العملية في أسرع وقت ممكن.'}
            </p>
          </div>

        </div>

        <div className="text-center text-gray-400 font-bold text-sm italic">
          * يخضع هذا النص للتحديث بشكل دوري لضمان أفضل خدمة لعملائنا.
        </div>
      </motion.div>
    </div>
  );
}
