import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (query: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [query]);

  const handleSend = () => {
    if (query.trim() && !isLoading) {
      onSendMessage(query.trim());
      setQuery('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-area-wrapper w-full">
      <div
        className={`input-bar flex items-end gap-2.5 bg-[#141414] border border-[#262626] rounded-2xl px-4 py-3 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500 transition-all ${
          isLoading ? 'opacity-60' : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a legal inquiry or cite a section..."
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent border-0 resize-none text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:ring-0 max-h-[140px] leading-relaxed"
        />
        <button
          className="send-btn shrink-0 w-8 h-8 rounded-xl bg-neutral-200 text-neutral-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-neutral-200 flex items-center justify-center transition-colors shadow-sm"
          onClick={handleSend}
          disabled={!query.trim() || isLoading}
          title="Send inquiry"
          type="button"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
