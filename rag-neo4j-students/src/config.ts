export const config = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  httpReferer: '',
  xTitle: 'IA Devs - Sales Analytics Reporter',
  models: [
    process.env.LANGSMITH_NATURAL_LANG_AI,
  ],
  provider: {
    sort: {
      by: 'throughput', // Route to model with highest throughput (fastest response)
      partition: 'none',
    },
  },
  temperature: 0.7,
  neo4j: {
    uri: `neo4j://${process.env.GRAPH_DB_SERVICE}:7687`,
    username: process.env.GRAPH_DB_USER,
    password: process.env.GRAPH_DB_PASS,
  },
  maxCorrectionAttempts: 1,
  maxSubQuestions: 3,
};


export default config
