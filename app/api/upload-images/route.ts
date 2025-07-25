import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToCloudinary } from '@/lib/cloudinaryUtils';

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const files = formData.getAll('images') as File[];

		if (!files || files.length === 0) {
			return NextResponse.json(
				{ error: 'No images provided' },
				{ status: 400 }
			);
		}

		const uploadPromises = files.map(async (file) => {
			if (!file.type.startsWith('image/')) {
				throw new Error(`Invalid file type: ${file.type}`);
			}

			const url = await uploadImageToCloudinary(file);
			return url;
		});

		const imageUrls = await Promise.all(uploadPromises);

		return NextResponse.json({
			success: true,
			imageUrls,
		});
	} catch (error: any) {
		console.error('Error uploading images:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to upload images' },
			{ status: 500 }
		);
	}
}
