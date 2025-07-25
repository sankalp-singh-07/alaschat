import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function urlToGenerativePart(imageUrl: string) {
	try {
		const response = await fetch(imageUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}

		console.log(response);

		const contentType =
			response.headers.get('Content-Type') || 'image/jpeg';
		const arrayBuffer = await response.arrayBuffer();
		const base64Data = Buffer.from(arrayBuffer).toString('base64');

		return {
			inlineData: {
				data: base64Data,
				mimeType: contentType,
			},
		};
	} catch (error) {
		console.error('Error processing image URL:', imageUrl, error);
		throw new Error(`Failed to process image: ${error}`);
	}
}

const buildPrompt = (userMessage: string): string => {
	const lowerMsg = userMessage.toLowerCase();

	let specializationInstructions = '';
	let additionalFocus = '';

	if (
		lowerMsg.includes('diagnose') ||
		lowerMsg.includes('problem') ||
		lowerMsg.includes('issue')
	) {
		specializationInstructions =
			'Focus on detecting visual symptoms, flaws, defects, or anomalies in the image.';
		additionalFocus =
			'Look for any warning signs or patterns that indicate a problem or malfunction.';
	} else if (lowerMsg.includes('improve') || lowerMsg.includes('enhance')) {
		specializationInstructions =
			'Focus on analyzing quality, composition, and areas for improvement.';
		additionalFocus =
			'Give constructive suggestions for enhancing the visual or structural aspects.';
	} else if (lowerMsg.includes('describe') || lowerMsg.includes('analyze')) {
		specializationInstructions =
			'Provide a thorough and objective analysis of the image.';
		additionalFocus =
			'Describe what you see in clear, human-friendly terms.';
	} else {
		specializationInstructions =
			'Try to understand the context based on the image(s) and message.';
		additionalFocus = 'Respond in a relevant, helpful, and insightful way.';
	}

	return `
		You are an expert visual and contextual AI assistant.
		Your task is to:
		1. Carefully examine the attached image(s).
		2. Fully understand the user's message and intent.
		3. Connect the visual details from the image(s) with what the user is asking or describing.
		4. ${specializationInstructions}
		5. ${additionalFocus}

		Here is the user's message:
		"${userMessage}"

		Now begin your analysis and respond in a helpful and clear manner.
	`.trim();
};

export async function POST(request: NextRequest) {
	try {
		console.log('API Route called');
		const { message, images } = await request.json();

		console.log('Request data:', {
			messageLength: message?.length,
			imageCount: images?.length,
		});

		if (!process.env.GEMINI_API_KEY) {
			console.error('Gemini API key not configured');
			return NextResponse.json(
				{ error: 'Gemini API key not configured' },
				{ status: 500 }
			);
		}

		if (!images || images.length === 0) {
			console.error('No images provided');
			return NextResponse.json(
				{ error: 'No images provided for analysis' },
				{ status: 400 }
			);
		}

		console.log('Initializing Gemini model...');
		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash-latest',
		});

		const prompt = buildPrompt(
			message ||
				'Please analyze these images in detail. Describe what you see, identify key elements, patterns, data, text, or any notable features. Provide insights and observations that would be helpful for understanding the content.'
		);

		console.log('Converting images to Gemini format...');
		const imageParts = await Promise.all(
			images.map(async (imageUrl: string) => {
				return await urlToGenerativePart(imageUrl);
			})
		);

		console.log('Calling Gemini API...');
		const result = await model.generateContent([prompt, ...imageParts]);

		console.log('Gemini API response received');
		const response = await result.response;
		const analysisResult = response.text();

		if (!analysisResult) {
			console.error('No analysis result in response');
			return NextResponse.json(
				{ error: 'No analysis result received' },
				{ status: 500 }
			);
		}

		console.log('Analysis successful');
		return NextResponse.json({
			analysis: analysisResult,
			usage: {
				promptTokens: 0,
				completionTokens: 0,
				totalTokens: 0,
			},
		});
	} catch (error: any) {
		console.error('Detailed error:', {
			message: error.message,
			code: error.code,
			status: error.status,
			stack: error.stack,
		});

		if (error.message?.includes('API_KEY_INVALID')) {
			console.error('Invalid Gemini API key');
			return NextResponse.json(
				{ error: 'Invalid Gemini API key' },
				{ status: 401 }
			);
		}

		if (error.message?.includes('QUOTA_EXCEEDED')) {
			console.error('Gemini quota exceeded');
			return NextResponse.json(
				{ error: 'Gemini API quota exceeded' },
				{ status: 429 }
			);
		}

		if (error.message?.includes('PERMISSION_DENIED')) {
			console.error('Permission denied - check API key permissions');
			return NextResponse.json(
				{ error: 'API permission denied' },
				{ status: 403 }
			);
		}

		if (error.status === 400) {
			console.error('Bad request - possibly image format issue');
			return NextResponse.json(
				{ error: 'Invalid image format or request' },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: `API Error: ${error.message}` },
			{ status: 500 }
		);
	}
}
