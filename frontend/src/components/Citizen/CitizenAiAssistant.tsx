import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Mic, Send, X, Volume2, VolumeX, Loader2, Trash2 } from 'lucide-react';
import { aiApi, type AiAssistantResponse } from '../../services/api';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const HOLD_DURATION_MS = 1000;
const CHAT_MESSAGES_KEY = 'ctix_ai_chat_messages_v1';
const CHAT_OPEN_KEY = 'ctix_ai_chat_open_v1';

const WELCOME_MSG: ChatMsg = {
  id: 'welcome',
  role: 'assistant',
  text: 'Chào bạn! Tôi là Trợ lý AI Phường Trấn Biên. Chạm để hỏi đáp thông tin thực tế hoặc ra lệnh điều khiển trang; giữ nút AI 1 giây để nói trực tiếp.',
};

function loadSavedMessages(): ChatMsg[] {
  if (typeof window === 'undefined') return [WELCOME_MSG];
  try {
    const raw = window.sessionStorage.getItem(CHAT_MESSAGES_KEY);
    if (!raw) return [WELCOME_MSG];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return [WELCOME_MSG];
}

function loadSavedChatOpen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(CHAT_OPEN_KEY) === '1';
  } catch {
    return false;
  }
}

function pickSupportedAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

export const CitizenAiAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { setElderlyMode } = useIncidentStore();
  const { isAuthenticated, logout } = useAuthStore();

  // Chatbot tối giản — giữ nguyên khung chat & lịch sử khi chuyển trang (Persistent Chat)
  const [chatOpen, setChatOpen] = useState<boolean>(() => loadSavedChatOpen());
  const [messages, setMessages] = useState<ChatMsg[]>(() => loadSavedMessages());

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHAT_OPEN_KEY, chatOpen ? '1' : '0');
    } catch {}
  }, [chatOpen]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  const handleClearChat = () => {
    setMessages([WELCOME_MSG]);
    try {
      window.sessionStorage.removeItem(CHAT_MESSAGES_KEY);
    } catch {}
  };
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(true);

  // Hold 1s -> Direct Audio Recording for Gemini 2.5 Flash
  const [holding, setHolding] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const recordIntervalRef = useRef<number | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const peakVolumeRef = useRef<number>(0);
  const triggeredVoiceRef = useRef(false);
  const cancelledVoiceRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const cleanupMedia = () => {
    if (recordIntervalRef.current) {
      window.clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (volumeIntervalRef.current) {
      window.clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  useEffect(() => {
    return () => cleanupMedia();
  }, []);

  const speakReply = (text: string) => {
    if (!voiceFeedback || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN';
      utter.rate = 1.05;
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const executeAssistantResult = (res: AiAssistantResponse, fromVoice: boolean) => {
    if (fromVoice) {
      setToast(res.transcript ? `“${res.transcript}” — ${res.reply}` : res.reply);
      speakReply(res.reply);
    }

    // Hỗ trợ ĐA LỆNH (multi-intent): thực thi đồng thời cờ phụ (chữ to, cuộn trang) cùng lệnh chính
    if (typeof res.elderlyEnabled === 'boolean') {
      setElderlyMode(res.elderlyEnabled);
    }

    let didNavigate = false;

    // Khi đang chat bằng văn bản (!fromVoice): GIỮ NGUYÊN KHUNG CHAT mở khi chuyển trang nền!
    if (res.action === 'create_report' && res.reportDraft) {
      if (fromVoice) setChatOpen(false);
      navigate('/citizen/submit', {
        state: {
          aiPrefill: res.reportDraft,
          openCamera: Boolean(res.openCamera),
          aiPrefillAt: Date.now(),
        },
      });
      didNavigate = true;
    } else if (res.action === 'open_camera') {
      if (fromVoice) setChatOpen(false);
      navigate('/citizen/submit', {
        state: {
          openCamera: true,
          aiNavAt: Date.now(),
        },
      });
      didNavigate = true;
    } else if (res.action === 'open_my_reports') {
      if (fromVoice) setChatOpen(false);
      navigate('/citizen/reports', {
        state: { onlyMyReports: true, aiNavAt: Date.now() },
      });
      didNavigate = true;
    } else if (res.action === 'filter_reports') {
      if (fromVoice) setChatOpen(false);
      navigate('/citizen/reports', {
        state: { aiFilter: res.reportFilter || {}, aiNavAt: Date.now() },
      });
      didNavigate = true;
    } else if (res.action === 'go_back') {
      if (fromVoice) setChatOpen(false);
      navigate(-1);
      didNavigate = true;
    } else if (res.action === 'call_hotline') {
      if (fromVoice) setChatOpen(false);
      navigate('/citizen/help');
      setToast('Tổng đài hỗ trợ khẩn cấp 24/7 Phường Trấn Biên: 1022');
      didNavigate = true;
    } else if (res.action === 'logout') {
      if (isAuthenticated) {
        logout();
        if (fromVoice) setChatOpen(false);
        navigate('/citizen/home');
        setToast('Đã đăng xuất tài khoản thành công.');
      } else {
        setToast('Bạn hiện chưa đăng nhập tài khoản.');
      }
      didNavigate = true;
    } else if (res.action === 'navigate' && res.route) {
      if (fromVoice) setChatOpen(false);
      if (res.route === '/citizen/account' && !isAuthenticated) {
        navigate('/login');
        setToast('Bạn cần đăng nhập để xem trang Tài khoản cá nhân.');
      } else if ((res.route === '/login' || res.route === '/register') && isAuthenticated) {
        navigate('/citizen/account');
        setToast('Bạn đã đăng nhập rồi. Đang mở trang Tài khoản.');
      } else {
        navigate(res.route);
      }
      didNavigate = true;
    }

    if (res.scrollDirection) {
      window.setTimeout(() => {
        window.scrollTo({
          top: res.scrollDirection === 'bottom' ? document.body.scrollHeight : 0,
          behavior: 'smooth',
        });
      }, didNavigate ? 250 : 0);
      return;
    }

    if (!didNavigate && res.action !== 'toggle_elderly' && fromVoice && res.transcript) {
      setChatOpen(true);
    }
  };

  const sendTextToAssistant = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: clean }]);
    setSending(true);

    try {
      const res = await aiApi.assistant(clean, 'chat', historyPayload);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: res.reply },
      ]);
      executeAssistantResult(res, false);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: 'Không kết nối được máy chủ AI. Vui lòng thử lại sau.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const startAudioRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setToast('Trình duyệt không hỗ trợ thu âm trực tiếp. Hãy chạm để dùng Chatbot nhé.');
      return;
    }

    try {
      navigator.vibrate?.(40);
    } catch {}

    cancelledVoiceRef.current = false;
    audioChunksRef.current = [];
    setRecordSeconds(0);
    setChatOpen(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Nếu người dùng đã thả tay trong lúc xin quyền micro -> dừng ngay
      if (!triggeredVoiceRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      mediaStreamRef.current = stream;
      peakVolumeRef.current = 0;

      // Đo mức âm lượng thực tế để chống gửi file im lặng lên AI (tránh ảo giác tự ghi phản ánh)
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          audioContextRef.current = ctx;
          const dataArr = new Uint8Array(analyser.fftSize);
          volumeIntervalRef.current = window.setInterval(() => {
            analyser.getByteTimeDomainData(dataArr);
            let sumSq = 0;
            for (let i = 0; i < dataArr.length; i++) {
              const norm = (dataArr[i] - 128) / 128;
              sumSq += norm * norm;
            }
            const rms = Math.sqrt(sumSq / dataArr.length);
            if (rms > peakVolumeRef.current) {
              peakVolumeRef.current = rms;
            }
          }, 80);
        }
      } catch {}

      const mimeType = pickSupportedAudioMime();
      const recorderOptions: MediaRecorderOptions = { audioBitsPerSecond: 32000 };
      if (mimeType) recorderOptions.mimeType = mimeType;
      const recorder = new MediaRecorder(stream, recorderOptions);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const peakVol = peakVolumeRef.current;
        const hadAnalyser = Boolean(audioContextRef.current);
        cleanupMedia();
        setVoiceActive(false);

        if (cancelledVoiceRef.current || chunks.length === 0) return;

        // Nếu micro hoàn toàn im lặng -> không gửi lên AI, không tự ghi phản ánh
        if (hadAnalyser && peakVol < 0.015) {
          setToast('Chưa nghe thấy giọng nói của bạn. Hãy giữ nút AI 1 giây và nói rõ yêu cầu nhé.');
          return;
        }

        const blob = new Blob(chunks, { type });
        if (blob.size < 1200) {
          setToast('Đoạn ghi âm quá ngắn. Hãy giữ nút và nói rõ yêu cầu nhé.');
          return;
        }

        setVoiceProcessing(true);
        try {
          const res = await aiApi.voiceCommand(blob);
          if (res.transcript) {
            setMessages((prev) => [
              ...prev,
              { id: `u-${Date.now()}`, role: 'user', text: res.transcript! },
              { id: `a-${Date.now() + 1}`, role: 'assistant', text: res.reply },
            ]);
          }
          executeAssistantResult(res, true);
        } catch (err) {
          const msg =
            err instanceof Error && err.message && !err.message.includes('Failed to fetch')
              ? err.message
              : 'Không thể kết nối máy chủ AI (có thể máy chủ đang khởi động lại). Vui lòng thử lại sau vài giây.';
          setToast(msg);
        } finally {
          setVoiceProcessing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setVoiceActive(true);

      recordIntervalRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setVoiceActive(false);
      setToast('Vui lòng cấp quyền Micro để dùng điều khiển bằng giọng nói.');
    }
  };

  const stopAudioRecording = (cancel = false) => {
    cancelledVoiceRef.current = cancel;
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        cleanupMedia();
        setVoiceActive(false);
      }
    } else {
      cleanupMedia();
      setVoiceActive(false);
    }
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
      void startAudioRecording();
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
      stopAudioRecording(false);
    } else {
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
      stopAudioRecording(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    const text = inputText;
    setInputText('');
    void sendTextToAssistant(text);
  };

  const formatTimer = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

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

      {/* 2. KHUNG ĐANG GHI ÂM TRỰC TIẾP GỬI GEMINI 2.5 FLASH */}
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
                  ? 'AI Gemini đang nghe & chép nguyên văn...'
                  : `Đang ghi âm trực tiếp (${formatTimer(recordSeconds)})`}
              </span>
            </div>
            {voiceActive && (
              <button
                type="button"
                onClick={() => stopAudioRecording(true)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Hủy
              </button>
            )}
          </div>

          <div className="p-2.5 rounded-[6px] bg-white/10 text-xs text-blue-100 leading-relaxed flex items-center justify-between gap-3">
            <span>
              {voiceProcessing
                ? 'Đang phân tích giọng nói và tự động điền đúng mô tả của bạn...'
                : 'Hãy nói tự nhiên yêu cầu phản ánh của bạn, thả tay ra để gửi.'}
            </span>
            {voiceActive && (
              <div className="flex items-end gap-0.5 h-5 shrink-0">
                <span className="w-1 bg-amber-400 rounded-full animate-pulse h-3" />
                <span className="w-1 bg-amber-300 rounded-full animate-pulse h-5" />
                <span className="w-1 bg-amber-400 rounded-full animate-pulse h-2.5" />
                <span className="w-1 bg-amber-300 rounded-full animate-pulse h-4" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CỬA SỔ CHATBOT TỐI GIẢN (KHÔNG NÚT GỢI Ý NHANH) */}
      {chatOpen && !voiceActive && (
        <div className="fixed bottom-[144px] md:bottom-24 left-3 right-3 sm:left-auto sm:right-6 sm:w-[360px] z-50 bg-white rounded-[8px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[65vh]">
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
                onClick={handleClearChat}
                title="Xóa lịch sử trò chuyện"
                aria-label="Xóa lịch sử trò chuyện"
                className="p-1.5 rounded hover:bg-white/10 text-blue-200 hover:text-white transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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

      {/* 4. NÚT TRỢ LÝ AI NỔI DUY NHẤT (CHẠM = CHATBOT | GIỮ 1S = THU ÂM TRỰC TIẾP) */}
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
