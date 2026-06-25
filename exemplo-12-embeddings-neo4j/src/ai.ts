import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

type DebugLog = (...args: unknown[]) => void;
type Params = {
    debugLog: DebugLog,
    vectorStore: Neo4jVectorStore,
    nlpModel: ChatOpenAI,
    promptConfig: any,
    templateText: string,
    topK: number
}

interface ChainState {
    question: string;
    context?: string;
    topScore?: number;
    error?: string;
    answer?: string;
}

const insufficientInfoErrorMessage = "Desculpe, não encontrei informações relevantes sobre essa pergunta na base de conhecimento";

export class AI {
    constructor(
        private readonly params: Params
    ) {}

    async retrieveVectorSearchResults(input: ChainState): Promise<ChainState> {
        const MINIMAL_SCORE_ACCEPTABLE = 0.5;

        this.params.debugLog("Buscando no vector store do Neo4j...");
        const vectorResults = await this.params.vectorStore.similaritySearchWithScore(input.question, this.params.topK);

        if (!vectorResults.length) {
            this.params.debugLog("Nenhum resultado encontrado no vector store.");
            return {
                ...input,
                error: insufficientInfoErrorMessage
            };
        }

        const topScore = vectorResults[0]![1];
        this.params.debugLog(`Encontrados ${vectorResults.length} resultados relevantes (melhor score: ${topScore.toFixed(3)})`);

        if (topScore <= MINIMAL_SCORE_ACCEPTABLE) {
            this.params.debugLog("Resultados de baixo score encontrados no vector store.");
            return {
                ...input,
                error: insufficientInfoErrorMessage
            };
        }

        const contexts = vectorResults
            .filter(([, score]) => score > MINIMAL_SCORE_ACCEPTABLE)
            .map(([doc]) => doc.pageContent)
            .join("\n\n---\n\n");

        return {
            ...input,
            context: contexts,
            topScore,
        }
    }

    async generateNLPResponse(input: ChainState): Promise<ChainState> {
        if (input.error) return input;
        this.params.debugLog("Gerando resposta com IA...");

        const responsePrompt = ChatPromptTemplate.fromTemplate(
            this.params.templateText
        );

        const responseChain = responsePrompt
            .pipe(this.params.nlpModel)
            .pipe(new StringOutputParser());

        const rawResponse = await responseChain.invoke({
            role: this.params.promptConfig.role,
            task: this.params.promptConfig.task,
            tone: this.params.promptConfig.constraints.tone,
            language: this.params.promptConfig.constraints.language,
            format: this.params.promptConfig.constraints.format,
            instructions: this.params.promptConfig.instructions
                .map((instruct, idx) => `${idx + 1} - ${instruct}`)
                .join('\n'),
            question: input.question,
            context: input.context
        });

        if (rawResponse === 'INSUFFICIENT_INFO') return {
            ...input,
            error: insufficientInfoErrorMessage
        };

        return {
            ...input,
            answer: rawResponse
        }
    }

    async answerQuestion(question: string) {
        const chain = RunnableSequence.from([
            this.retrieveVectorSearchResults.bind(this),
            this.generateNLPResponse.bind(this),
        ]);

        return await chain.invoke({ question });
    }
}