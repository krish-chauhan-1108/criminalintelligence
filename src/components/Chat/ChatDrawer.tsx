import React, { useRef, useEffect } from 'react';
import { X, Upload, Send } from 'lucide-react';
import type { ChatMessage } from '@/lib/trana-types';
import { marked } from 'marked';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  onUpload,
  isUploading,
  uploadProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  const handleSend = () => {
    if (inputRef.current && inputRef.current.value.trim() && !isLoading) {
      onSendMessage(inputRef.current.value.trim());
      inputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="chat-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="chat-drawer fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0f0f0f] border-l border-[#242424] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="chat-header h-16 border-b border-[#222222] px-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-serif tracking-tight text-neutral-100">
              Legal Assistant Workspace
            </h2>
            <p className="text-[11px] text-neutral-400">Direct statutory RAG advisor</p>
          </div>
          <button
            className="close-btn text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="drawer-upload p-4 border-b border-[#1e1e1e] bg-[#141414]">
          <div
            className="upload-zone border border-dashed border-[#333333] hover:border-neutral-500 rounded-xl p-3 text-center cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-300">
              <Upload size={15} className="text-amber-300/80" />
              <span>Upload Legal Document (PDF)</span>
            </div>
          </div>
          {isUploading && (
            <div className="progress-track mt-2 h-1 w-full bg-[#222222] rounded-full overflow-hidden">
              <div
                className="progress-fill h-full bg-amber-400/90 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Transcript Area */}
        <div className="transcript-area flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center text-neutral-500 my-12 text-xs">
              Upload a document above or ask an inquiry to begin.
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const cleanContent = msg.content.replace(/\|\n\n\|/g, '|\n|');
              const htmlContent = marked.parse(cleanContent) as string;

              return (
                <div
                  key={idx}
                  className={`transcript-entry rounded-xl p-3.5 text-xs ${
                    isUser
                      ? 'transcript-entry--user bg-[#1a1a1a] border border-[#2c2c2c] text-neutral-200 ml-6'
                      : 'bg-[#121212] border border-[#202020] text-neutral-300 mr-6'
                  }`}
                >
                  <div className="transcript-entry__author font-semibold mb-1 text-[11px] text-neutral-400 uppercase tracking-wider">
                    {isUser ? 'Client Query' : 'Legal Assistant'}
                  </div>
                  <div
                    className="transcript-entry__content prose prose-invert prose-xs max-w-none text-neutral-200"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="source-ref mt-3 pt-2 border-t border-[#222222] text-[11px]">
                      <strong className="text-[10px] uppercase text-neutral-400 tracking-wider block mb-1">
                        Citations:
                      </strong>
                      <div className="space-y-1">
                        {msg.sources.map((src, i) => (
                          <div key={i} className="source-item text-neutral-400 flex items-center justify-between">
                            <span className="source-item__doc truncate max-w-[240px]">
                              [{i + 1}] {src.document_name || src.act || 'Document'}
                            </span>
                            <span className="text-neutral-500 text-[10px]">
                              {src.section && src.section !== 'General' ? `Sec ${src.section}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="transcript-entry bg-[#121212] border border-[#202020] rounded-xl p-3.5 text-xs mr-6">
              <div className="transcript-entry__author font-semibold mb-1 text-[11px] text-neutral-400 uppercase tracking-wider">
                Legal Assistant
              </div>
              <div className="text-neutral-400 italic">Analyzing documents and drafting statutory response...</div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="drawer-input-container p-4 border-t border-[#222222] bg-[#121212] shrink-0">
          <div className="transcript-input flex items-end gap-2 bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2">
            <textarea
              ref={inputRef}
              placeholder="Enter your inquiry..."
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={2}
              className="flex-1 bg-transparent border-0 resize-none text-neutral-200 placeholder-neutral-500 text-xs focus:outline-none"
            />
            <button
              className="send-btn-minimal w-7 h-7 rounded-lg bg-neutral-200 text-neutral-900 hover:bg-white disabled:opacity-40 flex items-center justify-center shrink-0 transition-colors"
              onClick={handleSend}
              disabled={isLoading}
              type="button"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
