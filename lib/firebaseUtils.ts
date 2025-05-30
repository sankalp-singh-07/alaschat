import {
	collection,
	doc,
	setDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	addDoc,
	Timestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface FirebaseMessage {
	id: string;
	type: 'user' | 'assistant';
	content: string;
	images?: string[];
	timestamp: Timestamp;
	chatId: string;
	userId: string;
}

export interface FirebaseChatSession {
	id: string;
	title: string;
	lastMessage: string;
	timestamp: Timestamp;
	messageCount: number;
	userId: string;
}

export const saveChatSession = async (
	session: Omit<FirebaseChatSession, 'timestamp' | 'userId'> & {
		timestamp: Date;
	},
	userId: string
) => {
	try {
		const chatRef = doc(db, 'chatSessions', session.id);
		await setDoc(chatRef, {
			...session,
			timestamp: Timestamp.fromDate(session.timestamp),
			userId,
		});
		console.log('Chat session saved successfully');
	} catch (error) {
		console.error('Error saving chat session:', error);
		throw error;
	}
};

export const loadChatSessions = async (
	userId: string
): Promise<FirebaseChatSession[]> => {
	try {
		const chatSessionsRef = collection(db, 'chatSessions');
		const q = query(
			chatSessionsRef,
			where('userId', '==', userId),
			orderBy('timestamp', 'desc')
		);

		const querySnapshot = await getDocs(q);
		const sessions: FirebaseChatSession[] = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			sessions.push({
				id: doc.id,
				title: data.title,
				lastMessage: data.lastMessage,
				timestamp: data.timestamp,
				messageCount: data.messageCount,
				userId: data.userId,
			});
		});

		console.log('Loaded chat sessions:', sessions.length);
		return sessions;
	} catch (error) {
		console.error('Error loading chat sessions:', error);
		return [];
	}
};

export const saveMessage = async (
	message: Omit<FirebaseMessage, 'timestamp' | 'userId'> & {
		timestamp: Date;
		userId: string;
	}
) => {
	try {
		const messagesRef = collection(db, 'messages');
		await addDoc(messagesRef, {
			...message,
			timestamp: Timestamp.fromDate(message.timestamp),
		});
		console.log('Message saved successfully');
	} catch (error) {
		console.error('Error saving message:', error);
		throw error;
	}
};

export const loadMessages = async (
	chatId: string,
	userId: string
): Promise<FirebaseMessage[]> => {
	try {
		const messagesRef = collection(db, 'messages');
		const q = query(
			messagesRef,
			where('chatId', '==', chatId),
			where('userId', '==', userId),
			orderBy('timestamp', 'asc')
		);

		const querySnapshot = await getDocs(q);
		const messages: FirebaseMessage[] = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			messages.push({
				id: doc.id,
				type: data.type,
				content: data.content,
				images: data.images || [],
				timestamp: data.timestamp,
				chatId: data.chatId,
				userId: data.userId,
			});
		});

		console.log('Loaded messages for chat:', chatId, messages.length);
		return messages;
	} catch (error) {
		console.error('Error loading messages:', error);
		return [];
	}
};

export const updateChatSession = async (
	chatId: string,
	updates: Partial<Omit<FirebaseChatSession, 'timestamp'>> & {
		timestamp?: Date;
	},
	userId: string
) => {
	try {
		const chatRef = doc(db, 'chatSessions', chatId);
		const updateData: any = { ...updates };

		if (updates.timestamp) {
			updateData.timestamp = Timestamp.fromDate(updates.timestamp);
		}

		await updateDoc(chatRef, updateData);
		console.log('Chat session updated successfully');
	} catch (error) {
		console.error('Error updating chat session:', error);
		throw error;
	}
};

export const deleteChatSession = async (chatId: string, userId: string) => {
	try {
		const messagesRef = collection(db, 'messages');
		const messagesQuery = query(
			messagesRef,
			where('chatId', '==', chatId),
			where('userId', '==', userId)
		);

		const messageSnapshots = await getDocs(messagesQuery);
		const deletePromises = messageSnapshots.docs.map((docSnapshot) =>
			deleteDoc(docSnapshot.ref)
		);

		await Promise.all(deletePromises);

		const chatRef = doc(db, 'chatSessions', chatId);
		await deleteDoc(chatRef);

		console.log('Chat session and messages deleted successfully');
	} catch (error) {
		console.error('Error deleting chat session:', error);
		throw error;
	}
};
