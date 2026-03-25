import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { protectedRoute } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  context?: {
    totalLeads?: number;
    totalRevenue?: number;
    pendingFollowUps?: number;
    recentActivities?: string[];
  };
}

const systemPrompt = `You are an AI assistant for SplitSheet, a CRM designed for freelancers and small agencies. Your role is to help users:

1. **Organize their work** - Suggest how to prioritize leads, schedule follow-ups, and structure their pipeline
2. **Write follow-up messages** - Help draft personalized messages for leads at different stages
3. **Analyze their business** - Provide insights on conversion rates, revenue trends, and lead sources
4. **Plan their workflow** - Suggest daily/weekly routines for managing clients effectively

Guidelines:
- Be helpful, concise, and actionable
- Use simple language (freelancers are busy!)
- Focus on practical advice
- When unsure about specific data, ask clarifying questions
- Suggest specific actions they can take in SplitSheet
- Keep responses under 150 words unless detailed analysis is requested

You have access to their CRM context when provided. Use it to give personalized advice.`;

export async function POST(request: NextRequest) {
  return protectedRoute(request, async (req, user) => {
    try {
      // Verify user has AI access
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { plan: true },
      });

      if (dbUser?.plan !== 'ai_pro' && dbUser?.plan !== 'lifetime') {
        return NextResponse.json(
          { error: 'AI features require AI Pro plan' },
          { status: 403 }
        );
      }

      if (!process.env.NVIDIA_API_KEY) {
        console.error('NVIDIA_API_KEY not configured');
        return NextResponse.json(
          { error: 'AI service unavailable' },
          { status: 503 }
        );
      }

      const body: ChatRequest = await req.json();
      const { messages, context } = body;

      if (!messages || messages.length === 0) {
        return NextResponse.json(
          { error: 'Messages are required' },
          { status: 400 }
        );
      }

      const contextPrompt = context ? `
USER CRM CONTEXT:
- Total Leads: ${context.totalLeads || 0}
- Total Revenue: $${context.totalRevenue || 0}
- Pending Follow-ups: ${context.pendingFollowUps || 0}
${context.recentActivities?.length ? `- Recent Activities: ${context.recentActivities.join(', ')}` : ''}

Use this context to provide personalized advice.
` : '';

      const formattedMessages = [
        { role: 'system' as const, content: systemPrompt + contextPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const completion = await nvidiaClient.chat.completions.create({
        model: 'deepseek-ai/deepseek-r1',
        messages: formattedMessages,
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 800,
        stream: false,
      });

      const messageObj = completion.choices[0]?.message as { content?: string } | undefined;
      const response = messageObj?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

      return NextResponse.json({
        success: true,
        message: response.trim(),
      });
    } catch (error) {
      console.error('AI Chat API Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      );
    }
  });
}
