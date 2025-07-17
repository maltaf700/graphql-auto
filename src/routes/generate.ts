import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

export const generateRoute = Router();

generateRoute.post("/", async (req: Request, res: Response) => {
  const { typeDefs, resolverCode } = req.body;

  if (!typeDefs || !resolverCode) {
    return res.status(400).json({
      error:
        "Provide 'typeDefs' (SDL string) and 'resolverCode' (JavaScript string)",
    });
  }

  const schemaPath = path.join(__dirname, "..", "graphql", "schema.graphql");
  const resolversDir = path.join(__dirname, "..", "graphql", "resolvers");
  const resolverPath = path.join(resolversDir, "index.js");

  if (!fs.existsSync(resolversDir)) {
    fs.mkdirSync(resolversDir, { recursive: true });
  }

  fs.writeFileSync(schemaPath, typeDefs);
  fs.writeFileSync(resolverPath, resolverCode);

  return res.json({ message: "Schema and resolvers generated." });
});
