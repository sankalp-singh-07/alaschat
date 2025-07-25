'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import {
	Send,
	X,
	MessageSquare,
	Bot,
	Paperclip,
	Plus,
	Trash2,
	Menu,
	Upload,
} from 'lucide-react';
import {
	createMessage,
	createSession,
	deleteSession,
	getMessages,
	getSessions,
	updateSession,
	testConnection,
	type Message,
	type ChatSession,
} from '@/lib/supabaseUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface UploadedImage {
	id: string;
	file: File;
	preview: string;
	name: string;
}

interface MessageStatus {
	id: string;
	status: 'sending' | 'sent' | 'analyzing' | 'completed' | 'error';
}

export default function ChatPage() {
	const { user, isLoaded } = useUser();

	useEffect(() => {
		if (isLoaded && !user) {
			redirect('/');
		}
	}, [isLoaded, user]);

	useEffect(() => {
		const testDB = async () => {
			if (isLoaded && user) {
				const connected = await testConnection();
				if (!connected) {
					toast.error(
						'Database connection failed. Please check your setup.'
					);
				}
			}
		};
		testDB();
	}, [isLoaded, user]);

	const [messages, setMessages] = useState<Message[]>([]);
	const [inputMessage, setInputMessage] = useState('');
	const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
	const [currentSessionImages, setCurrentSessionImages] = useState<string[]>(
		[]
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isUploadingImages, setIsUploadingImages] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isLoadingData, setIsLoadingData] = useState(true);
	const [messageStatuses, setMessageStatuses] = useState<MessageStatus[]>([]);
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [currentChatId, setCurrentChatId] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const loadUserData = async () => {
			if (isLoaded && user) {
				setIsLoadingData(true);
				try {
					const sessions = await getSessions(user.id);
					setChatSessions(sessions);
				} catch (error) {
					console.error('Error loading user data', error);
					toast.error('Failed to load chat sessions');
				} finally {
					setIsLoadingData(false);
				}
			}
		};

		loadUserData();
	}, [isLoaded, user]);

	useEffect(() => {
		scrollToBottom();
	}, [messages, messageStatuses]);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${Math.min(
				textareaRef.current.scrollHeight,
				120
			)}px`;
		}
	}, [inputMessage]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const addMessageStatus = (id: string, status: MessageStatus['status']) => {
		setMessageStatuses((prev) => [
			...prev.filter((m) => m.id !== id),
			{ id, status },
		]);
	};

	const updateMessageStatus = (
		id: string,
		status: MessageStatus['status']
	) => {
		setMessageStatuses((prev) =>
			prev.map((m) => (m.id === id ? { ...m, status } : m))
		);
	};

	const removeMessageStatus = (id: string) => {
		setMessageStatuses((prev) => prev.filter((m) => m.id !== id));
	};

	const createNewChat = () => {
		setMessages([]);
		setCurrentChatId(null);
		setUploadedImages([]);
		setCurrentSessionImages([]);
		setInputMessage('');
		setIsSidebarOpen(false);
		setMessageStatuses([]);
	};

	const deleteChat = async (chatId: string) => {
		if (!user) return;

		try {
			await deleteSession(chatId, user.id);
			setChatSessions((prev) =>
				prev.filter((chat) => chat.id !== chatId)
			);
			if (currentChatId === chatId) {
				createNewChat();
			}
			toast.success('Chat deleted successfully');
		} catch (error) {
			console.error('Error deleting chat:', error);
			toast.error('Failed to delete chat');
		}
	};

	const loadChat = async (chatId: string) => {
		if (!user) return;

		setCurrentChatId(chatId);
		setIsSidebarOpen(false);

		try {
			const chatMessages = await getMessages(chatId);
			setMessages(chatMessages);

			const session = chatSessions.find((s) => s.id === chatId);
			if (session && session.last_img) {
				setCurrentSessionImages(session.last_img);
			} else {
				setCurrentSessionImages([]);
			}
			setUploadedImages([]); // Clear any newly uploaded images when loading an old chat
		} catch (error) {
			console.error('Error loading chat messages:', error);
			setMessages([]);
			toast.error('Failed to load chat messages');
		}
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);

		files.forEach((file) => {
			if (!file.type.startsWith('image/')) {
				toast.error('Please upload only image files');
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

	const uploadImagesToCloudinary = async (
		images: UploadedImage[]
	): Promise<string[]> => {
		setIsUploadingImages(true);
		try {
			const formData = new FormData();
			images.forEach((image) => {
				formData.append('images', image.file);
			});

			const response = await fetch('/api/upload-images', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Failed to upload images');
			}

			const { imageUrls } = await response.json();
			return imageUrls;
		} catch (error) {
			console.error('Error uploading images:', error);
			throw error;
		} finally {
			setIsUploadingImages(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!inputMessage.trim() &&
			uploadedImages.length === 0 &&
			currentChatId === null
		) {
			toast.warning(
				'Please type a message or upload an image to start the conversation.'
			);
			return;
		}
		if (!user) return;

		let imagesToSend: string[] = [];
		const isNewImagesUploaded = uploadedImages.length > 0;

		if (isNewImagesUploaded) {
			addMessageStatus('uploading', 'sending');
			toast.info('Uploading images...', { autoClose: 2000 });
			try {
				imagesToSend = await uploadImagesToCloudinary(uploadedImages);
				setCurrentSessionImages(imagesToSend);
			} catch (error) {
				toast.error('Failed to upload images. Please try again.');
				removeMessageStatus('uploading');
				setIsLoading(false);
				return;
			}
			removeMessageStatus('uploading');
		} else {
			imagesToSend = currentSessionImages;
		}

		if (imagesToSend.length === 0 && !currentChatId) {
			toast.warning(
				'Please upload an image first to start the conversation.'
			);
			return;
		}

		const messageId = uuidv4();
		addMessageStatus(messageId, 'sending');
		setIsLoading(true);

		const newChatId = currentChatId || uuidv4();
		const currentMessage = inputMessage;
		const isNewChat = !currentChatId;

		try {
			if (isNewChat) {
				const newSession: ChatSession = {
					id: newChatId,
					title:
						currentMessage.slice(0, 50) +
							(currentMessage.length > 50 ? '...' : '') ||
						'Image Analysis',
					last_message: currentMessage || 'Image Analysis',
					message_count: 0,
					last_img: imagesToSend,
					user_id: user.id,
				};
				await createSession(newSession);
				setChatSessions((prev) => [newSession, ...prev]);
				setCurrentChatId(newChatId);
			}

			setInputMessage('');
			setUploadedImages([]);

			const userMessage: Message = {
				id: messageId,
				type: 'user',
				content: currentMessage,
				image_url: imagesToSend,
				chat_id: newChatId,
				user_id: user.id,
			};

			setMessages((prev) => [...prev, userMessage]);
			updateMessageStatus(messageId, 'sent');
			toast.success('Message sent!', { autoClose: 1500 });

			await createMessage(userMessage);

			updateMessageStatus(messageId, 'analyzing');
			toast.info('AI is analyzing your message...', { autoClose: 3000 });

			const response = await fetch('/api/analyze-images', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: currentMessage,
					images: imagesToSend,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to analyze images');
			}

			const { analysis } = await response.json();

			const aiMessage: Message = {
				type: 'assistant',
				content: analysis,
				chat_id: newChatId,
				user_id: user.id,
			};

			setMessages((prev) => [...prev, aiMessage]);
			updateMessageStatus(messageId, 'completed');
			toast.success('Analysis complete!', { autoClose: 1000 });

			await createMessage(aiMessage);

			const updatedSession = await updateSession(newChatId, {
				last_message:
					analysis.slice(0, 100) +
					(analysis.length > 100 ? '...' : ''),
				message_count: messages.length + 2,
				last_img: imagesToSend,
			});

			setChatSessions((prev) =>
				prev.map((chat) =>
					chat.id === newChatId ? updatedSession : chat
				)
			);

			setTimeout(() => removeMessageStatus(messageId), 2000);
		} catch (error: any) {
			console.error('Error processing message:', error);
			updateMessageStatus(messageId, 'error');

			let errorMessage =
				'Sorry, I encountered an error while analyzing your images. Please try again.';

			if (error.message.includes('API key')) {
				errorMessage =
					'AI service configuration error. Please contact support.';
			} else if (error.message.includes('quota')) {
				errorMessage =
					'AI service quota exceeded. Please try again later.';
			} else if (error.message.includes('upload')) {
				errorMessage = 'Failed to upload images. Please try again.';
			}

			const errorResponse: Message = {
				type: 'assistant',
				content: errorMessage,
				chat_id: newChatId,
				user_id: user.id,
			};

			setMessages((prev) => [...prev, errorResponse]);
			toast.error(errorMessage);

			setTimeout(() => removeMessageStatus(messageId), 3000);
		} finally {
			uploadedImages.forEach((img) => {
				URL.revokeObjectURL(img.preview);
			});
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const currentStatus = messageStatuses[messageStatuses.length - 1];
	const hasAnyImages =
		uploadedImages.length > 0 || currentSessionImages.length > 0;

	if (!isLoaded || isLoadingData) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						{!isLoaded
							? 'Loading authentication...'
							: 'Loading your chats...'}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-inter">
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
                    ${
						isSidebarOpen
							? 'translate-x-0'
							: '-translate-x-full lg:translate-x-0'
					}
                `}
			>
				<div className="flex flex-col h-full">
					<div className="p-6 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">
								ALASCHAT
							</h2>
							<div className="flex gap-2">
								<button
									onClick={createNewChat}
									className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
									title="Start a new chat"
								>
									<Plus className="h-4 w-4" />
									<span className="hidden lg:block">
										New Chat
									</span>
								</button>
								<button
									onClick={() => setIsSidebarOpen(false)}
									className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white dark:text-gray-200 bg-red-500 dark:bg-gray-700 rounded-lg hover:bg-red-800 dark:hover:bg-red-800 transition-colors cursor-pointer lg:hidden"
									title="Close sidebar"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
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

							<UserButton />
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
											{chat.last_message}
										</p>
										<div className="flex items-center justify-between mt-2">
											<span className="text-xs text-gray-400 dark:text-gray-500">
												{chat.updated_at &&
													formatTime(chat.updated_at)}
											</span>
											<span className="text-xs text-gray-400 dark:text-gray-500">
												{chat.message_count} messages
											</span>
										</div>
									</div>

									<button
										onClick={(e) => {
											e.stopPropagation();
											deleteChat(chat.id);
										}}
										className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded cursor-pointer"
										title="Delete chat"
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
								title="Open sidebar"
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
										AI Image Analysis Assistant
										{currentSessionImages.length > 0 &&
											` • ${
												currentSessionImages.length
											} image${
												currentSessionImages.length > 1
													? 's'
													: ''
											} loaded`}
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
									Upload images and ask me anything about
									them. I'll help you analyze and understand
									your visual content.
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
						{currentSessionImages.length > 0 &&
							messages.length === 0 && (
								<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
									<div className="flex items-center gap-2 mb-3">
										<Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
										<span className="text-sm font-medium text-blue-800 dark:text-blue-200">
											Current Session Images (
											{currentSessionImages.length})
										</span>
									</div>
									<div className="flex flex-wrap gap-3">
										{currentSessionImages.map(
											(imageUrl, index) => (
												<img
													key={index}
													src={imageUrl}
													alt={`Session image ${
														index + 1
													}`}
													className="w-16 h-16 object-cover rounded-lg border border-blue-300 dark:border-blue-600"
												/>
											)
										)}
									</div>
									<p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
										You can continue asking questions about
										these images or upload new ones to
										replace them.
									</p>
								</div>
							)}
						{messages.map((message, index) => (
							<div
								key={message.id || index}
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
										{message.image_url &&
											message.image_url.length > 0 && (
												<div className="mb-4 space-y-3">
													{message.image_url.map(
														(
															imageUrl,
															imgIndex
														) => (
															<img
																key={imgIndex}
																src={imageUrl}
																alt={`Uploaded image ${
																	imgIndex + 1
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
										{message.created_at &&
											new Date(
												message.created_at
											).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit',
											})}
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
						{currentStatus && (
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
											{currentStatus.status ===
												'sending' &&
												'Sending message...'}
											{currentStatus.status === 'sent' &&
												'Message sent!'}
											{currentStatus.status ===
												'analyzing' &&
												'AI is analyzing...'}
											{currentStatus.status === 'error' &&
												'Error occurred'}
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
												className="w-20 h-20 object-cover rounded-lg "
											/>
											<button
												onClick={() =>
													removeImage(image.id)
												}
												className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
												title="Remove image"
											>
												<X className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
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
								className={`flex-shrink-0 h-12 px-4 border rounded-xl transition-colors cursor-pointer ${
									hasAnyImages && uploadedImages.length === 0
										? 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
										: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
								}`}
								title={
									hasAnyImages && uploadedImages.length === 0
										? 'Upload new images (optional)'
										: 'Upload images (required)'
								}
								disabled={isLoading || isUploadingImages}
							>
								<Paperclip className="w-5 h-5" />
							</button>

							<div className="flex-1">
								<textarea
									ref={textareaRef}
									value={inputMessage}
									onChange={(e) =>
										setInputMessage(e.target.value)
									}
									onKeyDown={handleKeyDown}
									placeholder={
										currentStatus?.status === 'analyzing'
											? 'AI is analyzing...'
											: hasAnyImages
											? `Ask Anything now...`
											: 'Upload an image first to start chatting...'
									}
									rows={1}
									className={`w-full h-12 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
										!hasAnyImages ||
										currentStatus?.status === 'analyzing'
											? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed'
											: 'bg-white dark:bg-gray-700'
									}`}
									disabled={
										isLoading ||
										isUploadingImages ||
										!hasAnyImages ||
										currentStatus?.status === 'analyzing'
									}
								/>
							</div>

							<button
								type="submit"
								disabled={
									!hasAnyImages ||
									!inputMessage.trim() ||
									isLoading ||
									isUploadingImages ||
									currentStatus?.status === 'analyzing'
								}
								className="flex-shrink-0 h-12 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
								title="Send message"
							>
								{currentStatus?.status === 'sending' ||
								isUploadingImages ? (
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<Send className="w-5 h-5" />
								)}
							</button>
						</form>

						<div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
							{!hasAnyImages ? (
								<span className="text-amber-600 dark:text-amber-400">
									🖼️ Upload images to start analyzing with AI
								</span>
							) : currentSessionImages.length > 0 &&
							  uploadedImages.length === 0 ? (
								<span>
									💬 Continue asking about your images or
									upload new ones to replace them
								</span>
							) : (
								<span>✨ AI-powered image analysis ready</span>
							)}
						</div>
					</div>
				</div>
			</div>
			<ToastContainer
				position="top-right"
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
			/>
		</div>
	);
}
