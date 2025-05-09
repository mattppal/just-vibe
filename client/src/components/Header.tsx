import { Link, useLocation } from "wouter";
import { Menu, Github, ExternalLink, LogIn, LogOut, Lock } from "lucide-react";
import { DocPage, getDocByPath } from "@/lib/docs";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const [location] = useLocation();
  const [currentDoc, setCurrentDoc] = useState<DocPage | undefined>(undefined);
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  
  useEffect(() => {
    async function fetchDoc() {
      const doc = await getDocByPath(location);
      setCurrentDoc(doc);
    }
    
    fetchDoc();
  }, [location]);
  
  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 md:px-6">
        <button
          onClick={onOpenSidebar}
          className="md:hidden mr-2 p-1 text-secondary hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <nav className="flex items-center gap-1 text-sm ml-4 md:ml-0">
          <Link href="/" className="text-secondary hover:text-foreground">
            Docs
          </Link>
          {currentDoc?.section && (
            <>
              <span className="text-secondary">/</span>
              <span className="text-secondary">{currentDoc.section}</span>
            </>
          )}
          {currentDoc?.title && (
            <>
              <span className="text-secondary">/</span>
              <span className="text-foreground">{currentDoc.title}</span>
            </>
          )}
        </nav>
        
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex rounded-md p-1.5 text-secondary hover:text-foreground"
          >
            <Github className="w-5 h-5" />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            href="https://example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex rounded-md p-1.5 text-secondary hover:text-foreground"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="sr-only">External Link</span>
          </a>
          
          {isLoading ? (
            <div className="w-24 h-9 animate-pulse bg-[hsl(var(--code))] rounded-md" />
          ) : isAuthenticated ? (
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          ) : (
            <Button
              onClick={login}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
