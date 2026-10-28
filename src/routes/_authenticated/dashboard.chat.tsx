import React, { useState, useRef, useEffect } from 'react';
import { createFileRoute, useNavigate, useLocation, useParams } from '@tanstack/react-router';
import { Send, Paperclip, FileText, Image as ImageIcon, X, Scale, AlertTriangle } from 'lucide-react';
import { MessageBubble } from '@/components/Chat/MessageBubble';
import type { ApplicableLaw, ChatMessage, ChatSession, StructuredAnalysis } from '@/lib/trana-types';
import { authFetch, authHeaders, notifyApiOnline, useTranaCredential } from '@/lib/trana-auth';
import { API_URL } from '@/lib/trana-backend';

export const Route = createFileRoute('/_authenticated/dashboard/chat')({
  head: () => ({
    meta: [
      { title: 'Legal Chat TRANA' },
      { name: 'description', content: 'Statutory AI legal advisor with verified citations and legal document analysis.' },
      { property: 'og:title', content: 'Legal Chat TRANA' },
    ],
  }),
  component: ChatView,
});

const loadingSynonyms = ['Thinking...', 'Analyzing statutes...', 'Reviewing provisions...', 'Almost there...'];
const WELCOME_MESSAGE = "I'm TRANA—your friendly legal assistant. How can I help you today?";
const CHAT_REQUEST_TIMEOUT_MS = 45_000;
const TEMPORARY_CHAT_STORAGE_KEY = 'trana.temporary-chat';

const readTemporaryChat = (): ChatMessage[] => {
  try {
    const saved = localStorage.getItem(TEMPORARY_CHAT_STORAGE_KEY);
    if (!saved) return [createWelcomeMessage()];
    const messages = JSON.parse(saved) as ChatMessage[];
    if (!Array.isArray(messages) || messages.length > 100) return [createWelcomeMessage()];
    return messages.filter(
      (message) =>
        message &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.length <= 12000,
    );
  } catch {
    return [createWelcomeMessage()];
  }
};

