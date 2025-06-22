# 🧠 Infobox Plugin for Obsidian

This Obsidian plugin adds a floating infobox-style callout to your notes, automatically pulling metadata from frontmatter and optionally displaying a linked image.

## ✨ Features

 - 📄 Automatically renders an infobox from frontmatter fields.
 - 🖼️ Embeds an image if one exists with the same name as the note.
 - 🎯 Floats to the right of your content with responsive behavior.
 - 🔧 Allows easy overrides via code block parameters.
 - 🎨 Customizable via styles.css.
 - ⚡ Command palette shortcut to insert infobox template.

## 🛠️ Usage

Add the following code block to any note:

```infobox
caption: Optional caption
exclude: tags,aliases
strip_title: true
```

## 📌 Supported Parameters

|Key|Description|
|---|-----------|
|caption|Caption text displayed under the image (optional).|
|title|Override the title shown at the top of the infobox.|
|exclude|Comma-separated list of frontmatter keys to hide.|
|image|Specify an image filename (without extension) if different from note name.|
|strip_title|If true (default), removes prefixes like Folder - Title.|
|hidetable|If true, hides the frontmatter detail table completely.|

## 📂 Image Handling

The plugin auto-detects images using these rules:
 - Matches the current note name with supported extensions (.png, .jpg, .jpeg, .webp, .gif)
 - Looks in your Obsidian attachments folder as defined in Settings > Files & Links > Attachment folder path
 - Use `image: CustomName` to specify a different image name (no extension)

## 💬 Command Palette

Use the command: `Insert Infobox` to insert a boilerplate template for the infobox block.

## 🎨 Styling
Customize the appearance via the bundled styles.css file. The plugin automatically injects it on load. Update this file for:
 - Font sizes
 - Table layout
 - Box shadow
 - Colors and spacing

## 📦 Installation
Place the plugin folder inside .obsidian/plugins/infobox-plugin.

Make sure it contains:
 - main.js
 - manifest.json
 - styles.css

Enable the plugin from Obsidian Settings → Community Plugins.

## 🧹 Unloading
The plugin cleanly removes styles on unload and leaves your notes untouched.
