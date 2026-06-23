import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { title, description, tags, type } = await req.json();

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Mock mode if no API key is provided
      console.warn("No GEMINI_API_KEY found, using mock SEO generator.");
      return NextResponse.json({
        success: true,
        data: {
          seoTitle: `Play ${title} - Free Online ${type === 'category' ? 'Games' : 'Game'}`,
          seoDescription: `Play ${title} online for free. ${description ? description.substring(0, 100) + '...' : ''}`,
          seoKeywords: `${title.toLowerCase()}, free games, online games, ${tags ? tags.join(', ') : ''}`.replace(/,\s*$/, '')
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert SEO specialist for a modern online gaming portal.
Generate highly optimized SEO metadata for a ${type === 'category' ? 'game category' : 'game'}.

Given Information:
Title: ${title}
Description: ${description || 'None'}
Tags: ${tags ? tags.join(', ') : 'None'}

Return ONLY a raw JSON object with no markdown formatting or backticks. 
The object must have exactly these keys:
- seoTitle (string, max 60 chars)
- seoDescription (string, max 160 chars, compelling and action-oriented)
- seoKeywords (string, comma-separated, max 10 highly relevant keywords)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text || '{}';
    // Clean up potential markdown formatting if the model disobeys
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(rawText);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('SEO Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
