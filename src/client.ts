import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline";

// Define interfaces based on investigation and failed imports
interface McpToolDefinition {
  name: string;
  description?: string;
}

interface McpContentItem {
  type: "text" | "error" | string; // Extend with other known types if necessary
  text?: string;
  message?: string;
  [key: string]: any;
}

interface McpToolCallResponse {
  isError?: boolean;
  content: McpContentItem[];
}

// Helper function to read input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  // Configure the transport to connect to the server
  // This assumes the server (server.js or server.ts compiled) is run directly
  const transport = new StdioClientTransport({ // transport type is StdioClientTransport
    command: "node", // Or "ts-node" if running .ts directly and it's globally available
    args: ["dist/server.js"], // Path to the compiled server code
  });

  const client = new Client({
    name: "HatenaBookmarkSearchClient",
    version: "1.0.0",
  });

  try {
    console.log("Connecting to Hatena Bookmark Search MCP Server...");
    await client.connect(transport);
    console.log("Connected successfully!");

    // List available tools (optional, for demonstration)
    // Per investigation, listTools() returns a complex object.
    // We'll access its properties dynamically for now.
    const listToolsResult: any = await client.listTools();
    // Prioritize 'availableTools', then 'tools', then assume the result itself is the array (less likely)
    // Added || [] to ensure 'tools' is always an array to prevent runtime errors if listToolsResult is unexpected.
    const tools: McpToolDefinition[] = (listToolsResult.availableTools || listToolsResult.tools || listToolsResult || []) as McpToolDefinition[];

    console.log("Available tools:", tools.map((t: McpToolDefinition) => t.name));

    if (!tools.some((t: McpToolDefinition) => t.name === 'searchBookmarks')) {
      console.error("searchBookmarks tool not found on server.");
      return;
    }

    const searchQuery = await askQuestion("Enter your search query for Hatena Bookmarks: ");
    const limitStr = await askQuestion("Enter limit (e.g., 10, default 20): ");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    if (searchQuery.trim() === "") {
      console.log("Search query cannot be empty.");
      return;
    }

    console.log(`Searching for: "${searchQuery}" with limit ${limit ?? 20}...`);

    // Actual return type of callTool is a complex Zod object.
    // We'll receive it as 'any' and then access its properties.
    const toolCallOutput: any = await client.callTool({
      name: "searchBookmarks",
      arguments: {
        query: searchQuery,
        ...(limit && !isNaN(limit) && { limit }), // Add limit only if valid
      },
    });

    console.log("\nSearch Result:");
    // Assuming isError and content are top-level properties or nested under a common property like 'output' or 'data'
    // For now, let's assume they are accessible directly or adjust if further errors indicate nesting
    const isError = toolCallOutput.isError || (toolCallOutput.output && toolCallOutput.output.isError);
    const content : McpContentItem[] = (toolCallOutput.content || (toolCallOutput.output && toolCallOutput.output.content) || []) as McpContentItem[];

    if (isError) {
      console.error("Error from server:");
    }

    content.forEach((item: McpContentItem, index: number) => {
      if (item.type === "text") {
        console.log(`[Text ${index}]: ${item.text}`);
        // Attempt to parse if it might be a JSON string from our server
        if (item.text) {
          try {
            const bookmark = JSON.parse(item.text);
            // Check for a known property to identify it as a bookmark from our server
            if (bookmark && typeof bookmark === 'object' && 'title' in bookmark && 'url' in bookmark) {
               console.log(`  [Parsed Bookmark]: Title: ${bookmark.title}, URL: ${bookmark.url}`);
            }
          } catch (e) {
            // Not a JSON string or not the JSON we expected, ignore parse error
          }
        }
      } else if (item.type === "error") { // Example for handling error type if SDK uses it
        console.error(`[Error Content ${index}]: ${item.text || item.message || 'Unknown error content'}`);
      } else {
        // Fallback for other content types
        console.log(`[Content ${index} Type ${item.type}]:`, item.text || item);
      }
    });

  } catch (error) {
    console.error("Client error:", error);
  } finally {
    rl.close();
    // Attempt to close the transport if it has a close method
    if (typeof (transport as any).close === 'function') {
      console.log("Closing transport...");
      (transport as any).close();
    }
  }
}

main();
