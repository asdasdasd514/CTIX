import type { Request, Response } from 'express';
import {
  AiServiceError,
  runCitizenAssistant,
  runCitizenVoiceAudio,
  type AssistantMessage,
} from '../services/aiAssistantService';

// POST /api/ai/assistant — Trợ lý AI Công dân (Chatbot văn bản)
export async function citizenAssistant(req: Request, res: Response) {
  try {
    const { message, mode = 'chat', history = [] } = req.body as {
      message?: string;
      mode?: 'chat' | 'voice';
      history?: AssistantMessage[];
    };

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung hoặc nói yêu cầu.' });
    }

    const result = await runCitizenAssistant(message, mode, Array.isArray(history) ? history : []);
    return res.json(result);
  } catch (err) {
    console.error('[AI Controller] assistant error:', err);
    if (err instanceof AiServiceError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Trợ lý AI tạm thời bận. Vui lòng thử lại.' });
  }
}

// POST /api/ai/voice-command — Nhận trực tiếp file Audio cho Gemini 2.5 Flash nghe & chép nguyên văn
export async function citizenVoiceCommand(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({ message: 'Không nhận được dữ liệu âm thanh.' });
    }

    const result = await runCitizenVoiceAudio(file.buffer, file.mimetype || 'audio/webm');
    return res.json(result);
  } catch (err) {
    console.error('[AI Controller] voiceCommand error:', err);
    if (err instanceof AiServiceError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({
      message: 'Không thể xử lý âm thanh lúc này. Vui lòng thử lại sau vài giây.',
    });
  }
}
