// CS543 - Assignment 7: Tasks service (Multi-Agent AI Workspace) exposed through GraphQL.
// Apollo Server (schema + resolvers) mounted on Express, with SQL over PostgreSQL.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const pool = require('./db');

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

// Column aliases map SQL snake_case (assigned_agent) to GraphQL camelCase (assignedAgent).
const COLUMNS = 'id, title, assigned_agent AS "assignedAgent", status, priority';

const resolvers = {
  Query: {
    // query { tasks { ... } }  ->  SELECT without WHERE
    tasks: async () => {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM tasks ORDER BY id`);
      return rows;
    },
    // query { task(id: 1) { ... } }  ->  WHERE id = $1
    task: async (_parent, { id }) => {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM tasks WHERE id = $1`, [id]);
      return rows[0] || null;
    },
  },
  Mutation: {
    // mutation { addTask(input: {...}) { ... } }  ->  INSERT ... RETURNING
    addTask: async (_parent, { input }) => {
      const { title, assignedAgent, priority } = input;
      const { rows } = await pool.query(
        `INSERT INTO tasks (title, assigned_agent, priority)
         VALUES ($1, $2, COALESCE($3, 1))
         RETURNING ${COLUMNS}`,
        [title, assignedAgent ?? null, priority ?? null]
      );
      return rows[0];
    },
  },
};

async function start() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/graphql', cors(), express.json(), expressMiddleware(server));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`Front-end page:   http://localhost:${PORT}/`);
  });
}

start().catch((err) => { console.error(err); process.exit(1); });
