import { createServer } from './server.ts';
import config from './config.ts';
import OpenRouterService from './OpenRouterService.ts';

const openRouterService = new OpenRouterService(config);
const app = createServer(openRouterService);

await app.listen({
    port: 3000,
    host: '0.0.0.0'
});
