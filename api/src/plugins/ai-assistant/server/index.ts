/**
 * AI Assistant Plugin for Strapi
 * 
 * Provides:
 *   - /api/ai/generate — generate content (title, intro, full post, SEO, excerpt)
 *   - /api/ai/stream — SSE streaming for live generation in editor
 *   - /api/ai/models — list available models
 * 
 * Uses open-source models via OpenRouter by default.
 * Self-hosted Ollama/vLLm via env config.
 */

import { generateContent, streamContent } from '../../services/ai-service';

export default {
  register({ strapi }: any) {
    const prefix = 'ai';

    // --- Routes ---
    strapi.server.routes({
      method: 'POST',
      path: `/${prefix}/generate`,
      handler: 'ai.generate',
      config: { policies: [], auth: { scope: ['admin'] } },
    });

    strapi.server.routes({
      method: 'POST',
      path: `/${prefix}/stream`,
      handler: 'ai.stream',
      config: { policies: [], auth: { scope: ['admin'] } },
    });

    strapi.server.routes({
      method: 'GET',
      path: `/${prefix}/models`,
      handler: 'ai.listModels',
      config: { policies: [], auth: false },
    });

    // --- Controllers ---
    strapi.controller('ai', () => ({
      async generate(ctx: any) {
        const { type, topic, tone, wordCount, keywords } = ctx.request.body;

        if (!type || !topic) {
          return ctx.badRequest('Missing required fields: type, topic');
        }

        const validTypes = ['title', 'intro', 'outline', 'full_post', 'seo_meta', 'excerpt'];
        if (!validTypes.includes(type)) {
          return ctx.badRequest(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
        }

        try {
          const result = await generateContent({
            type,
            topic,
            tone,
            wordCount,
            keywords,
          });

          // Log usage for rate limiting & analytics
          strapi.log.info(`[AI] Generated ${type} for "${topic}" via ${result.provider}/${result.model} (${result.tokensUsed} tokens)`);

          return ctx.send({
            data: {
              text: result.text,
              model: result.model,
              provider: result.provider,
              tokensUsed: result.tokensUsed,
            },
          });
        } catch (error: any) {
          strapi.log.error('[AI] Generation failed:', error.message);
          return ctx.internalServerError('AI generation failed', { error: error.message });
        }
      },

      async stream(ctx: any) {
        const { type, topic, tone } = ctx.request.body;

        // Set up Server-Sent Events
        ctx.set({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable Nginx buffering for SSE
        });

        const stream = ctx.res;
        const generator = streamContent({ type, topic, tone } as any);

        try {
          for await (const token of generator) {
            stream.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
          stream.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        } catch (error: any) {
          stream.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        } finally {
          stream.end();
        }
      },

      async listModels(ctx: any) {
        const provider = process.env.AI_PROVIDER || 'openrouter';

        if (provider === 'openrouter') {
          // Fetch available models from OpenRouter
          const axios = require('axios');
          try {
            const res = await axios.get('https://openrouter.ai/api/v1/models');
            const models = res.data.data
              .filter((m: any) => m.pricing?.prompt_price !== '999') // Filter out unusable
              .map((m: any) => ({
                id: m.id,
                name: m.name,
                contextLength: m.context_length,
                maxTokens: m.top_provider_completion_max_tokens,
                provider: 'openrouter',
              }));
            return ctx.send({ data: models });
          } catch {
            return getDefaultModels(ctx);
          }
        }

        return getDefaultModels(ctx);
      },
    }));

    function getDefaultModels(ctx: any) {
      return ctx.send({
        data: [
          { id: 'meta-llama/llama-3.1-70b', name: 'Llama 3.1 70B', contextLength: 128000, provider: 'openrouter' },
          { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', contextLength: 32000, provider: 'openrouter' },
          { id: 'microsoft/phi-3-medium-128k', name: 'Phi-3 Medium', contextLength: 128000, provider: 'openrouter' },
          { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', contextLength: 8000, provider: 'openrouter' },
          { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', contextLength: 128000, provider: 'openrouter' },
        ],
      });
    }

    strapi.log.info('🧠 AI Assistant plugin registered — using open-source models');
  },

  bootstrap({ strapi }: any) {
    // Validate AI config on startup
    const provider = process.env.AI_PROVIDER || 'openrouter';
    const model = process.env.AI_MODEL || 'meta-llama/llama-3.1-70b';
    strapi.log.info(`[AI] Provider: ${provider} | Model: ${model} | Open-source first! 🎉`);
  },
};
