import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, Send, X, Bot, User, Loader2, 
  Copy, RotateCcw, Trash2, Minimize2, Maximize2
} from 'lucide-react';
import { awsService } from '../services/awsService';

// Smart welcome message based on context
const getWelcomeMessage = (userRole?: string, currentStep?: string, currentDocId?: string, hasDocuments?: boolean) => {
  if (currentDocId) {
    return `Hello! I'm your AI assistant. I can see you're working on document ${currentDocId}. I can help with entity extraction, claim validation, and document analysis. What would you like to know?`;
  }
  
  if (userRole === 'Adjuster') {
    return `Hello! I'm your AI assistant for adjusters. I can help you review claims, analyze documents, and validate information. How can I assist you today?`;
  }
  
  if (currentStep === 'upload' || hasDocuments) {
    return `Hello! I'm your AI assistant for document processing. I can help you with uploads, classifications, and extractions. How can I assist you today?`;
  }
  
  return `Hello! I'm your AI assistant for document processing. I can help you with claims, extractions, and system guidance. How can I assist you today?`;
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
  currentDocId?: string;
  userRole?: string;
  currentStep?: string;
  hasDocuments?: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onToggle, currentDocId, userRole, currentStep, hasDocuments }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getWelcomeMessage(userRole, currentStep, currentDocId, hasDocuments),
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId] = useState(() => Math.floor(1000000 + Math.random() * 9000000).toString());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Streaming text effect
  const streamText = (text: string, messageId: string) => {
    setIsStreaming(true);
    setStreamingText('');
    let index = 0;
    
    // Start with first character immediately
    if (text.length > 0) {
      setStreamingText(text[0]);
      index = 1;
    }
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setStreamingText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        setStreamingText('');
        // Update final message
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, text, isStreaming: false } : msg
        ));
      }
    }, 8); // Very fast - 8ms per character
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const payload = {
        body: {
          docid: currentDocId || "DOC172950",
          userid: "USER1",
          sessionid: sessionId,
          userquery: userMessage.text
        }
      };

      const response = await awsService.invokeLambda('nmm_chatbot_lambda', payload);

      const botMessageId = (Date.now() + 1).toString();
      const botMessage: Message = {
        id: botMessageId,
        text: '',
        sender: 'bot',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, botMessage]);
      
      const responseText = response.body || 'I apologize, but I encountered an issue. Please try again.';
      
      streamText(responseText, botMessageId);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    setMessages([messages[0]]);
  };

  const regenerateResponse = () => {
    if (messages.length > 1) {
      const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'user');
      if (lastUserMessage) {
        setInputText(lastUserMessage.text);
        sendMessage();
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggle}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-100 relative"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
        onClick={onToggle}
      />

      {/* Chat Window */}
      <div
        className={`fixed top-0 right-0 w-[50%] ${isMinimized ? 'h-16' : 'h-full'} bg-white shadow-2xl flex flex-col z-50 transition-all duration-100`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-blue-100">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-blue-500 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-blue-500 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gray-700'
                    }`}>
                      {message.sender === 'user' ? (
                        <User size={16} className="text-white" />
                      ) : (
                        <Bot size={16} className="text-white" />
                      )}
                    </div>

                    {/* Message */}
                    <div className={`rounded-2xl px-4 py-3 group relative ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                    }`}>
                      <div className="text-sm leading-relaxed">
                        {message.sender === 'bot' && message.isStreaming ? (
                          <div className="flex items-end">
                            <span>{streamingText}</span>
                            <span className="animate-pulse ml-1 text-blue-500">|</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {message.text.split('\n').map((line, index) => {
                              // Handle file paths
                              if (line.includes('.pdf') || line.includes('newmexicomutual/')) {
                                return (
                                  <div key={index} className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-600 break-all">
                                    📄 {line}
                                  </div>
                                );
                              }
                              // Handle numbered lists
                              if (line.match(/^\d+\./)) {
                                return (
                                  <div key={index} className="flex items-start space-x-2">
                                    <span className="font-bold text-blue-500 bg-blue-50 rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">
                                      {line.match(/^\d+/)?.[0]}
                                    </span>
                                    <span className="flex-1">{line.replace(/^\d+\.\s*/, '')}</span>
                                  </div>
                                );
                              }
                              // Handle bullet points
                              if (line.startsWith('- ') || line.startsWith('• ')) {
                                return (
                                  <div key={index} className="flex items-start space-x-2">
                                    <span className="text-blue-500 font-bold mt-1">•</span>
                                    <span className="flex-1">{line.replace(/^[-•]\s*/, '')}</span>
                                  </div>
                                );
                              }
                              // Handle bold text **text**
                              if (line.includes('**')) {
                                const parts = line.split(/(\*\*.*?\*\*)/);
                                return (
                                  <div key={index} className="mb-1">
                                    {parts.map((part, i) => 
                                      part.startsWith('**') && part.endsWith('**') ? (
                                        <span key={i} className="font-bold text-gray-900">
                                          {part.slice(2, -2)}
                                        </span>
                                      ) : (
                                        <span key={i}>{part}</span>
                                      )
                                    )}
                                  </div>
                                );
                              }
                              // Handle questions or queries
                              if (line.includes('query') || line.includes('question')) {
                                return (
                                  <div key={index} className="bg-blue-50 p-2 rounded text-sm border-l-4 border-blue-400">
                                    💬 {line}
                                  </div>
                                );
                              }
                              // Regular paragraphs
                              return line.trim() ? (
                                <div key={index} className="mb-2 leading-relaxed">{line}</div>
                              ) : (
                                <div key={index} className="h-2" />
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      {/* Copy button and timestamp - bottom right */}
                      <div className="flex items-center justify-end mt-2 space-x-2">
                        {message.sender === 'bot' && !message.isStreaming && (
                          <button
                            onClick={() => copyMessage(message.text)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                        <div className={`text-xs ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-center space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message AI Assistant..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-2xl transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
              
              {/* Quick actions */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-3">
                  <button
                    onClick={clearChat}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={regenerateResponse}
                    className="text-xs text-gray-500 hover:text-blue-600 flex items-center space-x-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    <span>Regenerate</span>
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  {messages.length - 1} messages
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChatBot;
