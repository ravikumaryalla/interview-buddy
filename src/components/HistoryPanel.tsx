import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Download, Trash2, Clock, FileCode } from 'lucide-react';

export const HistoryPanel: React.FC = () => {
  const { history, deleteFromHistory, setCurrentProblem, setCurrentSolution } = useAppStore();

  const handleExport = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const md = `# Interview Problem\n\n## Problem\n${item.problem}\n\n## Summary\n${item.solution.summary}\n\n## Approach\n${item.solution.approach}\n\n## Complexity\n- Time: ${item.solution.complexity.time}\n- Space: ${item.solution.complexity.space}\n\n## Code\n\n### JavaScript\n\`\`\`javascript\n${item.solution.code.javascript}\n\`\`\`\n\n### Python\n\`\`\`python\n${item.solution.code.python}\n\`\`\`\n\n### Java\n\`\`\`java\n${item.solution.code.java}\n\`\`\`\n`;
    await window.electronAPI.exportMarkdown(`solution-${item.id.slice(0, 6)}.md`, md);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-foreground/20 p-8 select-none">
        <Clock size={36} />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/40">No history yet</p>
          <p className="text-xs text-foreground/25 mt-1">Solved problems appear here automatically</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-3 space-y-2">
      {history.map((item) => (
        <div
          key={item.id}
          onClick={() => { setCurrentProblem(item.problem); setCurrentSolution(item.solution); }}
          className="group bg-panel border border-border rounded-xl p-3.5 cursor-pointer hover:border-accent/40 hover:shadow-sm transition-all"
        >
          {/* Title + date */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-foreground/85 line-clamp-2 leading-snug">
              {item.solution?.summary || 'Saved Problem'}
            </p>
            <span className="text-[10px] text-foreground/35 whitespace-nowrap shrink-0 mt-0.5">
              {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 text-[10px] text-foreground/45">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-background border border-border rounded-full">
              <FileCode size={10} /> Coding
            </span>
            <span className="px-2 py-0.5 bg-background border border-border rounded-full font-mono">
              {item.solution?.complexity?.time}
            </span>
          </div>

          {/* Actions (hover) */}
          <div className="flex justify-end gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleExport(item, e)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <Download size={11} /> Export
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteFromHistory(item.id); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg text-foreground/40 hover:text-red-400 hover:bg-red-500/8 transition-colors"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
