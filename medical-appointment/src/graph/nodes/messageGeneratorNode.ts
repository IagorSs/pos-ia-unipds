import { getSystemPrompt, getUserPromptTemplate, MessageSchema } from '../../prompts/v1/messageGenerator.ts';
import { AppointmentService } from '../../services/appointmentService.ts';
import { OpenRouterService } from '../../services/openRouterService.ts';
import type { GraphState } from '../graph.ts';
import { AIMessage } from 'langchain';

export function createMessageGeneratorNode(
    llmClient: OpenRouterService,
) {
    return async (state: GraphState): Promise<GraphState> => {
        console.log(`💬 Generating response message...`);

        try {
            const hasSucceeded = state.actionSuccess ? 'success' : 'error';
            const scenario = `${state.intent ?? 'unknown'}_${hasSucceeded}`;
            const details = {
                professionalName: state.professionalName,
                dateTime: state.datetime,
                patientName: state.patientName,
                error: state.error,
            };

            const systemPrompt = getSystemPrompt();
            const userPrompt = getUserPromptTemplate({
                scenario,
                details
            });

            const result = await llmClient.generateStructured(
                systemPrompt,
                userPrompt,
                MessageSchema
            );

            if (result.error) {
                console.error(`Messa generation failed: ${result.error}`);
                return {
                    ...state,
                    messages: [
                        ...state.messages,
                        new AIMessage('Desculpe, quebrei!')
                    ]
                };
            }

            return {
                ...state,
                messages: [
                    ...state.messages,
                    new AIMessage(result.data!.message)
                ],
            };
        } catch (error) {
            console.error('❌ Error in messageGenerator node:', error);
            return {
                ...state,
                messages: [
                    ...state.messages,
                    new AIMessage('An error occurred while processing your request.')
                ],
            };
        }
    };
}
