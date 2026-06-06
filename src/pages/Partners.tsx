import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function Partners() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    business: '',
    city: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, phone, business, email, city, message } = form;

    if (!name.trim() || !phone.trim() || !business.trim()) {
      toast.error('❌ يرجى ملء الحقول المطلوبة (الاسم، الهاتف، نوع النشاط)');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'mt_partner_requests'), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        business: business.trim(),
        city: city.trim(),
        message: message.trim(),
        status: 'pending',
        createdAt: new Date()
      });

      // Send WhatsApp notification to admin
      const msg = encodeURIComponent(
        `🤝 طلب شراكة جديد!\n\n` +
        `👤 الاسم: ${name.trim()}\n` +
        `📞 الهاتف: ${phone.trim()}\n` +
        `🏪 النشاط: ${business.trim()}\n\n` +
        `راجع لوحة التحكم للتفاصيل`
      );
      
      toast.success('تم إرسال طلبك بنجاح ✅ سنتواصل معك قريباً');
      
      // WhatsApp trigger in new window safely
      window.open(`https://wa.me/22236096100?text=${msg}`, '_blank');
      
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast.error('❌ خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      direction: 'rtl',
      fontFamily: 'Cairo, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#F8F9FC',
      paddingBottom: '60px'
    }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628, #1A2F5E)',
        padding: '80px 20px',
        textAlign: 'center',
        color: 'white',
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 900,
          margin: '0 0 12px',
        }}>
          شراكة تجارية مع Panda
        </h1>
        <p style={{
          fontSize: '16px',
          opacity: 0.85,
          maxWidth: '500px',
          margin: '0 auto 24px',
          lineHeight: '1.7',
        }}>
          انضم لأكبر منصة إلكترونيات في موريتانيا واعرض منتجاتك لآلاف الزبائن
        </p>
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {['✅ مجاني للتسجيل', '📦 أضف منتجاتك', '💰 استلم أرباحك'].map((item, index) => (
            <span key={index} style={{
              background: 'rgba(201,168,76,0.2)',
              border: '1px solid rgba(201,168,76,0.4)',
              color: '#C9A84C',
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>{item}</span>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '48px 20px',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '24px',
          color: '#0A1628',
          marginBottom: '32px',
          fontWeight: 800
        }}>
          لماذا تنضم إلينا؟
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '48px',
        }}>
          {[
            {icon:'👥', title:'قاعدة عملاء واسعة', desc:'آلاف الزبائن الموريتانيين يتسوقون يومياً'},
            {icon:'📊', title:'لوحة تحكم كاملة', desc:'تابع مبيعاتك وطلباتك في الوقت الفعلي'},
            {icon:'💰', title:'عمولة منخفضة', desc:'أقل نسبة عمولة في السوق — فقط 10%'},
            {icon:'🚀', title:'تسويق مجاني', desc:'نسوق لمنتجاتك على وسائل التواصل'},
            {icon:'📱', title:'تطبيق موبايل', desc:'إدارة متجرك من هاتفك في أي وقت'},
            {icon:'🔒', title:'دفع آمن ومضمون', desc:'نضمن وصول أموالك بشكل منتظم'},
          ].map((b, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #F0F0F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              textAlign: 'center',
              transition: 'transform 0.3s'
            }} className="hover:scale-105">
              <div style={{
                fontSize: '36px',
                marginBottom: '12px',
              }}>{b.icon}</div>
              <h3 style={{
                color: '#0A1628',
                fontSize: '16px',
                margin: '0 0 8px',
                fontWeight: 700
              }}>{b.title}</h3>
              <p style={{
                color: '#6B7280',
                fontSize: '13px',
                margin: 0,
                lineHeight: '1.6',
              }}>{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Registration Form */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 4px 24px rgba(10,22,40,0.08)',
          border: '1px solid #F0F0F0',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <h2 style={{
            textAlign: 'center',
            color: '#0A1628',
            fontSize: '22px',
            margin: '0 0 8px',
            fontWeight: 800
          }}>
            سجّل كشريك تجاري
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '14px',
            margin: '0 0 28px',
          }}>
            سيتواصل معك فريقنا خلال 24 ساعة
          </p>
          
          <form onSubmit={handleSubmit}>
            {[
              {id:'partnerName', label:'اسم التاجر / الشركة *', placeholder:'أدخل اسمك أو اسم شركتك', type:'text', valueKey: 'name'},
              {id:'partnerPhone', label:'رقم الهاتف *', placeholder:'رقم التواصل ومكتمل برمز البلد', type:'tel', valueKey: 'phone'},
              {id:'partnerEmail', label:'البريد الإلكتروني', placeholder:'بريدك الإلكتروني (اختياري)', type:'email', valueKey: 'email'},
              {id:'partnerBusiness', label:'نوع النشاط التجاري *', placeholder:'مثال: بيع هواتف، إكسسوارات...', type:'text', valueKey: 'business'},
              {id:'partnerCity', label:'المدينة', placeholder:'مثال: نواكشوط، نواذيبو...', type:'text', valueKey: 'city'},
            ].map(field => (
              <div style={{ marginBottom: '16px' }} key={field.id}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}>{field.label}</label>
                <input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(form as any)[field.valueKey]}
                  onChange={(e) => setForm(prev => ({ ...prev, [field.valueKey]: e.target.value }))}
                  required={field.label.includes('*')}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: '10px',
                    fontFamily: 'Cairo, sans-serif',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  className="focus:border-[#C9A84C]"
                />
              </div>
            ))}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#374151',
                marginBottom: '6px',
                fontWeight: 600,
              }}>رسالة إضافية (اختياري)</label>
              <textarea
                id="partnerMessage"
                rows={3}
                placeholder="أي معلومات إضافية تريد مشاركتها..."
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '10px',
                  fontFamily: 'Cairo, sans-serif',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                className="focus:border-[#C9A84C]"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                color: '#0A1628',
                border: 'none',
                borderRadius: '12px',
                fontFamily: 'Cairo, sans-serif',
                fontSize: '16px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
                transition: 'all 0.3s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none' }}
            >
              {loading ? '⏳ جاري الإرسال...' : '🤝 أرسل طلب الشراكة'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
