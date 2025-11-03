function requireServerEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    return "";
    // throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const serverEnv = {
  supabaseServiceRoleKey: requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseJwtSecret: requireServerEnv("SUPABASE_JWT_SECRET"),
};

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined");
}

export type ServerEnv = typeof serverEnv;
export type PublicEnv = typeof publicEnv;
