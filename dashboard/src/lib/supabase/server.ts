"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { type CookieOptions } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

type Cookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      get(key: string) {
        return cookieStore.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookieStore.set({ name: key, value, ...options });
      },
      remove(key: string, options: CookieOptions) {
        cookieStore.set({ name: key, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
