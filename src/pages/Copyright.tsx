import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Copyright as CopyrightIcon, ShieldAlert, Lock, Scale } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { StoreConfig } from '../types';

export default function Copyright() {
  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'settings'), (snap) => {
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
              <Scale className="w-10 h-10" />
           </div>
           <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tighter mb-4">الملكية الفكرية</h1>
           <p className="text-xl font-bold text-gray-400">حماية حقوق Mauri Tick ومحتواها</p>
        </div>

        <div className="bg-white border-2 border-gray-100 p-10 rounded-[40px] shadow-sm flex flex-col gap-10">
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-primary">
              <CopyrightIcon className="w-8 h-8" />
              <h2 className="text-3xl font-black">جميع الحقوق محفوظة</h2>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
               <p className="text-lg font-bold text-gray-700 leading-loose">
                 {config?.copyrightText || 'جميع المحتويات الموجودة على هذا الموقع، بما في ذلك النصوص، الصور، الشعارات، البرمجيات، والتصاميم، هي ملك خاص لمؤسسة Mauri Tick ومحمية بموجب قوانين الملكية الفكرية المعمول بها في موريتانيا ودولياً.'}
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-red-500">
                  <ShieldAlert className="w-6 h-6" />
                  <h3 className="text-xl font-black">الاستخدام غير المصرح به</h3>
                </div>
                <p className="font-bold text-gray-500 text-sm leading-relaxed">
                  يمنع منعاً باتاً نسخ، إعادة إنتاج، تعديل، أو توزيع أي جزء من محتوى الموقع لأي غرض تجاري دون الحصول على موافقة خطية مسبقة من إدارة Mauri Tick.
                </p>
             </div>
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-blue-500">
                  <Lock className="w-6 h-6" />
                  <h3 className="text-xl font-black">العلامات التجارية</h3>
                </div>
                <p className="font-bold text-gray-500 text-sm leading-relaxed">
                  "Mauri Tick" هي علامة تجارية مسجلة. يحظر استخدام اسم العلامة أو شعارها بطريقة قد تسبب الالتباس للعملاء أو تسيء للعلامة التجارية.
                </p>
             </div>
          </div>

          <div className="bg-orange-50 p-8 rounded-[40px] flex flex-col gap-4 border border-orange-100">
             <h3 className="text-lg font-black text-orange-900 uppercase tracking-widest">إخلاء المسؤولية</h3>
             <p className="font-bold text-orange-800 text-sm leading-relaxed">
               بينما نسعى جاهدين لضمان دقة المحتوى، إلا أن Mauri Tick لا تتحمل المسؤولية عن أي أخطاء مطبعية أو فنية قد ترد في وصف المنتجات أو أسعارها.
             </p>
          </div>
        </div>

        <div className="text-center">
           <p className="text-gray-400 font-bold mb-4">© 2025 Mauri Tick. جميع الحقوق محفوظة.</p>
           <a href={`https://wa.me/222${config?.whatsappNumber}`} className="text-primary font-black underline decoration-2 underline-offset-8">للاستفسارات القانونية تواصل معنا</a>
        </div>
      </motion.div>
    </div>
  );
}
