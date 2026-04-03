import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { solveProblemWithAI, answerWithCustomPrompt } from '../lib/ai';
import type { AISolution } from '../lib/ai';
import { CodeBlock } from './CodeBlock';
import { Loader2, Wand2, Clock, MemoryStick, FileText, ChevronDown, ChevronUp, MessageSquare, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ProblemSolver: React.FC = () => {
  const {
    currentProblem, currentSolution, setCurrentSolution,
    promptMode, customPrompt, customResponse, setCustomResponse,
    selectedModel, reasoningEffort,
    isSolving, setIsSolving,
    selectedLanguage, setSelectedLanguage,
    saveToHistory, setCredits,
  } = useAppStore();

  const [editableProblem, setEditableProblem] = useState(currentProblem);
  const [problemExpanded, setProblemExpanded] = useState(true);

  React.useEffect(() => {
    setEditableProblem(currentProblem);
    setProblemExpanded(true);
  }, [currentProblem]);

  const handleSolve = async () => {
    setIsSolving(true);
    try {
      if (promptMode === 'coding') {
        const solution: AISolution = await solveProblemWithAI(editableProblem, selectedModel, reasoningEffort);
        setCurrentSolution(solution);
        saveToHistory({ problem: editableProblem, solution });
        setProblemExpanded(false);
      } else {
        const prompt = customPrompt.trim() || 'Analyze the following content and provide a detailed, helpful response.';
        setCustomResponse('');
        setProblemExpanded(false);
        await answerWithCustomPrompt(editableProblem, prompt, selectedModel, (delta) =>
          setCustomResponse(prev => prev + delta)
        );
      }
      // Refresh credit balance after use
      const { api } = await import('../lib/api');
      const me = await api.user.me();
      setCredits(me.credits);
    } catch (e: any) {
      if (e?.status === 402) {
        alert('Not enough credits. Contact admin for more.');
      } else {
        alert('AI request failed: ' + e.message);
      }
    } finally {
      setIsSolving(false);
    }
  };

  if (!currentProblem && !currentSolution && !customResponse) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-foreground/20 p-8 select-none">
        <Sparkles size={36} />
        <p className="text-sm text-center">Capture a screen area to get started</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto no-scrollbar">
      <div className="p-3 space-y-3">

        {/* Extracted text — collapsible */}
        {currentProblem && (
          <div className="anim-slide-up border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setProblemExpanded(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-panel/60 hover:bg-panel transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-foreground/60">
                <FileText size={12} className="text-accent" /> Extracted Text
              </span>
              {problemExpanded ? <ChevronUp size={13} className="text-foreground/40" /> : <ChevronDown size={13} className="text-foreground/40" />}
            </button>

            {problemExpanded && (
              <div className="p-2.5">
                <textarea
                  value={editableProblem}
                  onChange={(e) => setEditableProblem(e.target.value)}
                  className="w-full h-24 px-2.5 py-2 bg-background border border-border rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-accent/50 resize-none whitespace-pre-wrap transition-colors"
                />
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        {currentProblem && (
          <button
            onClick={handleSolve}
            disabled={isSolving || !editableProblem.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-accent/20 active:scale-[0.99]"
          >
            {isSolving ? (
              <><Loader2 size={15} className="animate-spin" /> Thinking…</>
            ) : promptMode === 'coding' ? (
              <><Wand2 size={15} /> Generate Solution</>
            ) : (
              <><MessageSquare size={15} /> Ask AI</>
            )}
          </button>
        )}

        {/* Custom prompt response */}
        {promptMode === 'custom' && customResponse && !isSolving && (
          <div className="anim-fade-in space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/50">
              <MessageSquare size={11} className="text-accent" /> AI Response
            </div>
            <div className="bg-panel border border-border rounded-xl p-3.5 text-sm text-foreground/80 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{customResponse}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Coding solution */}
        {promptMode === 'coding' && currentSolution && !isSolving && (
          <div className="anim-fade-in space-y-3">

            {/* Summary */}
            <div className="bg-panel border border-border rounded-xl p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40 mb-1.5">Summary</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{currentSolution.summary}</p>
            </div>

            {/* Complexity */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 bg-panel border border-border rounded-xl p-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Clock size={13} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-wide">Time</p>
                  <p className="text-sm font-mono font-medium">{currentSolution.complexity.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-panel border border-border rounded-xl p-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <MemoryStick size={13} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-wide">Space</p>
                  <p className="text-sm font-mono font-medium">{currentSolution.complexity.space}</p>
                </div>
              </div>
            </div>

            {/* Approach */}
            <div className="bg-panel border border-border rounded-xl p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40 mb-1.5">Approach</p>
              <div className="text-sm text-foreground/80 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{currentSolution.approach}</ReactMarkdown>
              </div>
            </div>

            {/* Code */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex bg-panel border-b border-border">
                {(['javascript', 'python', 'java'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors
                      ${selectedLanguage === lang
                        ? 'text-accent bg-accent/5 border-b border-accent'
                        : 'text-foreground/40 hover:text-foreground/70'}`}
                  >
                    {lang === 'javascript' ? 'JS' : lang === 'python' ? 'Python' : 'Java'}
                  </button>
                ))}
              </div>
              {(currentSolution.code as any)[selectedLanguage]
                ? <CodeBlock language={selectedLanguage} code={(currentSolution.code as any)[selectedLanguage]} />
                : <p className="p-4 text-center text-xs text-foreground/40 italic">No code for {selectedLanguage}</p>
              }
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
