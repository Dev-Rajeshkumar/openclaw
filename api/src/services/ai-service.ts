/**
 * AI Service — Provider-agnostic AI adapter
 * 
 * Supports:
 *   - OpenRouter (open-source models: Llama, Mistral, Mixtral, Phi, etc.)
 *   - Ollama (self-hosted, local inference)
 *   - vLLM (self-hosted, production-grade)
 * 
 *Configure via environment:
 *   AI_PROVIDER=openrouter|ollama|vllm
 *   AI_API_KEY=sk-or-xxx (for OpenRouter)
 *   AI_BASE_URL=http://localhost:11434 (for Ollama)
 *   AI_MODEL=meta-llama/llama-3.1-70b (default)
 */

import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// --- Configuration ---
const AI_PROVIDER = process.env.AI_PROVIDER || 'openrouter';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_BASE_URL = process.env.AI_BASE_URL || getDefaultBaseUrl();
const AI_MODEL = process.env.AI_MODEL || 'meta-llama/llama-3.1-70b';

function getDefaultBaseUrl(): string {
  switch (AI_PROVIDER) {
    case 'ollama': return 'http://localhost:11434/v1';
    case 'vllm': return 'http://localhost:8000/v1';
    default: return 'https://openrouter.ai/api/v1';
  }
}

// --- Types ---
interface AIProvider {
  complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse>;
  stream(prompt: string, options?: AIRequestOptions): AsyncGenerator<string>;
}

interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  model?: string;
}

interface AIResponse {
  text: string;
  tokensUsed: number;
  model: string;
  provider: string;
}

// --- OpenRouter Provider (recommended: open-source models) ---
class OpenRouterProvider implements AIProvider {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'CMS AI Assistant',
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }

  async complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
    const res = await this.client.post('/chat/completions', {
      model: options?.model || AI_MODEL,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature ?? 0.7,
    });

    return {
      text: res.data.choices[0].message.content,
      tokensUsed: res.data.usage?.total_tokens || 0,
      model: res.data.model,
      provider: 'openrouter',
    };
  }

  async *stream(prompt: string, options?: AIRequestOptions): AsyncGenerator<string> {
    const res = await this.client.post('/chat/completions', {
      model: options?.model || AI_MODEL,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature ?? 0.7,
      stream: true,
    }, { responseType: 'stream' });

    // Parse SSE stream
    const buffer: string[] = [];
    for await (const chunk of res.data as NodeJS.ReadableStream) {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              buffer.push(token);
              yield token;
            }
          } catch { /* skip malformed */ }
        }
      }
    }
  }
}

// --- Ollama Provider (self-hosted, zero cost) ---
class OllamaProvider implements AIProvider {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: AI_BASE_URL,
      timeout: 120000, // local models can be slow
    });
  }

  async complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
    const res = await this.client.post('/chat/completions', {
      model: options?.model || 'llama3.1',
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature ?? 0.7,
      stream: false,
    });

    return {
      text: res.data.choices[0].message.content,
      tokensUsed: res.data.usage?.total_tokens || 0,
      model: res.data.model,
      provider: 'ollama',
    };
  }

  async *stream(prompt: string, options?: AIRequestOptions): AsyncGenerator<string> {
    const res = await this.client.post('/chat/completions', {
      model: options?.model || 'llama3.1',
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      stream: true,
    }, { responseType: 'stream' });

    for await (const chunk of res.data as NodeJS.ReadableStream) {
      const lines = chunk.toString().trim().split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.choices?.[0]?.delta?.content) {
            yield parsed.choices[0].delta.content;
          }
        } catch { /* skip */ }
      }
    }
  }
}

// --- Factory ---
export function createAIProvider(): AIProvider {
  switch (AI_PROVIDER) {
    case 'ollama': return new OllamaProvider();
    case 'vllm': return new OpenRouterProvider(); // vLLM uses OpenAI-compatible API
    default: return new OpenRouterProvider();
  }
}

// --- Content Generation Helpers ---

const provider = createAIProvider();

export interface GenerateContentOptions {
  type: 'title' | 'intro' | 'outline' | 'full_post' | 'seo_meta' | 'excerpt';
  topic: string;
  tone?: string;
  wordCount?: number;
  keywords?: string[];
  existingContent?: string;
}

/**
 * Generate blog content using AI.
 * All functions go through the provider-agnostic adapter.
 */
export async function generateContent(opts: GenerateContentOptions): Promise<AIResponse> {
  const systemPrompt = `You are an expert blog writer and SEO specialist. Write clear, engaging content.`;
  
  const prompts: Record<string, string> = {
    title: `Generate 5 compelling blog post titles about "${opts.topic}". Return as a JSON array of strings.`,
    intro: `Write an engaging introduction (100-150 words) for a blog post about "${opts.topic}". Tone: ${opts.tone || 'professional'}.`,
    outline: `Create a detailed blog post outline for "${opts.topic}". Include H2 and H3 headings. Return as structured list.`,
    full_post: `Write a complete blog post about "${opts.topic}". Target ${opts.wordCount || 1500} words. Tone: ${opts.tone || 'professional'}. Include headings, short paragraphs, and a conclusion.`,
    seo_meta: `Generate SEO meta title (max 60 chars), meta description (max 155 chars), and 5 keywords for a blog post about "${opts.topic}". Return as JSON: { "title": "...", "description": "...", "keywords": [...] }`,
    excerpt: `Write a 2-3 sentence excerpt summarizing this blog post:\n\n"${opts.existingContent?.slice(0, 2000)}"`,
  };

  return provider.complete(prompts[opts.type], {
    systemPrompt,
    maxTokens: opts.type === 'full_post' ? 4000 : 1000,
    temperature: opts.type === 'seo_meta' ? 0.3 : 0.7,
  });
}

export async function* streamContent(opts: GenerateContentOptions): AsyncGenerator<string> {
  const systemPrompt = `You are an expert blog writer and SEO specialist.`;
  
  const prompts: Record<string, string> = {
    title: `Generate 5 compelling blog post titles about "${opts.topic}". Return as a JSON array.`,
    intro: `Write an engaging introduction (100-150 words) for a blog post about "${opts.topic}".`,
    outline: `Create a detailed blog post outline for "${opts.topic}".`,
    full_post: `Write a complete blog post about "${opts.topic}". Target ${opts.wordCount || 1500} words.`,
    seo_meta: `Generate SEO meta title, description, and keywords for "${opts.topic}". Return as JSON.`,
    excerpt: `Write an excerpt for: "${opts.existingContent?.slice(0, 2000)}"`,
  };

  yield* provider.stream(prompts[opts.type], { systemPrompt });
}
