import React from 'react';
import { Link } from 'wouter';
import { Github } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-10 pt-6 pb-10 border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © {currentYear} Just Vibe Docs
          </div>
          
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/getting-started/course-welcome" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Getting Started
            </Link>
            <a href="https://replit.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;