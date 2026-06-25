import { readFileSync } from 'node:fs';

export interface TextSplitterConfig {
    chunkSize: number;
    chunkOverlap: number;
}

const promptFolder = './prompts';
const promptsFiles = {
    answerPrompt: `${promptFolder}/answerPrompt.json`,
    template: `${promptFolder}/template.txt`,
}

export const CONFIG = Object.freeze({
    promptConfig: JSON.parse(readFileSync(promptsFiles.answerPrompt, 'utf-8')),
    templateText: readFileSync(promptsFiles.template, 'utf-8'),
    repopulateEmbeddings: JSON.parse(process.env.REPOPULATE_EMBEDDINGS!) as boolean,
    output: {
        answersFolder: './respostas',
        fileName: 'resposta',
    },
    neo4j: {
        url: process.env.NEO4J_URI!,
        username: process.env.NEO4J_USER!,
        password: process.env.NEO4J_PASSWORD!,
        indexName: "tensors_index",
        searchType: "vector" as const,
        textNodeProperties: ["text"],
        nodeLabel: "Chunk",
    },
    openRouter: {
        url: process.env.OPENROUTER_API_URL,
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature: 0.3,
        maxRetries: 2,
        defaultHeaders: {
            "HTTP-Referer": process.env.OPENROUTER_SITE_URL,
            "X-Title": process.env.OPENROUTER_SITE_NAME,
        }
    },
    pdf: {
        path: "./tensores.pdf",
    },
    textSplitter: {
        chunkSize: 1000,
        chunkOverlap: 200,
    },
    ais: {
        nlp: {
            modelName: process.env.NLP_MODEL,
        },
        embedding: {
            modelName: process.env.EMBEDDING_MODEL!,
            pretrainedOptions: {
                // Options: 'fp32' (best quality), 'fp16' (faster), 'q8', 'q4', 'q4f16' (quantized)
                dtype: "fp32"
            },
        },
    },
    similarity: {
        topK: 3,
    },
});
