import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { CONFIG } from "./config.ts";

type Embeddings = number[];

type DebugLog = (...args: unknown[]) => void;

export class NvidiaEmbeddingModel implements EmbeddingsInterface {
    constructor(
        private readonly logger: DebugLog = () => {}
    ) { }

    async embedDocuments(documents: string[]): Promise<Embeddings[]> {
        return [await this.requestEmbeddings(documents)];
    }

    async embedQuery(document: string): Promise<Embeddings> {
        return await this.requestEmbeddings([document]);
    }

    private async requestEmbeddings(documents: string[]): Promise<Embeddings> {
        if (documents.length === 0) return [];
        
        this.logger('Requesting embeddings for follow documents: ', documents);

        const response = await fetch(`${CONFIG.openRouter.url}/embeddings`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.openRouter.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": CONFIG.ais.embedding.modelName,
                "input": [
                    {
                        "content": documents.map(document => ({
                            type: "text",
                            text: document
                        }))
                    }
                ],
                "encoding_format": "float"
            })
        });
    
        const data = await response.json() as {
            data: [{ embedding: Embeddings }]
        };

        this.logger('Embeddings response: ', data);

        return data.data[0].embedding;
    }
}