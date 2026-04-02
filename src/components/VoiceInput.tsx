import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Trash2, Bot } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { chatWithAI } from '../lib/ai';

export const VoiceInput: React.FC = () => {
  const { apiKey, selectedModel, reasoningEffort, currentSolution, currentProblem } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      setSpeechSupported(true);
      recognitionRef.current.onresult = (e: any) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        setTranscript(t);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      setMessages(p => [...p, { role: 'assistant', content: 'Voice input unavailable. You can still type.' }]);
      return;
    }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { setTranscript(''); recognitionRef.current.start(); setIsListening(true); }
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setMessages(p => [...p, { role: 'user', content: userMsg }]);
    setTranscript('');
    if (isListening) toggleListen();

    if (!apiKey) {
      setMessages(p => [...p, { role: 'assistant', content: 'Please configure your OpenAI API key in Settings.' }]);
      return;
    }

    setIsTyping(true);
    try {
      const system = currentSolution
        ? `You are an expert interview assistant. The user is solving: "${currentProblem}". Solution summary: "${currentSolution.summary}". Approach: "${currentSolution.approach}". Answer follow-up questions clearly and concisely.`
        : 'You are a helpful interview assistant. Answer questions clearly and concisely.';

      const reply = await chatWithAI(apiKey, userMsg, messages, system, selectedModel, reasoningEffort);
      setMessages(p => [...p, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Error connecting to AI.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    if (isListening) toggleListen();
    setMessages([]);
    setTranscript('');
  };

  const QUICK = ['Explain this solution', 'Optimize space complexity', 'Edge cases?', 'Time complexity?'];

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-medium text-foreground/50 flex items-center gap-1.5">
          <Bot size={12} className="text-accent" /> AI Chat
          {!speechSupported && <span className="text-[10px] text-foreground/30">· type only</span>}
        </span>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1 text-[10px] text-foreground/30 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-500/8"
          >
            <Trash2 size={10} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Bot size={20} className="text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/60">Ask me anything</p>
              <p className="text-xs text-foreground/30 mt-0.5">About the captured problem or general coding</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {QUICK.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-2.5 py-1 bg-panel border border-border rounded-full text-[11px] text-foreground/60 hover:text-accent hover:border-accent/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'bg-panel border border-border text-foreground/80 rounded-bl-sm'}`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 px-3 py-2.5 bg-panel border border-border rounded-2xl rounded-bl-sm">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce"
                      style={{ animationDelay: `${d}s`, animationDuration: '0.9s' }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-panel border border-border rounded-xl px-1 py-1">
          <button
            onClick={toggleListen}
            className={`p-2 rounded-lg transition-colors shrink-0
              ${isListening
                ? 'bg-red-500/15 text-red-400'
                : 'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5'}`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(transcript)}
            placeholder={isListening ? 'Listening…' : 'Type a question…'}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-foreground/25 min-w-0"
          />
          <button
            onClick={() => send(transcript)}
            disabled={!transcript.trim()}
            className="p-2 rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
