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
	const [hasSpoken, setHasSpoken] = useState<boolean>(false);
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
			setHasSpoken(true);
		}
	}, [transcript, setInputMessage]);

	const toggleListening = async () => {
		if (disabled || !hasImages) return;

		if (listening) {
			await SpeechRecognition.stopListening();

			if (toastIdRef.current) {
				toast.dismiss(toastIdRef.current);
				toastIdRef.current = null;
			}

			if (hasSpoken) {
				toast.success('✅ Voice input captured!', { autoClose: 1500 });
			} else {
				toast.info('🔇 No speech detected', { autoClose: 1500 });
			}
		} else {
			if (!isMicrophoneAvailable) {
				toast.error('🎤 Microphone not available. Check permissions.');
				return;
			}

			resetTranscript();
			setHasSpoken(false);

			try {
				await SpeechRecognition.startListening({
					continuous: true,
					language: 'en-US',
				});
				toastIdRef.current = toast.info('🎤 Listening... Speak now', {
					autoClose: false,
					closeButton: false,
				});
			} catch (error) {
				console.error('Speech recognition error:', error);
				toast.error('❌ Failed to start voice input.');
			}
		}
	};

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
			SpeechRecognition.abortListening();
		};
	}, []);

	if (!browserSupportsSpeechRecognition) {
		return (
			<div
				title="Voice input not supported"
				className="flex-shrink-0 h-12 px-4 border rounded-xl bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-not-allowed"
			>
				<Mic className="w-5 h-5 text-gray-400" />
			</div>
		);
	}

	const isEffectivelyDisabled = disabled || !hasImages;

	return (
		<div className="relative">
			<button
				type="button"
				onClick={toggleListening}
				disabled={isEffectivelyDisabled}
				className={`
                    flex-shrink-0 h-12 px-4 border rounded-xl transition-all duration-200 cursor-pointer
                    flex items-center justify-center relative overflow-hidden
                    ${
						listening
							? 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600 shadow-lg'
							: !isEffectivelyDisabled
							? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
							: 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 cursor-not-allowed'
					}
                    ${isEffectivelyDisabled ? 'opacity-50' : ''}
                `}
				title={
					!hasImages
						? 'Upload images first to use voice input'
						: disabled
						? 'Voice input disabled'
						: !isMicrophoneAvailable
						? 'Microphone not available'
						: listening
						? 'Stop recording (Ctrl+Space)'
						: 'Start voice input (Ctrl+Space)'
				}
			>
				{listening ? (
					<MicOff className="w-5 h-5 relative z-10" />
				) : (
					<Mic className="w-5 h-5 relative z-10" />
				)}

				{listening && (
					<>
						<div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
						<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
						<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
						{hasSpoken && (
							<div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
						)}
					</>
				)}
			</button>
		</div>
	);
};
