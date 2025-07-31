import supabase from './supabaseClient';

export interface Message {
	id?: string;
	type: 'user' | 'assistant';
	content: string;
	image_url?: string[];
	chat_id: string;
	user_id: string;
	created_at?: string;
}

export interface ChatSession {
	id: string;
	title: string;
	last_message: string;
	message_count: number;
	last_img: string[];
	user_id: string;
	created_at?: string;
	updated_at?: string; //> use latest message time
}

// Test connection function
export const testConnection = async () => {
	try {
		const { error } = await supabase
			.from('chatsessions')
			.select('id')
			.limit(1);

		if (error) {
			console.error('Connection test failed:', error);
			if (error.code === '42P01') {
				console.error(
					'Table does not exist. Please run the SQL schema first.'
				);
			}
			return false;
		}

		console.log('Supabase connection successful');
		return true;
	} catch (error) {
		console.error('Connection test error:', error);
		return false;
	}
};

export const getSessions = async (userId: string): Promise<ChatSession[]> => {
	try {
		console.log('Fetching sessions for user:', userId);

		const { data, error } = await supabase
			.from('chatsessions')
			.select('*')
			.eq('user_id', userId)
			.order('updated_at', { ascending: true });

		if (error) {
			console.error('Error getting sessions:', error);
			throw error;
		}

		console.log('Sessions fetched successfully:', data?.length || 0);
		return data || [];
	} catch (error) {
		console.error('Error in getSessions:', error);
		throw error;
	}
};

export const createSession = async (
	sessionData: Omit<ChatSession, 'created_at' | 'updated_at'>
): Promise<ChatSession> => {
	try {
		console.log('Creating session:', sessionData);

		const { data, error } = await supabase
			.from('chatsessions')
			.insert({
				id: sessionData.id,
				title: sessionData.title,
				last_message: sessionData.last_message,
				message_count: sessionData.message_count,
				last_img: sessionData.last_img,
				user_id: sessionData.user_id,
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating session:', error);
			throw error;
		}

		console.log('Session created successfully:', data);
		return data;
	} catch (error) {
		console.error('Error in createSession:', error);
		throw error;
	}
};

export const updateSession = async (
	id: string,
	updates: Partial<Omit<ChatSession, 'id' | 'user_id' | 'created_at'>>
): Promise<ChatSession> => {
	try {
		console.log('Updating session:', id, updates);

		const updateData: any = {};
		if (updates.title !== undefined) updateData.title = updates.title;
		if (updates.last_message !== undefined)
			updateData.last_message = updates.last_message;
		if (updates.message_count !== undefined)
			updateData.message_count = updates.message_count;
		if (updates.last_img !== undefined)
			updateData.last_img = updates.last_img;

		const { data, error } = await supabase
			.from('chatsessions')
			.update(updateData)
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error updating session:', error);
			throw error;
		}

		console.log('Session updated successfully:', data);
		return data;
	} catch (error) {
		console.error('Error in updateSession:', error);
		throw error;
	}
};

export const deleteSession = async (
	id: string,
	userId: string
): Promise<void> => {
	try {
		console.log('Deleting session:', id, 'for user:', userId);

		const { error: messageDeleteError } = await supabase
			.from('messages')
			.delete()
			.eq('chat_id', id)
			.eq('user_id', userId);

		if (messageDeleteError) {
			console.error('Error deleting messages:', messageDeleteError);
		}

		const { error: sessionDeleteError } = await supabase
			.from('chatsessions')
			.delete()
			.eq('id', id)
			.eq('user_id', userId);

		if (sessionDeleteError) {
			console.error('Error deleting session:', sessionDeleteError);
			throw sessionDeleteError;
		}

		console.log('Session deleted successfully');
	} catch (error) {
		console.error('Error in deleteSession:', error);
		throw error;
	}
};

export const createMessage = async (
	messageData: Omit<Message, 'id' | 'created_at'>
): Promise<Message> => {
	try {
		console.log('Creating message:', messageData);

		const { data, error } = await supabase
			.from('messages')
			.insert({
				type: messageData.type,
				content: messageData.content,
				image_url: messageData.image_url || [],
				chat_id: messageData.chat_id,
				user_id: messageData.user_id,
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating message:', error);
			throw error;
		}

		console.log('Message created successfully:', data);
		return data;
	} catch (error) {
		console.error('Error in createMessage:', error);
		throw error;
	}
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
	try {
		console.log('Fetching messages for chat:', chatId);

		const { data, error } = await supabase
			.from('messages')
			.select('*')
			.eq('chat_id', chatId)
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Error getting messages:', error);
			throw error;
		}

		console.log('Messages fetched successfully:', data?.length || 0);
		return data || [];
	} catch (error) {
		console.error('Error in getMessages:', error);
		throw error;
	}
};
