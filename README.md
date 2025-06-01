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
    Currently, the Consumer Key and Consumer Secret are stored as constants directly in the `src/hatenaAuth.ts` file:
    ```typescript
    // In src/hatenaAuth.ts
    const CONSUMER_KEY = 'CjrFt8E/8G8otw=='; // Replace with your actual Consumer Key
    const CONSUMER_SECRET = 'lhNFFK+sI/nei/yatXMxnObciI8='; // Replace with your actual Consumer Secret
    ```
    Replace the placeholder values with the actual keys you obtained. The current values are the test ones provided.

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
