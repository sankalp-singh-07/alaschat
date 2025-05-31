'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import {
	Send,
	X,
	MessageSquare,
	Bot,
	Paperclip,
	Plus,
	Trash2,
	Menu,
} from 'lucide-react';
import {
	saveChatSession,
	loadChatSessions,
	saveMessage,
	loadMessages,
	updateChatSession,
	deleteChatSession as deleteFirebaseChatSession,
} from '../../lib/firebaseUtils';
import VoiceInput from '../../components/voiceInput';

interface Message {
	id: string;
	type: 'user' | 'assistant';
	content: string;
	images?: string[];
	timestamp: Date;
}

interface ChatSession {
	id: string;
	title: string;
	lastMessage: string;
	timestamp: Date;
	messageCount: number;
}

interface UploadedImage {
	id: string;
	file: File;
	preview: string;
	name: string;
}

export default function ChatPage() {
	const { user, isLoaded } = useUser();

	useEffect(() => {
		if (isLoaded && !user) {
			redirect('/');
		}
	}, [isLoaded, user]);

	useEffect(() => {
		const loadUserData = async () => {
			if (isLoaded && user) {
				setIsLoadingData(true);
				try {
					const sessions = await loadChatSessions(user.id);
					const convertedSessions = sessions.map((session) => ({
						...session,
						timestamp: session.timestamp.toDate(),
					}));
					setChatSessions(convertedSessions);
				} catch (error) {
					console.error('Error loading user data', error);
				} finally {
					setIsLoadingData(false);
				}
			}
		};

		loadUserData();
	}, [isLoaded, user]);

	const [messages, setMessages] = useState<Message[]>([]);
	const [inputMessage, setInputMessage] = useState('');
	const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isLoadingData, setIsLoadingData] = useState(true);

	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [currentChatId, setCurrentChatId] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const voiceInput = VoiceInput({
		onTranscript: (text: string) => {
			setInputMessage((prev) => prev + (prev ? ' ' : '') + text);
		},
		disabled: uploadedImages.length === 0 || isLoading,
		size: 'md',
	});

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${Math.min(
				textareaRef.current.scrollHeight,
				120
			)}px`;
		}
	}, [inputMessage]);

	const createNewChat = () => {
		setMessages([]);
		setCurrentChatId(null);
		setUploadedImages([]);
		setInputMessage('');
		setIsSidebarOpen(false);
		if (voiceInput.isRecording) {
			voiceInput.forceStop();
		}
	};

	const deleteChat = async (chatId: string) => {
		if (!user) return;

		try {
			await deleteFirebaseChatSession(chatId, user.id);
			setChatSessions((prev) =>
				prev.filter((chat) => chat.id !== chatId)
			);
			if (currentChatId === chatId) {
				createNewChat();
			}
		} catch (error) {
			console.error('Error deleting chat:', error);
		}
	};

	const loadChat = async (chatId: string) => {
		if (!user) return;

		setCurrentChatId(chatId);
		setIsSidebarOpen(false);

		if (voiceInput.isRecording) {
			voiceInput.forceStop();
		}

		try {
			const chatMessages = await loadMessages(chatId, user.id);
			const convertedMessages = chatMessages.map((msg) => ({
				...msg,
				timestamp: msg.timestamp.toDate(),
			}));
			setMessages(convertedMessages);
		} catch (error) {
			console.error('Error loading chat messages:', error);
			setMessages([]);
		}
	};

	const formatTime = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);

		files.forEach((file) => {
			if (!file.type.startsWith('image/')) {
				alert('Please upload only image files');
				return;
			}

			const preview = URL.createObjectURL(file);

			const uploadedImage: UploadedImage = {
				id: Date.now().toString() + Math.random(),
				file,
				preview,
				name: file.name,
			};

			setUploadedImages((prev) => [...prev, uploadedImage]);
		});

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const removeImage = (imageId: string) => {
		setUploadedImages((prev) => {
			const imageToRemove = prev.find((img) => img.id === imageId);
			if (imageToRemove) {
				URL.revokeObjectURL(imageToRemove.preview);
			}
			return prev.filter((img) => img.id !== imageId);
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!inputMessage.trim() && uploadedImages.length === 0) return;
		if (!user) return;

		if (voiceInput.isRecording) {
			voiceInput.forceStop();
		}

		setIsLoading(true);

		const imageDataUrls = await Promise.all(
			uploadedImages.map((img) => fileToBase64(img.file))
		);

		const userMessage: Message = {
			id: Date.now().toString(),
			type: 'user',
			content: inputMessage || 'Analyze these images',
			images: uploadedImages.map((img) => img.preview),
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);

		const imagesToProcess = [...uploadedImages];
		const currentMessage = inputMessage;
		setInputMessage('');
		setUploadedImages([]);

		try {
			let activeChatId = currentChatId;

			if (!activeChatId) {
				activeChatId = Date.now().toString();
				setCurrentChatId(activeChatId);
			}

			await saveMessage({
				id: userMessage.id,
				type: userMessage.type,
				content: userMessage.content,
				images: imageDataUrls,
				timestamp: userMessage.timestamp,
				chatId: activeChatId,
				userId: user.id,
			});

			const response = await fetch('/api/analyze-images', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: currentMessage,
					images: imageDataUrls,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to analyze images');
			}

			const { analysis } = await response.json();

			const aiMessage: Message = {
				id: (Date.now() + 1).toString(),
				type: 'assistant',
				content: analysis,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, aiMessage]);

			await saveMessage({
				id: aiMessage.id,
				type: aiMessage.type,
				content: aiMessage.content,
				timestamp: aiMessage.timestamp,
				chatId: activeChatId,
				userId: user.id,
			});

			if (!currentChatId) {
				const newSession: ChatSession = {
					id: activeChatId,
					title:
						currentMessage.slice(0, 50) +
							(currentMessage.length > 50 ? '...' : '') ||
						'Image Analysis',
					lastMessage:
						analysis.slice(0, 100) +
						(analysis.length > 100 ? '...' : ''),
					timestamp: new Date(),
					messageCount: 2,
				};

				await saveChatSession(newSession, user.id);
				setChatSessions((prev) => [newSession, ...prev]);
			} else {
				const updatedSession = {
					lastMessage:
						analysis.slice(0, 100) +
						(analysis.length > 100 ? '...' : ''),
					timestamp: new Date(),
					messageCount: messages.length + 2,
				};

				await updateChatSession(activeChatId, updatedSession, user.id);
				setChatSessions((prev) =>
					prev.map((chat) =>
						chat.id === activeChatId
							? { ...chat, ...updatedSession }
							: chat
					)
				);
			}
		} catch (error: any) {
			console.error('Error processing message:', error);

			let errorMessage =
				'Sorry, I encountered an error while analyzing your images. Please try again.';

			if (error.message.includes('API key')) {
				errorMessage =
					'AI service configuration error. Please contact support.';
			} else if (error.message.includes('quota')) {
				errorMessage =
					'AI service quota exceeded. Please try again later.';
			} else if (error.message.includes('Invalid')) {
				errorMessage =
					'Invalid request. Please check your images and try again.';
			}

			const errorResponse: Message = {
				id: (Date.now() + 1).toString(),
				type: 'assistant',
				content: errorMessage,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, errorResponse]);
		} finally {
			imagesToProcess.forEach((img) => {
				URL.revokeObjectURL(img.preview);
			});
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (voiceInput.isRecording) {
				voiceInput.forceStop();
			}
			handleSubmit(e);
		}
	};

	if (!isLoaded || isLoadingData) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						{!isLoaded ? 'Loading...' : 'Loading your chats...'}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen bg-gray-50 dark:bg-gray-900">
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			<div
				className={`
					fixed lg:relative inset-y-0 left-0 z-50
					w-80 bg-white dark:bg-gray-800
					border-r border-gray-200 dark:border-gray-700
					transform transition-transform duration-300 ease-in-out
					${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
				`}
			>
				<div className="flex flex-col h-full">
					<div className="p-6 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">
								ALASCHAT
							</h2>
							<button
								onClick={createNewChat}
								className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
							>
								<Plus className="h-4 w-4" />
								New Chat
							</button>
						</div>

						<div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
							<div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
								{user?.firstName?.charAt(0) ||
									user?.emailAddresses[0]?.emailAddress.charAt(
										0
									) ||
									'U'}
							</div>

							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
									{user?.firstName ||
										user?.emailAddresses[0]?.emailAddress}
								</p>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									{chatSessions.length} conversations
								</p>
							</div>

							<UserButton afterSignOutUrl="/" />
						</div>
					</div>

					<div className="flex-1 overflow-y-auto p-4">
						<div className="space-y-2">
							{chatSessions.map((chat) => (
								<div
									key={chat.id}
									className={`
										group flex items-start gap-3 p-4 rounded-lg cursor-pointer
										transition-all duration-200 border
										${
											currentChatId === chat.id
												? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
												: 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
										}
									`}
									onClick={() => loadChat(chat.id)}
								>
									<div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
										<MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									</div>

									<div className="flex-1 min-w-0">
										<h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
											{chat.title}
										</h3>
										<p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
											{chat.lastMessage}
										</p>
										<div className="flex items-center justify-between mt-2">
											<span className="text-xs text-gray-400 dark:text-gray-500">
												{formatTime(chat.timestamp)}
											</span>
											<span className="text-xs text-gray-400 dark:text-gray-500">
												{chat.messageCount} messages
											</span>
										</div>
									</div>

									<button
										onClick={(e) => {
											e.stopPropagation();
											deleteChat(chat.id);
										}}
										className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded cursor-pointer"
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</button>
								</div>
							))}
						</div>

						{chatSessions.length === 0 && (
							<div className="text-center py-12">
								<MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
								<p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
									No conversations yet
								</p>
								<p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
									Start by uploading an image!
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex-1 flex flex-col min-w-0">
				<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<button
								onClick={() => setIsSidebarOpen(true)}
								className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
							>
								<Menu className="h-5 w-5" />
							</button>

							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
									<Bot className="h-5 w-5 text-white" />
								</div>
								<div>
									<h1 className="font-semibold text-gray-900 dark:text-white">
										{currentChatId
											? chatSessions.find(
													(c) =>
														c.id === currentChatId
											  )?.title || 'Chat'
											: 'New Conversation'}
									</h1>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										AI Image Analysis Assistant with Voice
										Input
									</p>
								</div>
							</div>
						</div>
					</div>
				</header>

				<div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 px-6 py-6">
					<div className="max-w-4xl mx-auto space-y-6">
						{messages.length === 0 && (
							<div className="text-center py-16">
								<div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
									<Bot className="h-10 w-10 text-blue-600 dark:text-blue-400" />
								</div>
								<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
									Welcome to ALASCHAT!
								</h2>
								<p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
									Upload images and ask me anything about them
									using text or voice input. I'll help you
									analyze and understand your visual content.
								</p>
								<div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
									<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
										Try asking:
									</p>
									<ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
										<li>
											🗣️ "What do you see in this image?"
										</li>
										<li>
											📊 "Analyze the data in this chart"
										</li>
										<li>
											📈 "What trends can you identify?"
										</li>
									</ul>
								</div>
							</div>
						)}

						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex gap-4 ${
									message.type === 'user'
										? 'justify-end'
										: 'justify-start'
								}`}
							>
								{message.type === 'assistant' && (
									<div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
										<Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
									</div>
								)}

								<div
									className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
										message.type === 'user' ? 'order-1' : ''
									}`}
								>
									<div
										className={`
											rounded-2xl px-6 py-4 border
											${
												message.type === 'user'
													? 'bg-blue-600 text-white border-blue-600'
													: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700'
											}
										`}
									>
										{message.images &&
											message.images.length > 0 && (
												<div className="mb-4 space-y-3">
													{message.images.map(
														(imageUrl, index) => (
															<img
																key={index}
																src={imageUrl}
																alt={`Uploaded image ${
																	index + 1
																}`}
																className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
															/>
														)
													)}
												</div>
											)}

										<p className="whitespace-pre-wrap text-sm leading-relaxed">
											{message.content}
										</p>
									</div>

									<p
										className={`text-xs text-gray-500 dark:text-gray-400 mt-2 ${
											message.type === 'user'
												? 'text-right'
												: 'text-left'
										}`}
									>
										{message.timestamp.toLocaleTimeString(
											[],
											{
												hour: '2-digit',
												minute: '2-digit',
											}
										)}
									</p>
								</div>

								{message.type === 'user' && (
									<div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 order-2">
										<span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
											{user?.firstName?.charAt(0) || 'U'}
										</span>
									</div>
								)}
							</div>
						))}

						{isLoading && (
							<div className="flex justify-start gap-4">
								<div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
									<Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
								</div>
								<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4">
									<div className="flex items-center gap-3">
										<div className="flex gap-1">
											<div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
											<div
												className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
												style={{
													animationDelay: '0.1s',
												}}
											></div>
											<div
												className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
												style={{
													animationDelay: '0.2s',
												}}
											></div>
										</div>
										<span className="text-sm text-gray-500 dark:text-gray-400">
											AI is analyzing...
										</span>
									</div>
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
					<div className="max-w-4xl mx-auto">
						{uploadedImages.length > 0 && (
							<div className="mb-4">
								<div className="flex flex-wrap gap-3">
									{uploadedImages.map((image) => (
										<div
											key={image.id}
											className="relative"
										>
											<img
												src={image.preview}
												alt={image.name}
												className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
											/>
											<button
												onClick={() =>
													removeImage(image.id)
												}
												className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
											>
												<X className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
							</div>
						)}

						{uploadedImages.length === 0 && (
							<div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
								<p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
									<Paperclip className="w-4 h-4" />
									Upload an image first to enable text and
									voice input
								</p>
							</div>
						)}

						{uploadedImages.length > 0 && (
							<div className="mb-4">
								<voiceInput.VoiceStatus />
							</div>
						)}

						<form
							onSubmit={handleSubmit}
							className="flex items-end gap-3"
						>
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleFileUpload}
								accept="image/*"
								multiple
								className="hidden"
							/>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="flex-shrink-0 h-12 px-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl transition-colors cursor-pointer"
								title="Upload images"
							>
								<Paperclip className="w-5 h-5" />
							</button>

							<voiceInput.VoiceButton />

							<div className="flex-1">
								<textarea
									ref={textareaRef}
									value={
										inputMessage +
										(voiceInput.interimText
											? ' ' + voiceInput.interimText
											: '')
									}
									onChange={(e) =>
										setInputMessage(e.target.value)
									}
									onKeyDown={handleKeyDown}
									placeholder={
										uploadedImages.length === 0
											? 'Upload an image first to start chatting...'
											: voiceInput.isRecording
											? '🎤 Listening... Speak now or continue typing'
											: 'Type your message or click the mic to speak...'
									}
									rows={1}
									className={`w-full h-12 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
										uploadedImages.length === 0
											? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed'
											: voiceInput.isRecording
											? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
											: 'bg-white dark:bg-gray-700'
									}`}
									disabled={
										isLoading || uploadedImages.length === 0
									}
								/>
							</div>

							<button
								type="submit"
								disabled={
									uploadedImages.length === 0 ||
									(!inputMessage.trim() &&
										uploadedImages.length === 0) ||
									isLoading
								}
								className="flex-shrink-0 h-12 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
							>
								<Send className="w-5 h-5" />
							</button>
						</form>

						<div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
							{voiceInput.speechSupported ? (
								<span>
									🎤 Voice input ready • Chrome, Edge, Safari
									supported • 📱 Mobile optimized • Firefox
									not supported
								</span>
							) : (
								<span>
									🚫 Voice features require Chrome, Edge, or
									Safari • Firefox doesn't support voice input
								</span>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
