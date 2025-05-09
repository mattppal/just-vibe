import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X } from "lucide-react";
import { useLocation } from "wouter";
import { getAllDocs } from "@/lib/docs";

interface SearchResult {
  title: string;
  path: string;
  excerpt: string;
}

export default function Search() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    // Search through documentation
    const docs = getAllDocs();
    const filtered = docs.filter(doc => 
      doc.title.toLowerCase().includes(query.toLowerCase()) || 
      doc.content.toLowerCase().includes(query.toLowerCase())
    );
    
    setResults(filtered.map(doc => ({
      title: doc.title,
      path: doc.path,
      excerpt: doc.content.substring(0, 100) + "..."
    })));
  };

  const handleSelectResult = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Command+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      
      // Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);
  
  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between bg-[hsl(var(--code))] text-foreground border-border"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center">
          <SearchIcon className="mr-2 h-4 w-4" />
          <span>Search documentation...</span>
        </div>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] bg-background text-foreground">
          <DialogHeader>
            <DialogTitle>Search Documentation</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-[hsl(var(--code))] text-foreground border-border"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full rounded-l-none"
                onClick={() => handleSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {results.length > 0 ? (
            <ul className="max-h-[300px] overflow-y-auto">
              {results.map((result, index) => (
                <li key={index} className="border-b border-border last:border-0">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-2 py-4 h-auto text-left"
                    onClick={() => handleSelectResult(result.path)}
                  >
                    <div>
                      <h4 className="font-medium text-foreground">{result.title}</h4>
                      <p className="text-sm text-secondary truncate">
                        {result.excerpt}
                      </p>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          ) : searchQuery.length > 1 ? (
            <div className="py-6 text-center text-secondary">
              No results found for "{searchQuery}"
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
