import React, { useCallback } from 'react';
import { Link, useLocation } from 'wouter';

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({ href, children, className = '', onClick }) => {
  const [, navigate] = useLocation();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Call the provided onClick handler if it exists
    if (onClick) {
      onClick(e);
    }
    
    // First navigate to the new page
    navigate(href);
    
    // Then scroll to the top of the page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [href, navigate, onClick]);
  
  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
};

export default NavigationLink;