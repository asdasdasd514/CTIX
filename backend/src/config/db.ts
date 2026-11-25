import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  // Đảm bảo phân giải SRV của MongoDB Atlas ổn định trên mọi mạng ISP
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[MongoDB] Connected to database: ${mongoose.connection.name}`);

  // Xóa index email_1 cũ nếu còn tồn tại để tránh lỗi E11000 khi chỉ dùng SĐT
  try {
    await mongoose.connection.collection('users').dropIndex('email_1');
    console.log('[MongoDB] Dropped legacy email_1 index on users collection.');
  } catch {
    // Index không tồn tại -> bỏ qua
  }
}
