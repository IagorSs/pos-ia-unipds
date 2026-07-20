import { ChatOpenAI } from '@langchain/openai';
import { config, prompts, type ModelConfig } from '../config.ts';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { createAgent } from 'langchain';
import { getMcpTools } from './mcpService.ts';
import { PromptTemplate } from '@langchain/core/prompts';

export type GuardrailResult = {
    safe: boolean;
    reason?: string;
    score?: number;
    analysis?: string;
};

export class OpenRouterService {
    private config: ModelConfig;
    private llmClient: ChatOpenAI;
    private safeGuardClient: ChatOpenAI;
    private fsAgent: ReturnType<typeof createAgent> | null = null;

    constructor(configOverride?: ModelConfig) {
        this.config = configOverride ?? config;
        this.llmClient = this.#createChatModel(this.config.models[0]);
        this.safeGuardClient = this.#createChatModel(this.config.guardrailsModel);
    }

    #createChatModel(modelName: string): ChatOpenAI {
        return new ChatOpenAI({
            apiKey: this.config.apiKey,
            modelName: modelName,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            configuration: {
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': this.config.httpReferer,
                    'X-Title': this.config.xTitle,
                },
            },
            modelKwargs: {
                models: this.config.models,
            },
        });
    }

    async generate(
        systemPrompt: string,
        userPrompt: string,
    ): Promise<string> {

        if (!this.fsAgent) {
            const tools = await getMcpTools();
            this.fsAgent = createAgent({
                model: this.llmClient,
                tools,
            });
        }

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
        ];

        const response = await this.fsAgent.invoke({ messages });
        const content = String(response.messages.at(-1)?.text ?? '');

        return content;
    }

    async checkGuardRails(
        userInput: string,
        enabled: boolean = true
    ): Promise<GuardrailResult> {
        if (!enabled) return {
            safe: true,
            reason: 'Guardails disabled'
        };

        const template = PromptTemplate.fromTemplate(prompts.guardrails);
        const input = await template.format({
            USER_INPUT: userInput,
        });

        const response = await this.safeGuardClient.invoke([
            {
                role: 'user',
                content: input
            }
        ]);
        const analysis = response.text.trim();

        if (analysis.toUpperCase().startsWith('SAFE')) return {
            safe: true,
            analysis
        }

        return {
            safe: false,
            reason: 'Prompt Injection detected by safeguard model',
            analysis
        }
    }
}
