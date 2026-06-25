import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { ChatOpenAI } from "@langchain/openai";
import { mkdir, writeFile } from 'node:fs/promises';
import { AI } from "./ai.ts";
import { CONFIG } from "./config.ts";
import { DocumentProcessor } from "./documentProcessor.ts";
import { NvidiaEmbeddingModel } from "./NvidiaEmbeddingModel.ts";

let _neo4jVectorStore = null;

async function clearAll(vectorStore: Neo4jVectorStore, nodeLabel: string) {
    console.log("Removendo todos os documentos existentes...");
    await vectorStore.query(
        `Match (n: \`${nodeLabel}\`) DETACH DELETE n`
    )
    console.log("Documentos removidos com sucesso");
}

try {
    console.log("Inicializando sistema de embeddings com neo4j");

    const documentProcessor = new DocumentProcessor(
        CONFIG.pdf.path,
        CONFIG.textSplitter
    );

    const documents = await documentProcessor.loadAndSplit();

    const embeddings = new NvidiaEmbeddingModel();

    _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(
        embeddings,
        CONFIG.neo4j
    );
    
    if (CONFIG.repopulateEmbeddings) {
        await clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel);
    
        for (const [index, doc] of documents.entries()) {
            console.log(`Adicionando documento ${index +1}/${documents.length}`);
            await _neo4jVectorStore.addDocuments([doc]);
        }
    
        console.log("Base de dados populada com sucesso");
    }

    const nlpModel = new ChatOpenAI({
        temperature: CONFIG.openRouter.temperature,
        maxRetries: CONFIG.openRouter.maxRetries,
        model: CONFIG.ais.nlp.modelName,
        openAIApiKey: CONFIG.openRouter.apiKey,
        configuration: {
            baseURL: CONFIG.openRouter.url,
            defaultHeaders: CONFIG.openRouter.defaultHeaders
        }
    });

    console.log("ETAPA 2: Executando buscas por similaridade...");
    const questions = [
        "Me fale sobre pinguins?",
        "O que são tensores e como são representados em JavaScript",
        "Como converter objetos JavaScript em tensores?",
        "O que é normalização de dados e por que é necessária?",
        "Como funciona uma rede neural no TensorFlow.js?",
        "O que significa treinar uma rede neural?",
        "O que é hot enconding e quando usar?"
    ]

    const ai = new AI({
        nlpModel,
        debugLog: console.log,
        vectorStore: _neo4jVectorStore,
        promptConfig: CONFIG.promptConfig,
        templateText: CONFIG.templateText,
        topK: CONFIG.similarity.topK
    });

    for (const index in questions) {
        const question = questions[index]!;
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Pergunta: ${question}`);
        console.log('='.repeat(80));

        const result = await ai.answerQuestion(question);

        if (result.error) {
            console.error(`\n Erro: ${result.error}\n`);
            continue;
        }

        console.log("Resposta: ");
        console.log(result.answer);

        await mkdir(CONFIG.output.answersFolder, { recursive: true });
        const fileName = `${CONFIG.output.answersFolder}/${CONFIG.output.fileName}-${index}-${Date.now()}.md`;
        await writeFile(fileName, result.answer!);
    }
} catch (error) {
    console.error('error', error);
} finally {
    await _neo4jVectorStore?.close();
}