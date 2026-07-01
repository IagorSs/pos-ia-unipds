import type { ChatGenerationParamsProvider } from "@openrouter/sdk/models";

console.assert(
    process.env.OPENROUTER_API_KEY,
    'OPENROUTER_API_KEY is not set in env variables'
);

export type ModelConfig = {
    apiKey: string;
    httpReferer: string;
    xTitle: string;
    port: number;
    models: string[];
    temperature: number;
    maxTokens: number;
    systemPrompt: string;

    provider: ChatGenerationParamsProvider;
};

const config: ModelConfig = {
    apiKey: process.env.OPENROUTER_API_KEY!,
    httpReferer: 'http://pos-ia.com',
    xTitle: 'SmartModelRouterGateway',
    port: 3000,
    models: [
        // free usage with lowest latency but only explain message
        'liquid/lfm-2.5-1.2b-instruct:free',

        // free usage with highest throughput
        'nvidia/nemotron-3-nano-30b-a3b:free',
    ],
    temperature: 0.2,
    maxTokens: 50,
    systemPrompt: 'You are a helpful assistant.',

    provider: {
        sort: {
            by: 'throughput',
            partition: 'none'
        },
    }
};

export default config;
