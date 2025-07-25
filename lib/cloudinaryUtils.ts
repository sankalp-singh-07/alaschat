import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImageToCloudinary = async (
	file: File,
	folder: string = 'chat-images'
): Promise<string> => {
	try {
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		return new Promise((resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: 'image',
						folder: folder,
						transformation: [
							{ quality: 'auto' },
							{ fetch_format: 'auto' },
						],
					},
					(error, result) => {
						if (error) {
							reject(error);
						} else {
							resolve(result?.secure_url || '');
						}
					}
				)
				.end(buffer);
		});
	} catch (error) {
		console.error('Error uploading to Cloudinary:', error);
		throw new Error('Failed to upload image');
	}
};

export const deleteImageFromCloudinary = async (
	publicId: string
): Promise<void> => {
	try {
		await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		console.error('Error deleting from Cloudinary:', error);
		throw new Error('Failed to delete image');
	}
};

export const getCloudinaryPublicId = (url: string): string => {
	const parts = url.split('/');
	const filename = parts[parts.length - 1];
	return filename.split('.')[0];
};
