import type { GraphState } from "../graph.ts";

export function fallbackNode(state: GraphState): GraphState {
    const message = "Unknown command. Try some message containing 'upper' or 'lower'."

    return {
        ...state,
        output: message
    };
};
