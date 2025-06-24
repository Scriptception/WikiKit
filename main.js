// wikikit-plugin/main.js
// WikiKit: Professional, clean, and well-documented Obsidian plugin for infoboxes and tag tables

const { Plugin, WorkspaceLeaf, Setting, PluginSettingTab, ItemView } = require("obsidian");

// --- Constants & Defaults ---
const TAGTABLE_ICON_ID = "wikikit-tagtable";
const TAGTABLE_ICON_SVG = `
<svg viewBox="0 0 100 100" width="100" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="20" width="70" height="12" rx="3" fill="currentColor"/>
  <rect x="15" y="44" width="70" height="12" rx="3" fill="currentColor"/>
  <rect x="15" y="68" width="70" height="12" rx="3" fill="currentColor"/>
  <circle cx="30" cy="26" r="4" fill="#FFD600"/>
  <circle cx="30" cy="50" r="4" fill="#FFD600"/>
  <circle cx="30" cy="74" r="4" fill="#FFD600"/>
</svg>
`;
const WIKIKIT_TAGTABLE_VIEW_TYPE = "wikikit-tagtable-sidebar";
const DEFAULT_SETTINGS = {
  // Tag Table Settings
  level1: 'entity',
  level2: 'type',
  level3: 'subtype',
  // Infobox Settings
  infobox_width: '320px',
  infobox_margin_left: '2rem',
  infobox_margin_bottom: '1.5rem',
  infobox_strip_title: true,
  infobox_exclude_keys: 'tags,aliases,file,position,created,updated,Source'
};

// --- Utility: Parse simple key:value block ---
function parseSimpleBlock(source) {
  const config = {};
  source.split("\n").forEach(line => {
    const match = line.match(/^\s*([\w-]+)\s*:\s*(.*)$/);
    if (match) {
      config[match[1].trim().toLowerCase()] = match[2].trim();
    }
  });
  return config;
}

// --- Helper: Render Tag Table (shared by codeblock & sidebar) ---
async function renderTagTable(plugin, filePath, container, overrides = {}) {
  container.innerHTML = "";
  const cache = plugin.app.metadataCache.getCache(filePath);
  const frontmatter = cache?.frontmatter || {};
  const tags = (frontmatter.tags || []).map(t => t.toLowerCase());
  // Use settings or overrides for tag levels
  const level1 = (overrides.level1 || plugin.settings.level1 || 'entity').toLowerCase();
  const level2 = (overrides.level2 || plugin.settings.level2 || 'type').toLowerCase();
  const level3 = (overrides.level3 || plugin.settings.level3 || 'subtype').toLowerCase();
  const targetEntityTag = tags.find(tag => tag.startsWith(`${level1}/`));
  if (!targetEntityTag) {
    const level1Label = (overrides.level1 || plugin.settings.level1 || 'entity').replace(/^\w/, c => c.toUpperCase());
    container.innerHTML = `<p><em>No ${level1Label} tag found on this page.</em></p>`;
    return;
  }
  // Group related pages by type/subtype
  const pages = plugin.app.vault.getMarkdownFiles();
  const groupedData = {};
  for (const page of pages) {
    const cache = plugin.app.metadataCache.getCache(page.path);
    if (!cache || !cache.frontmatter) continue;
    const fm = cache.frontmatter;
    const tags = (fm.tags || []).map(t => t.toLowerCase());
    if (!tags.includes(targetEntityTag)) continue;
    const typeTag = tags.find(tag => tag.startsWith(`${level2}/`));
    if (!typeTag) continue;
    const subTypeTag = tags.find(tag => tag.startsWith(`${level3}/`));
    const type = typeTag;
    const sub = subTypeTag || "—";
    if (!groupedData[type]) groupedData[type] = {};
    if (!groupedData[type][sub]) groupedData[type][sub] = [];
    let title = fm.title || page.basename;
    title = title.replace(/^.* - /, '');
    groupedData[type][sub].push({ name: title, path: page.path });
  }
  // Build table HTML
  const title = targetEntityTag.split("/").slice(-1)[0].replace(/\b\w/g, c => c.toUpperCase());
  const tableWrapper = document.createElement("div");
  tableWrapper.className = "tagtable-wrapper sidebar";
  tableWrapper.innerHTML = `<div class="tagtable-header"><strong>${title} - Related Pages</strong></div>`;
  const table = document.createElement("table");
  table.className = "tagtable";
  for (const [type, subGroups] of Object.entries(groupedData)) {
    const typeRow = document.createElement("tr");
    const typeCell = document.createElement("td");
    typeCell.setAttribute("rowspan", Object.keys(subGroups).length);
    typeCell.textContent = type.split("/").slice(-1)[0].replace(/\b\w/g, c => c.toUpperCase());
    typeCell.className = "tagtable-type";
    typeRow.appendChild(typeCell);
    let first = true;
    for (const [sub, entries] of Object.entries(subGroups)) {
      const row = first ? typeRow : document.createElement("tr");
      first = false;
      const subCell = document.createElement("td");
      subCell.textContent = sub.split("/").slice(-1)[0].replace(/\b\w/g, c => c.toUpperCase());
      subCell.className = "tagtable-subtype";
      const entriesCell = document.createElement("td");
      entriesCell.innerHTML = entries
        .map(e => `<a href=\"#\" data-href=\"${e.path}\">${e.name}</a>`)
        .join(" · ");
      row.appendChild(subCell);
      row.appendChild(entriesCell);
      table.appendChild(row);
    }
  }
  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);
  // Link handling
  tableWrapper.querySelectorAll("a[data-href]").forEach(link => {
    link.addEventListener("click", (evt) => {
      evt.preventDefault();
      const targetPath = link.getAttribute("data-href");
      const targetFile = plugin.app.vault.getAbstractFileByPath(targetPath);
      if (targetFile) {
        plugin.app.workspace.openLinkText(
          plugin.app.metadataCache.fileToLinktext(targetFile, filePath),
          filePath
        );
      }
    });
  });
}

