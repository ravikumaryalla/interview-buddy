import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Download, Trash2, Clock, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const HistoryPanel: React.FC = () => {
  const { history, deleteFromHistory, setCurrentProblem, setCurrentSolution } = useAppStore();

  const handleExport = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const md = `# Interview Problem\n\n## Problem\n${item.problem}\n\n## Summary\n${item.solution.summary}\n\n## Approach\n${item.solution.approach}\n\n## Complexity\n- Time: ${item.solution.complexity.time}\n- Space: ${item.solution.complexity.space}\n\n## Code\n\n### JavaScript\n\`\`\`javascript\n${item.solution.code.javascript}\n\`\`\`\n\n### Python\n\`\`\`python\n${item.solution.code.python}\n\`\`\`\n\n### Java\n\`\`\`java\n${item.solution.code.java}\n\`\`\`\n`;
    await window.electronAPI.exportMarkdown(`solution-${item.id.slice(0, 6)}.md`, md);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 select-none">
        <div className="w-12 h-12 rounded-2xl bg-foreground/[0.04] border border-border flex items-center justify-center">
          <Clock size={22} className="text-foreground/25" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/40">No history yet</p>
          <p className="text-xs text-foreground/25 mt-1">Solved problems will appear here</p>
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
          className="group bg-panel border border-border rounded-xl p-3.5 cursor-pointer card-hover"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-foreground/85 line-clamp-2 leading-snug">
              {item.solution?.summary || 'Saved Problem'}
            </p>
            <span className="text-[10px] text-foreground/30 whitespace-nowrap shrink-0 mt-0.5">
              {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="accent"><FileCode size={9} /> Coding</Badge>
            <Badge variant="outline" className="font-mono">{item.solution?.complexity?.time}</Badge>
          </div>

          <div className="flex justify-end gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleExport(item, e)}
              className="h-6 text-[11px] gap-1 text-foreground/50 hover:text-accent hover:bg-accent/8"
            >
              <Download size={10} /> Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); deleteFromHistory(item.id); }}
              className="h-6 text-[11px] gap-1 text-foreground/40 hover:text-red-400 hover:bg-red-500/8"
            >
              <Trash2 size={10} /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
