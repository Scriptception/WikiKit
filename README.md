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
* **Supports multiple area tags** - displays separate tables for each area tag found on the page (except for the 'Create Links from Tag Table' command, which only uses the first area tag)
* **Respects tag order** - tables appear in the same order as tags in frontmatter
* Groups entries by `level2`, then `level3` (optional)
* **Formats tag names** - replaces underscores with spaces and capitalizes all words (e.g., `video_games` → `Video Games`)
* **Alphabetical sorting** - categories and subcategories are sorted alphabetically for consistent display
* Titles, types, and subtypes are capitalized
* Titles are stripped like infoboxes (default)

### Tag Table Parameters

| Key         | Description                                    |
| ----------- | ---------------------------------------------- |
| `level1`    | Top-level tag (e.g. `Entity`)                  |
| `level2`    | Middle group tag (e.g. `Type`)                 |
| `level3`    | Subgroup tag (e.g. `SubType`)                  |
| `first_only`| If `true`, shows only the first area table     |

> **💡 Note**: By default, all area tables are displayed. Use `first_only: true` to show only the first area table.

> **📝 Sorting**: Categories and subcategories are sorted alphabetically. "Uncategorized" categories and empty subcategories appear first in their respective lists.

> **🎯 Pro Tip**: Use underscores as invisible sorting prefixes to control order! Since underscores are replaced with spaces during display, you can name tags like `___Collection`, `__Topic`, `_Molecule` to force them to appear in that order while displaying as "Collection", "Topic", "Molecule".

