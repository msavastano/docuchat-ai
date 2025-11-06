
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, BotIcon, UserIcon } from './icons';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  isReady: boolean;
}

const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    const isSystem = message.role === 'system';

    if (isSystem) {
        return (
            <div className="text-center my-4 text-sm text-gray-400">
                <p>{message.content}</p>
            </div>
        );
    }
  
    return (
      <div className={`flex items-start gap-4 my-4 ${isModel ? '' : 'justify-end'}`}>
        {isModel && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
            <BotIcon className="w-5 h-5 text-white" />
          </div>
        )}
        <div
          className={`max-w-xl p-4 rounded-2xl shadow-md ${
            isModel
              ? 'bg-gray-700/80 text-gray-200 rounded-tl-none'
              : 'bg-indigo-600 text-white rounded-br-none'
          }`}
        >
          <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }}></div>
        </div>
        {!isModel && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    );
};

const LoadingIndicator: React.FC = () => (
    <div className="flex items-start gap-4 my-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
            <BotIcon className="w-5 h-5 text-white" />
        </div>
        <div className="max-w-xl p-4 rounded-2xl shadow-md bg-gray-700/80 text-gray-200 rounded-tl-none">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
            </div>
        </div>
    </div>
);


const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage, isReady }) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && isReady) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl flex flex-col h-full p-1 sm:p-2 md:p-4">
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700/50">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReady ? "Ask a question about your documents..." : "Please upload a document to begin"}
            disabled={!isReady || isLoading}
            className="w-full bg-gray-700/60 border-2 border-transparent rounded-full py-3 pl-5 pr-14 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!isReady || isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
