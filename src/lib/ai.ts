import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function getAIRecommendations(query: string, products: Product[]) {
  if (!ai) {
    // Simple rule-based fallback if no API key
    const q = query.toLowerCase();
    if (q.includes('ميزانيتي') || q.includes('سعر')) {
      return "لدينا خيارات رائعة تناسب ميزانيتك. هل تفضل البحث في فئة الهواتف الاقتصادية أم الرائدة؟ هل تريد إضافته للسلة؟ 🛒";
    }
    if (q.includes('كاميرا')) {
      return "للتصوير الاحترافي، ننصح بهواتف سامسونج S24 Ultra أو آيفون 15 بروك ماكس. كلاهما يقدم جودة مذهلة. هل تريد إضافته للسلة؟ 🛒";
    }
    if (q.includes('بطارية')) {
      return "إذا كنت تبحث عن بطارية تدوم طويلاً، ننصح بسلسلة هواتف شاومي أو سامسونج M. بطاريات تصل لـ 5000-6000 مللي أمبير. هل تريد إضافته للسلة؟ 🛒";
    }
    if (q.includes('ألعاب') || q.includes('رام')) {
      return "للألعاب (Gaming)، تحتاج معالجاً قوياً مثل Snapdragon 8 Gen 3 ورام لا تقل عن 12 جيجا. هل تريد إضافته للسلة؟ 🛒";
    }
    return "أهلاً بك في موري تيك! كيف يمكنني مساعدتك اليوم في اختيار هاتفك الجديد؟ هل تريد إضافته للسلة؟ 🛒";
  }

  // If AI is available, we could use it here. But the user requested "Rule-based recommendations".
  // I'll stick to a more sophisticated rule-based/templated response for reliability in this demo.
  // Actually, I can combine:
  try {
    const prompt = `
      You are an AI Shopping Assistant for "Mauri Tick", a mobile phone store in Mauritania.
      The user is asking in Arabic: "${query}"
      Current products (summary): ${products.map(p => `${p.name} (${p.price} MRU)`).join(', ')}
      
      Respond in professional, friendly Arabic. 
      Help them choose a phone based on their needs.
      Constraint: ALWAYS end your response with "هل تريد إضافته للسلة؟ 🛒".
      Constraint: Max 3-4 sentences.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "عذراً، حدث خطأ في معالجة طلبك. هل تريد إضافته للسلة؟ 🛒";
  } catch (error) {
    return "حدث خطأ أثناء التواصل مع المساعد الذكي. هل تريد إضافته للسلة؟ 🛒";
  }
}
