import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { getDocByPath, DocPage as DocPageType } from "@/lib/docs";
import TableOfContents from "@/components/TableOfContents";
import CodeBlock from "@/components/CodeBlock";

export default function DocPage() {
  const [match, params] = useRoute("/:path*");
  const [doc, setDoc] = useState<DocPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determine the path from the URL
  const path = match ? `/${params.path || ""}` : "/";
  
  useEffect(() => {
    async function fetchDoc() {
      try {
        setLoading(true);
        setError(null);
        
        const docData = await getDocByPath(path);
        
        if (docData) {
          setDoc(docData);
        } else {
          setError("Document not found");
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    }
    
    fetchDoc();
  }, [path]);
  
  // Extract code blocks from HTML content
  const processHtml = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Process all code blocks
    doc.querySelectorAll("pre code").forEach((codeBlock) => {
      const language = codeBlock.className.replace("language-", "");
      const code = codeBlock.textContent || "";
      
      // Replace with our custom code block component (rendered as string)
      const codeBlockWrapper = document.createElement("div");
      codeBlockWrapper.dataset.code = code;
      codeBlockWrapper.dataset.language = language || "javascript";
      codeBlockWrapper.className = "code-block-placeholder";
      
      // Replace the pre element with our wrapper
      const preElement = codeBlock.parentNode;
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(codeBlockWrapper, preElement);
      }
    });
    
    return doc.body.innerHTML;
  };
  
  // Render code blocks after the HTML has been inserted into the DOM
  useEffect(() => {
    if (!doc) return;
    
    // Find all code block placeholders and render the CodeBlock component
    document.querySelectorAll(".code-block-placeholder").forEach((placeholder) => {
      const code = placeholder.getAttribute("data-code") || "";
      const language = placeholder.getAttribute("data-language") || "javascript";
      
      // Create a container for the code block
      const container = document.createElement("div");
      container.className = "my-6";
      
      // Replace the placeholder with the container
      if (placeholder.parentNode) {
        placeholder.parentNode.replaceChild(container, placeholder);
        
        // Render the CodeBlock component to a string and set as innerHTML
        container.innerHTML = `<pre><code class="language-${language}">${code}</code></pre>`;
        
        // Apply syntax highlighting
        // Note: In a full implementation, you would render the CodeBlock component here
        // This is a simplified version that just wraps the code in pre and code tags
      }
    });
  }, [doc]);
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-1/3 bg-[hsl(var(--code))] rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-[hsl(var(--code))] rounded w-full"></div>
          <div className="h-4 bg-[hsl(var(--code))] rounded w-5/6"></div>
          <div className="h-4 bg-[hsl(var(--code))] rounded w-4/6"></div>
        </div>
      </div>
    );
  }
  
  if (error || !doc) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-secondary">{error || "Document not found"}</p>
      </div>
    );
  }
  
  return (
    <div>
      <article className="prose prose-invert max-w-none">
        <h1>{doc.title}</h1>
        <p className="text-secondary lead">{doc.description}</p>
        
        {/* Render the HTML content */}
        <div dangerouslySetInnerHTML={{ __html: doc.html }} />
      </article>
      
      {doc.headings.length > 0 && (
        <div className="hidden xl:block">
          <TableOfContents items={doc.headings.map(h => ({ id: h.id, title: h.title }))} />
        </div>
      )}
    </div>
  );
}