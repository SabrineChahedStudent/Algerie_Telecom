import React, { useState, useEffect, useRef } from 'react';
import { chatWithSupport } from '@/api/tickets';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Bot, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SupportChatbot({ isOpen, ticketData, onCancel, onForceSubmit }) {
  const [history, setHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const initialized = useRef(false);
  
  useEffect(() => {
    if (isOpen && !initialized.current) {
      initialized.current = true;
      startConversation();
    } else if (!isOpen) {
      initialized.current = false;
      setHistory([]);
    }
  }, [isOpen]);

  const startConversation = async () => {
    setLoading(true);
    setHistory([{ role: 'bot', text: 'Bonjour, je suis l\'assistant d\'Algérie Télécom. Laissez-moi analyser votre problème pour voir si je peux vous aider immédiatement...' }]);
    
    try {
      const resp = await chatWithSupport({
        service_name: ticketData.typeServiceName || 'Inconnu',
        description: ticketData.description || '',
        history: ''
      });
      setHistory(prev => [...prev, { role: 'bot', text: resp.reply, is_resolved: resp.is_resolved, can_submit: resp.can_submit, auto_submit: resp.auto_submit }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'bot', text: 'Je rencontre un souci technique pour analyser. Dois-je soumettre votre réclamation directement aux agents ?', can_submit: true }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;
    const query = inputText;
    setInputText('');
    
    const newHistory = [...history, { role: 'user', text: query }];
    setHistory(newHistory);
    setLoading(true);
    
    try {
      const stringHistory = newHistory.map(m => `${m.role === 'bot' ? 'Bot' : 'User'}: ${m.text}`).join('\n');
      const resp = await chatWithSupport({
        service_name: ticketData.typeServiceName || 'Inconnu',
        description: ticketData.description || '',
        history: stringHistory
      });
      
      setHistory(prev => [...prev, { 
        role: 'bot', 
        text: resp.reply || "Pouvez-vous préciser ?", 
        is_resolved: resp.is_resolved, 
        can_submit: resp.can_submit,
        auto_submit: resp.auto_submit
      }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'bot', text: "Erreur réseau. Continuer la soumission ?", can_submit: true }]);
    } finally {
      setLoading(false);
    }
  };

  const lastBotMsg = history.filter(m => m.role === 'bot').pop();
  const canSubmitNow = lastBotMsg?.can_submit;
  const isResolvedNow = lastBotMsg?.is_resolved;
  const autoSubmitNow = lastBotMsg?.auto_submit;

  useEffect(() => {
    if (autoSubmitNow) {
      onForceSubmit(history);
    }
  }, [autoSubmitNow]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300 border-l border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0055A4] p-5 text-white flex justify-between items-center shadow-lg z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight tracking-tight">Assistant Technique</h2>
              <p className="text-[11px] opacity-90 font-bold uppercase tracking-wider mt-0.5">Algérie Télécom IA</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-5 bg-slate-50/50">
          <div className="space-y-5 pb-6">
            {history.map((m, i) => (
              <div key={i} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "px-5 py-3.5 max-w-[85%] text-[15px] rounded-2xl shadow-sm",
                  m.role === 'user' 
                    ? "bg-[#0055A4] text-white rounded-tr-none" 
                    : "bg-white text-slate-800 border border-slate-200/60 rounded-tl-none font-medium"
                )}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex w-full justify-start">
                <div className="bg-white border border-slate-200/60 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            )}

            {/* Actions UI */}
            {canSubmitNow && !autoSubmitNow && !loading && (
               <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl mt-6 text-center shadow-sm">
                 <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                 <p className="text-[15px] text-amber-900 font-bold mb-4">L'assistant n'a pas pu résoudre le problème.</p>
                 <Button onClick={() => onForceSubmit(history)} className="w-full bg-[#0055A4] hover:bg-[#004080] font-bold py-6 text-base">
                    Transmettre le Ticket
                 </Button>
               </div>
            )}

            {isResolvedNow && !loading && (
               <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl mt-6 text-center shadow-sm">
                 <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                 <p className="text-[15px] text-emerald-900 font-bold mb-4">Génial ! Le problème semble résolu.</p>
                 <Button onClick={onCancel} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-6 text-base">
                    Fermer
                 </Button>
               </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Répondre à l'assistant..."
              className="flex-1 bg-slate-100/80 rounded-xl px-5 py-3 border-transparent focus:bg-white focus:border-[#0055A4] focus:ring-2 focus:ring-[#0055A4]/20 transition-all text-[15px] outline-none font-medium placeholder:text-slate-400"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <Button 
              onClick={handleSend}
              disabled={!inputText.trim() || loading}
              className="bg-[#0055A4] hover:bg-[#004080] shrink-0 h-auto px-4 rounded-xl shadow-md"
            >
              <Send className="w-5 h-5 translate-x-0.5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
