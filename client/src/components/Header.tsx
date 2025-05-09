import { Link, useLocation } from "wouter";
import { Menu, Github, ExternalLink, LogIn, LogOut, Lock, User, ChevronDown } from "lucide-react";
import { DocPage, getDocByPath } from "@/lib/docs";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <header className="sticky top-0 z-20 w-full border-b border-[#333] bg-black/90 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 md:px-6">
        <button
          onClick={onOpenSidebar}
          className="md:hidden mr-2 p-1 text-gray-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <nav className="flex items-center gap-1 text-sm ml-4 md:ml-0">
          <Link href="/" className="text-gray-400 hover:text-white">
            Docs
          </Link>
          {currentDoc?.section && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-400">{currentDoc.section.replace(/^\d+-/, '')
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}</span>
            </>
          )}
          {currentDoc?.title && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-white">{currentDoc.title}</span>
            </>
          )}
        </nav>
        
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex rounded-md p-1.5 text-gray-400 hover:text-white"
          >
            <Github className="w-5 h-5" />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            href="https://example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex rounded-md p-1.5 text-gray-400 hover:text-white"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="sr-only">External Link</span>
          </a>
          
          {isLoading ? (
            <div className="w-24 h-9 animate-pulse bg-[#111] rounded-md" />
          ) : isAuthenticated ? (
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent border-[#333] text-white hover:bg-[#111] hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          ) : (
            <Button
              onClick={login}
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent border-[#333] text-white hover:bg-[#111] hover:text-white"
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
