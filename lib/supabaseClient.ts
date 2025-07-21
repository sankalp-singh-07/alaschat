import { createClient } from '@supabase/supabase-js';

export async function getSupabaseClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) return;

	const supabase = createClient(supabaseUrl, supabaseAnonKey);

	return supabase;
}
