# Sketch Selection Helper

A plugin for Sketch that helps you copy selection IDs to use with the Sketch Context MCP server.

## How to Use

1. Select one or more layers in your Sketch document
2. Run the plugin from the Plugins menu or use the shortcut `Ctrl+Shift+I`
3. The IDs of the selected layers will be copied to your clipboard
4. Use these IDs with the Sketch Context MCP server to reference specific elements

## Integration with Sketch Context MCP

This plugin is designed to work with the Sketch Context MCP server, which allows you to:

- Access Sketch designs from Cursor IDE
- Reference specific components and layers by ID
- Enable AI-powered design-to-code workflows

To use the Sketch Context MCP server:

1. Install the server: `npm install -g sketch-context-mcp`
2. Run it with your Sketch file: `sketch-context-mcp --local-file=/path/to/your/file.sketch`
3. Connect Cursor to the MCP server at `http://localhost:3333`
4. Use the IDs copied by this plugin to reference specific elements

## Troubleshooting

If the plugin doesn't work:

- Make sure you have selected at least one layer
- Check the Sketch console for any error messages (Window → Developer → Console)
- Restart Sketch and try again

## About

This plugin is part of the Sketch Context MCP project, which aims to integrate Sketch designs with AI-powered coding tools like Cursor IDE. 