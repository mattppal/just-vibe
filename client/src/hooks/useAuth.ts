import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - user info changes infrequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Only check every 5 minutes to see if still logged in
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: () => {
      window.location.href = '/api/login';
    },
    logout: () => {
      window.location.href = '/api/logout';
    },
  };
}
