'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Mic, Send } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  placeholder = "Type a message...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Allow Shift+Enter for new lines in textarea
  };

  return (
    <div className="border-t bg-transparent p-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          {/* Text Input Area - Top */}
          <div className="mb-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full border-0 outline-none text-sm placeholder:text-gray-400 bg-transparent resize-none overflow-hidden"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '20px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>

          {/* Button Footer - Bottom */}
          <div className="flex items-center justify-between">
            {/* Left Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-lg border-0 bg-transparent hover:bg-gray-100"
              disabled={disabled}
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </Button>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-2">
              {/* Voice Input Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full bg-transparent hover:bg-gray-100"
                disabled={disabled}
              >
                <Mic className="h-4 w-4 text-gray-600" />
              </Button>

              {/* Send Button */}
              <Button
                type="submit"
                size="sm"
                className="h-7 w-7 p-0 rounded-full bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50"
                disabled={!message.trim() || disabled}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};