import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DocPage } from '@/lib/docs';

export interface DocNavigationLink {
  title: string;
  path: string;
}

interface DocNavigationProps {
  previousDoc: DocNavigationLink | null;
  nextDoc: DocNavigationLink | null;
}

export function DocNavigation({ previousDoc, nextDoc }: DocNavigationProps) {
  // If there's no previous or next document, don't render anything
  if (!previousDoc && !nextDoc) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border flex justify-between">
      {/* Previous Doc Link */}
      {previousDoc ? (
        <Link 
          href={previousDoc.path} 
          className="group inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <div>
            <div className="text-xs uppercase font-medium">Previous</div>
            <div className="font-medium">{previousDoc.title}</div>
          </div>
        </Link>
      ) : (
        <div></div>
      )}

      {/* Next Doc Link */}
      {nextDoc ? (
        <Link 
          href={nextDoc.path} 
          className="group inline-flex items-center gap-2 text-right text-muted-foreground hover:text-primary transition-colors"
        >
          <div>
            <div className="text-xs uppercase font-medium">Next</div>
            <div className="font-medium">{nextDoc.title}</div>
          </div>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      ) : (
        <div></div>
      )}
    </div>
  );
}

// Helper function to find previous and next docs
export function findAdjacentDocs(
  currentDoc: DocPage,
  sections: Record<string, DocPage[]> | undefined
): { previousDoc: DocNavigationLink | null; nextDoc: DocNavigationLink | null } {
  // If sections data is not available, return null for both links
  if (!sections) {
    return { previousDoc: null, nextDoc: null };
  }
  // Initialize result
  let previousDoc: DocNavigationLink | null = null;
  let nextDoc: DocNavigationLink | null = null;

  // Create a flattened array of all docs in the correct order
  const allDocs: DocPage[] = [];

  // First get the sections in the correct order (with root first)
  const orderedSectionNames = Object.keys(sections).sort((a, b) => {
    // Always keep root first
    if (a === 'root') return -1;
    if (b === 'root') return 1;
    
    // Extract numeric prefix from section names for ordering
    const getOrderPrefix = (name: string) => {
      const match = name.match(/^(\d+)-/);
      return match ? parseInt(match[1], 10) : 999;
    };
    
    // Sort by numeric prefix
    return getOrderPrefix(a) - getOrderPrefix(b);
  });

  // Add documents from each section in order
  orderedSectionNames.forEach(sectionName => {
    const sectionDocs = sections[sectionName];
    // If the section has documents, add them to our flattened array
    if (sectionDocs && sectionDocs.length > 0) {
      allDocs.push(...sectionDocs);
    }
  });

  // Find the current document's index in the flattened array
  const currentIndex = allDocs.findIndex(doc => doc.slug === currentDoc.slug);

  // If found, determine previous and next documents
  if (currentIndex !== -1) {
    // Previous doc is the one before the current (if it exists)
    if (currentIndex > 0) {
      const prevDoc = allDocs[currentIndex - 1];
      previousDoc = {
        title: prevDoc.title,
        path: prevDoc.path
      };
    }

    // Next doc is the one after the current (if it exists)
    if (currentIndex < allDocs.length - 1) {
      const next = allDocs[currentIndex + 1];
      nextDoc = {
        title: next.title,
        path: next.path
      };
    }
  }

  return { previousDoc, nextDoc };
}
