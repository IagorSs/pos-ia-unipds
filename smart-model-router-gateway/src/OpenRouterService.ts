import { OpenRouter } from '@openrouter/sdk';
import defaultConfig, { type ModelConfig } from './config.ts';

export type LLMResponse = {
    model: string,
    content: string
}

export default class OpenRouterService {
    private readonly client: OpenRouter;
    private readonly config: ModelConfig;

    constructor(
        configOverride?: ModelConfig
    ) {
        this.config = configOverride ?? defaultConfig;

        this.client = new OpenRouter({
            apiKey: this.config.apiKey,
            httpReferer: this.config.httpReferer,
            xTitle: this.config.xTitle
        });
    }

    async generate(prompt: string): Promise<LLMResponse> {
        const response = await this.client.chat.send({
            models: this.config.models,
            messages: [
                { role: 'system', content: this.config.systemPrompt },
                { role: 'user', content: prompt }
            ],
            stream: false,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            provider: this.config.provider,
            
        });

        return {
            model: response.model,
            content: String(response.choices[0].message.content)
        };
    }
}