const fetchChatRequest = async (
  input: RequestInfo | URL,
  credential: string,
  init: RequestInit,
  timeoutMessage: string,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);
  try {
    return await authFetch(input, credential, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new Error(timeoutMessage);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

interface ChatAttachment {
  id: string;
  filename: string;
  content_type: string;
  size?: number;
  created_at?: string;
}

const isImageFile = (file: Pick<File, 'type' | 'name'>): boolean =>
  file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);

const readAttachments = (payload: unknown): ChatAttachment[] => {
  if (!payload || typeof payload !== 'object') return [];
  const attachments = (payload as { attachments?: unknown }).attachments;
  if (!Array.isArray(attachments)) return [];
  return attachments.filter(
    (item): item is ChatAttachment =>
      Boolean(
        item &&
          typeof item === 'object' &&
          typeof (item as ChatAttachment).id === 'string' &&
          typeof (item as ChatAttachment).filename === 'string' &&
          typeof (item as ChatAttachment).content_type === 'string',
      ),
  );
};

const createWelcomeMessage = (): ChatMessage => ({
  role: 'assistant',
  content: WELCOME_MESSAGE,
  created_at: new Date().toISOString(),
});

const formatSection = (section?: string | null, subsection?: string | null): string => {
  if (!section) return subsection ? `(${subsection})` : '';
  return subsection ? `${section}(${subsection})` : section;
};

const formatLegalLaw = (law: ApplicableLaw): string => {
  const title =
    [law.act ?? law.code, formatSection(law.section, law.subsection)].filter(Boolean).join(' — ') ||
    'Applicable law';
  const parts = [`### ${title}`];

  if (law.explanation?.trim()) {
    const explanation = law.explanation.trim().replace(/\s+/g, ' ');
    parts.push(`**Explanation**\n\n${explanation.length > 280 ? `${explanation.slice(0, 277)}…` : explanation}`);
  }

  return parts.join('\n\n');
};

const formatAnalysis = (
  analysis: unknown,
  options: { includeLegacyLawSummary?: boolean } = {},
): string => {
  if (typeof analysis === 'string') return analysis;
  if (!analysis || typeof analysis !== 'object') return 'The backend returned an empty analysis.';

  const result = analysis as StructuredAnalysis;
  const sections: string[] = [];

  if (result.conversational_reply) sections.push(result.conversational_reply);
  if (result.general_analysis) sections.push(`## General Legal Analysis\n${result.general_analysis}`);
  if (result.situation_meaning) sections.push(`## What This Situation Means\n${result.situation_meaning}`);
  if (result.bail_status) sections.push(`## Bail Status\n${result.bail_status}`);
  if (result.next_24_hours?.length) {
    sections.push(`## What To Do Next\n${result.next_24_hours.map((item) => `- ${item}`).join('\n')}`);
  }
  if (result.rights?.length) {
    sections.push(`## Your Rights\n${result.rights.map((item) => `- ${item}`).join('\n')}`);
  }
  if (result.handling_authority) sections.push(`## Relevant Authority\n${result.handling_authority}`);
  if (options.includeLegacyLawSummary && result.applicable_laws?.length) {
    const laws = result.applicable_laws.map(formatLegalLaw);
    sections.push(`## Applicable Laws\n${laws.join('\n\n')}`);
  }
  if (result.suggest_lawyer) {
    sections.push('> Consider consulting a qualified lawyer for advice about your specific situation.');
  }

  return sections.join('\n\n') || 'The backend returned an analysis without readable content.';
};

const ThinkingAnimation: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % loadingSynonyms.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3.5 animate-fade-in mb-4">
      <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#262626] flex items-center justify-center shrink-0 shadow-sm text-amber-200/90">
        <Scale className="w-4 h-4" />
      </div>
      <div className="bg-[#121212] border border-[#222222] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-3 w-fit shadow-sm">
        <div className="flex gap-1.5 items-center justify-center h-5">
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse-dot" style={{ animationDelay: '200ms' }} />
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-dot" style={{ animationDelay: '400ms' }} />
        </div>
        <div className="relative h-5 overflow-hidden min-w-[120px]">
          {loadingSynonyms.map((synonym, i) => {
            let positionClass = 'translate-y-full opacity-0';
            if (i === index) {
              positionClass = 'translate-y-0 opacity-100';
            } else if (i === (index - 1 + loadingSynonyms.length) % loadingSynonyms.length) {
              positionClass = '-translate-y-full opacity-0';
            }

            return (
              <span
                key={synonym}
                className={`absolute inset-0 flex items-center transition-all duration-500 ease-in-out text-xs font-medium text-neutral-400 whitespace-nowrap ${positionClass}`}
              >
                {synonym}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ChatLoadingScreen: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-neutral-500 animate-fade-in py-16">
    <div className="w-10 h-10 rounded-full border-2 border-neutral-800 border-t-amber-400 animate-spin mb-4" />
    <p className="text-sm font-medium text-neutral-300">Loading your legal conversation...</p>
    <p className="mt-1 text-xs text-neutral-500 text-center max-w-xs">
      Connecting to statutory verification engine.
    </p>
  </div>
);

export function ChatView() {
  const { credential } = useTranaCredential();
  return <ChatViewContent key={credential ? 'signed-in' : 'guest'} />;
}

export function ChatViewContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = (useParams({ strict: false }) as { id?: string }) || {};
  const routeChatId = params.id;
  const { credential, user } = useTranaCredential();
  const preloadedMessages = (location.state as { preloadedMessages?: ChatMessage[] } | null)?.preloadedMessages;
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    preloadedMessages ?? (routeChatId ? [] : credential ? [createWelcomeMessage()] : readTemporaryChat()),
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [quickUnavailable, setQuickUnavailable] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [chatAttachments, setChatAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!credential && !routeChatId) {
      try {
        localStorage.setItem(TEMPORARY_CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-100)));
      } catch {
        console.warn('Could not save temporary chat in browser storage.');
      }
    }
  }, [credential, messages, routeChatId]);

  const handleChatPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboard = event.clipboardData;
    const images = Array.from(clipboard.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    const text = clipboard.getData('text/plain');
    const composerFocused = event.target === chatInputRef.current;
    if (!images.length && composerFocused) return;
    if (images.length) {
      event.preventDefault();
      const namedImages = images.map(
        (file, index) =>
          new File(
            [file],
            file.name || `clipboard-image-${Date.now()}-${index + 1}.${file.type.split('/')[1] || 'png'}`,
            { type: file.type, lastModified: Date.now() },
          ),
      );
      setPendingFiles((files) => [...files, ...namedImages]);
      setAttachmentError('');
    }
    if (text && (!composerFocused || images.length > 0)) {
      event.preventDefault();
      setInput((current) => {
        if (!current) return text;
        if (!composerFocused) return `${current}\n${text}`;
        const inputElement = chatInputRef.current;
        const start = inputElement?.selectionStart ?? current.length;
        const end = inputElement?.selectionEnd ?? start;
        return `${current.slice(0, start)}${text}${current.slice(end)}`;
      });
    }
  };

  useEffect(() => {
    const urls: Record<string, string> = {};
    pendingFiles.forEach((file) => {
      if (isImageFile(file)) urls[`${file.name}:${file.size}:${file.lastModified}`] = URL.createObjectURL(file);
    });
    setPreviewUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [pendingFiles]);

  useEffect(() => {
    let active = true;
    if (!routeChatId || !credential) {
      setChatAttachments([]);
      return () => {
        active = false;
      };
    }
    const loadAttachments = async () => {
      try {
        const response = await authFetch(
          `${API_URL}/api/chats/${encodeURIComponent(routeChatId)}/attachments`,
          credential,
          { cache: 'no-store' },
        );
        if (!response.ok) throw new Error(`Attachment list failed: ${response.status}`);
        const payload: unknown = await response.json();
        if (active) setChatAttachments(readAttachments(payload));
      } catch (error) {
        console.error('Failed to load chat attachments', error);
        if (active) setAttachmentError('Could not load this chat’s attachments. Reload the chat to try again.');
      }
    };
    setAttachmentError('');
    loadAttachments();
    return () => {
      active = false;
    };
  }, [credential, routeChatId]);

  useEffect(() => {
    let active = true;

    if (!routeChatId || !credential) {
      return () => {
        active = false;
      };
    }

    if (preloadedMessages && preloadedMessages.length > 0) {
      return () => {
        active = false;
      };
    }

    const loadChat = async () => {
      setIsChatLoading(true);
      setMessages([]);
      try {
        const response = await authFetch(`${API_URL}/api/chats/${encodeURIComponent(routeChatId)}`, credential, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Chat history failed: ${response.status}`);

        const chat = (await response.json()) as ChatSession;
        if (!active) return;

        setMessages(
          (chat.messages ?? []).map((message) => {
            const sources = message.sources ?? undefined;
            return {
              role: message.role,
              content:
                message.role === 'assistant' && message.structured_content
                  ? formatAnalysis(message.structured_content, { includeLegacyLawSummary: !sources?.length })
                  : message.content,
              sources,
              model_used: message.model_used ?? undefined,
              processing_time_seconds: message.processing_time_seconds ?? undefined,
              created_at: message.created_at,
            };
          }),
        );
      } catch (error) {
        console.error('Failed to load chat history', error);
      } finally {
        if (active) setIsChatLoading(false);
      }
    };

    loadChat();
    return () => {
      active = false;
    };
  }, [credential, routeChatId, preloadedMessages]);

  const shouldShowChatLoading = Boolean(routeChatId && credential && isChatLoading);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || isLoading || shouldShowChatLoading) return;
    if (!credential && pendingFiles.length > 0) {
      setAttachmentError('Sign in to attach PDFs or photos. Temporary chats support text only.');
      return;
    }

    setIsLoading(true);
    const newMessage: ChatMessage = { role: 'user', content: input, created_at: new Date().toISOString() };
    setAttachmentError('');
    let uploadComplete = pendingFiles.length === 0;

    try {
      let activeChatId = routeChatId ?? pendingChatIdRef.current;
      if (credential && !activeChatId) {
        const createResponse = await fetchChatRequest(
          `${API_URL}/api/chats`,
          credential,
          {
            method: 'POST',
            headers: { ...authHeaders(credential), 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: input.slice(0, 30) || 'New Chat' }),
          },
          'Creating this chat took too long. Please try sending again.',
        );
        if (!createResponse.ok) throw new Error('Could not create a chat session.');
        const createdChat = (await createResponse.json()) as ChatSession;
        activeChatId = createdChat.id;
        pendingChatIdRef.current = activeChatId;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chat-created', { detail: createdChat }));
        }
      }

      if (credential && pendingFiles.length > 0 && activeChatId) {
        setIsUploadingAttachments(true);
        const formData = new FormData();
        pendingFiles.forEach((file) => formData.append('files', file, file.name));
        const uploadResponse = await fetchChatRequest(
          `${API_URL}/api/chats/${encodeURIComponent(activeChatId)}/attachments`,
          credential,
          {
            method: 'POST',
            body: formData,
          },
          'Saving the attachment took too long. It is still selected; please retry.',
        );
        if (!uploadResponse.ok) {
          let detail = 'The files could not be uploaded. Your selected files are still here; please try again.';
          try {
            const body = (await uploadResponse.json()) as { detail?: unknown };
            if (typeof body.detail === 'string') detail = body.detail;
          } catch {
            /* Keep fallback */
          }
          throw new Error(detail);
        }
        const uploaded: unknown = await uploadResponse.json();
        const uploadedAttachments = readAttachments(uploaded);
        if (uploadedAttachments.length !== pendingFiles.length) {
          throw new Error('The server did not confirm every attachment. Your selected files are still here; please retry.');
        }
        setChatAttachments((current) => {
          const ids = new Set(current.map((attachment) => attachment.id));
          return [...current, ...uploadedAttachments.filter((attachment) => !ids.has(attachment.id))];
        });
        setPendingFiles([]);
        uploadComplete = true;
      }

      setMessages((prev) => [...prev, newMessage]);
      setInput('');

      const priorHistory = messages
        .filter((message) => message.content !== WELCOME_MESSAGE)
        .slice(-20)
        .map(({ role, content }) => ({ role, content: content.slice(-8000) }));
      const res = await fetchChatRequest(
        `${API_URL}${credential ? '/api/analyze' : '/api/analyze/temporary'}`,
        credential ?? '',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: newMessage.content || 'Analyze the attached document.',
            model_preference: 'quick',
            ...(credential ? { chat_id: activeChatId } : { conversation_history: priorHistory }),
          }),
        },
        'Analysis took too long. Please try sending your question again.',
      );

      if (res.ok) {
        notifyApiOnline(true);
        const data = await res.json();
        const sources = Array.isArray(data.sources) ? data.sources : undefined;
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: formatAnalysis(data.analysis, { includeLegacyLawSummary: !sources?.length }),
          sources,
          model_used: data.model_used,
          processing_time_seconds: data.processing_time_seconds,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if (credential && !routeChatId && activeChatId) {
          const messagesForNavigation = messages.length > 0 ? messages : [createWelcomeMessage()];
          navigate({
            to: '/dashboard/chat/$id',
            params: { id: activeChatId },
            replace: true,
            state: { preloadedMessages: [...messagesForNavigation, newMessage, assistantMessage] } as any,
          });
          pendingChatIdRef.current = null;
        }
      } else {
        let detail = 'The backend could not complete the analysis.';
        let errorCode = '';
        try {
          const err = (await res.json()) as { detail?: unknown };
          if (typeof err.detail === 'string') {
            detail = err.detail;
          } else if (err.detail && typeof err.detail === 'object') {
            const structuredDetail = err.detail as { code?: unknown; message?: unknown };
            errorCode = typeof structuredDetail.code === 'string' ? structuredDetail.code : '';
            if (typeof structuredDetail.message === 'string') detail = structuredDetail.message;
          }
        } catch {
          // Keep the fallback
        }

        const quickIsUnavailable =
          res.status === 429 &&
          (errorCode === 'QUICK_MODEL_UNAVAILABLE' || detail.toLowerCase().includes('quick thinking'));
        if (quickIsUnavailable) {
          setQuickUnavailable(true);
          detail =
            'Quick Thinking is temporarily unavailable because all configured Quick Thinking providers are rate-limited.';
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I couldn't complete that analysis. ${detail} Please try again in a moment.`,
          },
        ]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'I couldn’t send this message. Please try again.';
      if (!uploadComplete) {
        setAttachmentError(message);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `${message} Your message${
              credential ? ' and saved attachments are still in this chat' : ' is still in this temporary chat'
            }.`,
          },
        ]);
      }
    } finally {
      setIsUploadingAttachments(false);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="chat-view flex flex-col h-[calc(100vh-140px)] bg-[#0d0d0d] border border-[#222222] rounded-2xl overflow-hidden relative"
      onPaste={handleChatPaste}
    >
      {/* Header */}
      <header className="chat-view__header h-16 border-b border-[#222222] flex items-center justify-between px-6 shrink-0 z-10 bg-[#121212]/90 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-serif tracking-tight text-neutral-100">Legal Analysis & RAG Chat</h2>
          {!credential && <p className="text-xs text-neutral-400">Temporary chat · saved in this browser only</p>}
        </div>
        {quickUnavailable && (
          <div
            className="chat-view__alert flex items-center justify-end gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded-full"
            role="status"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Quick Thinking temporarily rate-limited.
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="chat-view__messages flex-1 overflow-y-auto p-6 space-y-4">
        {shouldShowChatLoading ? (
          <ChatLoadingScreen />
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-16">
            <Scale className="w-12 h-12 mb-3 opacity-30 text-amber-200" />
            <p className="text-sm font-serif">Start a new legal inquiry...</p>
          </div>
        ) : null}
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {isLoading && <ThinkingAnimation />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="chat-view__composer p-4 bg-[#121212] border-t border-[#222222] shrink-0">
        <div className="max-w-4xl mx-auto">
          {(chatAttachments.length > 0 || pendingFiles.length > 0) && (
            <div className="mb-3 flex flex-wrap gap-2" aria-label="Chat attachments">
              {chatAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-[#181818] border border-[#2a2a2a] text-xs py-1.5 px-2.5 rounded-lg max-w-full text-neutral-300"
                  title={`${attachment.filename} (saved in this chat)`}
                >
                  {attachment.content_type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-violet-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                  )}
                  <span className="font-medium truncate max-w-[180px]">{attachment.filename}</span>
                  <span className="text-neutral-500 text-[10px]">Saved</span>
                </div>
              ))}
              {pendingFiles.map((file, index) => {
                const key = `${file.name}:${file.size}:${file.lastModified}`;
                const preview = previewUrls[key];
                return (
                  <div
                    key={`${key}:${index}`}
                    className="flex items-center gap-2 bg-[#181818] border border-[#2a2a2a] text-xs py-1.5 px-2.5 rounded-lg max-w-full text-neutral-300"
                  >
                    {preview ? (
                      <img src={preview} alt="" className="w-7 h-7 object-cover rounded" />
                    ) : (
                      <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                    <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => setPendingFiles((files) => files.filter((_, i) => i !== index))}
                      disabled={isLoading}
                      className="text-neutral-500 hover:text-neutral-300 disabled:opacity-40"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {attachmentError && <p role="alert" className="mb-2 text-xs text-rose-400">{attachmentError}</p>}
          {isUploadingAttachments && (
            <p role="status" className="mb-2 text-xs text-neutral-400">Saving attachments to this chat…</p>
          )}

          <div className="chat-view__input-shell flex items-center gap-3 bg-[#161616] border border-[#2c2c2c] rounded-xl px-4 py-3 shadow-inner focus-within:border-amber-400/80 focus-within:ring-1 focus-within:ring-amber-400/50 transition-all">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const chosen = Array.from(e.target.files ?? []);
                if (chosen.length) {
                  setPendingFiles((files) => {
                    const existing = new Set(files.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
                    return [
                      ...files,
                      ...chosen.filter((file) => !existing.has(`${file.name}:${file.size}:${file.lastModified}`)),
                    ];
                  });
                  setAttachmentError('');
                }
                e.currentTarget.value = '';
              }}
              className="hidden"
              accept="application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
              multiple
            />
            <button
              className="chat-view__attach-button text-neutral-400 hover:text-neutral-200 transition-colors p-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={!user || shouldShowChatLoading}
              title="Attach PDFs or photos to this chat"
              type="button"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              ref={chatInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={user ? 'Ask a legal question or attach case documents...' : 'Ask a legal question...'}
              disabled={shouldShowChatLoading}
              className="flex-1 bg-transparent border-none text-neutral-100 placeholder-neutral-500 text-sm min-w-0 outline-none"
            />

            <button
              className="chat-view__send-button bg-neutral-200 text-neutral-900 hover:bg-white p-2 rounded-lg disabled:opacity-40 transition-colors"
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
              type="button"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            PDFs and photos are analyzed with this chat session for follow-up statutory queries.
          </p>
        </div>
      </div>
    </div>
  );
}
