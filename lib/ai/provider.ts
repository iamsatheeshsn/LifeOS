import type { AIProvider } from '@/lib/ai/config';
import { getGeminiModel, getOpenAIModel, formatAIError } from '@/lib/ai/config';

export type { AIProvider };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatWithToolsResult {
  content: string;
  toolCalls: ToolCall[];
}

function resolveProvider(provider?: AIProvider): AIProvider {
  if (provider === 'openai' || provider === 'gemini') return provider;
  return (process.env.AI_PROVIDER === 'gemini' ? 'gemini' : 'openai');
}

async function ensureAIReady(provider?: AIProvider): Promise<void> {
  const { assertAIConfigured } = await import('@/lib/ai/config');
  assertAIConfigured(provider);
}

function wrapGeminiError(error: unknown): never {
  throw new Error(formatAIError(error));
}

function geminiSystemInstruction(text?: string) {
  if (!text) return undefined;
  return { parts: [{ text }] };
}

async function getGeminiModelInstance(generationConfig?: { responseMimeType?: string }) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({
    model: getGeminiModel(),
    ...(generationConfig ? { generationConfig } : {}),
  });
}

export async function generateText(
  prompt: string,
  systemPrompt?: string,
  provider?: AIProvider
): Promise<string> {
  await ensureAIReady(provider);
  const activeProvider = resolveProvider(provider);

  if (activeProvider === 'gemini') {
    try {
      const model = await getGeminiModelInstance();
      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (error) {
      wrapGeminiError(error);
    }
  }

  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: getOpenAIModel(),
    messages: [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user', content: prompt },
    ],
  });
  return response.choices[0]?.message?.content || '';
}

export async function generateStructured<T>(
  prompt: string,
  systemPrompt: string,
  provider?: AIProvider
): Promise<T> {
  await ensureAIReady(provider);
  const activeProvider = resolveProvider(provider);

  if (activeProvider === 'gemini') {
    try {
      const model = await getGeminiModelInstance({ responseMimeType: 'application/json' });
      const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
      const text = result.response.text();
      return JSON.parse(text) as T;
    } catch (error) {
      wrapGeminiError(error);
    }
  }

  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: getOpenAIModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  });
  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content) as T;
}

function normalizeEmbedding(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return values;
  return values.map((v) => v / magnitude);
}

async function geminiEmbed(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 1536,
      }),
    }
  );

  const data = (await res.json()) as {
    embedding?: { values?: number[] };
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || 'Gemini embedding failed');
  }

  const values = data.embedding?.values;
  if (!values?.length) {
    throw new Error('Empty embedding returned from Gemini');
  }

  const normalized = values.length === 3072 ? values : normalizeEmbedding(values);
  return normalized.slice(0, 1536);
}

export async function embed(text: string, provider?: AIProvider): Promise<number[]> {
  await ensureAIReady(provider);
  const activeProvider = resolveProvider(provider);

  if (activeProvider === 'gemini') {
    return geminiEmbed(text);
  }

  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function chatWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  provider?: AIProvider
): Promise<ChatWithToolsResult> {
  await ensureAIReady(provider);
  const activeProvider = resolveProvider(provider);

  if (activeProvider === 'gemini') {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const systemMsg = messages.find((m) => m.role === 'system');
      const model = genAI.getGenerativeModel({
        model: getGeminiModel(),
        systemInstruction: geminiSystemInstruction(systemMsg?.content),
        tools: [{
          functionDeclarations: tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          })) as any[],
        }],
      });

      const history = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const chat = model.startChat({
        history: history.slice(0, -1) as never[],
      });

      const lastMsg = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMsg.content);
      const response = result.response;

      const toolCalls: ToolCall[] = [];
      const functionCalls = response.functionCalls();
      if (functionCalls) {
        for (const fc of functionCalls) {
          toolCalls.push({
            id: fc.name,
            name: fc.name,
            arguments: fc.args as Record<string, unknown>,
          });
        }
      }

      return {
        content: response.text() || '',
        toolCalls,
      };
    } catch (error) {
      wrapGeminiError(error);
    }
  }

  const OpenAI = (await import('openai')).default;
  type ChatCompletionMessageParam = import('openai/resources/chat/completions').ChatCompletionMessageParam;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const openaiTools = tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const openaiMessages: ChatCompletionMessageParam[] = messages.map((m) => {
    if (m.role === 'tool') {
      return {
        role: 'tool',
        content: m.content,
        tool_call_id: m.tool_call_id || '',
      };
    }
    return {
      role: m.role,
      content: m.content,
    };
  });

  const response = await openai.chat.completions.create({
    model: getOpenAIModel(),
    messages: openaiMessages,
    tools: openaiTools,
  });

  const choice = response.choices[0]?.message;
  const toolCalls: ToolCall[] = (choice?.tool_calls || [])
    .filter((tc): tc is Extract<typeof tc, { type: 'function' }> => tc.type === 'function')
    .map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));

  return {
    content: choice?.content || '',
    toolCalls,
  };
}
