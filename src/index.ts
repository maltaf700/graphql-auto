import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import http from "http";
import { gql } from "graphql-tag";
import fs from "fs";
import path from "path";
import { generateRoute } from "./routes/generate";
import { makeExecutableSchema } from "@graphql-tools/schema";

// Dynamically load schema and resolvers
function loadSchemaAndResolvers() {
  const typeDefsPath = path.join(__dirname, "graphql", "schema.graphql");
  const resolversPath = path.join(
    __dirname,
    "graphql",
    "resolvers",
    "index.js"
  );

  const typeDefs = fs.existsSync(typeDefsPath)
    ? fs.readFileSync(typeDefsPath, "utf-8")
    : `type Query { hello: String }`;

  const resolvers = fs.existsSync(resolversPath)
    ? require(resolversPath).default
    : {
        Query: {
          hello: () => "Hello world!",
        },
      };

  return { typeDefs: gql(typeDefs), resolvers };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cors());
  app.use(express.json());

  const { typeDefs, resolvers } = loadSchemaAndResolvers();

  const server = new ApolloServer({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
  });

  await server.start();

  const graphqlMiddleware = expressMiddleware(server, {
    context: async ({ req, res }) => ({ req, res }),
  });

  app.use("/graphql", async (req, res, next) => {
    const middleware = await graphqlMiddleware;
    return middleware(req, res, next);
  });

  // Add REST endpoint for schema/resolver generation
  app.use("/generate", generateRoute);

  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL: http://localhost:${PORT}/graphql`);
    console.log(`📮 Generate: POST http://localhost:${PORT}/generate`);
  });
}

startServer();
