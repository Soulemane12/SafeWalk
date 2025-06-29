import React, { useState, useEffect, useRef } from 'react';
import { RouteAIService } from '@/lib/ai-service';

interface RouteChatProps {
  routeData?: {
    start: {
      lat: number;
      lng: number;
      address: string;
    };
    end: {
      lat: number;
      lng: number;
      address: string;
    };
    distance: string;
    duration: string;
    path: [number, number][];
    safetyScore: number;
    highRiskAreas: Array<{
      lat: number;
      lng: number;
      risk: string;
      description: string;
    }>;
    wellLitAreas: Array<{
      lat: number;
      lng: number;
      description: string;
    }>;
  };
}

export const RouteChat: React.FC<RouteChatProps> = ({ routeData }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    {
      role: 'assistant',
      content: routeData 
        ? `👋 Hi! I'm your Route Safety Assistant. I can help you analyze your route from ${routeData.start.address} to ${routeData.end.address} for safety and provide recommendations.

I can help you with:
• Route safety analysis
• High-risk area identification
• Alternative route suggestions
• Time-specific safety advice
• Emergency contact information

Feel free to ask me any questions about your route!`
        : `👋 Hi! I'm your Route Safety Assistant. Please select a route on the map to get started.

I can help you with:
• Route safety analysis
• High-risk area identification
• Alternative route suggestions
• Time-specific safety advice
• Emergency contact information

Once you select a route, I'll provide personalized safety recommendations!`
    }
  ]);
  const [input, setInput] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadSuggestedQuestions = async () => {
      if (!routeData) {
        setSuggestedQuestions([]);
        return;
      }

      try {
        const questions = await RouteAIService.getSuggestedQuestions(routeData);
        setSuggestedQuestions(questions);
      } catch (error) {
        console.error('Error loading suggested questions:', error);
        setSuggestedQuestions([
          "What's the safety score for this route?",
          "Are there any high-risk areas along this path?",
          "What's the safest time to take this route?",
          "Are there any well-lit areas I should be aware of?",
          "What are the alternative routes available?"
        ]);
      }
    };

    loadSuggestedQuestions();
  }, [routeData]);

  const handleSendMessage = async () => {
    if (!input.trim() || !routeData) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await RouteAIService.analyzeRoute(routeData, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={chatRef}
      className={`fixed bottom-3 right-3 w-[350px] transition-all duration-300 ease-in-out transform ${
        isCollapsed ? 'translate-y-[calc(100%-48px)]' : 'translate-y-0'
      } z-20`}
    >
      <div className="flex flex-col h-[420px] bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div 
          className="p-2.5 border-b bg-gradient-to-r from-blue-600 to-blue-700 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Route Safety Assistant
            </h2>
            <button 
              className="text-white hover:text-gray-200 transition-colors duration-200 p-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
            >
              <svg 
                className={`w-4 h-4 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-1.5`}>
              <div 
                className={`rounded-xl px-3 py-2 max-w-[90%] ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100/90 text-gray-800 shadow-sm border border-gray-200/50'
                }`}
              >
                {msg.content.split('\n').map((paragraph, i) => {
                  // Handle bullet points
                  if (paragraph.trim().startsWith('•')) {
                    return (
                      <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
                        <span className="text-base leading-none mt-0.5">•</span>
                        <span>{paragraph.trim().substring(1).trim()}</span>
                      </div>
                    );
                  }
                  // Handle numbered lists
                  else if (/^\d+\./.test(paragraph.trim())) {
                    const parts = paragraph.trim().split(/^(\d+\.\s*)/);
                    return (
                      <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
                        <span className="font-semibold">{parts[1]}</span>
                        <span>{parts[2] || ''}</span>
                      </div>
                    );
                  }
                  // Handle numbered lists with **bold** text
                  else if (/^\*\*\d+\.\s*.*\*\*/.test(paragraph.trim())) {
                    const parts = paragraph.trim().match(/^\*\*(\d+\.\s*.*?)\*\*(.*)$/);
                    if (parts) {
                      return (
                        <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
                          <span className="font-semibold">{parts[1]}</span>
                          <span>{parts[2] || ''}</span>
                        </div>
                      );
                    }
                  }
                  // Handle **bold** text
                  else if (paragraph.includes('**')) {
                    const parts = paragraph.split(/(\*\*[\s\S]+?\*\*)/g);
                    return (
                      <p key={i} className="mb-1 last:mb-0">
                        {parts.map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                          }
                          return <span key={j}>{part}</span>;
                        })}
                      </p>
                    );
                  }
                  // Regular paragraph
                  return paragraph.trim() ? <p key={i} className="mb-1 last:mb-0">{paragraph}</p> : null;
                })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-gray-100/90 rounded-xl p-2 border border-gray-200/50 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {suggestedQuestions.length > 0 && (
          <div className={`p-2 border-t bg-white/95 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center gap-1 mb-1">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-500">Quick Questions</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded-full transition-colors duration-200 flex items-center gap-1"
                >
                  <span className="truncate max-w-[100px]">{question}</span>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`p-2 border-t bg-white/95 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={routeData ? "Ask about your route..." : "Select a route first..."}
              disabled={!routeData}
              className="flex-1 px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !routeData}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5 text-xs font-medium"
            >
              <span>Send</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 