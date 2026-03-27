import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { protectedRoute } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseRequestBody, apiErrorToResponse, ApiError, logError } from '@/lib/errorHandler';
import { sanitizeString } from '@/lib/paramParsing';

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
        logError('ai_chat_no_api_key', new Error('NVIDIA_API_KEY not configured'));
        return NextResponse.json(
          { error: 'AI service unavailable' },
          { status: 503 }
        );
      }

      // Safe JSON parsing
      let body: ChatRequest;
      try {
        body = await parseRequestBody(req) as ChatRequest;
      } catch (error) {
        if (error instanceof ApiError) {
          return apiErrorToResponse(error);
        }
        return apiErrorToResponse(new ApiError('Invalid request format', 400));
      }

      const { messages, context } = body;

      // Validate messages
      if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json(
          { error: 'Messages are required' },
          { status: 400 }
        );
      }

      // Sanitize messages
      const sanitizedMessages = messages.map(m => ({
        role: m.role,
        content: sanitizeString(m.content, 5000),
      }));

      const contextPrompt = context ? `
USER CRM CONTEXT:
- Total Leads: ${typeof context.totalLeads === 'number' ? context.totalLeads : 0}
- Total Revenue: $${typeof context.totalRevenue === 'number' ? context.totalRevenue : 0}
- Pending Follow-ups: ${typeof context.pendingFollowUps === 'number' ? context.pendingFollowUps : 0}
${Array.isArray(context.recentActivities) && context.recentActivities.length ? `- Recent Activities: ${context.recentActivities.slice(0, 5).map(a => sanitizeString(String(a), 100)).join(', ')}` : ''}

Use this context to provide personalized advice.
` : '';

      const formattedMessages = [
        { role: 'system' as const, content: systemPrompt + contextPrompt },
        ...sanitizedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
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
      logError('ai_chat_api', error, { userId: user.userId });
      return apiErrorToResponse(new ApiError('Failed to generate response', 500));
    }
  });
}
