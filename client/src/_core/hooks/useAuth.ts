import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const user = useMemo(() => {
    if (meQuery.data) return meQuery.data;
    return { id: 0, name: "Usuário", email: "", role: "user" } as const;
  }, [meQuery.data]);

  return {
    user,
    loading: meQuery.isLoading,
    error: meQuery.error ?? null,
    isAuthenticated: true,
    logout: async () => {},
  };
}
