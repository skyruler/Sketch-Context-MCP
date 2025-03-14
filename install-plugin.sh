#!/bin/bash

# Sketch Selection Helper Plugin Installer
# This script installs the Sketch Selection Helper plugin to the Sketch plugins directory

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Sketch Selection Helper Plugin Installer${NC}"
echo "This script will install the Sketch Selection Helper plugin."

# Define the plugin directory
PLUGIN_DIR="sketch-selection-helper.sketchplugin"
SKETCH_PLUGINS_DIR="$HOME/Library/Application Support/com.bohemiancoding.sketch3/Plugins"

# Check if the plugin directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
  echo -e "${RED}Error: Plugin directory not found.${NC}"
  echo "Make sure you're running this script from the same directory as the plugin."
  exit 1
fi

# Check if Sketch plugins directory exists
if [ ! -d "$SKETCH_PLUGINS_DIR" ]; then
  echo -e "${RED}Error: Sketch plugins directory not found.${NC}"
  echo "Make sure you have Sketch installed."
  exit 1
fi

# Copy the plugin to the Sketch plugins directory
echo "Installing plugin to Sketch..."
cp -R "$PLUGIN_DIR" "$SKETCH_PLUGINS_DIR"

# Check if the installation was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Plugin installed successfully!${NC}"
  echo "You can now use the plugin in Sketch."
  echo "1. Open Sketch"
  echo "2. Select elements in your document"
  echo "3. Go to Plugins > Sketch Selection Helper > Copy Selection IDs"
  echo "4. The IDs will be copied to your clipboard for use with Sketch Context MCP"
else
  echo -e "${RED}Error: Failed to install plugin.${NC}"
  echo "Please try installing manually by copying the plugin to:"
  echo "$SKETCH_PLUGINS_DIR"
fi 