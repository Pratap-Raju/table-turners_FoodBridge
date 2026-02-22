import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_threshold: number;
  location?: string;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
}
