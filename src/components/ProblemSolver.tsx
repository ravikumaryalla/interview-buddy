import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { solveProblemWithAI, answerWithCustomPrompt } from '../lib/ai';
import type { AISolution } from '../lib/ai';
import { CodeBlock } from './CodeBlock';
import { Loader2, Wand2, Clock, Box, FileText, ChevronRight, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ProblemSolver: React.FC = () => {
  const {
    currentProblem, currentSolution, setCurrentSolution,
    promptMode, customPrompt, customResponse, setCustomResponse,
    apiKey, selectedModel, reasoningEffort,
    isSolving, setIsSolving,
    selectedLanguage, setSelectedLanguage,
    saveToHistory,
  } = useAppStore();

  const [editableProblem, setEditableProblem] = useState(currentProblem);

  React.useEffect(() => {
    setEditableProblem(currentProblem);
  }, [currentProblem]);

  const handleSolve = async () => {
    if (!apiKey) {
      alert("Please enter an OpenAI API key in the settings panel first.");
      return;
    }

    setIsSolving(true);
    try {
      if (promptMode === 'coding') {
        const solution: AISolution = await solveProblemWithAI(apiKey, editableProblem, selectedModel, reasoningEffort);
        setCurrentSolution(solution);
        saveToHistory({ problem: editableProblem, solution });
      } else {
        const effectivePrompt = customPrompt.trim() || 'Analyze the following content and provide a helpful, detailed response.';
        const response = await answerWithCustomPrompt(apiKey, editableProblem, effectivePrompt, selectedModel, reasoningEffort);
        setCustomResponse(response);
      }
    } catch (e: any) {
      alert("AI request failed: " + e.message);
    } finally {
      setIsSolving(false);
    }
  };

  const showInput = !!currentProblem;
  const buttonLabel = promptMode === 'coding' ? 'Generate Solution' : 'Ask AI';
  const buttonIcon = promptMode === 'coding' ? <Wand2 className="mr-2" size={18} /> : <MessageSquare className="mr-2" size={18} />;

  return (
    <div className="flex flex-col p-4 space-y-4 h-full overflow-y-auto overflow-x-hidden no-scrollbar">

      {/* Problem Input Box */}
      {showInput && (
        <div className="flex flex-col space-y-2 anim-slide-up">
          <label className="text-sm font-semibold flex items-center text-foreground/80">
            <FileText size={16} className="mr-1 text-accent" />
            Extracted Text
          </label>
          <textarea
            className="w-full h-32 p-3 bg-panel/50 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none resize-y text-sm font-mono whitespace-pre-wrap transition-colors"
            value={editableProblem}
            onChange={(e) => setEditableProblem(e.target.value)}
          />
          <button
            onClick={handleSolve}
            disabled={isSolving || !editableProblem.trim()}
            className="flex items-center justify-center w-full py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-all shadow-md shadow-accent/20"
          >
            {isSolving ? <Loader2 className="animate-spin mr-2" size={18} /> : buttonIcon}
            {isSolving ? 'Thinking...' : buttonLabel}
          </button>
        </div>
      )}

      {/* Custom prompt response */}
      {promptMode === 'custom' && customResponse && !isSolving && (
        <div className="flex flex-col space-y-2 anim-fade-in border-t border-border pt-4">
          <h3 className="font-semibold flex items-center text-foreground/80">
            <ChevronRight className="text-accent" size={18} /> AI Response
          </h3>
          <div className="bg-panel border border-border rounded-xl p-4 text-sm text-foreground/80 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{customResponse}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Coding solution */}
      {promptMode === 'coding' && currentSolution && !isSolving && (
        <div className="flex flex-col space-y-4 anim-fade-in mt-4 border-t border-border pt-4">

          <div className="bg-panel border border-border rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <ChevronRight className="text-accent" /> Summary
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{currentSolution.summary}</p>
          </div>

          <div className="flex space-x-2">
            <div className="flex-1 flex items-center p-3 bg-panel border gap-2 border-border rounded-xl">
              <div className="p-2 bg-blue-500/10 rounded-full text-blue-500"><Clock size={16} /></div>
              <div>
                <div className="text-xs text-foreground/50 uppercase font-semibold">Time</div>
                <div className="font-mono text-sm">{currentSolution.complexity.time}</div>
              </div>
            </div>
            <div className="flex-1 flex items-center p-3 gap-2 bg-panel border border-border rounded-xl">
              <div className="p-2 bg-purple-500/10 rounded-full text-purple-500"><Box size={16} /></div>
              <div>
                <div className="text-xs text-foreground/50 uppercase font-semibold">Space</div>
                <div className="font-mono text-sm">{currentSolution.complexity.space}</div>
              </div>
            </div>
          </div>

          <div className="bg-panel border border-border rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <ChevronRight className="text-accent" /> Optimal Approach
            </h3>
            <div className="text-sm text-foreground/80 leading-relaxed prose prose-sm dark:prose-invert">
              <ReactMarkdown>{currentSolution.approach}</ReactMarkdown>
            </div>
          </div>

          <div className="flex flex-col w-full bg-panel border-x border-t border-border rounded-t-xl overflow-hidden shadow-sm mt-2">
            <div className="flex bg-black/10 dark:bg-white/5 border-b border-border">
              {(['javascript', 'python', 'java'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${selectedLanguage === lang ? 'border-accent text-accent bg-panel' : 'border-transparent text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>

            {(currentSolution.code as any)[selectedLanguage] ? (
              <CodeBlock
                language={selectedLanguage}
                code={(currentSolution.code as any)[selectedLanguage]}
              />
            ) : (
              <div className="p-6 text-center text-foreground/50 italic text-sm border-x border-b border-border rounded-b-xl">
                Code not provided for {selectedLanguage}
              </div>
            )}
          </div>
        </div>
      )}

      {!currentProblem && !currentSolution && !customResponse && (
        <div className="flex flex-col items-center justify-center p-8 text-center opacity-50 space-y-4">
          <Wand2 size={48} className="text-accent" />
          <p>Capture a problem to see the AI solution here.</p>
        </div>
      )}
    </div>
  );
};