// --- Helper: Render Infobox ---
function renderInfobox(plugin, source, el, ctx) {
  const overrides = parseSimpleBlock(source);
  const file = ctx.sourcePath;
  const cache = plugin.app.metadataCache.getCache(file) || {};
  const frontmatter = cache.frontmatter || {};
  // Exclude keys - use settings or overrides
  const defaultExcludeKeys = (plugin.settings.infobox_exclude_keys || 'tags,aliases,file,position,created,updated,Source').split(/[\,\n]/).map(k => k.trim().toLowerCase());
  const excludeKeys = new Set(
    defaultExcludeKeys
      .concat((overrides.exclude || "").split(/[\,\n]/).map(k => k.trim().toLowerCase()))
  );
  // Title logic
  const originalFileName = file.replace(/^[^/]*[\\/]/, '').replace(/\.md$/, '');
  let displayName = overrides.title || frontmatter.title || originalFileName;
  const shouldStripTitle = overrides.strip_title !== undefined ? overrides.strip_title !== "false" : plugin.settings.infobox_strip_title;
  if (shouldStripTitle) {
    displayName = displayName.replace(/^.* - /, '');
  }
  // Image logic
  let src = null;
  const imageName = overrides.image;
  if (imageName && imageName.startsWith("http")) {
    src = imageName;
  } else {
    const supportedExtensions = ["png", "jpg", "jpeg", "webp", "gif"];
    const baseImageName = imageName || originalFileName;
    const attachmentFolder = plugin.app.vault.getConfig("attachmentFolderPath") || "";
    for (const ext of supportedExtensions) {
      const tryPath = `${attachmentFolder}/${baseImageName}.${ext}`;
      const fileObj = plugin.app.metadataCache.getFirstLinkpathDest(tryPath, file);
      if (fileObj) {
        src = plugin.app.vault.getResourcePath(fileObj);
        break;
      }
    }
  }
  // Table rows
  const rows = overrides.hidetable === "true" ? "" : Object.entries(frontmatter)
    .filter(([k]) => !excludeKeys.has(k.toLowerCase()))
    .map(([k, v]) => {
      const label = k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const display = v != null ? v.toString() : "—";
      return `<tr><td><strong>${label}</strong></td><td>${display}</td></tr>`;
    })
    .join("");
  // Build infobox
  const infoboxEl = document.createElement("div");
  infoboxEl.className = "infobox-float callout";
  infoboxEl.setAttribute("data-callout", "infobox");
  infoboxEl.innerHTML = `
    <div class="callout-title">${displayName}</div>
    ${src ? `<img src="${src}" style="width:100%;border-radius:6px;margin:0.75em 0;" />` : ""}
    ${overrides.caption ? `<div class="infobox-caption">${overrides.caption}</div>` : ""}
    ${rows ? `<div class="infobox-section-header">Details</div><table>${rows}</table>` : ""}
  `;
  // Wrapper - use settings for styling
  const wrapper = document.createElement("div");
  wrapper.className = "infobox-wrapper";
  const width = overrides.width || plugin.settings.infobox_width || '320px';
  const marginLeft = overrides.margin_left || plugin.settings.infobox_margin_left || '2rem';
  const marginBottom = overrides.margin_bottom || plugin.settings.infobox_margin_bottom || '1.5rem';
  wrapper.setAttribute("style", `float: right; clear: right; width: ${width}; margin-left: ${marginLeft}; margin-bottom: ${marginBottom};`);
  wrapper.appendChild(infoboxEl);
  el.parentElement.insertBefore(wrapper, el);
  el.style.display = "none";
}

