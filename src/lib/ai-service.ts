import OpenAI from 'openai';

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface RouteAnalysis {
  safetyScore: number;
  insights: string[];
  recommendations: string[];
  alternativeRoutes?: string[];
}

export interface ChatMessage {
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

export interface UserLocation {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

export class RouteAIService {
  private static instance: RouteAIService;
  private chatHistory: ChatMessage[] = [];
  private currentRouteData: any = null;

  private constructor() {}

  public static getInstance(): RouteAIService {
    if (!RouteAIService.instance) {
      RouteAIService.instance = new RouteAIService();
    }
    return RouteAIService.instance;
  }

  public setRouteData(routeData: any) {
    this.currentRouteData = routeData;
  }

  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> {
    let retries = 0;
    let delay = initialDelay;

    while (true) {
      try {
        return await operation();
      } catch (error: any) {
        if (retries >= maxRetries || !error.response?.status || error.response.status !== 429) {
          throw error;
        }

        const retryAfter = parseInt(error.response.headers['retry-after-ms'] || error.response.headers['retry-after']) || delay;
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        delay *= 2;
        retries++;
      }
    }
  }

  static async getSuggestedQuestions(routeData: any): Promise<string[]> {
    if (!openai.apiKey) {
      console.warn('OpenAI API key is not configured');
      return [
        "What's the safety score for this route?",
        "Are there any high-risk areas along this path?",
        "What's the safest time to take this route?",
        "Are there any well-lit areas I should be aware of?",
        "What are the alternative routes available?"
      ];
    }

    if (!routeData) {
      console.warn('No route data provided');
      return [];
    }

    return this.retryWithBackoff(async () => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGeneratingQuestions: true,
          routeData
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get suggested questions');
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response format');
      }
      return data.questions;
    });
  }

  static async analyzeRoute(
    routeData: any, 
    userQuestion: string, 
    useWebSearch: boolean = false,
    userLocation?: UserLocation
  ): Promise<{ response: string; annotations?: ChatMessage['annotations'] }> {
    if (!openai.apiKey) {
      console.warn('OpenAI API key is not configured');
      return {
        response: "I apologize, but I'm currently unable to analyze routes as the AI service is not properly configured. Please check your environment variables."
      };
    }

    if (!routeData) {
      return {
        response: "I apologize, but I don't have any route data to analyze. Please select a route first."
      };
    }

    return this.retryWithBackoff(async () => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userQuestion,
          routeData,
          useWebSearch,
          userLocation
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze route');
      }

      const data = await response.json();
      if (!data.response) {
        throw new Error('Invalid response format');
      }
      return {
        response: data.response,
        annotations: data.annotations
      };
    });
  }

  public async chat(
    message: string,
    useWebSearch: boolean = false,
    userLocation?: UserLocation
  ): Promise<{ response: string; annotations?: ChatMessage['annotations'] }> {
    if (!openai.apiKey) {
      console.warn('OpenAI API key is not configured');
      return {
        response: "I apologize, but I'm currently unable to chat as the AI service is not properly configured. Please check your environment variables."
      };
    }

    try {
      this.chatHistory.push({ role: 'user', content: message });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatHistory: this.chatHistory,
          useWebSearch,
          userLocation
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send chat message');
      }

      const data = await response.json();
      if (!data.response) {
        throw new Error('Invalid response format');
      }
      
      const reply = data.response;
      this.chatHistory.push({ 
        role: 'assistant', 
        content: reply,
        annotations: data.annotations
      });
      return {
        response: reply,
        annotations: data.annotations
      };
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  private parseAnalysis(analysis: string): RouteAnalysis {
    // Basic parsing logic - you might want to enhance this
    return {
      safetyScore: 75, // This should be extracted from the AI response
      insights: ['Sample insight 1', 'Sample insight 2'],
      recommendations: ['Sample recommendation 1', 'Sample recommendation 2'],
    };
  }
} 