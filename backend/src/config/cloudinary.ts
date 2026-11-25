import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadedImageResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export function uploadBufferToCloudinary(
  buffer: Buffer,
  folder = 'ctix_smartcity/incidents'
): Promise<UploadedImageResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
