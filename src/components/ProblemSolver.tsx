import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { solveProblemWithAI, answerWithCustomPrompt } from '../lib/ai';
import type { AISolution } from '../lib/ai';
import { CodeBlock } from './CodeBlock';
import {
  Loader2,
  Wand2,
  Clock,
  MemoryStick,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ProblemSolver: React.FC = () => {
  const {
    currentProblem,
    currentSolution,
    setCurrentSolution,
    promptMode,
    customPrompt,
    customResponse,
    setCustomResponse,
    selectedModel,
    reasoningEffort,
    isSolving,
    setIsSolving,
    selectedLanguage,
    setSelectedLanguage,
    saveToHistory,
    setCredits,
  } = useAppStore();

  const [editableProblem, setEditableProblem] = useState(currentProblem);
  const [problemExpanded, setProblemExpanded] = useState(true);
  const customResponseRef = useRef('');

  React.useEffect(() => {
    setEditableProblem(currentProblem);
    setProblemExpanded(true);
  }, [currentProblem]);

  const handleSolve = async () => {
    setIsSolving(true);
    try {
      if (promptMode === 'coding') {
        const solution: AISolution = await solveProblemWithAI(
          editableProblem,
          selectedModel,
          reasoningEffort,
        );
        setCurrentSolution(solution);
        saveToHistory({ problem: editableProblem, solution });
        setProblemExpanded(false);
      } else {
        const prompt =
          customPrompt.trim() ||
          'Analyze the following content and provide a detailed, helpful response.';
        customResponseRef.current = '';
        setCustomResponse('');
        setProblemExpanded(false);
        await answerWithCustomPrompt(
          editableProblem,
          prompt,
          selectedModel,
          (delta) => {
            customResponseRef.current += delta;
            setCustomResponse(customResponseRef.current);
          },
        );
      }
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
      <div className='h-full flex flex-col items-center justify-center gap-3 p-8 select-none'>
        <div className='w-12 h-12 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center'>
          <Sparkles size={22} className='text-accent/40' />
        </div>
        <div className='text-center'>
          <p className='text-sm font-medium text-foreground/40'>
            Ready to solve
          </p>
          <p className='text-xs text-foreground/25 mt-1'>
            Capture a screen area to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col overflow-y-auto no-scrollbar'>
      <div className='p-3 space-y-3'>
        {/* Extracted text */}
        {currentProblem && (
          <div
            className='anim-slide-up border border-border rounded-xl overflow-hidden'
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <button
              onClick={() => setProblemExpanded((v) => !v)}
              className='w-full flex items-center justify-between px-3 py-2 bg-panel/60 hover:bg-panel transition-colors'
            >
              <span className='flex items-center gap-2 text-xs font-medium text-foreground/60'>
                <FileText size={12} className='text-accent' /> Extracted Text
              </span>
              {problemExpanded ? (
                <ChevronUp size={12} className='text-foreground/35' />
              ) : (
                <ChevronDown size={12} className='text-foreground/35' />
              )}
            </button>
            {problemExpanded && (
              <div className='p-2.5'>
                <textarea
                  value={editableProblem}
                  onChange={(e) => setEditableProblem(e.target.value)}
                  className='w-full h-24 px-2.5 py-2 bg-background border border-[hsl(var(--input-border))] rounded-lg text-xs font-mono outline-none focus:border-accent/40 resize-none whitespace-pre-wrap transition-colors'
                />
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        {currentProblem && (
          <Button
            onClick={handleSolve}
            disabled={isSolving || !editableProblem.trim()}
            className='w-full h-9'
          >
            {isSolving ? (
              <>
                <Loader2 size={14} className='animate-spin' /> Thinking…
              </>
            ) : promptMode === 'coding' ? (
              <>
                <Wand2 size={14} /> Generate Solution
              </>
            ) : (
              <>
                <MessageSquare size={14} /> Ask AI
              </>
            )}
          </Button>
        )}

        {/* Custom prompt response */}
        {promptMode === 'custom' && customResponse && (
          <div className='anim-fade-in space-y-2'>
            <div className='flex items-center gap-1.5 text-xs font-medium text-foreground/50'>
              <MessageSquare size={11} className='text-accent' /> AI Response
              {isSolving && (
                <span className='ml-auto flex items-center gap-1 text-accent/60'>
                  <span className='inline-block w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse' />
                  <span className='text-[10px]'>streaming</span>
                </span>
              )}
            </div>
            <div
              className='bg-panel border border-border rounded-xl p-3.5 text-sm text-foreground/80 leading-relaxed prose prose-sm dark:prose-invert max-w-none
                [&>p]:mb-3 [&>p:last-child]:mb-0
                [&>ul]:mb-3 [&>ul]:pl-4 [&>ul>li]:mb-1
                [&>ol]:mb-3 [&>ol]:pl-4 [&>ol>li]:mb-1
                [&>h1]:text-base [&>h1]:font-semibold [&>h1]:mb-2 [&>h1]:mt-3
                [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mb-2 [&>h2]:mt-3
                [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mb-1.5 [&>h3]:mt-2.5
                [&>blockquote]:border-l-2 [&>blockquote]:border-accent/30 [&>blockquote]:pl-3 [&>blockquote]:text-foreground/60
                [&>pre]:mb-3 [&>code]:text-[11px]'
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <ReactMarkdown>{customResponse}</ReactMarkdown>
              {isSolving && (
                <span className='inline-block w-0.5 h-3.5 bg-accent/70 ml-0.5 animate-[blink_1s_step-end_infinite] align-text-bottom' />
              )}
            </div>
          </div>
        )}

        {/* Coding solution */}
        {promptMode === 'coding' && currentSolution && !isSolving && (
          <div className='anim-fade-in space-y-3'>
            {/* Summary */}
            <div
              className='bg-panel border border-border rounded-xl p-3.5'
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <p className='text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-1.5'>
                Summary
              </p>
              <p className='text-sm text-foreground/80 leading-relaxed'>
                {currentSolution.summary}
              </p>
            </div>

            {/* Complexity */}
            <div className='grid grid-cols-2 gap-2'>
              <div
                className='flex items-center gap-2.5 bg-panel border border-border rounded-xl p-3 card-hover'
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className='w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0'>
                  <Clock size={13} className='text-blue-400' />
                </div>
                <div>
                  <p className='text-[10px] text-foreground/35 font-medium uppercase tracking-wide'>
                    Time
                  </p>
                  <p className='text-sm font-mono font-semibold'>
                    {currentSolution.complexity.time}
                  </p>
                </div>
              </div>
              <div
                className='flex items-center gap-2.5 bg-panel border border-border rounded-xl p-3 card-hover'
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className='w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0'>
                  <MemoryStick size={13} className='text-purple-400' />
                </div>
                <div>
                  <p className='text-[10px] text-foreground/35 font-medium uppercase tracking-wide'>
                    Space
                  </p>
                  <p className='text-sm font-mono font-semibold'>
                    {currentSolution.complexity.space}
                  </p>
                </div>
              </div>
            </div>

            {/* Approach */}
            <div
              className='bg-panel border border-border rounded-xl p-3.5'
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <p className='text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-1.5'>
                Approach
              </p>
              <div className='text-sm text-foreground/80 leading-relaxed prose prose-sm dark:prose-invert max-w-none'>
                <ReactMarkdown>{currentSolution.approach}</ReactMarkdown>
              </div>
            </div>

            {/* Code with language tabs */}
            <div
              className='border border-border rounded-xl overflow-hidden'
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className='bg-panel border-b border-border px-2 pt-2'>
                <Tabs
                  value={selectedLanguage}
                  onValueChange={(v) =>
                    setSelectedLanguage(v as 'javascript' | 'python' | 'java')
                  }
                >
                  <TabsList className='h-7'>
                    <TabsTrigger
                      value='javascript'
                      className='h-6 px-3 text-[11px]'
                    >
                      JS
                    </TabsTrigger>
                    <TabsTrigger
                      value='python'
                      className='h-6 px-3 text-[11px]'
                    >
                      Python
                    </TabsTrigger>
                    <TabsTrigger value='java' className='h-6 px-3 text-[11px]'>
                      Java
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {(currentSolution.code as any)[selectedLanguage] ? (
                <CodeBlock
                  language={selectedLanguage}
                  code={(currentSolution.code as any)[selectedLanguage]}
                />
              ) : (
                <p className='p-4 text-center text-xs text-foreground/35 italic'>
                  No code for {selectedLanguage}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