// --- Main Plugin Class ---
module.exports = class WikiKitPlugin extends Plugin {
  async onload() {
    console.log("WikiKit Plugin loaded ✅");
    // Register custom icon if supported
    let iconId = "table";
    if (typeof this.addIcon === "function") {
      this.addIcon(TAGTABLE_ICON_ID, TAGTABLE_ICON_SVG);
      iconId = TAGTABLE_ICON_ID;
    }
    // Load settings
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Add settings tab
    this.addSettingTab(new WikiKitSettingTab(this.app, this));
    // Register sidebar view
    this.registerView(
      WIKIKIT_TAGTABLE_VIEW_TYPE,
      (leaf) => new WikiKitTagTableView(leaf, this)
    );
    // Ribbon icon
    this.addRibbonIcon(iconId, "Show Tag Table Sidebar", () => {
      this.activateView();
    });
    // Command palette entry
    this.addCommand({
      id: "show-tag-table-sidebar",
      name: "Show Tag Table Sidebar",
      callback: () => this.activateView()
    });
    // Update sidebar on file change
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        const leaf = this.app.workspace.getLeavesOfType(WIKIKIT_TAGTABLE_VIEW_TYPE)[0];
        if (leaf && leaf.view instanceof WikiKitTagTableView) {
          leaf.view.updateTagTable();
        }
      })
    );
    // Register Infobox code block
    this.registerMarkdownCodeBlockProcessor("infobox", (source, el, ctx) => {
      renderInfobox(this, source, el, ctx);
    });
    // Register TagTable code block
    this.registerMarkdownCodeBlockProcessor("tagtable", (source, el, ctx) => {
      const overrides = parseSimpleBlock(source);
      renderTagTable(this, ctx.sourcePath, el, overrides);
    });
    // Insert Infobox template command
    this.addCommand({
      id: "insert-infobox",
      name: "Insert Infobox",
      editorCallback: (editor) => {
        const template = [
          "```infobox",
          "caption: Optional caption",
          "exclude: tags,aliases",
          "strip_title: true",
          "image: https://example.com/image.png",
          "```"
        ].join("\n");
        editor.replaceSelection(template + "\n");
      }
    });
    // Insert TagTable template command
    this.addCommand({
      id: "insert-tag-table",
      name: "Insert Tag Table",
      editorCallback: (editor) => {
        const block = [
          "```tagtable",
          "level1: Entity",
          "level2: Type",
          "level3: SubType",
          "```"
        ].join("\n");
        editor.replaceSelection(block + "\n");
      }
    });
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(WIKIKIT_TAGTABLE_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({
        type: WIKIKIT_TAGTABLE_VIEW_TYPE,
        active: true
      });
    } else {
      this.app.workspace.revealLeaf(leaf);
    }
  }

  onunload() {
    // Clean up sidebar reference
    const leaf = this.app.workspace.getLeavesOfType(WIKIKIT_TAGTABLE_VIEW_TYPE)[0];
    if (leaf && leaf.view instanceof WikiKitTagTableView) {
      leaf.view.onunload();
    }
    console.log("WikiKit Plugin unloaded 🛃");
  }
};

