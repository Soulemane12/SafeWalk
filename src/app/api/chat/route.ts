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
    const { message, routeData, isGeneratingQuestions, isVoiceProcessing } = await req.json();

    if (!routeData && !isVoiceProcessing) {
      return NextResponse.json(
        { error: 'Route data is required' },
        { status: 400 }
      );
    }

    if (isVoiceProcessing) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a voice processing assistant for a navigation app. 
            Extract the following information from the user's voice input:
            1. Start location
            2. End location
            3. Transport mode (walking, cycling, driving) - default to walking if not specified
            4. Route priority (safest, fastest) - default to fastest if not specified
            
            IMPORTANT: If the user mentions "my location", "current location", "where I am", or similar phrases for either the start or end location, 
            set the corresponding location value to exactly "USE_CURRENT_LOCATION".
            
            Return ONLY a JSON object with the following properties:
            - "startLocation": string with the starting location (or "USE_CURRENT_LOCATION")
            - "endLocation": string with the destination (or "USE_CURRENT_LOCATION")
            - "transportMode": string with one of: "walking", "cycling", "driving"
            - "routeType": string with one of: "safest", "fastest"
            
            If you can't identify both locations, make your best guess based on context.
            Example: {"startLocation": "USE_CURRENT_LOCATION", "endLocation": "Central Park", "transportMode": "walking", "routeType": "fastest"}`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const locations = JSON.parse(content);
        return NextResponse.json({ locations });
      } catch (e) {
        // If parsing fails, return an error
        return NextResponse.json(
          { error: 'Failed to parse locations from voice input' },
          { status: 500 }
        );
      }
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