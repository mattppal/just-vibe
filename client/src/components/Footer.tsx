import React from "react";
import { Link } from "wouter";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 pt-6 pb-10 xl:pr-64 mx-auto max-w-5xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © {currentYear} Just Vibe Docs
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