// --- Sidebar View: Tag Table ---
class WikiKitTagTableView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    plugin.sidebarView = this;
  }
  getViewType() {
    return WIKIKIT_TAGTABLE_VIEW_TYPE;
  }
  getDisplayText() {
    return "WikiKit Tag Table";
  }
  getIcon() {
    return typeof this.plugin.addIcon === "function" ? TAGTABLE_ICON_ID : "table";
  }
  async onOpen() {
    await this.updateTagTable();
  }
  async updateTagTable() {
    const file = this.plugin.app.workspace.getActiveFile();
    if (!file) {
      this.contentEl.innerHTML = "<p style='padding:1em;'>No file selected.</p>";
      return;
    }
    await renderTagTable(this.plugin, file.path, this.contentEl);
  }
  onunload() {
    this.contentEl.innerHTML = "";
    if (this.plugin.sidebarView === this) {
      this.plugin.sidebarView = null;
    }
  }
}

// --- Settings Tab ---
class WikiKitSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'WikiKit Settings' });
    
    // Infobox Settings Section
    containerEl.createEl('h3', { text: 'Infobox Settings' });
    
    // Infobox Width
    new Setting(containerEl)
      .setName('Infobox Width')
      .setDesc('Default width for infoboxes (e.g. 320px, 25%)')
      .addText(text => text
        .setPlaceholder('320px')
        .setValue(this.plugin.settings.infobox_width)
        .onChange(async (value) => {
          this.plugin.settings.infobox_width = value.trim() || '320px';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Infobox Margin Left
    new Setting(containerEl)
      .setName('Infobox Margin Left')
      .setDesc('Left margin for infoboxes (e.g. 2rem, 20px)')
      .addText(text => text
        .setPlaceholder('2rem')
        .setValue(this.plugin.settings.infobox_margin_left)
        .onChange(async (value) => {
          this.plugin.settings.infobox_margin_left = value.trim() || '2rem';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Infobox Margin Bottom
    new Setting(containerEl)
      .setName('Infobox Margin Bottom')
      .setDesc('Bottom margin for infoboxes (e.g. 1.5rem, 15px)')
      .addText(text => text
        .setPlaceholder('1.5rem')
        .setValue(this.plugin.settings.infobox_margin_bottom)
        .onChange(async (value) => {
          this.plugin.settings.infobox_margin_bottom = value.trim() || '1.5rem';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Infobox Strip Title
    new Setting(containerEl)
      .setName('Strip Title Prefix')
      .setDesc('Automatically remove prefixes like "Folder - " from titles')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.infobox_strip_title)
        .onChange(async (value) => {
          this.plugin.settings.infobox_strip_title = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Infobox Exclude Keys
    new Setting(containerEl)
      .setName('Default Exclude Keys')
      .setDesc('Comma-separated list of frontmatter keys to hide by default')
      .addText(text => text
        .setPlaceholder('tags,aliases,file,position,created,updated,Source')
        .setValue(this.plugin.settings.infobox_exclude_keys)
        .onChange(async (value) => {
          this.plugin.settings.infobox_exclude_keys = value.trim() || 'tags,aliases,file,position,created,updated,Source';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Tag Table Settings Section
    containerEl.createEl('h3', { text: 'Tag Table Settings' });
    
    // Level 1
    new Setting(containerEl)
      .setName('Level 1 Tag')
      .setDesc('Top-level tag (e.g. entity)')
      .addText(text => text
        .setPlaceholder('entity')
        .setValue(this.plugin.settings.level1)
        .onChange(async (value) => {
          this.plugin.settings.level1 = value.trim() || 'entity';
          await this.plugin.saveData(this.plugin.settings);
        }));
    // Level 2
    new Setting(containerEl)
      .setName('Level 2 Tag')
      .setDesc('Middle group tag (e.g. type)')
      .addText(text => text
        .setPlaceholder('type')
        .setValue(this.plugin.settings.level2)
        .onChange(async (value) => {
          this.plugin.settings.level2 = value.trim() || 'type';
          await this.plugin.saveData(this.plugin.settings);
        }));
    // Level 3
    new Setting(containerEl)
      .setName('Level 3 Tag')
      .setDesc('Subgroup tag (e.g. subtype)')
      .addText(text => text
        .setPlaceholder('subtype')
        .setValue(this.plugin.settings.level3)
        .onChange(async (value) => {
          this.plugin.settings.level3 = value.trim() || 'subtype';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Helpful note about refreshing
    containerEl.createEl('div', { 
      text: '💡 Tip: Infobox settings changes require refreshing the page view to take effect. Switch to another note and back.',
      cls: 'setting-item-description',
      attr: { style: 'margin-top: 1rem; padding: 0.5rem; background: var(--background-secondary); border-radius: 4px; font-style: italic;' }
    });
  }
}

