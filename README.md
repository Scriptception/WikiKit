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

````
```infobox
caption: Optional caption
exclude: tags,aliases
strip_title: true
```
````

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


## 🔧 Default Parameters and Their Behavior
|Parameter|Type|Default Value|Behavior|
|---------|----|-------------|--------|
|caption|string|empty|Optional text shown below the image.|
|title|string|Note title|Custom title override shown at the top of the infobox.|
|exclude|string|tags,aliases|Comma-separated list of frontmatter keys to skip from the detail table.|
|strip_title|string|true|If true, removes everything before - in the title display.|
|image|string|Derived from note name|Optional base filename to search for image (excluding file extension).|
|hidetable|string|false|If true, suppresses the frontmatter detail table entirely.|

## 🧠 Additional Notes
exclude is case-insensitive and merged with a default exclusion list:
["tags", "aliases", "file", "position", "created", "updated", "source"].

Image search:

If image is not provided, the plugin searches for an image using the note’s name.

Searches within the attachmentFolderPath set in Obsidian settings.

Extensions checked in order: .png, .jpg, .jpeg, .webp, .gif.

strip_title:

When true (default), note titles like Category - Title will be shortened to just Title.

Set strip_title: false to retain the full note name as title.

Fallbacks:

If no title is provided, it will use frontmatter title, or the note's filename.

If no image is found, the image block is omitted.


