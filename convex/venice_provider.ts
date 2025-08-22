import { createOpenAI } from '@ai-sdk/openai';

/**
 * Venice AI Provider for AI SDK
 * 
 * Venice.ai is OpenAI-compatible, so we can use the OpenAI provider
 * with Venice's base URL and API structure.
 */
export const venice = createOpenAI({
  name: 'venice',
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
  compatibility: 'compatible', // Venice is OpenAI-compatible
  // Venice llama-3.2-3b only supports single tool calls
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.body && typeof init.body === 'string') {
      const body = JSON.parse(init.body);
      if (body.tools && body.parallel_tool_calls !== false) {
        body.parallel_tool_calls = false; // Force single tool calls for Venice
      }
      init.body = JSON.stringify(body);
    }
    return fetch(input, init);
  },
});

/**
 * Venice Chat Models
 */
export const veniceModels = {
  // Default Venice model for conversational agents
  uncensored: 'venice-uncensored',
  
  // Llama models
  llama_3_3_70b: 'llama-3.3-70b',
  llama_3_1_405b: 'llama-3.1-405b',
  
  // Function calling model - optimized for tool execution
  llama_3_2_3b_tools: 'llama-3.2-3b',
  
  // Other Llama models
  llama_3_2_3b: 'llama-3.2-3b',
  
  // Qwen models
  qwen_reasoning: 'qwen-2.5-qwq-32b',
  qwen_large: 'qwen3-235b',
  qwen_small: 'qwen3-4b',
  qwen_coder: 'qwen-2.5-coder-32b',
  
  // Other models
  dolphin: 'dolphin-2.9.2-qwen2-72b',
  deepseek_r1: 'deepseek-r1-671b',
  mistral: 'mistral-31-24b',
  deepseek_coder: 'deepseek-coder-v2-lite',
} as const;

/**
 * Venice Embedding Models
 * Note: Venice may not have dedicated embedding endpoints,
 * For now, we'll disable embeddings or use a simple fallback
 */
export const veniceEmbedding = {
  // Venice may not support embeddings - this may need to be removed or replaced
  // with a simpler text similarity approach
  small: 'text-embedding-3-small', // TODO: Verify Venice supports this model
} as const;