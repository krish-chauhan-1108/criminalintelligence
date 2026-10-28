import React, { useState, useEffect } from 'react';
import { User, Scale, ChevronDown, ChevronUp, Clock, CalendarClock, ExternalLink, FileText } from 'lucide-react';
import { marked } from 'marked';
import type { ChatMessage, SourceChunk } from '@/lib/trana-types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const formatMessageTime = (value: string): string | null => {
  // Older API records contain UTC timestamps without an offset.
  const normalizedValue = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return null;

  return `${new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)} IST`;
};

const VERIFIED_QUOTE_STATUSES = new Set(['backend_verified', 'verified', 'source_verified']);

const OFFICIAL_ACT_URLS = {
  bns: 'https://www.mha.gov.in/sites/default/files/2024-04/250883_english_01042024.pdf',
  bnss: 'https://www.mha.gov.in/sites/default/files/2024-04/250884_2_english_01042024.pdf',
  bsa: 'https://www.mha.gov.in/sites/default/files/2024-04/250882_english_01042024_0.pdf',
} as const;

const isVerifiedSource = (source: SourceChunk): boolean => {
  const status = source.quote_status?.trim().toLowerCase();
  return source.verified === true && !!status && VERIFIED_QUOTE_STATUSES.has(status);
};

const getVerifiedText = (source: SourceChunk): string | null => {
  if (!isVerifiedSource(source)) return null;
  const text = source.exact_text ?? source.quote ?? source.content;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
};

const formatDocName = (name?: string) => {
  if (!name) return 'Legal source';
  if (name.includes('::')) {
    const parts = name.split('::');
    return `Case Document: ${parts[parts.length - 1]}`;
  }
  return name;
};

const formatSection = (section?: string, subsection?: string | null): string => {
  if (!section) return subsection ? `(${subsection})` : '';
  return subsection ? `${section}(${subsection})` : section;
};

const formatActName = (source: SourceChunk): string =>
  source.act?.trim() || source.code?.trim() || formatDocName(source.document_name);

const formatSectionLabel = (source: SourceChunk): string =>
  formatSection(source.section, source.subsection) || 'General';

const formatQuoteStatus = (source: SourceChunk): string => {
  if (isVerifiedSource(source)) return 'Verified';
  if (source.quote_status?.trim().toLowerCase() === 'not_found') return 'Unavailable';
  return 'Not verified';
};

const getSourceText = (source: SourceChunk): string | null => {
  const text = source.exact_text ?? source.quote ?? source.content;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
};

const getConciseExplanation = (source: SourceChunk): string | null => {
  const explanation = source.explanation?.trim().replace(/\s+/g, ' ');
  if (!explanation) return null;
  return explanation.length > 260 ? `${explanation.slice(0, 257)}...` : explanation;
};

