# 🧠 WikiKit for Obsidian

Obsidian plugin to render structured **infoboxes** and **tag tables** from your note metadata.

---

## ✨ Features

* ✅ Floating infobox from frontmatter
* 🖼️ Auto or custom-linked image support
* 📚 Dynamic tag tables grouped by tags
* 🎨 Easy styling via CSS
* ⚡ One-click command palette templates
* 🔧 **Settings tab** for customizing tag levels
* 📋 **Sidebar view** for real-time tag table display
* 🎯 **Ribbon icon** for quick sidebar access

---

## 📦 Installation

Place files in `.obsidian/plugins/WikiKit/`:

* `main.js`
* `manifest.json`
* `styles.css`

Enable in **Settings → Community Plugins**.

---

## 📄 Infobox

Add this code block in any note:

````markdown
```infobox
caption: Optional caption
exclude: tags,aliases
strip_title: true
image: CustomImage
```
````

### Infobox Parameters

| Key           | Description                            |
| ------------- | -------------------------------------- |
| `caption`     | Text below image                       |
| `title`       | Override display title                 |
| `exclude`     | Comma list of frontmatter keys to hide |
| `image`       | Custom base filename or URL            |
| `strip_title` | Removes prefixes like `Folder - Title` |
| `hidetable`   | If true, hides all frontmatter rows    |
| `width`       | Override default infobox width         |
| `margin_left` | Override default left margin           |
| `margin_bottom` | Override default bottom margin       |

### Image Handling

If `image` is omitted, the plugin:

* Uses note filename as base
* Searches attachments folder for `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`

---

## 📊 Tag Table

Renders grouped links based on note tags. Add this block:

````markdown
```tagtable
level1: Entity
level2: Type
level3: SubType
```
````

### Tag Table Behavior

* Scans all notes that share the same `level1` tag as the current page
* Groups entries by `level2`, then `level3` (optional)
* Titles, types, and subtypes are capitalized
* Titles are stripped like infoboxes (default)

### Tag Table Parameters

| Key      | Description                    |
| -------- | ------------------------------ |
| `level1` | Top-level tag (e.g. `Entity`)  |
| `level2` | Middle group tag (e.g. `Type`) |
| `level3` | Subgroup tag (e.g. `SubType`)  |

---

## 🔧 Settings

Access via **Settings → Community Plugins → WikiKit**:

### Infobox Settings

* **Infobox Width**: Default width for infoboxes (default: `320px`)
* **Infobox Margin Left**: Left margin for infoboxes (default: `2rem`)
* **Infobox Margin Bottom**: Bottom margin for infoboxes (default: `1.5rem`)
* **Strip Title Prefix**: Automatically remove prefixes like "Folder - " from titles (default: `true`)
* **Default Exclude Keys**: Comma-separated list of frontmatter keys to hide by default (default: `tags,aliases,file,position,created,updated,Source`)

### Tag Table Settings

* **Level 1 Tag**: Top-level tag (default: `entity`)
* **Level 2 Tag**: Middle group tag (default: `type`) 
* **Level 3 Tag**: Subgroup tag (default: `subtype`)

These settings apply globally unless overridden in individual infobox or tagtable blocks.

> **💡 Note**: Infobox settings changes require refreshing the page view to take effect. Simply switch to another note and back.

---

## 📋 Sidebar View

The plugin includes a **Tag Table Sidebar** that:

* Shows related pages for the currently active note
* Updates automatically when switching between files
* Uses your configured tag level settings
* Accessible via ribbon icon or command palette

### Accessing the Sidebar

* Click the **table icon** in the ribbon
* Use command: **"Show Tag Table Sidebar"**
* Automatically appears on the right side

---

## ⚙️ Commands

Use via command palette:

* **Insert Infobox** - Adds infobox template
* **Insert Tag Table** - Adds tagtable template  
* **Show Tag Table Sidebar** - Opens sidebar view

---

## 🎨 Styling

Edit `styles.css` to customize:

* Colors
* Spacing
* Table formatting
* Infobox shadows, fonts
* Sidebar appearance

---

## 📝 Usage Examples

### Basic Infobox
````markdown
---
title: John Doe
age: 30
occupation: Developer
tags: [person/character]
---

```infobox
caption: Main character
exclude: tags,aliases
```
````

### Infobox with Custom Styling
````markdown
```infobox
caption: Character profile
width: 280px
margin_left: 1.5rem
margin_bottom: 2rem
exclude: tags,aliases,created
```
````

### Tag Table with Custom Levels
````markdown
```tagtable
level1: person
level2: role
level3: department
```
````

### Sidebar Integration
1. Open any note with tags like `entity/character`
2. Click the ribbon table icon
3. See all related pages grouped by type/subtype

