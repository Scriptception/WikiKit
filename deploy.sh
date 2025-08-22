#!/bin/bash

# WikiKit Plugin Deploy Script
# Usage: ./deploy.sh /path/to/your/vault

# Check if vault path argument is provided
if [ $# -eq 0 ]; then
    echo "Error: Please provide the path to your Obsidian vault"
    echo "Usage: ./deploy.sh /path/to/your/vault"
    echo ""
    echo "Example: ./deploy.sh ~/Documents/ObsidianVault"
    exit 1
fi

VAULT_PATH="$1"
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/WikiKit"

# Check if vault path exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "Error: Vault path '$VAULT_PATH' does not exist"
    exit 1
fi

# Check if .obsidian directory exists, create if it doesn't
if [ ! -d "$VAULT_PATH/.obsidian" ]; then
    echo "Creating .obsidian directory..."
    mkdir -p "$VAULT_PATH/.obsidian"
fi

# Check if plugins directory exists, create if it doesn't
if [ ! -d "$VAULT_PATH/.obsidian/plugins" ]; then
    echo "Creating plugins directory..."
    mkdir -p "$VAULT_PATH/.obsidian/plugins"
fi

# Create WikiKit plugin directory
echo "Creating WikiKit plugin directory..."
mkdir -p "$PLUGIN_DIR"

# Copy plugin files
echo "Copying plugin files..."
cp main.js "$PLUGIN_DIR/"
cp manifest.json "$PLUGIN_DIR/"
cp styles.css "$PLUGIN_DIR/"

# Check if files were copied successfully
if [ $? -eq 0 ]; then
    echo "✅ WikiKit plugin deployed successfully to: $PLUGIN_DIR"
    echo ""
    echo "Files installed:"
    echo "  - main.js"
    echo "  - manifest.json"
    echo "  - styles.css"
    echo ""
    echo "Please restart Obsidian or reload the plugin to activate WikiKit."
else
    echo "❌ Error: Failed to copy plugin files"
    exit 1
fi
