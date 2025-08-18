

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(text);
    setText('');
  };

  return (
    <div className="bg-surface-2 p-2 border-t border-surface-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('messages.inputPlaceholder')}
          className="w-full pl-4 pr-4 py-2.5 bg-surface-3 rounded-full focus:ring-1 focus:ring-primary outline-none transition duration-200"
          required
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-on-primary rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center transition"
          aria-label={t('messages.inputPlaceholder')}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
