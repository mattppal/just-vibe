import { Link, useLocation } from "wouter";
import { Menu, LogIn, LogOut, Lock, User, ChevronDown } from "lucide-react";
import { DocPage, getDocByPath } from "@/lib/docs";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // This effect captures the scrollY position when the dropdown opens
  // and prevents the header from disappearing on scroll
  useEffect(() => {
    if (!dropdownOpen) return;
    
    // Calculate the current scroll position
    const scrollY = window.scrollY;
    
    const handleScroll = () => {
      // When dropdown is open, maintain the header in the viewport
      if (headerRef.current) {
        // Force the header to remain fixed at the top
        headerRef.current.style.position = 'fixed';
        headerRef.current.style.top = '0';
        headerRef.current.style.left = '0';
        headerRef.current.style.right = '0';
        headerRef.current.style.width = '100%';
        headerRef.current.style.zIndex = '100';
        
        // If user scrolls, ensure header stays in place and scrolls with them
        if (window.scrollY !== scrollY) {
          window.scrollTo(0, scrollY);
        }
      }
    };
    
    // Apply initial styles to lock header in place
    handleScroll();
    
    // Add event listeners to react to scroll attempts
    window.addEventListener('scroll', handleScroll, { passive: false });
    
    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      // Reset the header back to its CSS-controlled state when dropdown closes
      if (headerRef.current) {
        headerRef.current.style.position = '';
        headerRef.current.style.top = '';
        headerRef.current.style.left = '';
        headerRef.current.style.right = '';
        headerRef.current.style.width = '';
        headerRef.current.style.zIndex = '';
      }
    };
  }, [dropdownOpen]);

  return (
    <header 
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 w-full border-b border-[#333] bg-black/90 backdrop-blur-sm",
        dropdownOpen && "sticky-header-no-shift"
      )}
    >
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="text-white font-bold text-xl flex items-center mr-6 tracking-tight">
          Just Vibe
        </div>

        <button
          onClick={onOpenSidebar}
          className="md:hidden mr-2 p-1 text-gray-400 hover:text-white"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          {isLoading ? (
            <div className="w-24 h-9 animate-pulse bg-[#111] rounded-md" />
          ) : isAuthenticated ? (
            <DropdownMenu 
              open={dropdownOpen} 
              onOpenChange={setDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 w-9 rounded-full bg-transparent p-0 hover:bg-[#111] focus:ring-0 focus:ring-offset-0 dropdown-menu-trigger-no-shift"
                  aria-label="User menu"
                >
                  <Avatar className="h-9 w-9 border border-[#333]">
                    {user?.profileImageUrl ? (
                      <AvatarImage
                        src={user.profileImageUrl}
                        alt="Profile"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <AvatarFallback className="bg-[#111] text-white">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  avoidCollisions={false}
                  collisionPadding={16}
                  className="w-56 bg-black border border-[#333] p-1 text-white z-[110] fixed-dropdown"
                >
                  <div className="flex items-center justify-start gap-3 p-2">
                    <Avatar className="h-9 w-9 border border-[#333]">
                      {user?.profileImageUrl ? (
                        <AvatarImage
                          src={user.profileImageUrl}
                          alt="Profile"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <AvatarFallback className="bg-[#111] text-white">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "Welcome"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        @{user?.id || "user"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-[#333] my-1" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer flex items-center gap-2 focus:bg-[#111] focus:text-white hover:bg-[#111] transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          ) : (
            <Button
              onClick={login}
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent border-[#333] text-white hover:bg-[#111] hover:text-white transition-colors duration-200"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
