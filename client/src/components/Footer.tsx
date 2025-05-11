import React from 'react';
import { Link } from 'wouter';
import { Github } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-20 pt-10 pb-16 border-t border-border">
      <div className="container px-4 mx-auto max-w-screen-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="text-xl font-bold">Just Vibe Docs</div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              A modern documentation platform designed for developers.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end space-y-6">
            <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/getting-started/course-welcome" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Getting Started
              </Link>
              <Link href="/core-concepts/prompting" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Core Concepts
              </Link>
              <a href="https://replit.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
            <div className="text-xs text-muted-foreground">
              © {currentYear} Just Vibe Docs. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;