"use client";

import { createContext, useContext, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

function instantiateClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}

const SupabaseClientContext = createContext<SupabaseClient | null>(null);

export function SupabaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = useMemo(() => instantiateClient(), []);
  return (
    <SupabaseClientContext.Provider value={client}>
      {children}
    </SupabaseClientContext.Provider>
  );
}

export function useSupabaseBrowserClient() {
  const context = useContext(SupabaseClientContext);
  return context ?? instantiateClient();
}

export function createSupabaseBrowserClient() {
  return instantiateClient();
}
