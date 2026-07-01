import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.ts';
import config, { type ModelConfig } from '../src/config.ts';
import OpenRouterService, { type LLMResponse } from '../src/OpenRouterService.ts';

console.assert(
    process.env.OPENROUTER_API_KEY,
    'OPENROUTER_API_KEY is not set in env variables'
);

test('routes to cheapest model by default', async () => {
    const customConfig: ModelConfig = {
        ...config,
        provider: {
            ...config.provider,
            sort: {
                ...(config.provider.sort as {}),
                by: 'price'
            }
        }
    }

    const routerService = new OpenRouterService(customConfig);
    const app = createServer(routerService);

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: "What is rate limit"
        }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json() as LLMResponse;

    const [baseName] = customConfig.models[0].split(':');

    // All models used are free, so the first will be chosen
    assert.ok(body.model.startsWith(baseName));
});

test('routes to highest throughput model by default', async () => {
    const customConfig: ModelConfig = {
        ...config,
        provider: {
            ...config.provider,
            sort: {
                ...(config.provider.sort as {}),
                by: 'throughput'
            }
        }
    }

    const routerService = new OpenRouterService(customConfig);
    const app = createServer(routerService);

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: "What is rate limit"
        }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json() as LLMResponse;

    // All models used are free, so the first will be chosen
    assert.equal(body.model, 'nvidia/nemotron-3-nano-30b-a3b:free');
});
