#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const dotenv = require('dotenv');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const readline = require('readline');
const tmp = require('tmp');
const { createServer } = require('http');

// Load environment variables from .env file
dotenv.config();

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('sketch-api-key', {
    description: 'Your Sketch API access token',
    type: 'string',
  })
  .option('port', {
    description: 'The port to run the server on',
    type: 'number',
    default: 3333,
  })
  .option('stdio', {
    description: 'Run the server in command mode, instead of default HTTP/SSE',
    type: 'boolean',
    default: false,
  })
  .option('local-file', {
    description: 'Path to a local Sketch file to serve',
    type: 'string',
  })
  .help()
  .version()
  .alias('help', 'h')
  .argv;

// Configuration variables
const config = {
  sketchApiKey: argv['sketch-api-key'] || process.env.SKETCH_API_KEY,
  port: argv.port || process.env.PORT || 3333,
  isStdioMode: argv.stdio || false,
  localFilePath: argv['local-file'] || process.env.LOCAL_SKETCH_PATH,
};

// Initialize Express app
const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(bodyParser.json());

// Store connected clients for SSE
const clients = new Set();

// SSE endpoint for Cursor to connect to
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Add this client to our connected clients
  clients.add(res);
  
  // Remove client when they disconnect
  req.on('close', () => {
    clients.delete(res);
  });
  
  // Send initial connection successful message
  res.write(`data: ${JSON.stringify({ type: 'connection_success' })}\n\n`);
});

// MCP Tools registration
const TOOLS = [
  {
    name: 'get_file',
    description: 'Get the contents of a Sketch file',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to a Sketch file or Sketch Cloud document',
        },
        nodeId: {
          type: 'string',
          description: 'Optional. ID of a specific node within the document to retrieve',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'list_components',
    description: 'List all components in a Sketch file',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to a Sketch file or Sketch Cloud document',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_selection',
    description: 'Get information about selected elements in a Sketch document',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to the Sketch document',
        },
        selectionIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of selected element IDs',
        }
      },
      required: ['url', 'selectionIds'],
    },
  }
];

