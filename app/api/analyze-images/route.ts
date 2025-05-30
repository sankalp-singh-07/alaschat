import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function base64ToGenerativePart(base64Data: string, mimeType: string) {
	return {
		inlineData: {
			data: base64Data.split(',')[1],
			mimeType,
		},
	};
}

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
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

		const prompt =
			message ||
			'Please analyze these images in detail. Describe what you see, identify key elements, patterns, data, text, or any notable features. Provide insights and observations that would be helpful for understanding the content.';

		console.log('Converting images to Gemini format...');
		const imageParts = images.map((imageData: string) => {
			const mimeType = imageData.substring(
				imageData.indexOf(':') + 1,
				imageData.indexOf(';')
			);
			return base64ToGenerativePart(imageData, mimeType);
		});

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
