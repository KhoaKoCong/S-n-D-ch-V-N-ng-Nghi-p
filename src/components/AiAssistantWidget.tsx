import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  ImagePlus,
  Camera,
  Trash2,
  Sparkles,
  CloudSun,
  Newspaper,
  Bug,
  HelpCircle,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ZoomIn,
  Zap,
  Brain,
} from 'lucide-react';
import { useAgri } from '../context/AgriContext';

type AiModePreference = 'auto' | 'fast' | 'smart';

interface AiChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  imagePreviewUrl?: string;
  hadImage?: boolean;
  isError?: boolean;
  tier?: 'fast' | 'smart';
  tierLabel?: string;
  isStreaming?: boolean;
}

interface PendingImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
  sizeKb: number;
}

const STORAGE_KEY = 'agri_ai_chat_history_v1';
const HINT_DISMISSED_KEY = 'agri_ai_hint_dismissed_v1';

const WELCOME_MESSAGE: AiChatMessage = {
  id: 'welcome-msg',
  role: 'model',
  text:
    'Chào bà con! Trợ lý Nông Vụ AI sẵn sàng hỗ trợ:\n' +
    '- **Chẩn đoán ảnh sâu bệnh:** Chụp hoặc gửi ảnh lá lúa, thân cây, trái cây để nhận hướng dẫn xử lý ngay.\n' +
    '- **Thời tiết & Thời sự ĐBSCL:** Tra cứu thời tiết thực tế 5 ngày, tin nóng nông nghiệp và giá nông sản.\n' +
    '- **Hướng dẫn dùng app:** Đăng bài thuê phun Drone/máy cắt, nạp ví Viettel Money và theo dõi tiến trình.',
  timestamp: new Date().toISOString(),
};