const getOfficialActUrl = (source: SourceChunk): string | null => {
  const identity = [source.act, source.code, source.document_name].filter(Boolean).join(' ').toLowerCase();
  // Always use the reachable official MHA copy for BNS/BNSS/BSA.
  if (identity.includes('bharatiya nyaya') || /\bbns\b/.test(identity)) return OFFICIAL_ACT_URLS.bns;
  if (identity.includes('bharatiya nagarik') || /\bbnss\b/.test(identity)) return OFFICIAL_ACT_URLS.bnss;
  if (identity.includes('bharatiya sakshya') || /\bbsa\b/.test(identity)) return OFFICIAL_ACT_URLS.bsa;

  const suppliedUrl = source.source_url?.trim();
  if (suppliedUrl) {
    try {
      const parsed = new URL(suppliedUrl);
      const hostname = parsed.hostname.toLowerCase();
      const isOfficialHost = hostname === 'mha.gov.in' || hostname.endsWith('.mha.gov.in');
      if (parsed.protocol === 'https:' && isOfficialHost) return parsed.toString();
    } catch {
      // No safe official URL was supplied.
    }
  }

  return null;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isUser = message.role === 'user';

  const [animatedContent, setAnimatedContent] = useState(isUser ? '' : message.content);

  useEffect(() => {
    if (isUser) {
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      index += 5;
      if (index >= message.content.length) {
        setAnimatedContent(message.content);
        clearInterval(interval);
      } else {
        setAnimatedContent(message.content.substring(0, index));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [message.content, isUser]);

  const displayedContent = isUser ? message.content : animatedContent;
  const cleanContent = displayedContent.replace(/\|\n\n\|/g, '|\n|');
  const htmlContent = marked.parse(cleanContent) as string;
  const formattedMessageTime = message.created_at
    ? formatMessageTime(message.created_at)
    : null;

  return (
    <div className={`message-bubble flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`message-bubble__row flex max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3.5`}>
        {/* Avatar */}
        <div
          className={`message-bubble__avatar shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 border ${
            isUser
              ? 'bg-[#1e1e1e] border-[#333333] text-white shadow-sm'
              : 'bg-[#111111] border-[#262626] text-amber-200/90 shadow-sm'
          }`}
        >
          {isUser ? <User size={15} /> : <Scale size={15} />}
        </div>

        {/* Bubble */}
        <div className={`message-bubble__content flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          <div
            className={`message-bubble__bubble px-5 py-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
              isUser
                ? 'bg-[#1c1c1c] text-[#f2f2f2] border border-[#2e2e2e] rounded-tr-none'
                : 'bg-[#121212] text-[#e0e0e0] border border-[#222222] rounded-tl-none'
            }`}
          >
            <div
              className={`prose prose-sm max-w-none ${
                isUser
                  ? 'prose-invert text-[#f0f0f0]'
                  : 'prose-invert text-[#e0e0e0] prose-headings:text-amber-100/90 prose-a:text-sky-400 hover:prose-a:underline'
              }`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          {/* Render Sources for AI Messages */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="message-sources mt-2.5 w-full">
              <button
                className="message-sources__toggle flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors bg-[#181818] border border-[#2a2a2a] px-3 py-1.5 rounded-full shadow-sm"
                type="button"
                aria-expanded={sourcesOpen}
                onClick={() => setSourcesOpen(!sourcesOpen)}
              >
                {sourcesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>
                  {message.sources.length} {message.sources.length === 1 ? 'verified source' : 'verified sources'}
                </span>
              </button>

              {sourcesOpen && (
                <div className="message-sources__list mt-3 w-full max-w-3xl space-y-2.5">
                  {message.sources.map((source, idx) => {
                    const verified = isVerifiedSource(source);
                    return (
                      <article
                        key={idx}
                        className="message-source-card bg-[#151515] border border-[#242424] rounded-xl p-3.5 text-xs text-neutral-300"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={15} className="text-amber-300/80 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-200 truncate">{formatActName(source)}</div>
                              <div className="text-[11px] text-neutral-400">Section {formatSectionLabel(source)}</div>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              verified
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            {formatQuoteStatus(source)}
                          </span>
                        </div>

                        {getConciseExplanation(source) && (
                          <p className="text-neutral-300 mb-2 leading-relaxed bg-[#101010] p-2.5 rounded-lg border border-[#1e1e1e]">
                            {getConciseExplanation(source)}
                          </p>
                        )}

                        {getSourceText(source) ? (
                          <details className="mt-2 text-[11px] group">
                            <summary className="cursor-pointer text-neutral-400 hover:text-neutral-200 select-none py-1">
                              {verified ? 'View verified statutory text' : 'View source excerpt'}
                            </summary>
                            <div className="mt-1.5 p-2.5 rounded-lg bg-[#0e0e0e] border border-[#1c1c1c] text-neutral-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                              {getVerifiedText(source) ?? getSourceText(source)}
                            </div>
                          </details>
                        ) : !getConciseExplanation(source) ? (
                          <p className="text-neutral-500 italic mt-1">Exact statutory wording is not available for this reference.</p>
                        ) : null}

                        <div className="mt-2.5 pt-2 border-t border-[#202020] flex items-center justify-between text-[11px]">
                          {getOfficialActUrl(source) ? (
                            <a
                              href={getOfficialActUrl(source) ?? undefined}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors"
                            >
                              <ExternalLink size={12} />
                              Open official text
                            </a>
                          ) : (
                            <span className="text-neutral-500">Official link unavailable</span>
                          )}
                          {(source.source_version || source.source_hash) && (
                            <details className="text-[10px] text-neutral-500">
                              <summary className="cursor-pointer hover:text-neutral-300">Technical info</summary>
                              <div className="mt-1 space-y-0.5">
                                {source.source_version && <div>Version: {source.source_version}</div>}
                                {source.source_hash && <div className="break-all font-mono">Hash: {source.source_hash}</div>}
                              </div>
                            </details>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Message metadata */}
          {(formattedMessageTime || (!isUser && message.processing_time_seconds !== undefined)) && (
            <div className="message-bubble__metadata flex flex-wrap gap-x-4 gap-y-1 mt-2 ml-1 text-[11px] text-neutral-500 font-medium">
              {!isUser && message.processing_time_seconds !== undefined && message.processing_time_seconds !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock size={11} /> {message.processing_time_seconds.toFixed(2)}s processing
                </span>
              )}
              {formattedMessageTime && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock size={11} /> {isUser ? 'Prompt' : 'Sent'} {formattedMessageTime}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
