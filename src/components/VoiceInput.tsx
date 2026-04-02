import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, MessageSquareText, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { chatWithAI } from '../lib/ai';

export const VoiceInput: React.FC = () => {
  const { apiKey, selectedModel, reasoningEffort, currentSolution, currentProblem } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      setSpeechSupported(true);

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Voice input is not available in this environment. You can still type your question below.' }]);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (!transcript.trim()) return;

    const userMsg = transcript;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setTranscript('');
    if (isListening) toggleListen();

    await askAI(userMsg);
  };

  const askAI = async (query: string) => {
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Please configure your OpenAI API key in settings." }]);
      return;
    }

    setIsTyping(true);
    try {
      const systemPrompt = currentSolution
        ? `You are an interview assistant. The user is currently solving this problem: "${currentProblem}"\nYour proposed solution summary was: "${currentSolution.summary}"\nThe code approach was: "${currentSolution.approach}"\n\nAnswer the user's follow-up questions clearly and concisely as if you are pair programming.`
        : `You are an interview assistant. Answer the user's questions clearly and concisely.`;

      const reply = await chatWithAI(apiKey, query, messages, systemPrompt, selectedModel, reasoningEffort);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (query: string) => {
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    askAI(query);
  };

  const handleClearChat = () => {
    if (isListening) toggleListen();
    setMessages([]);
    setTranscript('');
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4 relative">
      {messages.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground/50 hover:text-red-500 hover:bg-red-500/10 border border-border hover:border-red-500/30 rounded-lg transition-colors"
          >
            <Trash2 size={12} /> Clear chat
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-24">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40 space-y-2">
            <MessageSquareText size={32} />
            <p className="text-sm">Ask follow-up questions using your voice.</p>
            {!speechSupported && (
              <p className="text-xs max-w-xs text-center">Voice recognition is unavailable here, but text chat still works.</p>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <button onClick={() => handleQuickAction("Explain this solution")} className="px-3 py-1 bg-border/40 rounded-full text-xs hover:bg-border/60">Explain this</button>
              <button onClick={() => handleQuickAction("Can we optimize the space complexity?")} className="px-3 py-1 bg-border/40 rounded-full text-xs hover:bg-border/60">Optimize space</button>
              <button onClick={() => handleQuickAction("What are the edge cases?")} className="px-3 py-1 bg-border/40 rounded-full text-xs hover:bg-border/60">Edge cases?</button>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-accent text-white rounded-tr-sm' : 'bg-panel border border-border rounded-tl-sm text-foreground/80'}`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3 rounded-2xl text-sm bg-panel border gap-1 border-border rounded-tl-sm flex items-center">
              <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{animationDelay: '0.2s'}}></span>
              <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2 bg-panel border border-border rounded-full p-1 shadow-lg backdrop-blur-md">
        <button
          onClick={toggleListen}
          className={`p-3 rounded-full transition-colors flex-shrink-0 ${isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-foreground/5 hover:bg-foreground/10 text-foreground'}`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type or speak..."}
          className="flex-1 bg-transparent border-none outline-none text-sm px-2 truncate"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!transcript.trim()}
          className="p-3 rounded-full bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:bg-foreground/10 disabled:text-foreground/40 transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
