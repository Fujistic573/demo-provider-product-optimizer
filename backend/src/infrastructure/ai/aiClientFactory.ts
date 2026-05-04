import type { IChatCompletionClient } from '../../domain/ai/IChatCompletionClient';
import { DeepInfraClient } from './DeepInfraClient';

export type AiProviderType = 'deepinfra';

/**
 * Creates the configured AI chat completion client based on env.
 * Set AI_PROVIDER=deepinfra (default) and provider-specific keys (e.g. DEEP_INFRA_KEY).
 * Add new providers here and implement IChatCompletionClient in infrastructure/ai.
 */
export function createChatCompletionClient(): IChatCompletionClient {
  const provider = (process.env.AI_PROVIDER || 'deepinfra').toLowerCase().trim();

  switch (provider) {
    case 'deepinfra': {
      const apiKey = process.env.DEEP_INFRA_KEY;
      if (!apiKey?.trim()) {
        console.warn('⚠️ DEEP_INFRA_KEY is not set. AI features will be disabled.');
        return {
          chat: async () => {
            throw new Error('AI features are disabled: DEEP_INFRA_KEY is missing.');
          }
        };
      }
      return new DeepInfraClient({
        apiKey,
        model: process.env.DEEP_INFRA_MODEL || undefined,
      });
    }
    default:
      console.warn(`⚠️ Unknown AI_PROVIDER: ${provider}. Using mock client.`);
      return {
        chat: async () => {
          throw new Error(`AI provider ${provider} is not configured.`);
        }
      };
  }
}
