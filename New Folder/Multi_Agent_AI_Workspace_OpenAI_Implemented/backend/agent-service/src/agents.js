const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || 'gpt-5.5';

const AGENTS = [
  {
    id: 'research',
    name: 'Research Agent',
    role: 'Requirements and technical research',
    instructions: `You are the Research Agent in a multi-agent software engineering workspace. Analyze the user's task, clarify requirements, identify constraints, important technologies, security concerns, edge cases, and a practical implementation plan. Do not write the final solution. Return concise structured research that downstream agents can use.`,
  },
  {
    id: 'coding',
    name: 'Coding Agent',
    role: 'Software implementation planning',
    instructions: `You are the Coding Agent. Based on the original task and the Research Agent output, design the implementation. Specify architecture, modules, API endpoints, data flow, important code-level decisions, validation, error handling, and testing hooks. If code snippets are useful, provide focused snippets. Do not claim files were changed because you cannot access the user's repository.`,
  },
  {
    id: 'database',
    name: 'Database Agent',
    role: 'Schema and persistence design',
    instructions: `You are the Database Agent. Based on the task, research, and coding plan, design the persistence layer. Identify entities, relationships, keys, indexes, constraints, transaction boundaries, and migration considerations. Prefer PostgreSQL-compatible SQL when a database is required.`,
  },
  {
    id: 'testing',
    name: 'Testing Agent',
    role: 'Test generation and validation',
    instructions: `You are the Testing Agent. Review the task, research, implementation plan, and database design. Produce a practical test strategy with unit, integration, API, security, negative, and edge-case tests. Identify likely failure points and acceptance criteria.`,
  },
  {
    id: 'review',
    name: 'Review Agent',
    role: 'Output comparison and correction',
    instructions: `You are the Review Agent and final quality gate. Compare all upstream outputs against the original task. Identify contradictions, missing requirements, security or reliability issues, and unnecessary complexity. Then produce a final recommended solution and a short prioritized action list.`,
  },
];

async function runAgent(agent, input, useWebSearch = false) {
  const request = {
    model,
    instructions: agent.instructions,
    input,
  };

  if (useWebSearch && process.env.ENABLE_WEB_SEARCH !== 'false') {
    request.tools = [{ type: 'web_search' }];
  }

  const response = await openai.responses.create(request);
  return response.output_text || '';
}

async function executeWorkflow({ runId, taskId, workspaceId, title, description }) {
  const task = `Task title: ${title}\nTask description:\n${description || '(none)'}`;
  const outputs = {};
  const startedAt = new Date().toISOString();

  outputs.research = await runAgent(AGENTS[0], task, true);
  outputs.coding = await runAgent(
    AGENTS[1],
    `${task}\n\nResearch Agent output:\n${outputs.research}`
  );
  outputs.database = await runAgent(
    AGENTS[2],
    `${task}\n\nResearch Agent output:\n${outputs.research}\n\nCoding Agent output:\n${outputs.coding}`
  );
  outputs.testing = await runAgent(
    AGENTS[3],
    `${task}\n\nResearch:\n${outputs.research}\n\nCoding plan:\n${outputs.coding}\n\nDatabase design:\n${outputs.database}`
  );
  outputs.review = await runAgent(
    AGENTS[4],
    `${task}\n\nResearch:\n${outputs.research}\n\nCoding:\n${outputs.coding}\n\nDatabase:\n${outputs.database}\n\nTesting:\n${outputs.testing}`
  );

  return {
    runId,
    taskId,
    workspaceId,
    model,
    startedAt,
    completedAt: new Date().toISOString(),
    agents: AGENTS.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status: 'completed',
      output: outputs[agent.id],
    })),
    finalAnswer: outputs.review,
  };
}

module.exports = { AGENTS, executeWorkflow };
