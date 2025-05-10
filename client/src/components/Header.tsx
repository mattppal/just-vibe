import { Link, useLocation } from "wouter";
import { Menu, LogIn, LogOut, Lock, User, ChevronDown } from "lucide-react";
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

  // We don't need to fetch doc metadata in the header - this duplicates requests
  // from the DocPage component. The header doesn't actually use the current doc data.

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#333] bg-black/90 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="text-white font-bold text-xl flex items-center mr-6 tracking-tight">Just Vibe</div>
        
        <button
          onClick={onOpenSidebar}
          className="md:hidden mr-2 p-1 text-gray-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          {isLoading ? (
            <div className="w-24 h-9 animate-pulse bg-[#111] rounded-md" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full bg-transparent p-0 hover:bg-[#111]"
                >
                  <Avatar className="h-9 w-9 border border-[#333]">
                    {user?.profileImageUrl ? (
                      <AvatarImage src={user.profileImageUrl} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-[#111] text-white">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-black border border-[#333] p-1 text-white"
              >
                <div className="flex items-center justify-start gap-3 p-2">
                  <Avatar className="h-9 w-9 border border-[#333]">
                    {user?.profileImageUrl ? (
                      <AvatarImage src={user.profileImageUrl} alt="Profile" />
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
