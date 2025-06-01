import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline";

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
  const transport = new StdioClientTransport({
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
    const tools = await client.listTools();
    console.log("Available tools:", tools.map(t => t.name));

    if (!tools.some(t => t.name === 'searchBookmarks')) {
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

    const result = await client.callTool({
      name: "searchBookmarks",
      arguments: {
        query: searchQuery,
        ...(limit && !isNaN(limit) && { limit }), // Add limit only if valid
      },
    });

    console.log("\nSearch Result:");
    if (result.isError) {
      console.error("Error from server:");
    }
    result.content.forEach((item, index) => {
      if (item.type === "text") {
        console.log(`[Text ${index}]: ${item.text}`);
      } else if (item.type === "json") {
        console.log(`[Bookmark ${index}]:`);
        console.log(JSON.stringify(item.json, null, 2));
      } else {
        console.log(`[Content ${index} Type ${item.type}]:`, item);
      }
    });

  } catch (error) {
    console.error("Client error:", error);
  } finally {
    rl.close();
    if (client.isConnected) {
      await client.disconnect();
    }
    // transport.close() // StdioClientTransport might automatically close when the child process ends.
                       // Or it might require explicit closing depending on its implementation.
                       // Check SDK docs if issues arise.
  }
}

main();
