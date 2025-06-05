import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function POST(req: Request) {
  if (!openai.apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { message, routeData, isGeneratingQuestions } = await req.json();

    if (!routeData) {
      return NextResponse.json(
        { error: 'Route data is required' },
        { status: 400 }
      );
    }

    if (isGeneratingQuestions) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a route safety assistant. Generate 5 relevant questions about this specific route:
            From: ${routeData.start.address} (${routeData.start.lat}, ${routeData.start.lng})
            To: ${routeData.end.address} (${routeData.end.lat}, ${routeData.end.lng})
            Distance: ${routeData.distance}
            Duration: ${routeData.duration}
            Safety Score: ${routeData.safetyScore}
            High Risk Areas: ${JSON.stringify(routeData.highRiskAreas)}
            Well Lit Areas: ${JSON.stringify(routeData.wellLitAreas)}
            
            Focus on:
            1. Safety aspects specific to this route
            2. Time of day considerations
            3. Alternative routes
            4. Specific areas of concern
            5. Emergency preparedness
            
            Return the questions as a JSON array of strings.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const questions = JSON.parse(content);
        return NextResponse.json({ questions });
      } catch (e) {
        // If parsing fails, try to extract questions from the text
        const questions = content
          .split('\n')
          .filter(q => q.trim().length > 0)
          .map(q => q.replace(/^\d+\.\s*/, ''))
          .slice(0, 5);
        return NextResponse.json({ questions });
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a route safety assistant. Analyze this specific route and answer questions about it:
          From: ${routeData.start.address} (${routeData.start.lat}, ${routeData.start.lng})
          To: ${routeData.end.address} (${routeData.end.lat}, ${routeData.end.lng})
          Distance: ${routeData.distance}
          Duration: ${routeData.duration}
          Safety Score: ${routeData.safetyScore}
          High Risk Areas: ${JSON.stringify(routeData.highRiskAreas)}
          Well Lit Areas: ${JSON.stringify(routeData.wellLitAreas)}
          
          Provide clear, concise answers that include:
          1. Specific safety concerns for this route
          2. Recommendations for safer travel
          3. Alternative routes if available
          4. Time-specific advice
          5. Emergency contact information if relevant`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
} 