import React from 'react';
import { FaRobot, FaUser, FaExclamationTriangle } from 'react-icons/fa';

const ChatMessage = ({ message, isTyping = false }) => {
  const isUser = message.role === 'user';
  const isEmergency = message.isEmergency;
  const isError = message.type === 'error_response';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-1`}>
      <div className={`flex max-w-[90%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 sm:gap-3`}>
        {/* Avatar */}
        <div className={`
          w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-inner ring-1 ring-black/5 dark:ring-0
          ${isUser 
            ? 'bg-gradient-to-br from-primary to-primary/80 text-white' 
            : isEmergency 
              ? 'bg-red-500 text-white'
              : isError
                ? 'bg-yellow-500 text-white'
                : 'bg-white/80 text-gray-600 dark:bg-gray-700 dark:text-gray-300 backdrop-blur'
          }
        `}>
          {isUser ? (
            <FaUser className="text-sm" />
          ) : isEmergency || isError ? (
            <FaExclamationTriangle className="text-sm" />
          ) : (
            <FaRobot className="text-sm" />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`
          group rounded-2xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 border text-[13px] sm:text-sm leading-relaxed shadow-sm transition-colors
          ${isUser 
            ? 'bg-gradient-to-r from-primary to-primary/80 text-white border-primary/70 shadow-primary/20 shadow-md' 
            : isEmergency
              ? 'bg-red-50 border-red-200 dark:bg-red-900/25 dark:border-red-700/70'
              : isError
                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/25 dark:border-yellow-700/70'
                : 'bg-white/90 border-gray-200 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:bg-[#1e242c]/80 dark:border-white/10 dark:supports-[backdrop-filter]:bg-[#1e242c]/60'
          }
        `}>
          {/* Message Content */}
          <div className={`
            whitespace-pre-line
            ${isUser 
              ? 'text-white' 
              : isEmergency
                ? 'text-red-800 dark:text-red-200'
                : isError
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-gray-800 dark:text-gray-100'
            }
          `}>
            {isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="ml-2 text-secondary">AI is thinking...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {/* Format message content with basic markdown-like formatting */}
                {message.content.split('\n').map((line, index) => {
                  // Handle headers
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <h4 key={index} className="font-bold text-base mb-2 mt-3 first:mt-0">
                        {line.slice(2, -2)}
                      </h4>
                    );
                  }
                  
                  // Handle bullet points
                  if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('✅ ') || line.startsWith('❌ ')) {
                    return (
                      <div key={index} className="flex items-start gap-2 mb-1">
                        <span className="shrink-0 mt-1">
                          {line.startsWith('✅ ') ? '✅' : 
                           line.startsWith('❌ ') ? '❌' : 
                           line.startsWith('• ') ? '•' : '•'}
                        </span>
                        <span>{line.replace(/^[-•✅❌]\s*/, '')}</span>
                      </div>
                    );
                  }
                  
                  // Handle numbered lists
                  if (/^\d+\.\s/.test(line)) {
                    return (
                      <div key={index} className="mb-1">
                        <span className="font-medium">{line}</span>
                      </div>
                    );
                  }
                  
                  // Handle empty lines
                  if (line.trim() === '') {
                    return <div key={index} className="h-2"></div>;
                  }
                  
                  // Handle bold text within lines
                  const parts = line.split(/(\*\*.*?\*\*)/);
                  return (
                    <p key={index} className="mb-2 last:mb-0 leading-relaxed">
                      {parts.map((part, partIndex) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timestamp */}
          {message.timestamp && !isTyping && (
            <div className={`
              text-[10px] sm:text-xs mt-2 opacity-70 select-none
              ${isUser ? 'text-white/80' : 'text-gray-500 dark:text-secondary'}
            `}>
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}

          {/* Disclaimer for AI responses */}
          {!isUser && !isTyping && message.disclaimer && (
            <div className={`
              text-[10px] sm:text-xs mt-3 p-2 rounded-lg border-t leading-snug tracking-tight
              ${isEmergency
                ? 'bg-red-100/70 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
              }
            `}>
              {message.disclaimer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
