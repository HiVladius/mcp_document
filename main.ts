import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Buffer } from "node:buffer";

import * as crypto from "node:crypto";
import * as axios from "axios";

//! Necesitamos la api de Structurizr
const WORKSPACE_ID = Deno.env.get("WORKSPACE_ID")as string;
const API_KEY = Deno.env.get("API_KEY") as string;
const API_SECRET = Deno.env.get("API_SECRET") as string;
const URL = Deno.env.get("BASE_URL") as string;

interface AuthHeaders {
  "X-Authorization": string;
  "Nonce": string;
  "Content-MD5": string;
  "Content-Type": string;
  [key: string]: string;
}

//!Helper para firmar peticiones (indispensable para la api de Structurizr)
function getAuthHeaders(
  method: string,
  path: string,
  body: string = "",
): AuthHeaders {
  const nonce = Date.now().toString();
  const md5 = body
    ? crypto.createHash("md5").update(body, "utf-8").digest("hex")
    : "";

  const stringToSign =
    `${method}\n${path}\n${md5}\napplication/json\n${nonce}\n`;
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(stringToSign)
    .digest("hex");

  return {
    "X-Authorization": `${API_KEY}:${
      Buffer.from(signature).toString("base64")
    }`,
    "Nonce": nonce,
    "Content-MD5": md5,
    "Content-Type": "application/json",
  };
}

const server = new Server(
  { name: "Structurizr-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "fetch_workspace",
      descriptions: "Obtiene ",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "push_workspace",
      description: "Sube un nuevo modelo JSON a Structurizr",
      inputSchema: {
        type: "object",
        properties: {
          jsonContent: {
            type: "string",
            description: "El contenido JSON del workspace a subir",
          },
        },
        required: ["jsonContent"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const path = `/workspace/${WORKSPACE_ID}`;

  try {
    if (name === "fetch_workspace") {
      const headers = getAuthHeaders("GET", path);
      const { data } = await axios.default.get(`${URL}${path}`, {
        headers,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    }

    if (name === "push_workspace") {
      const body = args?.jsonContent as string;
      const headers = getAuthHeaders("PUT", path, body);
      await axios.default.put(`${URL}${path}`, body, { headers });

      return {
        content: [{ type: "text", text: `Workspace subido correctamente.` }],
      };
    }

    throw new Error(`Tool ${name} no implementada aún.`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{
        type: "text",
        text: `Error al ejecutar la herramienta ${name}: ${errorMessage}`,
      }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.log("MCP Structurizr Server running");
