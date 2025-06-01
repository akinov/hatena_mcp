# Hatena Bookmark Search MCP Server

This project implements a Model Context Protocol (MCP) server that allows you to perform full-text searches on your Hatena Bookmarks. It uses the Hatena Bookmark Full-Text Search API with OAuth 1.0a authentication.

## Prerequisites

- Node.js (v16 or later recommended)
- npm

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd hatena-bookmark-mcp
    ```
    (Replace `<repository_url>` with the actual URL of this repository)

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

To use the Hatena Bookmark API, you need a Consumer Key and Consumer Secret.

1.  **Obtain API Keys:**
    Register your application with Hatena Developer Center to get your OAuth Consumer Key and Consumer Secret. You can typically find information on how to do this at the [Hatena Developer Center](https://developer.hatena.ne.jp/ja/documents/auth/apis/oauth/consumer) (Note: Link might vary, please check the official Hatena documentation).

2.  **Set API Keys:**
    You will need to edit the `src/hatenaAuth.ts` file to set your API keys. Inside this file, you will find lines similar to this, including important instructions:
    ```typescript
    // IMPORTANT: Replace these placeholder values with your actual Hatena API Consumer Key and Secret.
    // You can obtain these from the Hatena Developer Center.
    // TODO: Store these securely, e.g., as environment variables
    const CONSUMER_KEY = "YOUR_CONSUMER_KEY_HERE";
    const CONSUMER_SECRET = "YOUR_CONSUMER_SECRET_HERE";
    ```
    Replace the placeholder strings `"YOUR_CONSUMER_KEY_HERE"` and `"YOUR_CONSUMER_SECRET_HERE"` with your actual Consumer Key and Consumer Secret obtained from Hatena.

    **Important:** For production environments, it is strongly recommended to use environment variables or a secure configuration management system to handle these sensitive credentials instead of hardcoding them.

## Building the Project

To compile the TypeScript code to JavaScript:
```bash
npm run build
```
This will output the compiled files to the `dist` directory.

## Running the Server

This MCP server is designed to be communicated with via an MCP client using StdioTransport (standard input/output). The example client (`src/client.ts`) is configured to start the server automatically.

If you need to run the server process directly for another MCP client, you can use:
```bash
npm run build && node dist/server.js
```

## Running the Example Client

The example client demonstrates how to connect to the server and use its `searchBookmarks` tool. It will prompt you for a search query.

To run the example client:
```bash
npm run client
```
This command will first build the project and then execute the client, which in turn starts the server process for communication.

## Running Tests

The project includes unit tests for the OAuth module and integration tests for the MCP server. To run the tests:
```bash
npm run test
```
This command will first build the project and then run Jest.

**Important Note on `server.test.ts` Behavior:**

The integration tests in `src/tests/server.test.ts` use an `StdioClientTransport` to communicate with the server. This means the actual server (`dist/server.js`) is launched as a separate child process during these tests.

Due to this architecture, standard Jest mocking for network requests or modules like `https` or `src/hatenaAuth.ts` within the test file **does not affect the child server process**. Consequently, when these tests run the `searchBookmarks` tool:

*   The server will attempt to make **live HTTP requests** to the Hatena Bookmark API.
*   The API credentials currently configured in `src/hatenaAuth.ts` are placeholder/test values.
*   As a result, the Hatena API is expected to return an authentication error (e.g., a 401 Unauthorized status).
*   The tests in `server.test.ts` are written to **expect this error response** from the live API. They verify that the server correctly processes this API error and relays it as an MCP error response.

Passing these specific tests therefore confirms that:
1.  Client-server MCP communication via StdioTransport is working for the `searchBookmarks` tool.
2.  The server can gracefully handle and report errors received from the live Hatena API.

The unit tests in `src/tests/hatenaAuth.test.ts`, on the other hand, run entirely within the main test process, and any mocks defined for them behave as expected.

## Project Structure

-   `src/`: Contains the TypeScript source code.
    -   `server.ts`: The main MCP server implementation.
    -   `client.ts`: An example MCP client to interact with the server.
    -   `hatenaAuth.ts`: Handles OAuth 1.0a authentication for the Hatena API.
    -   `tests/`: Contains Jest test files.
        -   `hatenaAuth.test.ts`: Unit tests for OAuth utilities.
        -   `server.test.ts`: Integration tests for the MCP server.
-   `dist/`: Contains the compiled JavaScript code (after running `npm run build`).
-   `package.json`: Defines project dependencies and scripts.
-   `tsconfig.json`: TypeScript compiler configuration.
-   `jest.config.js`: Jest test runner configuration.
-   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
-   `README.md`: This file, providing an overview and instructions.

## MCP Details

The server exposes the following:

### Tools

1.  **`searchBookmarks`**
    -   Description: Performs a full-text search of your Hatena Bookmarks.
    -   Arguments:
        -   `query` (string, required): The search term.
        -   `offset` (number, optional, default: 0): The offset for search results.
        -   `limit` (number, optional, default: 20, max: 100): The maximum number of results to return.
    -   Returns: A list of found bookmarks or an error message.

### Resources

1.  **`info`** (accessible via URI like `info://hatena-search`)
    -   Description: Provides basic information about this MCP server.
    -   Returns: A text string with the server description.

```
