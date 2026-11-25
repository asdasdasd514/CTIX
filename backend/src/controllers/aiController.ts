import type { Request, Response } from 'express';
import { runCitizenAssistant, type AssistantMessage } from '../services/aiAssistantService';

// POST /api/ai/assistant — Trợ lý AI Công dân (Chatbot & Ra lệnh giọng nói)
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
    return res.status(500).json({ message: 'Trợ lý AI tạm thời bận. Vui lòng thử lại.' });
  }
}
