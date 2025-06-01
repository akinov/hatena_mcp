import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getOAuthHeaders } from "./hatenaAuth"; // Assuming this path is correct
import https from 'https'; // For making API requests
// If axios was installed, could use: import axios from 'axios';

// Define the structure of a bookmark from Hatena API for type safety
interface HatenaBookmark {
  entry: {
    title: string;
    count: number;
    url: string;
    eid: string;
    snippet: string;
  };
  timestamp: number;
  comment: string;
  is_private: number;
}

interface HatenaSearchResponse {
  bookmarks: HatenaBookmark[];
  meta: {
    total: number;
    query: {
      original: string;
      queries: string[];
    };
    status: number;
    elapsed: number;
  };
}

// Create an MCP server
const server = new McpServer({
  name: "HatenaBookmarkSearch",
  version: "1.0.0",
});

// Define the search tool
server.tool(
  "searchBookmarks",
  {
    query: z.string().describe("The search query for Hatena Bookmarks."),
    offset: z.number().optional().default(0).describe("Search result offset."),
    limit: z.number().optional().default(20).describe("Search result limit (max 100)."),
  },
  async ({ query, offset, limit }) => {
    const apiUrl = "https://b.hatena.ne.jp/my/search/json";
    const method = "GET";

    // Ensure limit is within bounds
    const effectiveLimit = Math.min(limit ?? 20, 100);

    const params = new URLSearchParams({
      q: query,
      of: (offset ?? 0).toString(),
      limit: effectiveLimit.toString(),
    });
    const requestUrl = `${apiUrl}?${params.toString()}`;

    const oauthHeaders = getOAuthHeaders(requestUrl, method);

    try {
      // Using built-in https module. Replace with axios if preferred and installed.
      const responseText = await new Promise<string>((resolve, reject) => {
        const req = https.get(requestUrl, { headers: oauthHeaders }, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`Hatena API request failed with status ${res.statusCode}: ${data}`));
            }
          });
        });
        req.on("error", reject);
        req.end();
      });

      const responseData = JSON.parse(responseText) as HatenaSearchResponse;

      if (responseData.meta.status !== 200) {
        // Even if HTTP status is 200, Hatena API might return an error in its own status field
         return {
          content: [{ type: "text", text: `Hatena API returned status ${responseData.meta.status}. Query: ${responseData.meta.query.original}` }],
          isError: true,
        };
      }

      // Transform Hatena API response to MCP tool result format
      const results = responseData.bookmarks.map(bookmark => ({
        type: "json", // Or could be a custom structured type if MCP supports it well
        data: {
          title: bookmark.entry.title,
          url: bookmark.entry.url,
          comment: bookmark.comment,
          snippet: bookmark.entry.snippet,
          bookmark_count: bookmark.entry.count,
          timestamp: new Date(bookmark.timestamp * 1000).toISOString(),
          is_private: bookmark.is_private === 1,
          eid: bookmark.entry.eid
        }
      }));

      return {
        content: [
            { type: "text", text: `Found ${responseData.meta.total} bookmarks. Showing ${responseData.bookmarks.length}.` },
            ...results.map(r => ({ type: "json", json: r.data })) // Representing each bookmark as JSON content
        ]
      };

    } catch (error: any) {
      console.error("Error calling Hatena API:", error);
      return {
        content: [{ type: "text", text: `Error searching Hatena Bookmarks: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Placeholder for resources or prompts if needed later
server.resource(
  "info",
  "info://hatena-search",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "This MCP server allows searching your Hatena Bookmarks."
    }]
  })
);

// Start the server with StdioTransport
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("Hatena Bookmark Search MCP Server started with StdioTransport.");
  } catch (error) {
    console.error("Failed to start Hatena Bookmark Search MCP Server:", error);
    process.exit(1);
  }
}

main();
