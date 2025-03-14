# Sketch Cursor MCP

A Machine Context Protocol (MCP) server for integrating Sketch designs with IDEs such as Cursor, Cline, or Windsurf.

## Overview

This tool allows Cursor IDE to access and interpret Sketch design files, enabling AI-powered design-to-code workflows. It works by:

1. Providing a server that parses Sketch files (.sketch)
2. Implementing the MCP protocol that Cursor IDE uses for context
3. Allowing you to reference specific components and layers from your Sketch files

## Supported Features

- Local and Cloud Sketch file parsing
- Component/Symbol extraction
- Asset management and automatic downloads
- Selection links support
- Real-time updates via SSE
- Parsing both local and Sketch Cloud-hosted files
- Extracting document structure and component information
- Accessing specific nodes by ID
- Listing all components in a Sketch file

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- A Sketch account with API access

### Installation

```bash
npm install -g sketch-cursor-mcp
```

Or run directly with npx:

```bash
npx sketch-cursor-mcp --sketch-api-key=<your-sketch-api-key>
```

### Getting Your Sketch API Key

To use this tool with Sketch Cloud files, you'll need a Sketch API key:

1. Log in to your Sketch account at [sketch.com](https://www.sketch.com/)
2. Navigate to your account settings
3. Go to the "API Keys" or "Integrations" section
4. Create a new API key with appropriate permissions
5. Copy the generated API key

Note: For local Sketch files, an API key is not required.

## Configuration

The server can be configured using either environment variables (via `.env` file) or command-line arguments. Command-line arguments take precedence over environment variables.

### Environment Variables

* `SKETCH_API_KEY`: Your Sketch API access token (required for Sketch Cloud files)
* `PORT`: The port to run the server on (default: 3333)

### Command-line Arguments

* `--version`: Show version number
* `--sketch-api-key`: Your Sketch API access token
* `--port`: The port to run the server on
* `--stdio`: Run the server in command mode, instead of default HTTP/SSE
* `--help`: Show help menu

## Connecting to Cursor

### Start the Server

```bash
npx sketch-cursor-mcp --sketch-api-key=<your-sketch-api-key>
```

You should see output similar to:
```
Initializing Sketch MCP Server in HTTP mode on port 3333...
HTTP server listening on port 3333
SSE endpoint available at http://localhost:3333/sse
Message endpoint available at http://localhost:3333/messages
```

### Connect Cursor to the MCP Server

1. Open Cursor IDE
2. Go to Settings (⚙️)
3. Navigate to the Features tab
4. Find the "Context" section
5. Enter the URL for your MCP server: `http://localhost:3333`
6. Click "Connect"

After the server has been connected, you should see a green status indicator in Cursor's settings.

## Using with Cursor

Once the MCP server is connected, you can start using it with Cursor:

1. Make sure you're using Cursor in agent mode
2. Drop a link to a Sketch file in the Cursor composer
3. Ask Cursor to analyze or work with the design

For example, you could say: "Analyze this Sketch design and create a React component that matches the layout"

### Working with Selection Links

To reference specific elements in your Sketch file:

1. Select elements in Sketch
2. Use File > Copy Link to Selection (or the keyboard shortcut)
3. Paste the link in Cursor's composer
4. Ask Cursor to work with the selected elements

### Working with Components

To reference specific components in your Sketch file:

1. Open your Sketch file
2. Select the component you want to reference
3. Copy its ID or create a link to it
4. Use this ID/link when talking to Cursor

### Asset Management

Assets are automatically handled when:
- Accessing components with images
- Working with symbols
- Handling exported assets

The server will automatically:
- Download required assets
- Manage asset versions
- Handle asset references in components

## Troubleshooting

### Common Issues

- **Connection Errors**: Make sure your server is running and the port is accessible
- **Authentication Failures**: Verify your Sketch API key is correct
- **File Parsing Issues**: Ensure your Sketch file is valid and not corrupted

### Logs

To enable detailed logging, set the DEBUG environment variable:

```bash
DEBUG=sketch-mcp:* npx sketch-cursor-mcp
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.