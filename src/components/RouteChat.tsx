import React, { useState, useEffect, useRef } from 'react';
import { RouteAIService, UserLocation } from '@/lib/ai-service';

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  annotations?: Array<{
    type: string;
    url_citation?: {
      url: string;
      title: string;
      start_index: number;
      end_index: number;
    };
  }>;
}

export const RouteChat: React.FC<RouteChatProps> = ({ routeData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
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
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>();
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
      const { response, annotations } = await RouteAIService.analyzeRoute(
        routeData, 
        userMessage,
        useWebSearch,
        userLocation
      );
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response,
        annotations
      }]);
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

  const renderMessageContent = (message: ChatMessage) => {
    if (!message.annotations?.length) {
      return message.content.split('\n').map((line, i) => (
        <p key={i} className="mb-3 last:mb-0 text-base leading-relaxed">
          {line}
        </p>
      ));
    }

    const content = message.content;
    const annotations = message.annotations;
    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    annotations.forEach((annotation, index) => {
      if (annotation.type === 'url_citation' && annotation.url_citation) {
        const { start_index, end_index, url, title } = annotation.url_citation;
        
        // Add text before the citation
        if (start_index > lastIndex) {
          elements.push(
            <span key={`text-${index}`}>
              {content.slice(lastIndex, start_index)}
            </span>
          );
        }

        // Add the citation as a link
        elements.push(
          <a
            key={`link-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline"
            title={title}
          >
            {content.slice(start_index, end_index)}
          </a>
        );

        lastIndex = end_index;
      }
    });

    // Add any remaining text
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return elements.map((element, i) => (
      <p key={i} className="mb-3 last:mb-0 text-base leading-relaxed">
        {element}
      </p>
    ));
  };

  return (
    <div 
      ref={chatRef}
      className={`fixed bottom-4 right-4 w-[600px] transition-all duration-300 ease-in-out transform ${
        isCollapsed ? 'translate-y-[calc(100%-48px)]' : 'translate-y-0'
      }`}
    >
      <div className="flex flex-col h-[800px] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div 
          className="p-5 border-b bg-gradient-to-r from-blue-500 to-blue-600 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className={`w-7 h-7 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <div className="prose prose-sm">
                  {renderMessageContent(message)}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white rounded-2xl p-5 text-gray-800 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {suggestedQuestions.length > 0 && (
          <div className={`p-4 border-t bg-white transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-500">Quick Questions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="truncate max-w-[200px]">{question}</span>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`p-4 border-t bg-white transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 mb-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={useWebSearch}
                onChange={(e) => setUseWebSearch(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
              Enable web search
            </label>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={routeData ? "Ask about your route..." : "Select a route first..."}
              disabled={!routeData}
              className="flex-1 px-5 py-3.5 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !routeData}
              className="px-7 py-3.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 text-base font-medium"
            >
              <span>Send</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 