// Handler for messages endpoint
app.post('/messages', async (req, res) => {
  try {
    const message = req.body;
    
    if (message.type === 'ping') {
      return res.json({ type: 'pong' });
    }
    
    if (message.type === 'get_tools') {
      return res.json({
        type: 'tools',
        tools: TOOLS,
      });
    }
    
    if (message.type === 'execute_tool') {
      const { tool, params } = message;
      let result;
      
      if (tool === 'get_file') {
        result = await getSketchFile(params.url, params.nodeId);
      } else if (tool === 'list_components') {
        result = await listSketchComponents(params.url);
      } else {
        return res.status(400).json({
          type: 'error',
          error: `Unknown tool: ${tool}`,
        });
      }
      
      return res.json({
        type: 'tool_result',
        id: message.id,
        result,
      });
    }
    
    return res.status(400).json({
      type: 'error',
      error: `Unknown message type: ${message.type}`,
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return res.status(500).json({
      type: 'error',
      error: error.message,
    });
  }
});

// Main endpoint for basic info
app.get('/', (req, res) => {
  res.send(`
    <h1>Sketch MCP Server</h1>
    <p>Server is running!</p>
    <p>SSE endpoint available at <a href="/sse">http://localhost:${config.port}/sse</a></p>
    <p>Message endpoint available at http://localhost:${config.port}/messages</p>
  `);
});

// Function to get Sketch file contents
async function getSketchFile(url, nodeId) {
  // Add support for both local and cloud files
  const isCloudUrl = url.includes('sketch.cloud');
  let documentData;
  
  if (isCloudUrl) {
    const documentId = extractDocumentIdFromUrl(url);
    if (!config.sketchApiKey) {
      throw new Error('Sketch API key is required for cloud files');
    }
    documentData = await fetchCloudDocument(documentId);
  } else {
    documentData = await parseLocalSketchFile(url);
  }

  // Add better node traversal and selection support
  if (nodeId) {
    const node = findNodeWithMetadata(documentData, nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    // Include parent context and styling information
    return enrichNodeData(node);
  }

  return documentData;
}

// Function to fetch document from Sketch Cloud
async function fetchCloudDocument(documentId) {
  if (!config.sketchApiKey) {
    throw new Error('Sketch API key is required for cloud files');
  }
  
  // Call Sketch Cloud API to get document details
  const apiUrl = `https://api.sketch.cloud/v1/documents/${documentId}`;
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${config.sketchApiKey}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch document from Sketch Cloud: ${response.statusText}`);
  }
  
  const documentData = await response.json();
  
  // Get the download URL for the sketch file
  const downloadUrl = documentData.shortcut.downloadUrl;
  
  // Download the file
  const fileResponse = await fetch(downloadUrl);
  if (!fileResponse.ok) {
    throw new Error(`Failed to download Sketch file: ${fileResponse.statusText}`);
  }
  
  const buffer = await fileResponse.buffer();
  return parseSketchBuffer(buffer);
}

// Function to parse Sketch file buffer
async function parseSketchBuffer(buffer, nodeId = null) {
  // Create a temporary file to store the buffer
  const tmpFile = tmp.fileSync({ postfix: '.sketch' });
  fs.writeFileSync(tmpFile.name, buffer);
  
  try {
    // Extract the sketch file (it's a zip)
    const zip = new AdmZip(tmpFile.name);
    const entries = zip.getEntries();
    
    // Parse the document.json file
    const documentEntry = entries.find(entry => entry.entryName === 'document.json');
    if (!documentEntry) {
      throw new Error('Invalid Sketch file: document.json not found');
    }
    
    const documentJson = JSON.parse(zip.readAsText(documentEntry));
    
    // Get meta.json for additional info
    const metaEntry = entries.find(entry => entry.entryName === 'meta.json');
    const metaJson = metaEntry ? JSON.parse(zip.readAsText(metaEntry)) : {};
    
    // Parse pages
    const pages = [];
    const pagesEntries = entries.filter(entry => entry.entryName.startsWith('pages/'));
    
    for (const pageEntry of pagesEntries) {
      const pageJson = JSON.parse(zip.readAsText(pageEntry));
      pages.push(pageJson);
    }
    
    // Construct the result
    const result = {
      document: documentJson,
      meta: metaJson,
      pages: pages,
    };
    
    // If nodeId is specified, find the specific node
    if (nodeId) {
      // First check in the document
      let node = findNodeById(documentJson, nodeId);
      
      // If not found, check in pages
      if (!node) {
        for (const page of pages) {
          node = findNodeById(page, nodeId);
          if (node) break;
        }
      }
      
      if (!node) {
        throw new Error(`Node with ID ${nodeId} not found in the document`);
      }
      
      return node;
    }
    
    return result;
  } finally {
    // Clean up
    tmpFile.removeCallback();
  }
}

// Function to list components in a Sketch file
async function listSketchComponents(url) {
  try {
    const sketchData = await getSketchFile(url);
    const components = [];
    
    // Search for components in document
    findComponents(sketchData.document, components);
    
    // Search for components in pages
    for (const page of sketchData.pages) {
      findComponents(page, components);
    }
    
    return components;
  } catch (error) {
    console.error('Error listing components:', error);
    throw error;
  }
}

// Helper function to find components in a Sketch object
function findComponents(obj, components) {
  if (!obj) return;
  
  // Check if the object is a component (Symbol master in Sketch)
  if (obj._class === 'symbolMaster') {
    components.push({
      id: obj.do_objectID,
      name: obj.name,
      type: 'component',
      frame: obj.frame,
    });
  }
  
  // Recursively search for components in layers and other objects
  if (obj.layers && Array.isArray(obj.layers)) {
    for (const layer of obj.layers) {
      findComponents(layer, components);
    }
  }
  
  // Check for artboards, which can contain components
  if (obj.artboards && obj.artboards.objects) {
    for (const artboard of obj.artboards.objects) {
      findComponents(artboard, components);
    }
  }
}

// Helper function to find a node by ID
function findNodeById(obj, id) {
  if (!obj) return null;
  
  // Check if this is the node we're looking for
  if (obj.do_objectID === id) {
    return obj;
  }
  
  // Check in layers
  if (obj.layers && Array.isArray(obj.layers)) {
    for (const layer of obj.layers) {
      const found = findNodeById(layer, id);
      if (found) return found;
    }
  }
  
  // Check in artboards
  if (obj.artboards && obj.artboards.objects) {
    for (const artboard of obj.artboards.objects) {
      const found = findNodeById(artboard, id);
      if (found) return found;
    }
  }
  
  // Check in pages
  if (obj.pages && obj.pages.objects) {
    for (const page of obj.pages.objects) {
      const found = findNodeById(page, id);
      if (found) return found;
    }
  }
  
  return null;
}

// Helper function to extract document ID from Sketch Cloud URL
function extractDocumentIdFromUrl(url) {
  const regex = /sketch\.cloud\/s\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to broadcast messages to all connected SSE clients
function broadcast(message) {
  for (const client of clients) {
    client.write(`data: ${JSON.stringify(message)}\n\n`);
  }
}

// Check if we should run in stdio mode
if (config.isStdioMode) {
  console.log('Initializing Sketch MCP Server in stdio mode...');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  
  rl.on('line', async (line) => {
    try {
      const message = JSON.parse(line);
      let response;
      
      if (message.type === 'ping') {
        response = { type: 'pong' };
      } else if (message.type === 'get_tools') {
        response = {
          type: 'tools',
          tools: TOOLS,
        };
      } else if (message.type === 'execute_tool') {
        const { tool, params } = message;
        let result;
        
        if (tool === 'get_file')
          result = await getSketchFile(params.url, params.nodeId);
        else if (tool === 'list_components')
          result = await listSketchComponents(params.url);
        else
          throw new Error(`Unknown tool: ${tool}`);
        
        response = {
          type: 'tool_result',
          id: message.id,
          result,
        };
      } else {
        throw new Error(`Unknown message type: ${message.type}`);
      }
      
      console.log('Sending response:', response);
      broadcast(response);
    } catch (error) {
      console.error('Error processing message:', error);
      const response = handleError(error);
      console.log('Sending error response:', response);
      broadcast(response);
    }
  });
}

// Add more robust error handling
function handleError(error) {
  return {
    type: 'error',
    error: {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || {},
      suggestion: getSuggestionForError(error)
    }
  };
}

function getSuggestionForError(error) {
  // Implement logic to generate a suggestion based on the error
  return 'Please try again later or contact support for assistance.';
}

// Add implementation for parseLocalSketchFile
async function parseLocalSketchFile(url) {
  // If url is a local file path, use it directly
  // Otherwise, if we have a default local file configured, use that
  const filePath = url.startsWith('/') || url.includes(':\\') 
    ? url 
    : config.localFilePath;
  
  if (!filePath) {
    throw new Error('No local Sketch file specified. Use --local-file parameter or set LOCAL_SKETCH_PATH environment variable.');
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Local Sketch file not found: ${filePath}`);
  }
  
  // Read the file and parse it
  const buffer = fs.readFileSync(filePath);
  return parseSketchBuffer(buffer);
}

// Helper function to find a node with metadata
function findNodeWithMetadata(obj, nodeId) {
  const node = findNodeById(obj, nodeId);
  if (!node) return null;
  return node;
}

// Helper function to enrich node data with context
function enrichNodeData(node) {
  // Add additional context like parent information, styling, etc.
  return {
    node: node,
    type: node._class,
    metadata: {
      id: node.do_objectID,
      name: node.name,
      class: node._class
    }
  };
}

httpServer.listen(config.port, () => {
  console.log(`Sketch MCP Server is running on port ${config.port}`);
});