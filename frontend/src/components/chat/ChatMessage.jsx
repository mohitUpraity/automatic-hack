import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';

export default function ChatMessage({ message }) {
  const { role, text, author, event_type, sources, timestamp } = message;
  const isUser = role === 'user';
  const [showSources, setShowSources] = useState(false);

  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[80%] px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm shadow-sm'
            : 'bg-white/10 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl rounded-bl-sm text-slate-800 dark:text-slate-100 shadow-sm'
        }`}
      >
        {!isUser && author && (
          <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-indigo-500 dark:text-indigo-400">
            <Bot size={14} />
            <span>{author}</span>
            {event_type && <span className="text-slate-400 dark:text-slate-500">({event_type})</span>}
          </div>
        )}
        
        <div className={`prose-chat prose prose-sm max-w-none ${isUser ? 'prose-invert text-white' : 'dark:prose-invert'} prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700`}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{text}</div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          )}
        </div>

        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <button 
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Sources used ({sources.length})
            </button>
            {showSources && (
              <ul className="mt-2 space-y-1">
                {sources.map((src, i) => (
                  <li key={i} className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-black/20 rounded px-2 py-1 truncate">
                    {src.title || src.url || src}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {timeStr && (
          <div className={`text-[10px] mt-2 text-right ${isUser ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
            {timeStr}
          </div>
        )}
      </div>
    </motion.div>
  );
}
