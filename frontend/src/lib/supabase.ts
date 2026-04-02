import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = "free" | "pro" | "enterprise";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  plan: Plan;
  is_admin: boolean;
}
