import { getSupabaseClient } from './supabaseClient';

//> Session functions

export const getSessions = async () => {
	const supabase = await getSupabaseClient();

	if (!supabase) return;

	const { data, error } = await supabase
		.from('chatSessions')
		.select('*')
		.order('created_at');

	if (error) throw error;
	return data;
};

export const createSession = async (userData: any) => {
	const supabase = await getSupabaseClient();

	if (!supabase) return;

	const { data, error } = await supabase
		.from('chatSessions')
		.insert(userData);

	if (error) throw error;
	return data;
};

export const updateSession = async (updates: any, id: string) => {
	const supabase = await getSupabaseClient();

	if (!supabase) return;

	const { data, error } = await supabase
		.from('chatSessions')
		.update(updates)
		.eq('id', id);

	if (error) throw error;
	return data;
};

export const deleteSession = async (id: string) => {
	const supabase = await getSupabaseClient();

	if (!supabase) return;

	const { data, error } = await supabase
		.from('chatSessions')
		.delete()
		.eq('id', id);

	if (error) throw error;
	return data;
};

//> message functions

export const createMessage = async (message: {
	id: string;
	chatId: string;
	userId: string;
	content: string;
	imageUrl: string;
	type: string;
}) => {
	const supabase = await getSupabaseClient();

	if (!supabase) return;

	const { data, error } = await supabase.from('messages').insert(message);

	if (error) throw error;
	return data;
};

export const getMessages = async (chatId: string) => {
	const supabase = await getSupabaseClient();

	if (!supabase) return;

	const { data, error } = await supabase
		.from('messages')
		.select('*')
		.eq('chatId', chatId)
		.order('created_at', { ascending: true });

	if (error) throw error;
	return data;
};

export const deleteMessageByChatId = async (chatId: string) => {
	const supabase = await getSupabaseClient();

	if (!supabase) return;

	const { data, error } = await supabase
		.from('messages')
		.delete()
		.eq('chatId', chatId);

	if (error) throw error;
	return data;
};
