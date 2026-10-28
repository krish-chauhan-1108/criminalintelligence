import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '@/lib/trana-types';
import { Scale } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onQuickPrompt: (prompt: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onQuickPrompt }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="messages-container flex-1 flex items-center justify-center p-6">
        <div className="empty-state text-center max-w-lg mx-auto py-12 px-6 rounded-2xl bg-[#121212] border border-[#222222] shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2e2e2e] flex items-center justify-center mx-auto mb-4 text-amber-200/80">
            <Scale size={22} />
          </div>
          <h3 className="text-xl font-serif tracking-tight text-neutral-100 mb-2">
            Ask a Legal Question
          </h3>
          <p className="text-xs text-neutral-400 mb-6 leading-relaxed max-w-sm mx-auto">
            Inquire about Bharatiya Nyaya Sanhita (BNS), BNSS, BSA, procedural rights, bail provisions, or upload a legal document for clause analysis.
          </p>
          <div className="quick-prompts flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              className="quick-prompt-btn text-xs bg-[#181818] hover:bg-[#222222] text-neutral-300 border border-[#2a2a2a] px-3.5 py-2 rounded-full transition-colors"
              onClick={() => onQuickPrompt("What are the grounds and procedure for anticipatory bail under BNSS?")}
            >
              Anticipatory bail under BNSS
            </button>
            <button
              type="button"
              className="quick-prompt-btn text-xs bg-[#181818] hover:bg-[#222222] text-neutral-300 border border-[#2a2a2a] px-3.5 py-2 rounded-full transition-colors"
              onClick={() => onQuickPrompt("What are the key differences between theft and extortion in BNS?")}
            >
              BNS theft vs extortion
            </button>
            <button
              type="button"
              className="quick-prompt-btn text-xs bg-[#181818] hover:bg-[#222222] text-neutral-300 border border-[#2a2a2a] px-3.5 py-2 rounded-full transition-colors"
              onClick={() => onQuickPrompt("Explain the admissibility of electronic records under Bharatiya Sakshya Adhiniyam.")}
            >
              Electronic evidence under BSA
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container flex-1 overflow-y-auto px-4 py-6" ref={containerRef}>
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} />
      ))}

      {isLoading && (
        <div className="message message--ai flex gap-3.5 mb-6">
          <div className="shrink-0 w-8 h-8 rounded-full bg-[#111111] border border-[#262626] text-amber-200/90 flex items-center justify-center">
            <Scale size={15} />
          </div>
          <div className="bg-[#121212] border border-[#222222] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse [animation-delay:200ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse [animation-delay:400ms]" />
            <span className="text-xs text-neutral-400 ml-2 font-medium">Analyzing statutes...</span>
          </div>
        </div>
      )}
    </div>
  );
};
