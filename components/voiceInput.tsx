import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceInputProps {
	onTranscript: (text: string) => void;
	disabled?: boolean;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
}

interface SpeechRecognitionEvent extends Event {
	resultIndex: number;
	results: {
		length: number;
		[index: number]: {
			isFinal: boolean;
			[index: number]: {
				transcript: string;
				confidence: number;
			};
		};
	};
}

export default function VoiceInput({
	onTranscript,
	disabled = false,
	className = '',
	size = 'md',
}: VoiceInputProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [speechSupported, setSpeechSupported] = useState(false);
	const [voiceStatus, setVoiceStatus] = useState('Checking voice support...');
	const [interimText, setInterimText] = useState('');
	const [permissionGranted, setPermissionGranted] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [browserType, setBrowserType] = useState<
		'chrome' | 'edge' | 'firefox' | 'safari' | 'other'
	>('other');
	const [isMobile, setIsMobile] = useState(false);

	const recognitionRef = useRef<any>(null);
	const isRecognitionActive = useRef(false);
	const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastTranscriptRef = useRef<string>('');
	const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const mobileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const detectBrowser = useCallback(() => {
		if (typeof window === 'undefined') return 'other';

		const userAgent = window.navigator.userAgent.toLowerCase();

		// Detect if mobile device
		const isMobileDevice =
			/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
				userAgent
			) ||
			(navigator.maxTouchPoints &&
				navigator.maxTouchPoints > 2 &&
				/macintosh/.test(userAgent));
		setIsMobile(Boolean(isMobileDevice));

		if (userAgent.includes('firefox')) {
			return 'firefox';
		} else if (userAgent.includes('edg/')) {
			return 'edge';
		} else if (userAgent.includes('chrome')) {
			return 'chrome';
		} else if (userAgent.includes('safari')) {
			return 'safari';
		} else {
			return 'other';
		}
	}, []);

	const checkMicrophonePermission = useCallback(async () => {
		try {
			if (
				!navigator.mediaDevices ||
				!navigator.mediaDevices.getUserMedia
			) {
				setVoiceStatus('❌ Microphone not supported');
				return false;
			}

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			stream.getTracks().forEach((track) => track.stop());
			setPermissionGranted(true);
			setVoiceStatus('🎤 Voice input ready - Click mic to start');
			return true;
		} catch (error: any) {
			console.error('Microphone permission error:', error);
			if (
				error.name === 'NotAllowedError' ||
				error.name === 'PermissionDeniedError'
			) {
				setVoiceStatus(
					'🚫 Microphone access denied - Please allow microphone access'
				);
			} else if (
				error.name === 'NotFoundError' ||
				error.name === 'DevicesNotFoundError'
			) {
				setVoiceStatus(
					'🔍 No microphone found - Please connect a microphone'
				);
			} else {
				setVoiceStatus('❌ Microphone error: ' + error.message);
			}
			setPermissionGranted(false);
			return false;
		}
	}, []);

	const initializeSpeechRecognition = useCallback(() => {
		if (typeof window === 'undefined') return false;

		const browser = detectBrowser();
		setBrowserType(browser);

		// Firefox doesn't support Web Speech API
		if (browser === 'firefox') {
			setSpeechSupported(false);
			setVoiceStatus(
				"❌ Firefox doesn't support voice input. Please use Chrome, Edge, or Safari"
			);
			return false;
		}

		const SpeechRecognition =
			(window as any).SpeechRecognition ||
			(window as any).webkitSpeechRecognition;

		if (!SpeechRecognition) {
			setSpeechSupported(false);
			setVoiceStatus(
				'❌ Voice input not supported in this browser. Please use Chrome, Edge, or Safari'
			);
			return false;
		}

		try {
			const recognition = new SpeechRecognition();

			// Mobile-optimized settings
			if (isMobile) {
				recognition.continuous = false; // Better for mobile - restart manually
				recognition.interimResults = true;
				recognition.maxAlternatives = 3; // More alternatives for better accuracy
				// Add mobile-specific settings
				if ('webkitSpeechRecognition' in window) {
					recognition.lang = 'en-US';
					// Mobile Chrome specific optimizations
					(recognition as any).serviceURI =
						'wss://www.google.com/speech-api/full-duplex/v1';
				}
			} else {
				recognition.continuous = true;
				recognition.interimResults = true;
				recognition.maxAlternatives = 1;
			}

			recognition.lang = 'en-US';

			recognition.onstart = () => {
				console.log('🎤 Speech recognition started');
				setIsRecording(true);
				setIsInitializing(false);
				setVoiceStatus('🔴 LISTENING - Speak now!');
				isRecognitionActive.current = true;
			};

			recognition.onresult = (event: SpeechRecognitionEvent) => {
				let finalTranscript = '';
				let interimTranscript = '';

				for (let i = event.resultIndex; i < event.results.length; i++) {
					const transcript = event.results[i][0].transcript;
					if (event.results[i].isFinal) {
						finalTranscript += transcript;
					} else {
						interimTranscript += transcript;
					}
				}

				// Show interim results
				setInterimText(interimTranscript);

				if (finalTranscript) {
					const cleanTranscript = finalTranscript.trim();

					// Prevent duplicate transcriptions
					if (
						cleanTranscript &&
						cleanTranscript !== lastTranscriptRef.current
					) {
						// Clear any pending duplicate timeout
						if (transcriptTimeoutRef.current) {
							clearTimeout(transcriptTimeoutRef.current);
						}

						// Debounce to prevent rapid duplicates
						transcriptTimeoutRef.current = setTimeout(
							() => {
								console.log(
									'Adding transcript:',
									cleanTranscript
								);
								lastTranscriptRef.current = cleanTranscript;
								onTranscript(cleanTranscript);
								setInterimText('');

								// For mobile, restart recognition to continue listening
								if (
									isMobile &&
									isRecognitionActive.current &&
									recognitionRef.current
								) {
									try {
										setTimeout(() => {
											if (
												isRecognitionActive.current &&
												recognitionRef.current
											) {
												recognitionRef.current.start();
											}
										}, 100);
									} catch (error) {
										console.log(
											'Mobile restart error (normal):',
											error
										);
									}
								}
							},
							isMobile ? 300 : 100
						); // Longer debounce for mobile
					}
				}
			};

			recognition.onerror = (event: any) => {
				console.error('🚫 Speech recognition error:', event.error);
				forceStopInternal();

				switch (event.error) {
					case 'no-speech':
						setVoiceStatus(
							'🔇 No speech detected - Try speaking louder'
						);
						break;
					case 'audio-capture':
						setVoiceStatus(
							'🎤 Microphone error - Check your microphone'
						);
						break;
					case 'not-allowed':
						setVoiceStatus(
							'🚫 Microphone access denied - Please allow microphone access'
						);
						setPermissionGranted(false);
						break;
					case 'network':
						setVoiceStatus(
							'🌐 Network error - Check your internet connection'
						);
						break;
					case 'service-not-allowed':
						setVoiceStatus('🚫 Speech service not allowed');
						break;
					default:
						setVoiceStatus('❌ Speech error: ' + event.error);
				}

				setTimeout(() => {
					if (permissionGranted) {
						setVoiceStatus(
							'🎤 Voice input ready - Click mic to start'
						);
					}
				}, 3000);
			};

			recognition.onend = () => {
				console.log('⏹️ Speech recognition ended, isMobile:', isMobile);

				// For mobile, if we're still supposed to be recording, restart
				if (isMobile && isRecognitionActive.current && !disabled) {
					console.log('📱 Mobile: Restarting recognition...');

					// Clear mobile timeout if exists
					if (mobileTimeoutRef.current) {
						clearTimeout(mobileTimeoutRef.current);
					}

					// Restart after short delay for mobile
					mobileTimeoutRef.current = setTimeout(
						() => {
							if (
								isRecognitionActive.current &&
								recognitionRef.current &&
								!disabled
							) {
								try {
									recognitionRef.current.start();
									setVoiceStatus(
										'🔴 LISTENING - Continue speaking...'
									);
								} catch (error: any) {
									console.log(
										'Mobile restart ended (normal):',
										error
									);
									if (error.name !== 'InvalidStateError') {
										forceStopInternal();
										if (permissionGranted) {
											setVoiceStatus(
												'🎤 Voice input ready - Click mic to start'
											);
										}
									}
								}
							}
						},
						isMobile ? 500 : 100
					);
				} else {
					// Desktop or intentional stop
					forceStopInternal();
					if (permissionGranted) {
						setVoiceStatus(
							'🎤 Voice input ready - Click mic to start'
						);
					}
				}
			};

			recognitionRef.current = recognition;
			setSpeechSupported(true);
			return true;
		} catch (error) {
			console.error('Failed to initialize speech recognition:', error);
			setSpeechSupported(false);
			setVoiceStatus('❌ Failed to initialize speech recognition');
			return false;
		}
	}, [onTranscript, permissionGranted, detectBrowser]);

	useEffect(() => {
		const initialize = async () => {
			if (typeof window !== 'undefined') {
				const speechInitialized = initializeSpeechRecognition();

				if (speechInitialized) {
					const micPermission = await checkMicrophonePermission();
					if (!micPermission) {
						setVoiceStatus('🎤 Click to request microphone access');
					}
				}
			}
		};

		initialize();
	}, [initializeSpeechRecognition, checkMicrophonePermission]);

	const startRecording = async () => {
		if (!speechSupported || disabled) {
			return;
		}

		// If already recording, stop first
		if (isRecognitionActive.current || isRecording) {
			console.log('Already recording, stopping first...');
			stopRecording();
			return;
		}

		console.log('Starting new recording session...');
		setIsInitializing(true);
		setVoiceStatus('🎙️ Requesting microphone access...');

		try {
			if (!permissionGranted) {
				const hasPermission = await checkMicrophonePermission();
				if (!hasPermission) {
					setIsInitializing(false);
					return;
				}
			}

			if (!recognitionRef.current) {
				const initialized = initializeSpeechRecognition();
				if (!initialized) {
					setIsInitializing(false);
					return;
				}
			}

			setVoiceStatus('🚀 Starting speech recognition...');

			// Clear any previous states and refs
			setInterimText('');
			lastTranscriptRef.current = '';

			setTimeout(() => {
				try {
					if (
						recognitionRef.current &&
						!isRecognitionActive.current
					) {
						console.log(
							'Actually starting recognition... Mobile:',
							isMobile
						);
						recognitionRef.current.start();

						// For mobile, set a longer timeout to allow for longer phrases
						if (isMobile) {
							console.log(
								'📱 Mobile mode: Extended listening timeout'
							);
							setVoiceStatus(
								'🔴 LISTENING - Speak your full question...'
							);
						}
					} else {
						console.log(
							'Cannot start - recognition not ready or already active'
						);
						setIsInitializing(false);
					}
				} catch (error: any) {
					console.error('Error starting recognition:', error);
					setIsInitializing(false);
					setIsRecording(false);
					isRecognitionActive.current = false;

					if (error.name === 'InvalidStateError') {
						setVoiceStatus(
							'🔄 Recognition busy, try again in a moment'
						);
					} else if (error.name === 'NotAllowedError') {
						setVoiceStatus('🚫 Microphone access denied');
						setPermissionGranted(false);
					} else {
						setVoiceStatus('❌ Failed to start: ' + error.message);
					}

					setTimeout(() => {
						if (permissionGranted) {
							setVoiceStatus(
								'🎤 Voice input ready - Click mic to start'
							);
						}
					}, 2000);
				}
			}, 100);
		} catch (error: any) {
			console.error('Error in startRecording:', error);
			setIsInitializing(false);
			setIsRecording(false);
			isRecognitionActive.current = false;
			setVoiceStatus('❌ Failed to start recording: ' + error.message);
		}
	};

	// Internal force stop function
	const forceStopInternal = () => {
		isRecognitionActive.current = false;
		setIsRecording(false);
		setIsInitializing(false);
		setInterimText('');
		lastTranscriptRef.current = '';

		// Clear all timeouts
		if (stopTimeoutRef.current) {
			clearTimeout(stopTimeoutRef.current);
			stopTimeoutRef.current = null;
		}
		if (transcriptTimeoutRef.current) {
			clearTimeout(transcriptTimeoutRef.current);
			transcriptTimeoutRef.current = null;
		}
		if (mobileTimeoutRef.current) {
			clearTimeout(mobileTimeoutRef.current);
			mobileTimeoutRef.current = null;
		}
	};

	// Edge-specific aggressive stop
	const stopRecording = () => {
		console.log(
			'stopRecording called, browser:',
			browserType,
			'current state:',
			{
				isRecording,
				isRecognitionActive: isRecognitionActive.current,
				hasRecognition: !!recognitionRef.current,
			}
		);

		// Immediately update UI states
		forceStopInternal();
		setVoiceStatus('⏹️ Stopping recording...');

		if (recognitionRef.current) {
			try {
				// For Edge, use more aggressive stopping
				if (browserType === 'edge') {
					console.log('Using Edge-specific stop method...');

					// Try abort first (more aggressive)
					if (typeof recognitionRef.current.abort === 'function') {
						recognitionRef.current.abort();
					}

					// Also try stop
					if (typeof recognitionRef.current.stop === 'function') {
						recognitionRef.current.stop();
					}

					// Force reset after short delay for Edge
					stopTimeoutRef.current = setTimeout(() => {
						forceStopInternal();
						if (permissionGranted) {
							setVoiceStatus(
								'🎤 Voice input ready - Click mic to start'
							);
						}
					}, 200);
				} else {
					// Standard stop for other browsers
					recognitionRef.current.stop();
				}
			} catch (error) {
				console.error('Error stopping recognition:', error);
				forceStopInternal();
			}
		}

		// Fallback timeout for all browsers
		setTimeout(() => {
			if (isRecognitionActive.current || isRecording) {
				console.log('Fallback: Force stopping after timeout');
				forceStopInternal();
			}
			if (permissionGranted) {
				setVoiceStatus('🎤 Voice input ready - Click mic to start');
			}
		}, 1000);
	};

	const toggleRecording = () => {
		if (isRecording || isRecognitionActive.current) {
			console.log('Stopping recording...');
			stopRecording();
		} else {
			console.log('Starting recording...');
			startRecording();
		}
	};

	const requestMicrophoneAccess = async () => {
		setVoiceStatus('🎙️ Requesting microphone permission...');
		const granted = await checkMicrophonePermission();
		if (granted && !recognitionRef.current) {
			initializeSpeechRecognition();
		}
	};

	const handleVoiceButtonClick = () => {
		if (disabled) return;
		if (!speechSupported) return;

		// Always try to toggle if we have permission, regardless of other states
		if (permissionGranted) {
			toggleRecording();
		} else {
			requestMicrophoneAccess();
		}
	};

	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return 'h-8 px-2';
			case 'lg':
				return 'h-14 px-5';
			default:
				return 'h-12 px-4';
		}
	};

	const getVoiceButtonContent = () => {
		if (isInitializing) {
			return (
				<div className="flex items-center">
					<div
						className={`border-2 border-white border-t-transparent rounded-full animate-spin ${
							size === 'sm'
								? 'w-3 h-3'
								: size === 'lg'
								? 'w-6 h-6'
								: 'w-5 h-5'
						}`}
					></div>
				</div>
			);
		} else if (isRecording) {
			return (
				<div className="flex items-center">
					<MicOff
						className={
							size === 'sm'
								? 'w-3 h-3'
								: size === 'lg'
								? 'w-6 h-6'
								: 'w-5 h-5'
						}
					/>
					<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
				</div>
			);
		} else {
			return (
				<Mic
					className={
						size === 'sm'
							? 'w-3 h-3'
							: size === 'lg'
							? 'w-6 h-6'
							: 'w-5 h-5'
					}
				/>
			);
		}
	};

	const getVoiceButtonClass = () => {
		let baseClass = `flex-shrink-0 ${getSizeClasses()} rounded-xl transition-all duration-200 cursor-pointer border-2 relative font-medium text-sm ${className}`;

		if (disabled) {
			return `${baseClass} bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed`;
		} else if (isRecording) {
			return `${baseClass} bg-red-500 text-white border-red-400 hover:bg-red-600 shadow-lg scale-105 animate-pulse`;
		} else if (isInitializing) {
			return `${baseClass} bg-yellow-500 text-white border-yellow-400`;
		} else if (!speechSupported) {
			return `${baseClass} bg-gray-400 text-white border-gray-400 cursor-not-allowed`;
		} else if (!permissionGranted) {
			return `${baseClass} bg-orange-500 text-white border-orange-400 hover:bg-orange-600`;
		} else {
			return `${baseClass} bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300`;
		}
	};

	const getVoiceButtonTitle = () => {
		if (disabled) return 'Voice input disabled';
		if (!speechSupported) return 'Speech recognition not supported';
		if (!permissionGranted) return 'Click to grant microphone access';
		if (isInitializing) return 'Initializing...';
		if (isRecording || isRecognitionActive.current)
			return 'Click to STOP recording';
		return 'Click to START voice input';
	};

	// Force stop function for emergency cases
	const forceStop = () => {
		console.log(
			'FORCE STOP called for browser:',
			browserType,
			'Mobile:',
			isMobile
		);

		// Clear all timeouts
		if (stopTimeoutRef.current) {
			clearTimeout(stopTimeoutRef.current);
			stopTimeoutRef.current = null;
		}
		if (transcriptTimeoutRef.current) {
			clearTimeout(transcriptTimeoutRef.current);
			transcriptTimeoutRef.current = null;
		}
		if (mobileTimeoutRef.current) {
			clearTimeout(mobileTimeoutRef.current);
			mobileTimeoutRef.current = null;
		}

		// Immediately stop all states
		forceStopInternal();

		if (recognitionRef.current) {
			try {
				// Try all possible stop methods
				if (typeof recognitionRef.current.abort === 'function') {
					recognitionRef.current.abort();
				}
				if (typeof recognitionRef.current.stop === 'function') {
					recognitionRef.current.stop();
				}

				// For Edge or mobile: recreate the recognition object
				if (browserType === 'edge' || isMobile) {
					console.log(
						'Edge/Mobile detected: Recreating recognition object...'
					);
					recognitionRef.current = null;
					setTimeout(() => {
						initializeSpeechRecognition();
					}, 100);
				}
			} catch (error) {
				console.error('Error in force stop:', error);
			}
		}

		// Force UI reset
		if (permissionGranted) {
			setVoiceStatus('🎤 Voice input ready - Click mic to start');
		}
	};

	// Cleanup function to stop recording when component unmounts
	useEffect(() => {
		return () => {
			// Clear all timeouts
			if (stopTimeoutRef.current) {
				clearTimeout(stopTimeoutRef.current);
			}
			if (transcriptTimeoutRef.current) {
				clearTimeout(transcriptTimeoutRef.current);
			}
			if (mobileTimeoutRef.current) {
				clearTimeout(mobileTimeoutRef.current);
			}
			if (isRecording) {
				forceStop();
			}
		};
	}, [isRecording]);

	return {
		VoiceButton: () => (
			<button
				type="button"
				onClick={handleVoiceButtonClick}
				onDoubleClick={forceStop} // Emergency stop on double-click
				disabled={disabled}
				className={getVoiceButtonClass()}
				title={getVoiceButtonTitle()}
			>
				{getVoiceButtonContent()}
			</button>
		),
		VoiceStatus: () =>
			speechSupported ? (
				<div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
					<div className="flex items-center gap-2 text-sm">
						<div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
							<Mic className="w-4 h-4" />
							<span>{voiceStatus}</span>
							{isMobile && (
								<span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-medium">
									📱 MOBILE
								</span>
							)}
							{browserType === 'edge' && (
								<span className="px-2 py-1 bg-orange-500 text-white text-xs rounded font-medium">
									EDGE
								</span>
							)}
							{isRecording && (
								<span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse font-medium">
									RECORDING
								</span>
							)}
							{isInitializing && (
								<span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
									INITIALIZING
								</span>
							)}
						</div>
					</div>

					{isMobile && isRecording && (
						<div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
							<span className="text-green-700 dark:text-green-300">
								📱 Mobile tip: Speak your complete question
								clearly. The system will wait for you to finish.
							</span>
						</div>
					)}

					{interimText && (
						<div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
							<span className="text-gray-500 dark:text-gray-400">
								Live transcription:{' '}
							</span>
							<span className="text-gray-700 dark:text-gray-300 italic">
								{interimText}
							</span>
						</div>
					)}

					{/* Emergency stop button when recording */}
					{(isRecording || isRecognitionActive.current) && (
						<div className="mt-2 flex gap-2">
							<button
								onClick={forceStop}
								className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
							>
								Force Stop
							</button>
							{(browserType === 'edge' || isMobile) && (
								<button
									onClick={() => {
										forceStop();
										// Reinitialize for Edge/Mobile
										setTimeout(
											() => initializeSpeechRecognition(),
											200
										);
									}}
									className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
								>
									{isMobile ? 'Reset Mobile' : 'Reset Edge'}
								</button>
							)}
						</div>
					)}
				</div>
			) : (
				<div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
					<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
						<AlertCircle className="w-4 h-4" />
						<span>
							{browserType === 'firefox'
								? "Firefox doesn't support voice input. Please use Chrome, Edge, or Safari."
								: 'Voice input not supported in this browser. Please use Chrome, Edge, or Safari.'}
						</span>
					</div>
				</div>
			),
		isRecording,
		speechSupported,
		voiceStatus,
		interimText,
		stopRecording: () => stopRecording(),
		forceStop: () => forceStop(),
	};
}
