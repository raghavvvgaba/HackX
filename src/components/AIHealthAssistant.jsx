import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaPaperPlane, FaLightbulb, FaTimes, FaRedo } from 'react-icons/fa';
import { useAuth } from '../context/authContext';
import aiHealthAssistant from '../services/aiHealthAssistant';
import ChatMessage from './ChatMessage';

const AIHealthAssistant = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState(null);
  const [isAIAvailable, setIsAIAvailable] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamingMessageRef = useRef('');

  // Check AI service availability and set welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Check if AI service is available
      const available = aiHealthAssistant.isServiceAvailable?.() || false;
      setIsAIAvailable(available);

      const welcomeMessage = {
        role: 'assistant',
        content: available ? `👋 Hello! I'm your AI Health Assistant. I'm here to provide general health information and answer your health-related questions.

**I can help you with:**
• Understanding medical terms and conditions
• General health and wellness advice
• Lifestyle recommendations
• Explaining symptoms (general information)
• Health prevention tips

**Please remember:** I provide educational information only and cannot replace professional medical advice. For specific medical concerns, always consult with a healthcare provider.

What would you like to know about health today?` : `🤖 **AI Health Assistant - Service Unavailable**

I apologize, but the AI health assistant is currently not configured or experiencing technical issues.

**While I'm unavailable:**
• Contact your healthcare provider for medical advice
• Visit reputable health websites (Mayo Clinic, WebMD, CDC)
• Call emergency services for urgent concerns (911)
• Schedule an appointment with your doctor

**For general health information:**
• Check official health organization websites
• Consult medical encyclopedias
• Speak with a pharmacist or nurse hotline

The system administrator has been notified. Please try again later.`,
        timestamp: new Date().toISOString(),
        type: available ? 'welcome' : 'service_unavailable',
        disclaimer: available ? "⚕️ **Medical Disclaimer:** This information is for educational purposes only and should not replace professional medical advice." : "⚕️ **Medical Disclaimer:** Always consult with qualified healthcare providers for medical advice."
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isStreaming || !isAIAvailable) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowSuggestions(false);
    setError(null);
    setIsStreaming(true);
    setStreamingMessage('');
    streamingMessageRef.current = '';

    try {
      // Use streaming response for better UX
      const response = await aiHealthAssistant.streamHealthResponse(
        inputMessage.trim(),
        (chunk) => {
          streamingMessageRef.current += chunk;
          setStreamingMessage(streamingMessageRef.current);
        },
        user?.uid
      );

      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: response.timestamp,
          type: response.type,
          isEmergency: response.isEmergency,
          disclaimer: response.disclaimer
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      
      const errorMessage = {
        role: 'assistant',
        content: `I apologize, but I'm having trouble responding right now. Please try again in a moment.

**For immediate health concerns:**
• Contact your healthcare provider
• Call a nurse hotline
• Visit urgent care or emergency room if needed

Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        type: 'error_response'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
      streamingMessageRef.current = '';
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setShowSuggestions(true);
    setError(null);
    aiHealthAssistant.clearHistory();
  };

  const suggestions = aiHealthAssistant.getSuggestedTopics();
  const healthTips = aiHealthAssistant.getHealthTips();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-4xl h-[85vh] sm:h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-gray-200/70 dark:border-white/10 bg-white/90 dark:bg-[#0e1116]/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-[#0e1116]/75 transition-colors">
        {/* Subtle gradient bar */}
  <div className="absolute inset-x-0 top-0 h-1.5 bg-blue-500 opacity-70" />
        {/* Header */}
  <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shadow-md ring-1 ring-white/40">
              <FaRobot className="text-white text-base" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">AI Health Assistant</h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">General health guidance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearConversation}
              className="p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-white/10 text-primary dark:text-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-indigo-500/40"
              title="Clear conversation"
            >
              <FaRedo className="text-sm" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300/60 dark:focus:ring-red-500/40"
              title="Close assistant"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 scroll-smooth custom-scrollbar">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}

          {/* Streaming Message */}
          {isStreaming && streamingMessage && (
            <ChatMessage 
              message={{
                role: 'assistant',
                content: streamingMessage,
                timestamp: new Date().toISOString()
              }} 
            />
          )}

          {/* Typing Indicator */}
          {isStreaming && !streamingMessage && (
            <ChatMessage 
              message={{ role: 'assistant', content: '' }} 
              isTyping={true} 
            />
          )}

          {/* Suggestions */}
          {showSuggestions && messages.length <= 1 && (
      <div className="space-y-4 mt-2 sm:mt-6">
              <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2 tracking-wide">
                  <FaLightbulb className="text-yellow-500 shrink-0" />
                  <span className="hidden sm:inline">Suggested Questions</span>
                  <span className="sm:hidden">Try Asking</span>
                </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
          className="text-left p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary/40 dark:hover:border-indigo-400/50 hover:bg-primary/5 dark:hover:bg-white/10 active:scale-[.98] transition-all text-[11px] sm:text-sm text-gray-700 dark:text-gray-200 font-medium bg-white/70 dark:bg-white/5 backdrop-blur-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 tracking-wide">
                  💡 Quick Tips
                </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {healthTips.slice(0, 4).map((tip, index) => (
                    <div
                      key={index}
          className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/30 text-[11px] sm:text-sm text-emerald-800 dark:text-emerald-200 font-medium shadow-sm"
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
          <div className="flex gap-2 sm:gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAIAvailable ? "Ask a health question..." : "AI service is unavailable"}
                className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border resize-none min-h-[44px] max-h-32 shadow-inner ${
                  isAIAvailable
                    ? 'border-gray-300 dark:border-white/10 bg-white/80 dark:bg-white/5 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-indigo-500/40 focus:border-primary/40 dark:focus:border-indigo-400/40'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                rows={2}
                disabled={isLoading || isStreaming || !isAIAvailable}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || isStreaming || !isAIAvailable}
              className={`px-4 sm:px-6 py-3 rounded-2xl font-medium active:scale-[.97] disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0 shadow-md focus:outline-none focus:ring-2 ${
                isAIAvailable
                  ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500/40 disabled:opacity-50'
                  : 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <FaPaperPlane className="text-sm" />
              Send
            </button>
          </div>
          
          {/* Disclaimer */}
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-3 text-center leading-snug">
            This AI provides general health information only. Consult healthcare professionals for personal medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIHealthAssistant;
