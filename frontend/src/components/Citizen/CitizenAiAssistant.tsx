import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Mic, Send, X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { aiApi, type AiAssistantResponse } from '../../services/api';
import { useIncidentStore } from '../../store/useIncidentStore';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const HOLD_DURATION_MS = 1000;

export const CitizenAiAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { setElderlyMode } = useIncidentStore();

  // Chatbot state (tối giản, không có nút gợi ý nhanh)
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Chào bạn! Tôi là Trợ lý AI Phường Trấn Biên. Bạn có thể hỏi về quy trình phản ánh, hoặc nhấn giữ nút AI 1 giây để ra lệnh bằng giọng nói.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(true);

  // Hold 1s -> Voice Command state
  const [holding, setHolding] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const triggeredVoiceRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const speakReply = (text: string) => {
    if (!voiceFeedback || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN';
      utter.rate = 1.05;
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore TTS errors
    }
  };

  const executeAssistantResult = (res: AiAssistantResponse, fromVoice: boolean) => {
    if (fromVoice) {
      setToast(res.reply);
      speakReply(res.reply);
    }

    if (res.action === 'create_report' && res.reportDraft) {
      setChatOpen(false);
      navigate('/citizen/submit', {
        state: {
          aiPrefill: res.reportDraft,
          aiPrefillAt: Date.now(),
        },
      });
      return;
    }

    if (res.action === 'open_my_reports') {
      setChatOpen(false);
      navigate('/citizen/reports', {
        state: { onlyMyReports: true, aiNavAt: Date.now() },
      });
      return;
    }

    if (res.action === 'toggle_elderly') {
      setElderlyMode(res.elderlyEnabled ?? true);
      return;
    }

    if (res.action === 'navigate' && res.route) {
      setChatOpen(false);
      navigate(res.route);
      return;
    }

    // Nếu là câu hỏi bình thường bằng giọng nói -> mở khung Chatbot hiển thị câu trả lời
    if (fromVoice) {
      setChatOpen(true);
    }
  };

  const sendToAssistant = async (text: string, mode: 'chat' | 'voice') => {
    const clean = text.trim();
    if (!clean) return;

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: clean }]);
    if (mode === 'voice') setVoiceProcessing(true);
    else setSending(true);

    try {
      const res = await aiApi.assistant(clean, mode, historyPayload);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: res.reply },
      ]);
      executeAssistantResult(res, mode === 'voice');
    } catch {
      const fallbackMsg = 'Không kết nối được máy chủ AI. Vui lòng thử lại sau.';
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'assistant', text: fallbackMsg },
      ]);
      if (mode === 'voice') setToast(fallbackMsg);
    } finally {
      setSending(false);
      setVoiceProcessing(false);
    }
  };

  const startVoiceCommand = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setToast('Trình duyệt này chưa hỗ trợ thu âm giọng nói. Bạn hãy chạm để dùng Chatbot nhé.');
      return;
    }

    try {
      navigator.vibrate?.(40);
    } catch {}

    finalTranscriptRef.current = '';
    setLiveTranscript('');
    setVoiceActive(true);
    setChatOpen(false);

    const rec = new SpeechRec();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let interim = '';
      let finals = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = res[0]?.transcript || '';
        if (res.isFinal) {
          finals = `${finals} ${txt}`.trim();
        } else {
          interim += txt;
        }
      }
      finalTranscriptRef.current = finals;
      setLiveTranscript(`${finals} ${interim}`.trim());
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setToast('Vui lòng cấp quyền Micro cho trình duyệt để dùng điều khiển giọng nói.');
      }
      setVoiceActive(false);
    };

    rec.onend = () => {
      // xử lý gửi lệnh khi kết thúc thu âm
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setVoiceActive(false);
    }
  };

  const stopAndProcessVoice = () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try {
        rec.stop();
      } catch {}
    }
    setVoiceActive(false);

    // Đợi 250ms để SpeechRecognition chốt từ cuối cùng
    window.setTimeout(() => {
      const spoken = (finalTranscriptRef.current || liveTranscript).trim();
      setLiveTranscript('');
      finalTranscriptRef.current = '';
      if (spoken) {
        void sendToAssistant(spoken, 'voice');
      } else {
        setToast('Chưa nghe rõ lệnh của bạn. Hãy giữ nút 1 giây rồi nói rõ hơn nhé.');
      }
    }, 250);
  };

  // Xử lý nhấn giữ 1s vs chạm nhẹ
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (voiceProcessing) return;
    triggeredVoiceRef.current = false;
    setHolding(true);

    holdTimerRef.current = window.setTimeout(() => {
      triggeredVoiceRef.current = true;
      setHolding(false);
      startVoiceCommand();
    }, HOLD_DURATION_MS);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHolding(false);

    if (triggeredVoiceRef.current) {
      triggeredVoiceRef.current = false;
      stopAndProcessVoice();
    } else {
      // Chạm nhẹ (< 1s) -> mở / đóng Chatbot
      setChatOpen((prev) => !prev);
    }
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHolding(false);
    if (triggeredVoiceRef.current) {
      triggeredVoiceRef.current = false;
      stopAndProcessVoice();
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    const text = inputText;
    setInputText('');
    void sendToAssistant(text, 'chat');
  };

  return (
    <>
      {/* 1. THÔNG BÁO PHẢN HỒI SAU LỆNH GIỌNG NÓI */}
      {toast && (
        <div className="fixed bottom-[144px] md:bottom-24 right-4 md:right-6 z-50 max-w-xs sm:max-w-sm bg-blue-950 text-white text-xs font-medium px-4 py-3 rounded-[8px] shadow-xl border border-blue-800 flex items-start gap-2.5">
          <Bot className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <span className="flex-1 leading-relaxed">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-blue-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. KHUNG ĐANG NGHE LỆNH GIỌNG NÓI (KHI GIỮ ĐỦ 1 GIÂY) */}
      {(voiceActive || voiceProcessing) && (
        <div className="fixed bottom-[144px] md:bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900 text-white rounded-[10px] shadow-2xl border border-blue-500/40 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {voiceProcessing ? (
                <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
              <span className="text-xs font-bold tracking-wide text-blue-100">
                {voiceProcessing
                  ? 'AI Gemini đang xử lý lệnh...'
                  : 'Đang nghe lệnh giọng nói (thả tay để gửi)'}
              </span>
            </div>
            {voiceActive && (
              <button
                type="button"
                onClick={() => {
                  if (recognitionRef.current) {
                    try {
                      recognitionRef.current.stop();
                    } catch {}
                    recognitionRef.current = null;
                  }
                  finalTranscriptRef.current = '';
                  setLiveTranscript('');
                  setVoiceActive(false);
                }}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Hủy
              </button>
            )}
          </div>

          <div className="min-h-[40px] p-2.5 rounded-[6px] bg-white/10 text-xs sm:text-sm text-white leading-relaxed">
            {liveTranscript || (
              <span className="text-slate-400 italic">
                Ví dụ: &ldquo;Tôi muốn phản ánh đèn đường trước số 45 Nguyễn Ái Quốc bị tắt...&rdquo;
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. CỬA SỔ CHATBOT TỐI GIẢN (CHẠM NHẸ < 1s, KHÔNG CÓ NÚT GỢI Ý NHANH) */}
      {chatOpen && !voiceActive && (
        <div className="fixed bottom-[144px] md:bottom-24 left-3 right-3 sm:left-auto sm:right-6 sm:w-[360px] z-50 bg-white rounded-[8px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[65vh]">
          {/* Header */}
          <div className="bg-blue-950 text-white px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[6px] bg-blue-800 border border-white/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Trợ lý AI Phường Trấn Biên</div>
                <div className="text-[10px] text-blue-200 truncate">
                  Giữ nút AI 1 giây để ra lệnh giọng nói
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setVoiceFeedback((v) => !v)}
                title={voiceFeedback ? 'Tắt đọc giọng nói' : 'Bật đọc giọng nói'}
                className="p-1.5 rounded hover:bg-white/10 text-blue-200 hover:text-white transition"
              >
                {voiceFeedback ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="Đóng Chatbot"
                className="p-1.5 rounded hover:bg-white/10 text-blue-200 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-[8px] text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-700 text-white'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-[8px] bg-white border border-slate-200 text-xs text-slate-500 inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Đang trả lời...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <form
            onSubmit={handleChatSubmit}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi hoặc yêu cầu phản ánh..."
              className="flex-1 h-9 px-3 rounded-[5px] border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              aria-label="Gửi tin nhắn"
              className="w-9 h-9 rounded-[5px] bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 4. NÚT TRỢ LÝ AI NỔI DUY NHẤT (CHẠM = CHATBOT | GIỮ 1S = RA LỆNH GIỌNG NÓI) */}
      <div className="fixed bottom-[76px] right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-1.5 select-none">
        {holding && (
          <span className="px-2.5 py-1 rounded-[5px] bg-slate-900/90 text-white text-[11px] font-semibold shadow-md">
            Giữ 1 giây để nói lệnh...
          </span>
        )}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onContextMenu={(e) => e.preventDefault()}
          title="Chạm để mở Chatbot • Giữ 1 giây để ra lệnh giọng nói"
          aria-label="Trợ lý AI — Chạm mở Chatbot, giữ 1 giây để ra lệnh giọng nói"
          style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            voiceActive
              ? 'bg-rose-600 text-white ring-4 ring-rose-300/70 scale-105'
              : holding
                ? 'bg-blue-800 text-white scale-105'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
          }`}
        >
          {/* Vòng tiến trình 1 giây khi đang nhấn giữ */}
          {holding && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 56 56"
            >
              <circle
                cx="28"
                cy="28"
                r="25"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="3.5"
                strokeDasharray="157"
                strokeDashoffset="157"
                style={{
                  animation: `ai-hold-ring ${HOLD_DURATION_MS}ms linear forwards`,
                }}
              />
            </svg>
          )}
          {voiceActive ? (
            <Mic className="w-6 h-6 animate-pulse" />
          ) : voiceProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Bot className="w-6 h-6" />
          )}
        </button>

        <style>{`
          @keyframes ai-hold-ring {
            from { stroke-dashoffset: 157; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    </>
  );
};
