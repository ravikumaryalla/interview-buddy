import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Download, Trash2, Clock, CheckCircle2 } from 'lucide-react';

export const HistoryPanel: React.FC = () => {
  const { history, deleteFromHistory, setCurrentProblem, setCurrentSolution } = useAppStore();

  const handleLoad = (item: any) => {
    setCurrentProblem(item.problem);
    setCurrentSolution(item.solution);
  };

  const handleExport = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const content = `# Interview Problem
    
## Problem
${item.problem}

## Summary
${item.solution.summary}

## Approach
${item.solution.approach}

## Complexities
- Time: ${item.solution.complexity.time}
- Space: ${item.solution.complexity.space}

## Code

### JavaScript
\`\`\`javascript
${item.solution.code.javascript}
\`\`\`

### Python
\`\`\`python
${item.solution.code.python}
\`\`\`

### Java
\`\`\`java
${item.solution.code.java}
\`\`\`
`;

    const success = await window.electronAPI.exportMarkdown(`solution-${item.id.slice(0, 6)}.md`, content);
    if (!success) {
        // user cancelled or error
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFromHistory(id);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full text-center space-y-4 text-foreground/40">
        <Clock size={48} className="text-accent/30" />
        <p>No solved problems history found.</p>
        <p className="text-sm px-4">Generate and save a solution automatically by capturing a problem first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-3 h-full overflow-y-auto no-scrollbar pb-24">
      {history.map((item) => (
        <div 
          key={item.id} 
          onClick={() => handleLoad(item)}
          className="group flex flex-col p-4 bg-panel border gap-3 border-border rounded-xl cursor-pointer hover:border-accent hover:shadow-sm hover:shadow-accent/20 transition-all"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-sm text-foreground/90 line-clamp-1 break-all">
              {item.solution?.summary || 'Saved Problem'}
            </h3>
            <span className="text-[10px] text-foreground/50 whitespace-nowrap ml-2">
              {new Date(item.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center text-xs text-foreground/60 space-x-2">
            <span className="flex items-center px-2 py-0.5 bg-background rounded border border-border">
                <CheckCircle2 size={12} className="mr-1 text-green-500" /> Solved
            </span>
            <span className="flex items-center">
              Time: {item.solution?.complexity?.time}
            </span>
          </div>

          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleExport(item, e)}
              className="p-1.5 flex items-center text-xs rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-foreground/70"
              title="Export as Markdown"
            >
              <Download size={14} className="mr-1" /> Export
            </button>
            <button
              onClick={(e) => handleDelete(item.id, e)}
              className="p-1.5 flex items-center text-xs rounded hover:bg-red-500/20 text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