async function compressImageFile(file: File): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh này.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const fallbackRaw = () => {
        const match = rawDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        const base64 = match ? match[2] : rawDataUrl.split(',')[1] || '';
        if (!base64) {
          reject(new Error('Tệp chọn không phải là hình ảnh hợp lệ.'));
          return;
        }
        const sizeKb = Math.max(1, Math.round((base64.length * 3) / 4 / 1024));
        if (sizeKb > 6500) {
          reject(new Error('Ảnh quá lớn (> 6MB). Vui lòng chụp lại hoặc chọn ảnh nhẹ hơn.'));
          return;
        }
        const mimeType =
          match?.[1] || (file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg');
        resolve({
          dataUrl: rawDataUrl,
          base64,
          mimeType,
          sizeKb,
        });
      };

      const img = new Image();
      img.onerror = fallbackRaw;
      img.onload = () => {
        try {
          const maxSide = 1024;
          let { width, height } = img;
          if (width > maxSide || height > maxSide) {
            if (width >= height) {
              height = Math.round((height * maxSide) / width);
              width = maxSide;
            } else {
              width = Math.round((width * maxSide) / height);
              height = maxSide;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            fallbackRaw();
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
          const base64 = dataUrl.split(',')[1] || '';
          const sizeKb = Math.max(1, Math.round((base64.length * 3) / 4 / 1024));
          resolve({
            dataUrl,
            base64,
            mimeType: 'image/jpeg',
            sizeKb,
          });
        } catch {
          fallbackRaw();
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function renderInlineBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function FormattedAiText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed break-words">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) {
          return <div key={idx} className="h-1" />;
        }

        // Heading ### or ##
        const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
          return (
            <p key={idx} className="font-bold text-emerald-800 dark:text-emerald-300 pt-1">
              {renderInlineBold(headingMatch[1])}
            </p>
          );
        }

        // Bullet list item (- or * or +)
        const bulletMatch = line.match(/^[-*+•]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="flex-1">{renderInlineBold(bulletMatch[1])}</span>
            </div>
          );
        }

        // Numbered list item (1. ...)
        const numMatch = line.match(/^(\d+\.)\s+(.+)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 min-w-[18px]">
                {numMatch[1]}
              </span>
              <span className="flex-1">{renderInlineBold(numMatch[2])}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
}

export const AiAssistantWidget: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    activeTab,
    setActiveTab,
    selectedPost,
    selectedChatTxnId,
    showWalletModal,
    showAuthModal,
    showSyncModal,
    showOnboarding,
  } = useAgri();

  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HINT_DISMISSED_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AiChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore corrupt storage
    }
    return [WELCOME_MESSAGE];
  });

  const [inputText, setInputText] = useState('');
  const [aiMode, setAiMode] = useState<AiModePreference>('auto');
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Persist messages cleanly (strip large base64 data URLs before saving to localStorage)
  useEffect(() => {
    try {
      const compact = messages
        .filter((m) => !m.isStreaming)
        .slice(-26)
        .map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          timestamp: m.timestamp,
          hadImage: m.hadImage || Boolean(m.imagePreviewUrl),
          isError: m.isError,
          tier: m.tier,
          tierLabel: m.tierLabel,
        }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending]);

  const dismissHint = () => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_DISMISSED_KEY, '1');
    } catch {}
  };

  const handleOpen = () => {
    dismissHint();
    setIsOpen(true);
  };

  const handleClearChat = () => {
    if (isSending) return;
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date().toISOString() }]);
    setPendingImage(null);
    setUploadError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleSelectImageFile = async (file: File | null | undefined) => {
    if (!file) return;
    setUploadError(null);
    const hasImageMime = file.type ? file.type.startsWith('image/') : false;
    const hasImageExt = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '');
    if (!hasImageMime && !hasImageExt) {
      setUploadError('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP).');
      return;
    }
    try {
      const compressed = await compressImageFile(file);
      setPendingImage(compressed);
      setTimeout(() => textareaRef.current?.focus(), 60);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Không thể xử lý ảnh này.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void handleSelectImageFile(file);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void handleSelectImageFile(file);
          break;
        }
      }
    }
  };

  const sendMessage = async (overrideText?: string) => {
    if (isSending) return;
    const textToSend = (overrideText !== undefined ? overrideText : inputText).trim();
    const imageToSend = pendingImage;

    if (!textToSend && !imageToSend) return;

    setUploadError(null);
    const displayUserText =
      textToSend || 'Nhờ Trợ lý kiểm tra giúp hình ảnh này là sâu bệnh gì và cách xử lý nhé!';

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: displayUserText,
      timestamp: new Date().toISOString(),
      imagePreviewUrl: imageToSend?.dataUrl,
      hadImage: Boolean(imageToSend),
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome-msg' && !m.isError && !m.isStreaming)
      .slice(-8)
      .map((m) => ({
        role: m.role,
        text: m.text,
        hasImage: Boolean(m.hadImage || m.imagePreviewUrl),
      }));

    const aiMsgId = `ai-${Date.now()}`;
    const placeholderAiMsg: AiChatMessage = {
      id: aiMsgId,
      role: 'model',
      text: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, placeholderAiMsg]);
    setPendingImage(null);
    if (overrideText === undefined) {
      setInputText('');
    }
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyForApi,
          mode: aiMode,
          stream: true,
          image: imageToSend
            ? { data: imageToSend.base64, mimeType: imageToSend.mimeType }
            : null,
          context: {
            province: currentUser?.province || 'An Giang',
            activeTab,
            userName: isAuthenticated ? currentUser?.name : undefined,
            userRole: currentUser?.role,
          },
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      // Handle non-streaming JSON error or fallback JSON response
      if (!res.ok || !contentType.includes('text/event-stream') || !res.body) {
        const data = (await res.json().catch(() => ({}))) as {
          reply?: string;
          error?: string;
          timestamp?: string;
          tier?: 'fast' | 'smart';
          tierLabel?: string;
        };
        if (!res.ok || !data.reply) {
          throw new Error(
            data.error || 'Không thể kết nối với Trợ lý AI lúc này. Bà con vui lòng thử lại sau.'
          );
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  text: data.reply || '',
                  timestamp: data.timestamp || new Date().toISOString(),
                  tier: data.tier,
                  tierLabel: data.tierLabel,
                  isStreaming: false,
                }
              : m
          )
        );
        return;
      }

      // Consume SSE stream live chunk by chunk
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let streamTier: 'fast' | 'smart' | undefined;
      let streamTierLabel: string | undefined;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEvent of events) {
          const dataLine = rawEvent
            .split('\n')
            .find((line) => line.startsWith('data:'));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const payload = JSON.parse(jsonStr) as {
              type?: string;
              text?: string;
              tier?: 'fast' | 'smart';
              tierLabel?: string;
              timestamp?: string;
              error?: string;
            };

            if (payload.type === 'meta') {
              streamTier = payload.tier;
              streamTierLabel = payload.tierLabel;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, tier: streamTier, tierLabel: streamTierLabel }
                    : m
                )
              );
            } else if (payload.type === 'chunk' && payload.text) {
              accumulatedText += payload.text;
              const currentText = accumulatedText;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        text: currentText,
                        tier: streamTier,
                        tierLabel: streamTierLabel,
                      }
                    : m
                )
              );
            } else if (payload.type === 'error') {
              streamError = payload.error || 'Lỗi trong quá trình nhận phản hồi AI.';
            } else if (payload.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        text: accumulatedText,
                        timestamp: payload.timestamp || new Date().toISOString(),
                        tier: payload.tier || streamTier,
                        tierLabel: payload.tierLabel || streamTierLabel,
                        isStreaming: false,
                      }
                    : m
                )
              );
            }
          } catch {
            // Skip malformed SSE line
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (!accumulatedText.trim()) {
        throw new Error(
          'Trợ lý AI chưa nhận được phản hồi hợp lệ. Bà con vui lòng thử gửi lại câu hỏi nhé.'
        );
      }

      // Ensure streaming flag is cleared when stream ends naturally
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m))
      );
    } catch (err) {
      const errText =
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi kết nối Trợ lý AI.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: errText,
                timestamp: new Date().toISOString(),
                isError: true,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const jumpToTab = (tab: 'home' | 'news' | 'create' | 'transactions') => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const formatTimeVN = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const hasBlockingModalOpen = Boolean(
    selectedPost || selectedChatTxnId || showWalletModal || showAuthModal || showSyncModal || showOnboarding
  );

  const starterPrompts = [
    {
      icon: Bug,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
      label: 'Sâu bệnh đang hoành hành',
      prompt:
        'Hiện nay ở vùng ĐBSCL có những loại sâu bệnh nào trên lúa và cây ăn trái cần lưu ý nhất, cách phòng trị ra sao?',
    },
    {
      icon: CloudSun,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50',
      label: `Thời tiết ${currentUser?.province || 'An Giang'} hôm nay`,
      prompt: `Cho hỏi thời tiết hôm nay và 3 ngày tới ở ${currentUser?.province || 'An Giang'} có thuận lợi để phun thuốc Drone và làm đồng không?`,
    },
    {
      icon: Newspaper,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
      label: 'Tin thời sự & nông sản ĐBSCL',
      prompt: 'Tóm tắt giúp bà con các tin thời sự và tình hình nông nghiệp mới nhất ở ĐBSCL hôm nay.',
    },
    {
      icon: HelpCircle,
      color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50',
      label: 'Cách thuê máy & nạp ví',
      prompt: 'Hướng dẫn bà con cách đăng bài thuê phun Drone/máy cắt, nạp ví Viettel Money và theo dõi tiến trình trên app này.',
    },
  ];

  const isFreshChat = messages.length <= 1;

  return (
    <>
      {/* Hidden File Inputs for Gallery & Camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Floating Bottom-Right Bubble (Hidden while chat panel or full-screen app modal is open) */}
      {!isOpen && !hasBlockingModalOpen && (
        <div className="fixed bottom-[76px] right-3.5 lg:bottom-6 lg:right-6 z-40 flex items-end gap-2.5 pointer-events-none">
          {showHint && (
            <div className="pointer-events-auto flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-emerald-200 dark:border-emerald-800/70 shadow-lg shadow-emerald-950/10 rounded-2xl rounded-br-sm px-3 py-2 max-w-[205px] animate-fade-in">
              <button
                type="button"
                onClick={handleOpen}
                className="text-left text-[12px] leading-snug font-medium"
              >
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                  Trợ lý Nông Vụ AI
                </span>
                Hỏi thời tiết, cách dùng app & gửi ảnh sâu bệnh
              </button>
              <button
                type="button"
                onClick={dismissHint}
                aria-label="Ẩn gợi ý"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleOpen}
            aria-label="Mở Trợ lý Nông Vụ AI"
            className="pointer-events-auto group relative w-14 h-14 lg:w-[60px] lg:h-[60px] rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-700/35 hover:shadow-emerald-600/50 active:scale-95 hover:scale-105 transition-all flex items-center justify-center ring-2 ring-white/90 dark:ring-slate-900"
          >
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-lime-400 border-2 border-white dark:border-slate-900" />
            </span>
            <Bot className="w-7 h-7 lg:w-[30px] lg:h-[30px] drop-shadow-sm" />
            <Sparkles className="w-3.5 h-3.5 text-lime-200 absolute bottom-2 right-2" />
          </button>
        </div>
      )}

      {/* AI Chat Panel — Full-screen mobile sheet / Floating bottom-right popover on desktop */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Trợ lý Nông Vụ AI"
          className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6 z-50 sm:w-[420px] sm:h-[640px] sm:max-h-[calc(100dvh-40px)] bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl shadow-slate-950/30 border-0 sm:border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white px-4 py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[15px] font-bold tracking-tight truncate">
                    Trợ lý Nông Vụ AI
                  </h2>
                  <span className="inline-block w-2 h-2 rounded-full bg-lime-300 shrink-0" />
                </div>
                <p className="text-[11.5px] text-emerald-50/90 truncate">
                  Thời tiết • Tin ĐBSCL • Chẩn đoán ảnh sâu bệnh
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleClearChat}
                disabled={isSending}
                title="Bắt đầu cuộc trò chuyện mới"
                className="p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 active:scale-95 transition-all disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng trợ lý AI"
                className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Smart Routing Mode Bar + Compact Quick Nav */}
          <div className="shrink-0 px-3 py-2 bg-emerald-50/70 dark:bg-slate-900/90 border-b border-emerald-100 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-emerald-900/80 dark:text-emerald-300 shrink-0">
                Chế độ AI:
              </span>
              <div className="inline-flex items-center p-0.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { id: 'auto', label: 'Tự động', icon: Sparkles },
                    { id: 'fast', label: 'Nhanh', icon: Zap },
                    { id: 'smart', label: 'Chuyên sâu', icon: Brain },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = aiMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAiMode(opt.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        active
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-400 shrink-0 mr-0.5">
                Đi nhanh:
              </span>
              <button
                type="button"
                onClick={() => jumpToTab('news')}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors"
              >
                Tin tức & Thời tiết
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={() => jumpToTab('create')}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors"
              >
                Thuê phun Drone
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={() => jumpToTab('transactions')}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors"
              >
                Tiến trình
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3.5 space-y-3 bg-slate-50/80 dark:bg-slate-950/60 overscroll-contain">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 mb-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : msg.isError
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/70 rounded-bl-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {/* User Attached Image Preview */}
                    {msg.imagePreviewUrl && (
                      <button
                        type="button"
                        onClick={() => setZoomImageUrl(msg.imagePreviewUrl || null)}
                        className="group relative block mb-2 rounded-xl overflow-hidden border border-white/25 bg-black/10 max-w-[220px]"
                      >
                        <img
                          src={msg.imagePreviewUrl}
                          alt="Ảnh bà con gửi để chẩn đoán"
                          className="w-full max-h-48 object-cover block"
                        />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white rounded-lg px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1 opacity-90">
                          <ZoomIn className="w-3 h-3" />
                          Phóng to
                        </span>
                      </button>
                    )}

                    {!msg.imagePreviewUrl && msg.hadImage && isUser && (
                      <div className="mb-1.5 inline-flex items-center gap-1 text-[11px] bg-white/15 px-2 py-0.5 rounded-md text-emerald-50">
                        <Camera className="w-3 h-3" />
                        Đã gửi kèm hình ảnh
                      </div>
                    )}

                    {msg.isError ? (
                      <div className="flex items-start gap-2 text-[13px] leading-relaxed">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                        <span>{msg.text}</span>
                      </div>
                    ) : isUser ? (
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    ) : msg.isStreaming && !msg.text ? (
                      <div className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-300 py-0.5">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                        <span>
                          {msg.tier === 'fast'
                            ? 'AI Nhanh đang trả lời...'
                            : msg.tier === 'smart'
                            ? 'AI Chuyên sâu đang phân tích kỹ...'
                            : 'Đang chọn AI phù hợp...'}
                        </span>
                      </div>
                    ) : (
                      <FormattedAiText text={msg.text} />
                    )}

                    <div
                      className={`mt-1.5 flex items-center gap-2 text-[10px] ${
                        isUser
                          ? 'text-emerald-100/85 justify-end'
                          : 'text-slate-400 dark:text-slate-500 justify-between'
                      }`}
                    >
                      {!isUser && msg.tier && !msg.isError && (
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            msg.tier === 'fast'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {msg.tier === 'fast' ? (
                            <Zap className="w-2.5 h-2.5" />
                          ) : (
                            <Brain className="w-2.5 h-2.5" />
                          )}
                          {msg.tierLabel || (msg.tier === 'fast' ? 'AI Nhanh' : 'AI Chuyên sâu')}
                        </span>
                      )}
                      <span>{msg.isStreaming ? 'Đang gõ...' : formatTimeVN(msg.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Starter Quick Prompts when chat is fresh */}
            {isFreshChat && !isSending && (
              <div className="pt-1 space-y-2">
                {/* Featured Photo Diagnosis Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/70 hover:border-emerald-400 active:scale-[0.99] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-emerald-900 dark:text-emerald-200">
                      Gửi ảnh sâu bệnh để AI chẩn đoán
                    </div>
                    <div className="text-[11.5px] text-emerald-700/90 dark:text-emerald-400/90">
                      Chụp lá lúa, rầy nâu, đạo ôn, cây ăn trái...
                    </div>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {starterPrompts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => void sendMessage(item.prompt)}
                        className="flex flex-col items-start gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 active:scale-[0.98] transition-all text-left shadow-xs"
                      >
                        <span className={`p-1.5 rounded-lg ${item.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spacer for scroll anchor */}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending Image Preview / Upload Error */}
          {(pendingImage || uploadError) && (
            <div className="shrink-0 px-3.5 pt-2.5 pb-1 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              {uploadError && (
                <div className="flex items-center justify-between gap-2 text-[12px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded-xl mb-1.5">
                  <span>{uploadError}</span>
                  <button type="button" onClick={() => setUploadError(null)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {pendingImage && (
                <div className="space-y-2 pb-1">
                  <div className="inline-flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                    <img
                      src={pendingImage.dataUrl}
                      alt="Ảnh xem trước"
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-200 dark:border-emerald-700"
                    />
                    <div className="text-[12px] leading-tight">
                      <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                        Ảnh chẩn đoán đã sẵn sàng
                      </div>
                      <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                        Đã tối ưu dung lượng ({pendingImage.sizeKb} KB)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      aria-label="Xóa ảnh đính kèm"
                      className="p-1 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 shadow-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 1-tap farmer photo questions */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      'Đây là sâu bệnh gì và cách xử lý ngay?',
                      'Bệnh trong ảnh nên dùng nhóm thuốc nào?',
                      'Tình trạng này có nên thuê phun Drone không?',
                    ].map((quickPrompt) => (
                      <button
                        key={quickPrompt}
                        type="button"
                        disabled={isSending}
                        onClick={() => void sendMessage(quickPrompt)}
                        className="shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800/70 transition-colors"
                      >
                        {quickPrompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Composer Input Bar */}
          <div className="shrink-0 px-3 pt-2.5 pb-3 pb-safe bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-end gap-1.5">
              {/* Camera direct capture (mobile) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isSending}
                title="Chụp ảnh sâu bệnh"
                aria-label="Chụp ảnh sâu bệnh"
                className="sm:hidden p-2.5 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 active:scale-95 transition-all shrink-0 disabled:opacity-40"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* Gallery / File Picker */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                title="Chọn ảnh từ máy để hỏi sâu bệnh"
                aria-label="Tải ảnh lên"
                className="p-2.5 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 transition-all shrink-0 disabled:opacity-40"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              <div className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all px-3 py-2">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  disabled={isSending}
                  placeholder={
                    pendingImage
                      ? 'Mô tả thêm triệu chứng hoặc nhấn Gửi ngay...'
                      : 'Hỏi cách dùng app, thời tiết, sâu bệnh...'
                  }
                  className="w-full max-h-24 bg-transparent text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none leading-snug block"
                />
              </div>

              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isSending || (!inputText.trim() && !pendingImage)}
                aria-label="Gửi tin nhắn"
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Sent Crop Photos */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setZoomImageUrl(null)}
            aria-label="Đóng ảnh phóng to"
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomImageUrl}
            alt="Ảnh phóng to"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85dvh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