> **🔄 Workflow Tip**: Pair with [Tag Wrangler](https://github.com/pjeby/tag-wrangler) for seamless tag structure evolution! Mass rename tags across your vault and watch your tag tables automatically reflect the new organization. Perfect for refining your taxonomy as your knowledge base grows.

---

## 🗺️ Vault Map

Get a high-level overview of your entire vault's content structure. Perfect for home pages and navigation hubs.

Add this code block to any note:

````markdown
```vaultmap
show_metadata: true
sort_by: created
group_by: area
compact_view: false
```
````

### Vault Map Features

* **Scans your entire vault** for Collections (`zettel/collection`) and Topics (`zettel/topic`)
* **Groups by Areas** using your `area/` tags
* **Two view modes**: Detailed tables or compact overview
* **Interactive links** for quick navigation
* **Metadata display**: creation dates, status, and content counts
* **Responsive design** for desktop and mobile
* **NEW: Free-text search** in detailed view to instantly filter Collections and Topics by name or area

### Using the Vault Map Search

In the **detailed view** (the default, when `compact_view: false`):
- A search box appears above the tables.
- **Type any text** to instantly filter both Collections and Topics tables.
- The filter matches your text in either the **Name** or **Area** columns (case-insensitive, partial match).
- **Delete your text** to show all results again.

This makes it easy to quickly find any collection or topic, even in large vaults.

### Vault Map Parameters

| Key                 | Description                                    |
| ------------------- | ---------------------------------------------- |
| `show_metadata`     | Display created date, status, and counts (default: `true`) |
| `sort_by`           | Sort order: `created`, `modified`, `name`, `status` (default: `created`) |
| `group_by`          | Grouping: `area`, `status`, `none` (default: `area`) |
| `compact_view`      | Use compact overview instead of detailed tables (default: `false`) |
| `collection_tag`    | Override collection tag (default: from settings) |
| `topic_tag`         | Override topic tag (default: from settings) |
| `track_tags`        | Override trackable tags (default: from settings) |
| `shorten_tracked_tag_names` | Show only the last part of each tracked tag as the column name (default: from settings) |
| `status_enabled`    | Enable/disable status tracking (default: from settings) |
| `status_property`   | Override status property (default: from settings) |
| `max_collection_rows` | Maximum collection rows before table becomes scrollable (default: from settings) |
| `max_topic_rows`    | Maximum topic rows before table becomes scrollable (default: from settings) |

### View Modes

#### Detailed View (Default)
- **Collections table**: Name, Area, Items count, Created date, Status
- **Topics table**: Name, Area, [Trackable Tags], Created date, Status
- **Search box**: Instantly filter both tables by name or area
- **Summary statistics**: Total pages, collections, topics, and tag counts
- **Scrollable tables**: Large tables become scrollable with sticky headers

#### Compact View
- **Area-based overview** with inline links
- **Quick stats** for your vault

### Sidebar & Navigation
- Access the Vault Map via the **map icon** in the ribbon or the command palette
- Sidebar view provides real-time updates and navigation

> **Tip:** Use the Vault Map on your home page or dashboard note for instant vault overview and navigation!

### Vault Map Sidebar

Access a dedicated sidebar view via:
* **Ribbon icon** (map icon)
* **Command palette**: "WikiKit: Show Vault Map Sidebar"

The sidebar provides:
* **Real-time updates** as you navigate between files
* **Search functionality** (coming soon)
* **Quick navigation** to any collection or topic
* **Recent activity** tracking

> **💡 Pro Tip**: Use the Vault Map on your home page or dashboard note for instant vault overview and navigation!

> **🎯 Perfect for**: Home pages, dashboards, navigation hubs, and getting a quick sense of your vault's content structure.

#### Home Page Dashboard
Perfect for your vault's home page or dashboard:

````markdown
# 🏠 My Knowledge Vault

Welcome to my digital garden! Here's what I'm working on:

## 📊 Vault Overview
```vaultmap
compact_view: true
sort_by: modified
group_by: area
```

## 🎯 Quick Navigation
- [[Collections]] - Browse all my collections
- [[Topics]] - Explore topics I'm researching
- [[Recent]] - Recently updated content
````

This creates a beautiful, interactive dashboard that gives you instant insight into your vault's structure and content.

#### Custom Tag Configuration
For users with different naming conventions:

````markdown
```vaultmap
collection_tag: project/collection
topic_tag: research/topic
track_tags: priority,type,source
status_enabled: true
status_property: priority
```
````

#### Zettelkasten with Molecules and Atoms
For advanced Zettelkasten workflows:

````markdown
```vaultmap
collection_tag: zettel/collection
topic_tag: zettel/topic
track_tags: zettel/molecule,zettel/atom,zettel/source
status_enabled: true
status_property: status
```
````

This would show columns for Molecules, Atoms, and Sources in the topics table, perfect for tracking different types of knowledge components.

#### Scrollable Tables Configuration
Control table size and scrolling behavior:

````markdown
```vaultmap
max_collection_rows: 5
max_topic_rows: 8
show_metadata: true
sort_by: name
```
````

This creates compact tables that show only 5 collections and 8 topics before becoming scrollable, perfect for dashboards with limited space.

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
* **Table Spacing**: Spacing between multiple area tables (default: `2rem`)

### Vault Map Settings

* **Collection Tag**: Tag used to identify collection pages (default: `zettel/collection`)
* **Topic Tag**: Tag used to identify topic pages (default: `zettel/topic`)
* **Track Tags**: Comma-separated list of tag prefixes to count in topics table (default: `status,context,lens`)
* **Shorten Tracked Tag Names**: If enabled, only the last part of each tracked tag (e.g. "Atom" from "zettel/atom") will be shown as the column name in the topics table (default: `true`)
* **Enable Status Tracking**: Show status column in vault map tables (default: `true`)
* **Status Property**: Tag prefix to use for status (default: `status`)
* **Show Metadata**: Display created date, status, and counts in vault map tables (default: `true`)
* **Default Sort Order**: How to sort collections and topics (default: `created`)
* **Default Grouping**: How to group content (default: `area`)
* **Default Compact View**: Use compact overview instead of detailed tables (default: `false`)
* **Max Collection Rows**: Maximum number of collection rows to display before making the table scrollable (default: `10`)
* **Max Topic Rows**: Maximum number of topic rows to display before making the table scrollable (default: `15`)

> **💡 Scrollable Tables**: When tables exceed the configured row limits, they become scrollable with a sticky header. A "+ X more" indicator shows how many additional items are available. This keeps your vault map compact while still providing access to all content.

These settings apply globally unless overridden in individual infobox, tagtable, or vaultmap blocks.

> **💡 Note**: Settings changes require refreshing the page view to take effect. Simply switch to another note and back.

---

## 📋 Sidebar Views

The plugin includes two sidebar views:

### Tag Table Sidebar
* Shows related pages for the currently active note
* Updates automatically when switching between files
* Uses your configured tag level settings
* Accessible via ribbon icon or command palette

### Vault Map Sidebar
* Shows overview of all Collections and Topics in your vault
* Groups content by Areas using your existing tag structure
* Provides quick navigation to any collection or topic
* Updates in real-time as you navigate

### Accessing the Sidebars

* Click the **table icon** in the ribbon for Tag Table
* Click the **map icon** in the ribbon for Vault Map
* Use commands: **"WikiKit: Show Tag Table Sidebar"** or **"WikiKit: Show Vault Map Sidebar"**
* Automatically appears on the right side

---

## ⚙️ Commands

Use via command palette:

* **WikiKit: Insert Infobox** - Adds infobox template
* **WikiKit: Insert Tag Table** - Adds tagtable template
* **WikiKit: Insert Vault Map** - Adds vaultmap template
* **WikiKit: Show Tag Table Sidebar** - Opens tag table sidebar view
* **WikiKit: Show Vault Map Sidebar** - Opens vault map sidebar view
* **WikiKit: Create Links from Tag Table** - Generates hard-coded links at cursor position for navigation or graph view

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

### Multiple Area Tags Example
````markdown
---
title: Project Alpha
tags: [area/project, area/research, category/software, subcategory/web]
---

```tagtable
level1: area
level2: category
level3: subcategory
```
````
This will display two separate tables: one for "Project" and one for "Research", each showing related pages grouped by category and subcategory.

### Show Only First Area Table
````markdown
```tagtable
level1: area
level2: category
level3: subcategory
first_only: true
```
````
This will display only the first area table, even if the note has multiple area tags.

### Tag Formatting Example
````markdown
---
title: Gaming Collection
tags: [area/video_games, category/action_games, subcategory/first_person_shooters]
---

```tagtable
level1: area
level2: category
level3: subcategory
```
````
This will display:
- Area: "Video Games" (from `video_games`)
- Category: "Action Games" (from `action_games`) 
- Subcategory: "First Person Shooters" (from `first_person_shooters`)

### Sidebar Integration
1. Open any note with tags like `entity/character`
2. Click the ribbon table icon
3. See all related pages grouped by type/subtype

### Create Links from Tag Table Command
1. Open any note with area tags
2. Use command: **"WikiKit: Create Links from Tag Table"**
3. Hard-coded links are inserted at the cursor position, perfect for navigation sections or for Obsidian's graph view

### Vault Map Examples

#### Basic Vault Map
````markdown
```vaultmap
show_metadata: true
sort_by: created
group_by: area
compact_view: false
```
````

#### Compact Overview
````markdown
```vaultmap
compact_view: true
show_metadata: false
```
````

#### Sorted by Name
````markdown
```vaultmap
sort_by: name
group_by: area
show_metadata: true
```
````

#### Home Page Dashboard
Perfect for your vault's home page or dashboard:

````markdown
# 🏠 My Knowledge Vault

Welcome to my digital garden! Here's what I'm working on:

## 📊 Vault Overview
```vaultmap
compact_view: true
sort_by: modified
group_by: area
```

## 🎯 Quick Navigation
- [[Collections]] - Browse all my collections
- [[Topics]] - Explore topics I'm researching
- [[Recent]] - Recently updated content
````

This creates a beautiful, interactive dashboard that gives you instant insight into your vault's structure and content.

## TODO

- Seems to break if empty (malformed) tage in frontmatter (i.e. empty tag: ` - `)