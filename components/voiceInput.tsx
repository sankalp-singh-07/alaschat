import { Mic, MicOff } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import SpeechRecognition, {
	useSpeechRecognition,
} from 'react-speech-recognition';
import { toast } from 'react-toastify';

interface VoiceInputProps {
	setInputMessage: (message: string) => void;
	disabled?: boolean;
	hasImages?: boolean;
}

export const VoiceInput = ({
	setInputMessage,
	disabled = false,
	hasImages = true,
}: VoiceInputProps) => {
	const [isListening, setIsListening] = useState<boolean>(false);
	const [hasSpokenText, setHasSpokenText] = useState<boolean>(false);
	const toastIdRef = useRef<any>(null);

	const {
		transcript,
		listening,
		resetTranscript,
		browserSupportsSpeechRecognition,
		isMicrophoneAvailable,
	} = useSpeechRecognition();

	useEffect(() => {
		if (transcript) {
			setInputMessage(transcript);
			setHasSpokenText(true);
		}
	}, [transcript, setInputMessage]);

	useEffect(() => {
		setIsListening(listening);
	}, [listening]);

	const toggleListening = useCallback(async () => {
		if (disabled || !hasImages) return;

		try {
			if (listening) {
				SpeechRecognition.stopListening();
				setIsListening(false);

				if (toastIdRef.current) {
					toast.dismiss(toastIdRef.current);
					toastIdRef.current = null;
				}

				if (hasSpokenText && transcript.trim()) {
					toast.success('✅ Voice input captured!', {
						autoClose: 1500,
					});
				} else {
					toast.info('🔇 No speech detected', { autoClose: 1500 });
				}

				setHasSpokenText(false);
			} else {
				if (!isMicrophoneAvailable) {
					toast.error(
						'🎤 Microphone not available. Please check permissions.'
					);
					return;
				}

				resetTranscript();
				setHasSpokenText(false);

				await SpeechRecognition.startListening({
					continuous: true,
					language: 'en-US',
				});
				setIsListening(true);

				toastIdRef.current = toast.info('🎤 Listening... Speak now', {
					autoClose: false,
					closeButton: false,
				});
			}
		} catch (error) {
			console.error('Speech recognition error:', error);
			toast.error('❌ Failed to start voice input. Please try again.');
			setIsListening(false);
			setHasSpokenText(false);

			if (toastIdRef.current) {
				toast.dismiss(toastIdRef.current);
				toastIdRef.current = null;
			}
		}
	}, [
		listening,
		transcript,
		disabled,
		hasImages,
		isMicrophoneAvailable,
		resetTranscript,
		hasSpokenText,
	]);

	const handleKeyboardShortcut = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === ' ' && e.ctrlKey) {
				e.preventDefault();
				toggleListening();
			}
		},
		[toggleListening]
	);

	useEffect(() => {
		if (browserSupportsSpeechRecognition) {
			document.addEventListener('keydown', handleKeyboardShortcut);
			return () => {
				document.removeEventListener('keydown', handleKeyboardShortcut);
			};
		}
	}, [handleKeyboardShortcut, browserSupportsSpeechRecognition]);

	useEffect(() => {
		return () => {
			if (toastIdRef.current) {
				toast.dismiss(toastIdRef.current);
			}
		};
	}, []);

	if (!browserSupportsSpeechRecognition) {
		return (
			<div className="flex-shrink-0 h-12 px-4 border rounded-xl bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-not-allowed">
				<Mic className="w-5 h-5 text-gray-400" />
			</div>
		);
	}

	const isDisabled = disabled || !hasImages || !isMicrophoneAvailable;

	return (
		<div className="relative">
			<button
				type="button"
				onClick={toggleListening}
				disabled={isDisabled}
				className={`
					flex-shrink-0 h-12 px-4 border rounded-xl transition-all duration-200 cursor-pointer
					flex items-center justify-center relative overflow-hidden
					${
						isListening
							? 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600 shadow-lg'
							: hasImages && !disabled
							? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
							: 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 cursor-not-allowed'
					}
					${isDisabled ? 'opacity-50' : ''}
				`}
				title={
					!hasImages
						? 'Upload images first to use voice input'
						: disabled
						? 'Voice input disabled'
						: !isMicrophoneAvailable
						? 'Microphone not available'
						: isListening
						? 'Stop recording (Ctrl+Space)'
						: 'Start voice input (Ctrl+Space)'
				}
			>
				{isListening ? (
					<MicOff className="w-5 h-5 relative z-10" />
				) : (
					<Mic className="w-5 h-5 relative z-10" />
				)}

				{isListening && (
					<>
						<div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>

						<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
						<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>

						{hasSpokenText && (
							<div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
						)}
					</>
				)}
			</button>
		</div>
	);
};
