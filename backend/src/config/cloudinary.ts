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
  folder = 'ctix_smartcity/incidents/before/other'
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

export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[Cloudinary] delete warn:', err instanceof Error ? err.message : err);
  }
}

export async function deleteCloudinaryUrls(urls: string[]): Promise<void> {
  const ids = urls
    .map((u) => extractCloudinaryPublicId(u))
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;
  await Promise.allSettled(ids.map((id) => deleteFromCloudinary(id)));
}

export { cloudinary };
