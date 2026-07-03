import {
    END,
    MessagesZodMeta,
    START,
    StateGraph,
} from '@langchain/langgraph';
import { withLangGraph } from '@langchain/langgraph/zod';
import { BaseMessage } from 'langchain';
import { z } from 'zod/v3';
import { identifyIntentNode } from './nodes/identifyIntentNode.ts';
import { chatResponseNode } from './nodes/chatResponseNode.ts';
import { lowerCaseNode } from './nodes/lowerCaseNode.ts';
import { upperCaseNode } from './nodes/upperCaseNode.ts';
import { fallbackNode } from './nodes/fallbackNode.ts';

const GraphState = z.object({
    messages: withLangGraph(
        z.custom<BaseMessage[]>(),
        MessagesZodMeta
    ),
    output: z.string(),
    command: z.enum(['uppercase', 'lowercase', 'unknown'])
});

export type GraphState = z.infer<typeof GraphState>;

export function buildGraph() {
    const workflow = new StateGraph({
        stateSchema: GraphState
    })

    .addNode('identifyIntent', identifyIntentNode)
    .addNode('chatResponse', chatResponseNode)

    .addNode('lowerCase', lowerCaseNode)
    .addNode('upperCase', upperCaseNode)
    .addNode('fallback', fallbackNode)

    .addEdge(START, 'identifyIntent')
    .addConditionalEdges(
        'identifyIntent',
        (state: GraphState) => {
            switch(state.command) {
                case 'uppercase':
                    return 'uppercase';
                case 'lowercase':
                    return 'lowercase';
                default:
                    return 'fallback';
            }
        },
        {
            'uppercase': 'upperCase',
            'lowercase': 'lowerCase',
            'fallback': 'fallback'
        }
    )
    .addEdge('lowerCase', 'chatResponse')
    .addEdge('upperCase', 'chatResponse')
    .addEdge('fallback', 'chatResponse')
    .addEdge('chatResponse', END);

    return workflow.compile();
}