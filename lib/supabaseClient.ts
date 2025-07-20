import { useAuth } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';

const { getToken } = useAuth();

const token = await getToken({ template: 'supabase' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
	global: {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	},
});
