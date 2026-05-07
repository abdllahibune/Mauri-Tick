import { useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIRecommendations } from '../lib/ai';
import { Product } from '../types';

export function AIAssistant({ products }: { products: Product[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([
    { text: "أهلاً بك! أنا مساعدك الذكي في موري تيك. كيف أساعدك اليوم؟", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput('');
    setIsTyping(true);

    const response = await getAIRecommendations(userMsg, products);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { text: response, isBot: true }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden border border-gray-100 flex flex-col mb-4"
          >
            <div className="bg-primary p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <span className="font-bold">مساعد التسوق الذكي 🤖</span>
              </div>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-96 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isBot ? 'bg-white self-start shadow-sm' : 'bg-primary text-white self-end'}`}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="bg-white self-start shadow-sm p-3 rounded-2xl text-xs text-gray-500 animate-pulse">
                  يسجل رداً...
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2 bg-white">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اسألني أي شيء..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 ring-primary"
              />
              <button 
                onClick={handleSend}
                className="bg-primary text-white p-2 rounded-full hover:scale-110 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-110 transition-transform"
      >
        <span className="hidden sm:inline font-bold">مساعد التسوق 🤖</span>
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
