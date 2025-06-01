import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as HatenaAuth from '../hatenaAuth'; // To mock getOAuthHeaders
import https from 'https';

// Mock getOAuthHeaders
jest.mock('../hatenaAuth');
const mockedGetOAuthHeaders = HatenaAuth.getOAuthHeaders as jest.Mock;

// Mock https.get
jest.mock('https');
const mockedHttpsGet = https.get as jest.Mock;

describe('MCP Server - HatenaBookmarkSearch', () => {
  let client: Client;
  let transport: StdioClientTransport;
  // Server setup will be more complex as it needs to be started/stopped for tests
  // For simplicity, we'll use the actual server file and Stdio transport.

  beforeEach(async () => {
    // Reset mocks
    mockedGetOAuthHeaders.mockReset();
    mockedHttpsGet.mockReset();

    // Mock implementations
    mockedGetOAuthHeaders.mockReturnValue({ Authorization: 'OAuth mock_header' });

    transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/server.js'], // Assuming server.ts is compiled to dist/server.js
    });

    client = new Client({ name: 'TestClient', version: '1.0.0' });
    await client.connect(transport);
  });

  afterEach(async () => {
    if (client && client.isConnected) {
      await client.disconnect();
    }
    // transport.close(); // StdioClientTransport should handle child process termination
  });

  it('should list the searchBookmarks tool', async () => {
    const tools = await client.listTools();
    expect(tools.some(tool => tool.name === 'searchBookmarks')).toBe(true);
  });

  it('should call searchBookmarks tool and return mocked success response', async () => {
    const mockApiResponse = {
      meta: { total: 1, query: { original: 'test', queries: ['test'] }, status: 200, elapsed: 0.1 },
      bookmarks: [
        {
          entry: { title: 'Test Bookmark', count: 1, url: 'http://example.com', eid: '123', snippet: 'Test snippet' },
          timestamp: Math.floor(Date.now() / 1000),
          comment: 'Test comment',
          is_private: 0,
        },
      ],
    };

    // Mock the https.get response
    const mockRes = {
      on: (event: string, callback: any) => {
        if (event === 'data') callback(JSON.stringify(mockApiResponse));
        if (event === 'end') callback();
      },
      statusCode: 200,
    };
    mockedHttpsGet.mockImplementation((url: any, options: any, callback: any) => {
      callback(mockRes);
      return { on: jest.fn(), end: jest.fn() }; // Return a mock request object
    });

    const result = await client.callTool({
      name: 'searchBookmarks',
      arguments: { query: 'test' },
    });

    expect(result.isError).toBe(false);
    expect(result.content.length).toBeGreaterThan(1); // "Found X bookmarks" + bookmark data
    expect(result.content[0].type).toBe('text');
    expect((result.content[0] as any).text).toContain('Found 1 bookmarks');
    expect(result.content[1].type).toBe('json');
    expect((result.content[1] as any).json.title).toBe('Test Bookmark');
    expect(mockedGetOAuthHeaders).toHaveBeenCalled();
    expect(mockedHttpsGet).toHaveBeenCalledWith(
      expect.stringContaining('https://b.hatena.ne.jp/my/search/json?q=test&of=0&limit=20'),
      expect.any(Object), // headers
      expect.any(Function) // callback
    );
  });

  it('should handle Hatena API error response from searchBookmarks tool', async () => {
    const mockApiErrorResponse = {
      meta: { total: 0, query: { original: 'error_test', queries: ['error_test'] }, status: 403, elapsed: 0.1 },
      bookmarks: [],
    };
    const mockRes = {
      on: (event: string, callback: any) => {
        if (event === 'data') callback(JSON.stringify(mockApiErrorResponse));
        if (event === 'end') callback();
      },
      statusCode: 200, // API itself returns 200, but contains error in its payload
    };
     mockedHttpsGet.mockImplementation((url: any, options: any, callback: any) => {
      callback(mockRes);
      return { on: jest.fn(), end: jest.fn() };
    });

    const result = await client.callTool({
      name: 'searchBookmarks',
      arguments: { query: 'error_test' },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    expect((result.content[0] as any).text).toContain('Hatena API returned status 403');
  });

  it('should handle underlying HTTP error when calling Hatena API', async () => {
    mockedHttpsGet.mockImplementation((url: any, options: any, callback: any) => {
      const req = {
        on: jest.fn((event: string, cb: (err?: Error) => void) => {
          if(event === 'error') {
            // Store the callback to be called later
            (req as any)._errorCallback = cb;
          }
        }),
        end: jest.fn()
      };
      // Simulate request error by calling the stored error callback
      process.nextTick(() => {
        if ((req as any)._errorCallback) {
          (req as any)._errorCallback(new Error('Network Error'));
        }
      });
      return req;
    });

    const result = await client.callTool({
      name: 'searchBookmarks',
      arguments: { query: 'network_error' },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    expect((result.content[0] as any).text).toContain('Error searching Hatena Bookmarks: Network Error');
  });
});
