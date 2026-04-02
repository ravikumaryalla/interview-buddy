import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lang = language === 'java' ? 'java' : language === 'python' ? 'python' : 'javascript';

  return (
    <div className="relative group overflow-hidden">
      <button
        onClick={handleCopy}
        title="Copy code"
        className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-white/10 border border-white/10 text-white/60 hover:text-white hover:bg-white/15 opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      </button>
      <SyntaxHighlighter
        language={lang}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem', fontSize: '0.78rem', background: 'rgba(0,0,0,0.45)', borderRadius: 0 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
