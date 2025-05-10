import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export default function CodeBlock({ code, language = "javascript", className }: CodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>(code);

  useEffect(() => {
    // Simple syntax highlighting
    const highlightCode = (code: string) => {
      let highlighted = code;
      
      // Replace different tokens with styled spans
      highlighted = highlighted
        // Comments
        .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="token comment">$1</span>')
        // Strings
        .replace(/(['"`])(.*?)\1/g, '<span class="token string">$1$2$1</span>')
        // Keywords
        .replace(/\b(const|let|var|function|return|import|export|from|class|if|else|for|while|switch|case|break|default|try|catch|throw)\b/g, 
                '<span class="token keyword">$1</span>')
        // Functions
        .replace(/(\w+)(?=\s*\()/g, '<span class="token function">$1</span>')
        // Numbers
        .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="token number">$1</span>')
        // Operators
        .replace(/(\+|-|\*|\/|=|==|===|!=|!==|>|<|>=|<=|&&|\|\||\!)/g, 
                '<span class="token operator">$1</span>')
        // Class names
        .replace(/\b([A-Z]\w*)\b/g, '<span class="token class-name">$1</span>');
      
      return highlighted;
    };

    setHighlightedCode(highlightCode(code));
  }, [code]);

  return (
    <div className={cn("relative rounded-md bg-[hsl(var(--code))] p-4", className)}>
      <pre className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
}
