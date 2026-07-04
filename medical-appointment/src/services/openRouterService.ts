import { ChatOpenAI } from '@langchain/openai';
import { config, type ModelConfig } from '../config.ts';
import { z } from 'zod';
import { createAgent, HumanMessage, providerStrategy, SystemMessage } from 'langchain';

export class OpenRouterService {
    private readonly config: ModelConfig;
    private readonly llmClient: ChatOpenAI;

    constructor(
        configOverride?: ModelConfig
    ) {
        this.config = configOverride ?? config;

        this.llmClient = new ChatOpenAI({
            apiKey: this.config.apiKey,
            model: this.config.models[0],
            temperature: this.config.temperature,
            configuration: {
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': this.config.httpReferer,
                    'X-Title': this.config.xTitle
                }
            },

            modelKwargs: {
                models: this.config.models,
                provider: this.config.provider
            }
        })
    }

    async generateStructured<T>(
        systemPrompt: string,
        userPrompt: string,
        schema: z.ZodSchema<T>
    ) {
        try {
            const agent = createAgent({
                model: this.llmClient,
                responseFormat: providerStrategy(schema)
            });
    
            const messages = [
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt),
            ];
    
            const data = await agent.invoke({ messages });
    
            return {
                success: true,
                data: data.structuredResponse as z.infer<typeof schema>
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ?
                    error.message:
                    String(error)
            };
        }
    }
}