import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI:
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/ctix_smartcity',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  JWT_SECRET: process.env.JWT_SECRET || 'ctix_dev_secret_change_in_prod',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
