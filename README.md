# 🧠 WikiKit for Obsidian

Obsidian plugin to render structured **infoboxes** and **tag tables** from your note metadata.

---

## ✨ Features

* ✅ Floating infobox from frontmatter
* 🖼️ Auto or custom-linked image support
* 📚 Dynamic tag tables grouped by tags
* 🎨 Easy styling via CSS
* ⚡ One-click command palette templates

---

## 📦 Installation

Place files in `.obsidian/plugins/wikikit-plugin/`:

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

### Image Handling

If `image` is omitted, the plugin:

* Uses note filename as base
* Searches attachments folder for `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`

---

## 📊 Entity Table

Renders grouped links based on note tags. Add this block:

````markdown
```tagtable
level1: Entity
level2: Type
level3: SubType
```
````

### Entity Table Behavior

* Scans all notes that share the same `level1` tag as the current page
* Groups entries by `level2`, then `level3` (optional)
* Titles, types, and subtypes are capitalized
* Titles are stripped like infoboxes (default)

### Entity Table Parameters

| Key      | Description                    |
| -------- | ------------------------------ |
| `level1` | Top-level tag (e.g. `Entity`)  |
| `level2` | Middle group tag (e.g. `Type`) |
| `level3` | Subgroup tag (e.g. `SubType`)  |

---

## ⚙️ Commands

Use via command palette:

* `Insert Infobox`
* `Insert Entity Table`

---

## 🎨 Styling

Edit `styles.css` to customize:

* Colors
* Spacing
* Table formatting
* Infobox shadows, fonts

