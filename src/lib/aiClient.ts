import OpenAI from 'openai';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 30000, // 30 second timeout
  maxRetries: 2, // Retry failed requests up to 2 times
});

export interface ComposeOptions {
  leadName: string;
  leadContact: string;
  leadSource: string;
  leadStatus: string;
  action: 'followup' | 'proposal' | 'welcome' | 'reminder';
  tone?: 'professional' | 'friendly' | 'casual';
  customContext?: string;
}

export interface LeadInsightOptions {
  leadName: string;
  leadContact: string;
  leadStatus: string;
  leadPriority: string;
  leadRevenue: number;
  lastFollowUp?: string;
  notes?: string;
  daysSinceCreated: number;
}

const TONE_GUIDANCE = {
  professional: 'Use formal language, business-appropriate tone, and clear call-to-actions.',
  friendly: 'Use warm, approachable language with slight informal touch.',
  casual: 'Use relaxed, conversational tone that feels personal.',
};

const ACTION_PROMPTS = {
  followup: 'Write a personalized follow-up message to check in with this lead.',
  proposal: 'Write a professional proposal or quote introduction message.',
  welcome: 'Write a warm welcome message for a new lead who just reached out.',
  reminder: 'Write a gentle reminder message for scheduled follow-up.',
};

export async function composeMessage(options: ComposeOptions): Promise<{ message: string; reasoning?: string }> {
  const tone = options.tone || 'professional';
  const actionPrompt = ACTION_PROMPTS[options.action];
  const toneGuidance = TONE_GUIDANCE[tone];

  const prompt = `You are an expert copywriter for a freelance CRM helping freelancers and small agencies manage their client relationships.

CONTEXT:
- Lead Name: ${options.leadName}
- Lead Contact: ${options.leadContact}
- Lead Source: ${options.leadSource || 'Unknown'}
- Lead Status: ${options.leadStatus}
- Action Needed: ${actionPrompt}
- Tone: ${toneGuidance}

${options.customContext ? `Additional Context: ${options.customContext}` : ''}

REQUIREMENTS:
1. Keep the message under 150 words
2. Personalize it with the lead's name
3. Include a soft call-to-action
4. Make it specific to their situation (source, status)
5. End with a friendly sign-off

Generate the message now.`;

  try {
    const completion = await Promise.race([
      nvidiaClient.chat.completions.create({
        model: 'deepseek-ai/deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 500,
        stream: false,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), 30000)
      ),
    ]);

    const messageObj = completion.choices[0]?.message as { content?: string; reasoning_content?: string } | undefined;
    const reasoning = messageObj?.reasoning_content;
    const message = messageObj?.content || '';

    if (!message) {
      throw new Error('AI returned empty response');
    }

    return { message: message.trim(), reasoning: reasoning?.trim() };
  } catch (error) {
    console.error('AI Compose Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('timeout')) {
      throw new Error('AI service timed out. Please try again.');
    }
    if (errorMessage.includes('rate limit')) {
      throw new Error('AI service rate limit reached. Please try again in a moment.');
    }
    
    throw new Error('Failed to generate message. Please try again.');
  }
}

export async function generateLeadInsight(options: LeadInsightOptions): Promise<{
  priority: 'high' | 'medium' | 'low';
  suggestedAction: string;
  nextBestTime: string;
  summary: string;
}> {
  const prompt = `Analyze this lead and provide insights for a freelance CRM.

LEAD DATA:
- Name: ${options.leadName}
- Contact: ${options.leadContact}
- Status: ${options.leadStatus}
- Priority: ${options.leadPriority}
- Revenue Potential: $${options.leadRevenue}
- Days Since Created: ${options.daysSinceCreated} days
${options.lastFollowUp ? `- Last Follow-up: ${options.lastFollowUp}` : '- No follow-up yet'}
${options.notes ? `- Notes: ${options.notes}` : ''}

Based on this data:
1. PRIORITY: Is this lead high, medium, or low priority right now? (Consider recency, value, and stage)
2. SUGGESTED ACTION: What should the freelancer do next? (e.g., "Send proposal", "Schedule call", "Follow up via email")
3. BEST TIME: When is the best time to reach out? (e.g., "Today", "Tomorrow morning", "This week")
4. BRIEF SUMMARY: One sentence summary of the situation

Respond in this exact format:
PRIORITY: [high/medium/low]
ACTION: [suggested action]
TIME: [best time]
SUMMARY: [one sentence summary]`;

  try {
    const completion = await Promise.race([
      nvidiaClient.chat.completions.create({
        model: 'deepseek-ai/deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 300,
        stream: false,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), 30000)
      ),
    ]);

    const response = completion.choices[0]?.message?.content || '';
    
    if (!response) {
      throw new Error('AI returned empty response');
    }
    
    const parseLine = (prefix: string): string => {
      const match = response.match(new RegExp(`${prefix}:\\s*(.+)`));
      return match ? match[1].trim() : '';
    };

    const priority = parseLine('PRIORITY').toLowerCase();
    const validPriority = ['high', 'medium', 'low'].includes(priority) ? priority as 'high' | 'medium' | 'low' : 'medium';

    return {
      priority: validPriority,
      suggestedAction: parseLine('ACTION') || 'Follow up with the lead',
      nextBestTime: parseLine('TIME') || 'Today',
      summary: parseLine('SUMMARY') || 'Lead needs follow-up',
    };
  } catch (error) {
    console.error('AI Insight Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('timeout')) {
      throw new Error('AI service timed out. Please try again.');
    }
    if (errorMessage.includes('rate limit')) {
      throw new Error('AI service rate limit reached. Please try again in a moment.');
    }
    
    throw new Error('Failed to generate insights. Please try again.');
  }
}

export async function improveTemplate(
  currentTemplate: string,
  improvement: 'shorter' | 'longer' | 'more_personal' | 'more_professional'
): Promise<string> {
  const improvementPrompts = {
    shorter: 'Make this message more concise while keeping the key points.',
    longer: 'Expand this message with more detail and warmth.',
    more_personal: 'Make this message more personal and friendly.',
    more_professional: 'Make this message more formal and business-appropriate.',
  };

  const prompt = `${improvementPrompts[improvement]}

Current message:
${currentTemplate}

Return only the improved message.`;

  try {
    const completion = await Promise.race([
      nvidiaClient.chat.completions.create({
        model: 'deepseek-ai/deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), 30000)
      ),
    ]);

    const result = completion.choices[0]?.message?.content?.trim();
    
    if (!result) {
      console.warn('AI returned empty response, returning original template');
      return currentTemplate;
    }
    
    return result;
  } catch (error) {
    console.error('AI Improve Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('timeout')) {
      throw new Error('AI service timed out. Please try again.');
    }
    if (errorMessage.includes('rate limit')) {
      throw new Error('AI service rate limit reached. Please try again in a moment.');
    }
    
    throw new Error('Failed to improve template. Please try again.');
  }
}
