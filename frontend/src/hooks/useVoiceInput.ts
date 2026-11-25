import { useState, useRef, useEffect, useCallback } from 'react';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function useVoiceInput(onFinalTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const callbackRef = useRef(onFinalTranscript);
  callbackRef.current = onFinalTranscript;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Trình duyệt hiện tại chưa hỗ trợ nhập bằng giọng nói. Vui lòng dùng Chrome hoặc Edge.');
      return;
    }

    setError(null);
    setInterimText('');

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript || '';
          if (result.isFinal) {
            finalChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }

        setInterimText(interimChunk.trim());

        if (finalChunk.trim()) {
          callbackRef.current(finalChunk.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Bạn chưa cấp quyền Micro. Vui lòng cho phép trình duyệt sử dụng Micro rồi thử lại.');
        } else if (event.error === 'no-speech') {
          setError('Không nghe thấy giọng nói. Hãy bấm lại và nói rõ vào micro.');
        } else if (event.error !== 'aborted') {
          setError('Có lỗi khi nhận diện giọng nói. Bạn có thể thử lại hoặc gõ trực tiếp.');
        }
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setError('Không thể khởi động Micro. Vui lòng kiểm tra thiết bị và thử lại.');
      setIsListening(false);
    }
  }, [isSupported]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimText,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}
