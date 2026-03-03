import React, { useState, useRef, useEffect } from 'react';
import { useCardGame } from '../useCardGame';

export const ChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const chatMessages = useCardGame(s => s.chatMessages);
  const sendChat = useCardGame(s => s.sendChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(chatMessages.length);

  useEffect(() => {
    if (chatMessages.length > prevCountRef.current) {
      if (!isOpen) {
        setUnread(u => u + (chatMessages.length - prevCountRef.current));
      }
    }
    prevCountRef.current = chatMessages.length;
  }, [chatMessages.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendChat(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-16 right-3 z-40 md:bottom-4">
      {isOpen ? (
        <div className="w-72 h-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-900/50">
            <span className="text-white text-sm font-semibold">Chat</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {chatMessages.length === 0 && (
              <p className="text-gray-500 text-xs text-center mt-8">No messages yet</p>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className="text-sm">
                <span className="text-indigo-400 font-semibold text-xs">{msg.sender}: </span>
                <span className="text-gray-300 text-xs break-words">{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t border-gray-700 flex gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-xs placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
