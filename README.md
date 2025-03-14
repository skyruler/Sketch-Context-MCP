> **Note:** This project is currently in testing phase and may not be fully stable.

# Sketch Context MCP

A Model Context Protocol (MCP) server for integrating Sketch designs with IDEs such as Cursor, Cline, or Windsurf.

## Overview

This tool allows Cursor IDE to access and interpret Sketch design files, enabling AI-powered design-to-code workflows. It works by:

1. Providing a server that parses Sketch files (.sketch)
2. Implementing the MCP protocol that Cursor or other IDEs use for context
3. Allowing you to reference specific components and layers from your Sketch files

## Components

This project consists of two main components:

1. **MCP Server**: A Node.js server that implements the Model Context Protocol to provide Sketch file data to Cursor IDE
2. **Sketch Selection Helper Plugin**: A Sketch plugin that helps you copy selection IDs to use with the MCP server

## Supported Features

- Local and Cloud Sketch file parsing
- Component/Symbol extraction
- Asset management and automatic downloads
- Selection links support via the Sketch Selection Helper plugin
- Real-time updates via SSE
- Parsing both local and Sketch Cloud-hosted files
- Extracting document structure and component information
- Accessing specific nodes by ID
- Listing all components in a Sketch file

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- A Sketch account with API access (only needed for Sketch Cloud files)

### Installation

```bash
# Install globally
npm install -g sketch-context-mcp

# Run with a local Sketch file
sketch-context-mcp --local-file=/path/to/your/file.sketch

# Run with Sketch Cloud access
sketch-context-mcp --sketch-api-key=<your-sketch-api-key>
```

Or run directly with npx:

```bash
npx sketch-context-mcp --local-file=/path/to/your/file.sketch
```

### Integration with Cursor

To use this with Cursor:

1. Start the MCP server with your Sketch file:
   ```bash
   sketch-context-mcp --local-file=/path/to/your/file.sketch
   ```

2. In Cursor, connect to the MCP server:
   - Go to Settings > Features > Context
   - Enter the URL: `http://localhost:3333`
   - Click "Connect"

3. In the Cursor composer, you can now:
   - Reference components by ID: "Show me the component with ID 12345"
   - List all components: "List all components in the design"
   - Get details about specific elements: "Describe the button in the header"

### Working with Sketch Files

Since Sketch doesn't have a built-in "Copy Link to Selection" feature like Figma, you can:

1. Use the `list_components` tool to see all available components
2. Reference specific components by their ID
3. Use the Sketch plugin API to export selection IDs (see the Sketch Plugin section below)

## Configuration

The server can be configured using either environment variables (via `.env` file) or command-line arguments. Command-line arguments take precedence over environment variables.

### Environment Variables

* `SKETCH_API_KEY`: Your Sketch API access token (required for Sketch Cloud files)
* `PORT`: The port to run the server on (default: 3333)
* `LOCAL_SKETCH_PATH`: Path to local Sketch file (alternative to --local-file argument)
* `DEBUG_LEVEL`: Set logging verbosity (default: 'info')

### Command-line Arguments

* `--version`: Show version number
* `--sketch-api-key`: Your Sketch API access token
* `--port`: The port to run the server on
* `--stdio`: Run the server in command mode, instead of default HTTP/SSE
* `--help`: Show help menu

## Connecting to Cursor

### Start the Server

```bash
npx sketch-context-mcp --sketch-api-key=<your-sketch-api-key>
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

## Working with Selection Links

To reference specific elements in your Sketch file:

1. Install the Sketch Selection Helper plugin (see below)
2. Select elements in Sketch
3. Run the plugin from the Plugins menu (or use the keyboard shortcut)
4. The IDs will be copied to your clipboard
5. Use these IDs when talking to Cursor about specific elements

### Installing the Sketch Selection Helper Plugin

The plugin helps you get the IDs of selected elements in Sketch to use with the MCP server.

#### Automatic Installation

Run the installation script:

```bash
./install-plugin.sh
```

#### Manual Installation

1. Copy the `sketch-selection-helper.sketchplugin` folder to your Sketch plugins directory:
   ```
   ~/Library/Application Support/com.bohemiancoding.sketch3/Plugins/
   ```
2. Restart Sketch if it's already running

#### Using the Plugin

1. Open a Sketch document
2. Select one or more layers
3. Go to Plugins > Sketch Selection Helper > Copy Selection IDs
4. The IDs will be copied to your clipboard
5. Use these IDs with the MCP server to reference specific elements

For example, after copying the IDs, you might ask Cursor:
"Analyze the button with ID 12345 from the Sketch design"

## Working with Components

To reference specific components in your Sketch file:

1. Open your Sketch file
2. Select the component you want to reference
3. Copy its ID or create a link to it
4. Use this ID/link when talking to Cursor

## Asset Management

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
DEBUG=sketch-mcp:* npx sketch-context-mcp
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.