// wikikit-plugin/main.js
// WikiKit: Professional, clean, and well-documented Obsidian plugin for infoboxes and tag tables

const { Plugin, WorkspaceLeaf, Setting, PluginSettingTab, ItemView, Notice } = require("obsidian");

// --- Constants & Defaults ---
const TAGTABLE_ICON_ID = "wikikit-tagtable";
const TAGTABLE_ICON_SVG = `
<svg viewBox="0 0 100 100" width="100" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="15" y="20" width="70" height="12" rx="3" fill="currentColor"/>
  <rect x="15" y="44" width="70" height="12" rx="3" fill="currentColor"/>
  <rect x="15" y="68" width="70" height="12" rx="3" fill="currentColor"/>
  <circle cx="30" cy="26" r="4" fill="currentColor"/>
  <circle cx="30" cy="50" r="4" fill="currentColor"/>
  <circle cx="30" cy="74" r="4" fill="currentColor"/>
</svg>
`;
const WIKIKIT_TAGTABLE_VIEW_TYPE = "wikikit-tagtable-sidebar";
const WIKIKIT_VAULTMAP_VIEW_TYPE = "wikikit-vaultmap-sidebar";
const VAULTMAP_ICON_ID = "wikikit-vaultmap";
const VAULTMAP_ICON_SVG = `
<svg viewBox="0 0 100 100" width="100" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="15" width="80" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="3"/>
  <circle cx="30" cy="35" r="6" fill="currentColor"/>
  <circle cx="70" cy="35" r="6" fill="currentColor"/>
  <circle cx="50" cy="65" r="6" fill="currentColor"/>
  <line x1="30" y1="35" x2="70" y2="35" stroke="currentColor" stroke-width="2"/>
  <line x1="30" y1="35" x2="50" y2="65" stroke="currentColor" stroke-width="2"/>
  <line x1="70" y1="35" x2="50" y2="65" stroke="currentColor" stroke-width="2"/>
</svg>
`;
const DEFAULT_SETTINGS = {
  // Tag Table Settings
  level1: 'area',
  level2: 'category',
  level3: 'subcategory',
  table_spacing: '2rem',
  // Infobox Settings
  infobox_width: '320px',
  infobox_margin_left: '2rem',
  infobox_margin_bottom: '1.5rem',
  infobox_strip_title: true,
  infobox_exclude_keys: 'tags,aliases,file,position,created,updated,Source',
  // Vault Map Settings
  vaultmap_show_metadata: false,
  vaultmap_sort_by: 'name',
  vaultmap_group_by: 'area',
  vaultmap_compact_view: false,
  vaultmap_collection_tag: 'zettel/collection',
  vaultmap_topic_tag: 'zettel/topic',
  vaultmap_track_properties: 'status,context,lens',
  vaultmap_status_enabled: false,
  vaultmap_status_property: 'status',
  vaultmap_shorten_tracked_tags: true,
  vaultmap_exclude_folders: '',
  vaultmap_max_collection_rows: 10,
  vaultmap_max_topic_rows: 15,
  vaultmap_summary_visible: true,
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

// --- Utility: Format tag name for display ---
function formatTagName(tagName) {
  return tagName
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .replace(/\b\w/g, c => c.toUpperCase());  // Capitalize all words
}

// --- Helper: Set CSS custom properties for dynamic styling ---
function setWikiKitCSSProperties(plugin) {
  const root = document.documentElement;
  root.style.setProperty('--wikikit-infobox-width', plugin.settings.infobox_width || '320px');
  root.style.setProperty('--wikikit-infobox-margin-left', plugin.settings.infobox_margin_left || '2rem');
  root.style.setProperty('--wikikit-infobox-margin-bottom', plugin.settings.infobox_margin_bottom || '1.5rem');
  root.style.setProperty('--wikikit-table-spacing', plugin.settings.table_spacing || '2rem');
}

// --- Helper: Render Tag Table (shared by codeblock & sidebar) ---
async function renderTagTable(plugin, filePath, container, overrides = {}) {
  container.innerHTML = "";
  const cache = plugin.app.metadataCache.getCache(filePath);
  const frontmatter = cache?.frontmatter || {};
  const tags = (frontmatter.tags || []).map(t => t.toLowerCase());
  
  // Use settings or overrides for tag levels
  const level1 = (overrides.level1 || plugin.settings.level1 || 'area').toLowerCase();
  const level2 = (overrides.level2 || plugin.settings.level2 || 'category').toLowerCase();
  const level3 = (overrides.level3 || plugin.settings.level3 || 'subcategory').toLowerCase();
  
  // Find ALL area tags (not just the first one)
  const areaTags = tags.filter(tag => tag.startsWith(`${level1}/`));
  
  if (areaTags.length === 0) {
    const level1Label = (overrides.level1 || plugin.settings.level1 || 'area').replace(/^\w/, c => c.toUpperCase());
    container.innerHTML = `<p class="wikikit-sidebar-message"><em>No ${level1Label} tag found on this page.</em></p>`;
    return;
  }

  // Check if user wants only the first table
  const firstOnly = overrides.first_only === "true";
  const tagsToProcess = firstOnly ? areaTags.slice(0, 1) : areaTags;

  // Create a table for each area tag
  for (let i = 0; i < tagsToProcess.length; i++) {
    const targetAreaTag = tagsToProcess[i];
    
    // Group related pages by category/subcategory for this area
    const pages = plugin.app.vault.getMarkdownFiles();
    const groupedData = {};
    
    for (const page of pages) {
      const cache = plugin.app.metadataCache.getCache(page.path);
      if (!cache || !cache.frontmatter) continue;
      const fm = cache.frontmatter;
      const pageTags = (fm.tags || []).map(t => t.toLowerCase());
      if (!pageTags.includes(targetAreaTag)) continue;
      
      // Find Level 2 and Level 3 tags (optional)
      const categoryTag = pageTags.find(tag => tag.startsWith(`${level2}/`));
      const subCategoryTag = pageTags.find(tag => tag.startsWith(`${level3}/`));
      
      // Use "Uncategorized" for pages without Level 2 tag
      const category = categoryTag || "Uncategorized";
      // Use blank for pages without Level 3 tag
      const sub = subCategoryTag || "";
      
      if (!groupedData[category]) groupedData[category] = {};
      if (!groupedData[category][sub]) groupedData[category][sub] = [];
      let title = fm.title || page.basename;
      title = title.replace(/^.* - /, '');
      groupedData[category][sub].push({ name: title, path: page.path });
    }
    
    // Build table HTML for this area
    const title = formatTagName(targetAreaTag.split("/").slice(-1)[0]);
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "tagtable-wrapper sidebar";
    
    tableWrapper.innerHTML = `<div class="tagtable-header"><strong>${title} - Related Pages</strong></div>`;
    const table = document.createElement("table");
    table.className = "tagtable";
    
    // Sort categories alphabetically, with "Uncategorized" always first
    const sortedCategories = Object.keys(groupedData).sort((a, b) => {
      if (a === "Uncategorized") return -1;
      if (b === "Uncategorized") return 1;
      return a.localeCompare(b);
    });
    
    for (const category of sortedCategories) {
      const subGroups = groupedData[category];
      const categoryRow = document.createElement("tr");
      const categoryCell = document.createElement("td");
      categoryCell.setAttribute("rowspan", Object.keys(subGroups).length);
      // Handle "Uncategorized" specially
      const categoryDisplay = category === "Uncategorized" ? "Uncategorized" : formatTagName(category.split("/").slice(-1)[0]);
      categoryCell.textContent = categoryDisplay;
      categoryCell.className = "tagtable-category";
      categoryRow.appendChild(categoryCell);
      
      // Sort subcategories alphabetically, with empty string (no subcategory) last
      const sortedSubCategories = Object.keys(subGroups).sort((a, b) => {
        if (a === "") return 1;
        if (b === "") return -1;
        return a.localeCompare(b);
      });
      
      let first = true;
      for (const sub of sortedSubCategories) {
        const entries = subGroups[sub];
        // Sort entries alphabetically by name
        entries.sort((a, b) => a.name.localeCompare(b.name));
        const row = first ? categoryRow : document.createElement("tr");
        first = false;
        const subCell = document.createElement("td");
        // Handle blank subcategory
        const subDisplay = sub === "" ? "—" : formatTagName(sub.split("/").slice(-1)[0]);
        subCell.textContent = subDisplay;
        subCell.className = "tagtable-subcategory";
        const entriesCell = document.createElement("td");
        entriesCell.innerHTML = entries
          .map(e => `<a href=\"#\" data-href=\"${e.path}\">${e.name}</a>`)
          .join("<br>");
        row.appendChild(subCell);
        row.appendChild(entriesCell);
        table.appendChild(row);
      }
    }
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
  }
  
  // Link handling for all tables
  container.querySelectorAll("a[data-href]").forEach(link => {
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
    ${src ? `<img src="${src}" alt="${displayName}" />` : ""}
    ${overrides.caption ? `<div class="infobox-caption">${overrides.caption}</div>` : ""}
    ${rows ? `<div class="infobox-section-header">Details</div><table>${rows}</table>` : ""}
  `;
  
  // Wrapper - use CSS custom properties for styling
  const wrapper = document.createElement("div");
  wrapper.className = "infobox-wrapper";
  
  // Set custom properties for this specific infobox if overrides are provided
  if (overrides.width || overrides.margin_left || overrides.margin_bottom) {
    const width = overrides.width || plugin.settings.infobox_width || '320px';
    const marginLeft = overrides.margin_left || plugin.settings.infobox_margin_left || '2rem';
    const marginBottom = overrides.margin_bottom || plugin.settings.infobox_margin_bottom || '1.5rem';
    
    wrapper.style.setProperty('--wikikit-infobox-width', width);
    wrapper.style.setProperty('--wikikit-infobox-margin-left', marginLeft);
    wrapper.style.setProperty('--wikikit-infobox-margin-bottom', marginBottom);
  }
  
  wrapper.appendChild(infoboxEl);
  el.parentElement.insertBefore(wrapper, el);
  el.classList.add("wikikit-hidden");
}

// --- Helper: Generate Links from Tag Table Data ---
async function generateLinksFromTagTable(plugin, filePath, overrides = {}) {
  const cache = plugin.app.metadataCache.getCache(filePath);
  const frontmatter = cache?.frontmatter || {};
  const tags = (frontmatter.tags || []).map(t => t.toLowerCase());
  
  // Use settings or overrides for tag levels
  const level1 = (overrides.level1 || plugin.settings.level1 || 'area').toLowerCase();
  const level2 = (overrides.level2 || plugin.settings.level2 || 'category').toLowerCase();
  const level3 = (overrides.level3 || plugin.settings.level3 || 'subcategory').toLowerCase();
  
  // Find ALL area tags (not just the first one)
  const areaTags = tags.filter(tag => tag.startsWith(`${level1}/`));
  
  if (areaTags.length === 0) {
    return "No area tags found on this page.";
  }

  // Always only process the first area tag if there are multiple
  const tagsToProcess = areaTags.slice(0, 1);

  let result = "";
  
  // Process the first area tag only
  for (let i = 0; i < tagsToProcess.length; i++) {
    const targetAreaTag = tagsToProcess[i];
    
    // Group related pages by category/subcategory for this area
    const pages = plugin.app.vault.getMarkdownFiles();
    const groupedData = {};
    
    for (const page of pages) {
      const cache = plugin.app.metadataCache.getCache(page.path);
      if (!cache || !cache.frontmatter) continue;
      const fm = cache.frontmatter;
      const pageTags = (fm.tags || []).map(t => t.toLowerCase());
      if (!pageTags.includes(targetAreaTag)) continue;
      
      // Find Level 2 and Level 3 tags (optional)
      const categoryTag = pageTags.find(tag => tag.startsWith(`${level2}/`));
      const subCategoryTag = pageTags.find(tag => tag.startsWith(`${level3}/`));
      
      // Use "Uncategorized" for pages without Level 2 tag
      const category = categoryTag || "Uncategorized";
      // Use blank for pages without Level 3 tag
      const sub = subCategoryTag || "";
      
      if (!groupedData[category]) groupedData[category] = {};
      if (!groupedData[category][sub]) groupedData[category][sub] = [];
      let displayName = fm.title || page.basename;
      // Strip prefix for display only
      displayName = displayName.replace(/^.* - /, '');
      groupedData[category][sub].push({ name: displayName, path: page.path, basename: page.basename });
    }
    
    // Sort categories alphabetically, with "Uncategorized" always first
    const sortedCategories = Object.keys(groupedData).sort((a, b) => {
      if (a === "Uncategorized") return -1;
      if (b === "Uncategorized") return 1;
      return a.localeCompare(b);
    });
    
    // Generate markdown links
    for (const category of sortedCategories) {
      const subGroups = groupedData[category];
      const categoryDisplay = category === "Uncategorized" ? "Uncategorized" : formatTagName(category.split("/").slice(-1)[0]);
      
      // Add category header
      result += `\n## ${categoryDisplay}\n\n`;
      
      // Sort subcategories alphabetically, with empty string (no subcategory) first
      const sortedSubCategories = Object.keys(subGroups).sort((a, b) => {
        if (a === "") return -1;
        if (b === "") return 1;
        return a.localeCompare(b);
      });
      
      for (const sub of sortedSubCategories) {
        const entries = subGroups[sub];
        
        // Add subcategory header if it exists
        if (sub !== "") {
          const subDisplay = formatTagName(sub.split("/").slice(-1)[0]);
          result += `### ${subDisplay}\n`;
        }
        
        // Add links
        for (const entry of entries) {
          // Use full page name for link, displayName for text
          result += `- [[${entry.basename}|${entry.name}]]\n`;
        }
        
        // Add spacing after subcategory
        if (sub !== "") {
          result += "\n";
        }
      }
    }
  }
  
  return result.trim();
}

// --- Helper: Render Vault Map ---
async function renderVaultMap(plugin, container, overrides = {}) {
  container.innerHTML = "";
  
  // Get all markdown files
  const pages = plugin.app.vault.getMarkdownFiles();
  
  // Filter out excluded folders
  const excludeFolders = (overrides.exclude_folders || plugin.settings.vaultmap_exclude_folders || '').split(',').map(f => f.trim().toLowerCase()).filter(f => f);
  const filteredPages = pages.filter(page => {
    if (excludeFolders.length === 0) return true;
    const pagePath = page.path.toLowerCase();
    return !excludeFolders.some(folder => pagePath.startsWith(folder + '/'));
  });
  
  const collections = [];
  const topics = [];
  const areas = new Set();
  const level1Tags = new Set();
  const level2Tags = new Set();
  const level3Tags = new Set();
  
  // Get settings
  const collectionTag = (overrides.collection_tag || plugin.settings.vaultmap_collection_tag || 'zettel/collection').toLowerCase();
  const topicTag = (overrides.topic_tag || plugin.settings.vaultmap_topic_tag || 'zettel/topic').toLowerCase();
  const trackTags = (overrides.track_tags || plugin.settings.vaultmap_track_tags || plugin.settings.vaultmap_track_properties || 'status,context,lens').split(',').map(p => p.trim().toLowerCase());
  const statusEnabled = overrides.status_enabled !== undefined ? overrides.status_enabled === "true" : plugin.settings.vaultmap_status_enabled;
  const statusProperty = (overrides.status_property || plugin.settings.vaultmap_status_property || 'status').toLowerCase();
  
  // Get level tag names for display
  const level1Name = formatTagName(plugin.settings.level1 || 'area');
  const level2Name = formatTagName(plugin.settings.level2 || 'category');
  const level3Name = formatTagName(plugin.settings.level3 || 'subcategory');
  
  // Process all pages to categorize them
  for (const page of filteredPages) {
    const cache = plugin.app.metadataCache.getCache(page.path);
    if (!cache || !cache.frontmatter) continue;
    
    const fm = cache.frontmatter;
    const pageTags = (fm.tags || []).map(t => t.toLowerCase());
    const title = fm.title || page.basename;
    const displayName = title.replace(/^.* - /, '');
    
    // Get file stats
    const stats = plugin.app.vault.getFileByPath(page.path)?.stat;
    const created = stats?.ctime ? new Date(stats.ctime) : null;
    const modified = stats?.mtime ? new Date(stats.mtime) : null;
    
    // Check for collection and topic tags
    const isCollection = pageTags.some(tag => tag === collectionTag);
    const isTopic = pageTags.some(tag => tag === topicTag);
    
    // Get area tags and count level tags
    const areaTags = pageTags.filter(tag => tag.startsWith('area/'));
    areaTags.forEach(tag => areas.add(tag));
    
    // Count level tags from settings
    const level1 = plugin.settings.level1 || 'area';
    const level2 = plugin.settings.level2 || 'category';
    const level3 = plugin.settings.level3 || 'subcategory';
    
    pageTags.forEach(tag => {
      if (tag.startsWith(`${level1}/`)) level1Tags.add(tag);
      if (tag.startsWith(`${level2}/`)) level2Tags.add(tag);
      if (tag.startsWith(`${level3}/`)) level3Tags.add(tag);
    });
    
    // Get status
    let status = 'Active';
    if (statusEnabled) {
      const statusTag = pageTags.find(tag => tag.startsWith(`${statusProperty}/`));
      status = statusTag ? statusTag.split('/')[1] : 'Active';
    }
    
    const pageData = {
      name: displayName,
      title: title,
      path: page.path,
      basename: page.basename,
      created: created,
      modified: modified,
      status: status,
      areas: areaTags,
      tags: pageTags
    };
    
    if (isCollection) {
      collections.push(pageData);
    } else if (isTopic) {
      topics.push(pageData);
    }
  }
  
  // Count child pages for collections (handle multiple area tags)
  collections.forEach(collection => { collection.childCount = 0; });
  for (const page of filteredPages) {
    const cache = plugin.app.metadataCache.getCache(page.path);
    if (!cache) continue;
    const pageAreaTags = (cache.frontmatter?.tags || []).map(t => t.toLowerCase()).filter(tag => tag.startsWith('area/'));
    // For each area tag on this page, increment the matching collection's count
    for (const areaTag of pageAreaTags) {
      for (const collection of collections) {
        if (collection.areas.includes(areaTag)) {
          collection.childCount = (collection.childCount || 0) + 1;
        }
      }
    }
  }
  
  // Track tags for topics (same as before, just renamed)
  for (const topic of topics) {
    topic.trackedData = {};
    trackTags.forEach(rawTag => {
      const prop = rawTag.trim();
      topic.trackedData[prop] = 0;
      const topicAreas = topic.areas;
      if (topicAreas.length === 0) return;
      for (const page of filteredPages) {
        const cache = plugin.app.metadataCache.getCache(page.path);
        if (!cache || !cache.frontmatter) continue;
        const pageTags = (cache.frontmatter.tags || []).map(t => t.toLowerCase().trim());
        const pageAreas = pageTags.filter(tag => tag.startsWith('area/'));
        const hasSameArea = topicAreas.some(topicArea => pageAreas.includes(topicArea));
        if (hasSameArea) {
          const hasPropertyTag = pageTags.some(tag => tag === prop || tag.startsWith(`${prop}/`));
          if (hasPropertyTag) {
            topic.trackedData[prop]++;
          }
        }
      }
    });
  }
  
  // Sort collections and topics
  const sortBy = overrides.sort_by || plugin.settings.vaultmap_sort_by || 'created';
  const sortFunction = (a, b) => {
    switch (sortBy) {
      case 'created':
        return (b.created || 0) - (a.created || 0);
      case 'modified':
        return (b.modified || 0) - (a.modified || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return a.name.localeCompare(b.name);
    }
  };
  
  collections.sort(sortFunction);
  topics.sort(sortFunction);
  
  // Group by area if requested
  const groupBy = overrides.group_by || plugin.settings.vaultmap_group_by || 'area';
  const compactView = overrides.compact_view === "true" || plugin.settings.vaultmap_compact_view;
  const showMetadata = overrides.show_metadata !== "false" && plugin.settings.vaultmap_show_metadata;
  
  // Get max row settings (can be overridden in code block)
  const maxCollectionRows = overrides.max_collection_rows ? parseInt(overrides.max_collection_rows) : (plugin.settings.vaultmap_max_collection_rows || 10);
  const maxTopicRows = overrides.max_topic_rows ? parseInt(overrides.max_topic_rows) : (plugin.settings.vaultmap_max_topic_rows || 15);
  
  if (compactView) {
    renderCompactVaultMap(plugin, container, collections, topics, areas, showMetadata, filteredPages.length, level1Tags.size, level2Tags.size, level3Tags.size, level1Name, level2Name, level3Name);
  } else {
    renderDetailedVaultMap(plugin, container, collections, topics, areas, showMetadata, groupBy, filteredPages.length, level1Tags.size, level2Tags.size, level3Tags.size, trackTags, level1Name, level2Name, level3Name, maxCollectionRows, maxTopicRows);
  }
  
  // Add link handling
  container.querySelectorAll("a[data-href]").forEach(link => {
    link.addEventListener("click", (evt) => {
      evt.preventDefault();
      const targetPath = link.getAttribute("data-href");
      const targetFile = plugin.app.vault.getAbstractFileByPath(targetPath);
      if (targetFile) {
        plugin.app.workspace.openLinkText(
          plugin.app.metadataCache.fileToLinktext(targetFile, ""),
          ""
        );
      }
    });
  });
}

// --- Helper: Render Compact Vault Map ---
function renderCompactVaultMap(plugin, container, collections, topics, areas, showMetadata, totalPages, level1Tags, level2Tags, level3Tags, level1Name, level2Name, level3Name) {
  const wrapper = document.createElement("div");
  wrapper.className = "vaultmap-wrapper compact";
  
  // Header
  wrapper.innerHTML = `
    <div class="vaultmap-header">
      <h3>🗺️ Vault Overview</h3>
    </div>
  `;
  
  // Group by areas
  const areaData = {};
  areas.forEach(area => {
    areaData[area] = {
      collections: collections.filter(c => c.areas.includes(area)),
      topics: topics.filter(t => t.areas.includes(area))
    };
  });
  
  // Render each area
  Object.entries(areaData).forEach(([area, data]) => {
    const areaName = formatTagName(area.split('/')[1]);
    const totalPages = data.collections.length + data.topics.length;
    
    const areaSection = document.createElement("div");
    areaSection.className = "vaultmap-area-section";
    areaSection.innerHTML = `
      <h4>${getAreaIcon(area)} ${areaName} (${totalPages} pages)</h4>
      <div class="vaultmap-area-content">
        ${data.collections.length > 0 ? `
          <div class="vaultmap-group">
            <span class="vaultmap-group-icon">📚</span>
            <span class="vaultmap-group-label">Collections:</span>
            <span class="vaultmap-group-items">
              ${data.collections.map(c => `<a href="#" data-href="${c.path}">${c.name}</a>`).join(', ')}
            </span>
          </div>
        ` : ''}
        ${data.topics.length > 0 ? `
          <div class="vaultmap-group">
            <span class="vaultmap-group-icon">🧠</span>
            <span class="vaultmap-group-label">Topics:</span>
            <span class="vaultmap-group-items">
              ${data.topics.map(t => `<a href="#" data-href="${t.path}">${t.name}</a>`).join(', ')}
            </span>
          </div>
        ` : ''}
      </div>
    `;
    wrapper.appendChild(areaSection);
  });
  
  // Summary
  const summary = document.createElement("div");
  summary.className = "vaultmap-summary";
  summary.innerHTML = `
    <div class="vaultmap-stats">
      <span>📊 Quick Stats: ${totalPages} Total Pages • ${collections.length} Collections • ${topics.length} Topics • ${level1Tags} ${level1Name} Tags • ${level2Tags} ${level2Name} Tags • ${level3Tags} ${level3Name} Tags</span>
    </div>
  `;
  wrapper.appendChild(summary);
  
  container.appendChild(wrapper);
}

// --- Helper: Render Detailed Vault Map ---
function renderDetailedVaultMap(plugin, container, collections, topics, areas, showMetadata, groupBy, totalPages, level1Tags, level2Tags, level3Tags, trackTags, level1Name, level2Name, level3Name, maxCollectionRows, maxTopicRows) {
  const wrapper = document.createElement("div");
  wrapper.className = "vaultmap-wrapper detailed";
  
  // Header
  wrapper.innerHTML = `
    <div class="vaultmap-header">
      <h3>🗺️ Vault Content Map</h3>
    </div>
  `;
  
  // Collections Section
  if (collections.length > 0) {
    const collectionsSection = document.createElement("div");
    collectionsSection.className = "vaultmap-section";
    
    // Get max rows setting
    const hasMoreCollections = collections.length > maxCollectionRows;
    // Render all rows, not just the first N
    // const displayCollections = hasMoreCollections ? collections.slice(0, maxCollectionRows) : collections;
    const displayCollections = collections;
    
    // Build header row with semantic classes
    let collectionsHeader = `<tr><th>Collection Name</th><th>Area</th><th class='is-number'>Items</th>`;
    if (plugin.settings.vaultmap_status_enabled) {
      if (showMetadata) {
        collectionsHeader += `<th class='is-meta'>Created</th><th class='is-meta'>Status</th>`;
      }
    } else if (showMetadata) {
      collectionsHeader += `<th class='is-meta'>Created</th>`;
    }
    collectionsHeader += `</tr>`;
    
    // Build body rows with semantic classes
    const collectionsBody = displayCollections.map(collection => {
      const area = collection.areas.length > 0 ? collection.areas.map(a => formatTagName(a.split('/')[1])).join('<br><span>') : '—';
      const created = collection.created ? collection.created.toLocaleDateString() : '—';
      let row = `<tr>`;
      row += `<td><a href="#" data-href="${collection.path}">${collection.name}</a></td>`;
      row += `<td>${collection.areas.length > 0 ? '<span>' + area + '</span>' : area}</td>`;
      row += `<td class='is-number'>${collection.childCount || 0}</td>`;
      if (plugin.settings.vaultmap_status_enabled) {
        if (showMetadata) {
          row += `<td class='is-meta'>${created}</td><td class='is-meta'>${collection.status}</td>`;
        }
      } else if (showMetadata) {
        row += `<td class='is-meta'>${created}</td>`;
      }
      row += `</tr>`;
      return row;
    }).join('');
    
    collectionsSection.innerHTML = `
      <h4>🗂️ Collections (${collections.length})</h4>
      <div class="vaultmap-table-wrapper ${hasMoreCollections ? 'vaultmap-scrollable' : ''}">
        <table class="vaultmap-table">
          <thead>${collectionsHeader}</thead>
          <tbody>${collectionsBody}</tbody>
        </table>
      </div>
    `;
    wrapper.appendChild(collectionsSection);
  }
  
  // Topics Section
  if (topics.length > 0) {
    const topicsSection = document.createElement("div");
    topicsSection.className = "vaultmap-section";
    
    // Get max rows setting
    const hasMoreTopics = topics.length > maxTopicRows;
    // Render all rows, not just the first N
    // const displayTopics = hasMoreTopics ? topics.slice(0, maxTopicRows) : topics;
    const displayTopics = topics;
    
    // Build header row with semantic classes
    let topicsHeader = `<tr><th>Topic Name</th><th>Area</th>`;
    topicsHeader += trackTags.map(prop => {
      let display = prop;
      if (plugin.settings.vaultmap_shorten_tracked_tags) {
        display = prop.split('/').slice(-1)[0];
      }
      return `<th class='is-number'>${formatTagName(display)}</th>`;
    }).join('');
    if (plugin.settings.vaultmap_status_enabled) {
      if (showMetadata) {
        topicsHeader += `<th class='is-meta'>Created</th><th class='is-meta'>Status</th>`;
      }
    } else if (showMetadata) {
      topicsHeader += `<th class='is-meta'>Created</th>`;
    }
    topicsHeader += `</tr>`;
    
    // Build body rows with semantic classes
    const topicsBody = displayTopics.map(topic => {
      const area = topic.areas.length > 0 ? topic.areas.map(a => formatTagName(a.split('/').slice(-1)[0])).join('<br><span>') : '—';
      const created = topic.created ? topic.created.toLocaleDateString() : '—';
      let row = `<tr>`;
      row += `<td><a href="#" data-href="${topic.path}">${topic.name}</a></td>`;
      row += `<td>${topic.areas.length > 0 ? '<span>' + area + '</span>' : area}</td>`;
      row += trackTags.map(prop => `<td class='is-number'>${topic.trackedData[prop] || 0}</td>`).join('');
      if (plugin.settings.vaultmap_status_enabled) {
        if (showMetadata) {
          row += `<td class='is-meta'>${created}</td><td class='is-meta'>${topic.status}</td>`;
        }
      } else if (showMetadata) {
        row += `<td class='is-meta'>${created}</td>`;
      }
      row += `</tr>`;
      return row;
    }).join('');
    
    topicsSection.innerHTML = `
      <h4>🧠 Topics (${topics.length})</h4>
      <div class="vaultmap-table-wrapper ${hasMoreTopics ? 'vaultmap-scrollable' : ''}">
        <table class="vaultmap-table">
          <thead>${topicsHeader}</thead>
          <tbody>${topicsBody}</tbody>
        </table>
      </div>
    `;
    wrapper.appendChild(topicsSection);
  }
  
  // Summary Section
  const summarySection = document.createElement("div");
  summarySection.className = "vaultmap-section";
  
  // Get the stored summary visibility state
  const summaryVisible = plugin.settings.vaultmap_summary_visible !== false; // Default to true
  const toggleIcon = summaryVisible ? '📊' : '📈';
  const toggleText = summaryVisible ? '(click to hide)' : '(click to show)';
  const summaryDisplay = summaryVisible ? 'grid' : 'none';
  
  summarySection.innerHTML = `
    <h4 class="vaultmap-summary-toggle" style="cursor: pointer; user-select: none;">
      <span class="vaultmap-toggle-icon">${toggleIcon}</span> Summary 
      <span class="vaultmap-toggle-text">${toggleText}</span>
    </h4>
    <div class="vaultmap-summary-stats" style="display: ${summaryDisplay};">
      <div class="vaultmap-stat">
        <span class="vaultmap-stat-label">Total Pages:</span>
        <span class="vaultmap-stat-value">${totalPages}</span>
      </div>
      <div class="vaultmap-stat">
        <span class="vaultmap-stat-label">Collections:</span>
        <span class="vaultmap-stat-value">${collections.length}</span>
      </div>
      <div class="vaultmap-stat">
        <span class="vaultmap-stat-label">Topics:</span>
        <span class="vaultmap-stat-value">${topics.length}</span>
      </div>
      <div class="vaultmap-stat">
        <span class="vaultmap-stat-label">${level1Name} Tags:</span>
        <span class="vaultmap-stat-value">${level1Tags}</span>
      </div>
      <div class="vaultmap-stat">
        <span class="vaultmap-stat-label">${level2Name} Tags:</span>
        <span class="vaultmap-stat-value">${level2Tags}</span>
      </div>
      <div class="vaultmap-stat">
        <span class="vaultmap-stat-label">${level3Name} Tags:</span>
        <span class="vaultmap-stat-value">${level3Tags}</span>
      </div>
    </div>
  `;
  wrapper.appendChild(summarySection);
  
  container.appendChild(wrapper);

  // --- Helper: Make Table Sortable ---
  function makeTableSortable(table) {
    const ths = table.querySelectorAll('th');
    ths.forEach((th, colIdx) => {
      th.addEventListener('click', () => {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const isAsc = th.classList.contains('sort-asc');
        ths.forEach(header => header.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
        const getCellValue = (row, idx) => row.children[idx]?.textContent.trim() || '';
        rows.sort((a, b) => {
          const valA = getCellValue(a, colIdx);
          const valB = getCellValue(b, colIdx);
          // Try to compare as numbers, fallback to string
          const numA = parseFloat(valA.replace(/[^\d.\-]/g, ''));
          const numB = parseFloat(valB.replace(/[^\d.\-]/g, ''));
          if (!isNaN(numA) && !isNaN(numB)) {
            return (isAsc ? numA - numB : numB - numA);
          }
          return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
        rows.forEach(row => tbody.appendChild(row));
      });
    });
  }

  // Make tables sortable after rendering
  setTimeout(() => {
    const tables = wrapper.querySelectorAll('.vaultmap-table');
    tables.forEach(makeTableSortable);

    // Add summary toggle functionality
    const summaryToggle = wrapper.querySelector('.vaultmap-summary-toggle');
    const summaryStats = wrapper.querySelector('.vaultmap-summary-stats');
    const toggleIcon = wrapper.querySelector('.vaultmap-toggle-icon');
    const toggleText = wrapper.querySelector('.vaultmap-toggle-text');
    
    if (summaryToggle && summaryStats) {
      summaryToggle.addEventListener('click', async () => {
        const isVisible = summaryStats.style.display !== 'none';
        if (isVisible) {
          summaryStats.style.display = 'none';
          toggleIcon.textContent = '📈';
          toggleText.textContent = '(click to show)';
          plugin.settings.vaultmap_summary_visible = false;
        } else {
          summaryStats.style.display = 'grid';
          toggleIcon.textContent = '📊';
          toggleText.textContent = '(click to hide)';
          plugin.settings.vaultmap_summary_visible = true;
        }
        // Save the setting
        await plugin.saveData(plugin.settings);
      });
    }

    // Dynamically set max-height for scrollable tables to fit exactly the number of rows specified
    const wrappers = wrapper.querySelectorAll('.vaultmap-table-wrapper.vaultmap-scrollable');
    wrappers.forEach((wrap, index) => {
      const table = wrap.querySelector('table');
      if (!table) return;
      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      // Use the first row to measure row height
      const firstRow = tbody.querySelector('tr');
      const rowCount = Array.from(wrap.parentElement.querySelectorAll('h4'))[0]?.textContent.includes('Collection') ? maxCollectionRows : maxTopicRows;
      if (firstRow) {
        const rowHeight = firstRow.getBoundingClientRect().height;
        let headerHeight = 0;
        if (thead) {
          const headRow = thead.querySelector('tr');
          if (headRow) headerHeight = headRow.getBoundingClientRect().height;
        }
        // Set max-height to fit exactly the number of rows + header
        wrap.style.maxHeight = ((rowHeight * rowCount) + headerHeight) + 'px';
      }
    });
  }, 0);
}

// --- Helper: Get Area Icon ---
function getAreaIcon(area) {
  const areaName = area.split('/')[1].toLowerCase();
  const iconMap = {
    'gaming': '🎮',
    'security': '🔒',
    'technology': '💻',
    'programming': '⚡',
    'research': '🔬',
    'business': '💼',
    'health': '🏥',
    'education': '📚',
    'finance': '💰',
    'travel': '✈️'
  };
  return iconMap[areaName] || '📁';
}

// --- Main Plugin Class ---
module.exports = class WikiKitPlugin extends Plugin {
  async onload() {
    console.log("WikiKit Plugin loaded ✅");
    
    // Register custom icon if supported
    let iconId = "table";
    let vaultMapIconId = "map";
    if (typeof this.addIcon === "function") {
      this.addIcon(TAGTABLE_ICON_ID, TAGTABLE_ICON_SVG);
      this.addIcon(VAULTMAP_ICON_ID, VAULTMAP_ICON_SVG);
      iconId = TAGTABLE_ICON_ID;
      vaultMapIconId = VAULTMAP_ICON_ID;
    }
    
    // Load settings
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    
    // Set initial CSS custom properties
    setWikiKitCSSProperties(this);
    
    // Add settings tab
    this.addSettingTab(new WikiKitSettingTab(this.app, this));
    
    // Register sidebar views
    this.registerView(
      WIKIKIT_TAGTABLE_VIEW_TYPE,
      (leaf) => new WikiKitTagTableView(leaf, this)
    );
    this.registerView(
      WIKIKIT_VAULTMAP_VIEW_TYPE,
      (leaf) => new WikiKitVaultMapView(leaf, this)
    );
    
    // Ribbon icons
    this.addRibbonIcon(iconId, "Show Tag Table Sidebar", () => {
      this.activateView();
    });
    this.addRibbonIcon(vaultMapIconId, "Show Vault Map Sidebar", () => {
      this.activateVaultMapView();
    });
    
    // Command palette entries
    this.addCommand({
      id: "show-tag-table-sidebar",
      name: "Show Tag Table Sidebar",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "show-vault-map-sidebar",
      name: "Show Vault Map Sidebar",
      callback: () => this.activateVaultMapView()
    });
    
    this.addCommand({
      id: "refresh-vault-map",
      name: "Refresh Vault Map",
      callback: () => {
        const vaultMapLeaf = this.app.workspace.getLeavesOfType(WIKIKIT_VAULTMAP_VIEW_TYPE)[0];
        if (vaultMapLeaf && vaultMapLeaf.view instanceof WikiKitVaultMapView) {
          vaultMapLeaf.view.updateVaultMap();
          new Notice("Vault map refreshed!");
        } else {
          new Notice("Vault map sidebar not open. Open it first.");
        }
      }
    });
    
    // Update sidebars on file change
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        const tagTableLeaf = this.app.workspace.getLeavesOfType(WIKIKIT_TAGTABLE_VIEW_TYPE)[0];
        if (tagTableLeaf && tagTableLeaf.view instanceof WikiKitTagTableView) {
          tagTableLeaf.view.updateTagTable();
        }
      })
    );
    
    // Register code block processors
    this.registerMarkdownCodeBlockProcessor("infobox", (source, el, ctx) => {
      renderInfobox(this, source, el, ctx);
    });
    this.registerMarkdownCodeBlockProcessor("tagtable", (source, el, ctx) => {
      const overrides = parseSimpleBlock(source);
      renderTagTable(this, ctx.sourcePath, el, overrides);
    });
    this.registerMarkdownCodeBlockProcessor("vaultmap", (source, el, ctx) => {
      const overrides = parseSimpleBlock(source);
      renderVaultMap(this, el, overrides);
    });
    
    // Insert template commands
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
    this.addCommand({
      id: "insert-tag-table",
      name: "Insert Tag Table",
      editorCallback: (editor) => {
        const block = [
          "```tagtable",
          "level1: Area",
          "level2: Category",
          "level3: SubCategory",
          "first_only: false",
          "```"
        ].join("\n");
        editor.replaceSelection(block + "\n");
      }
    });
    this.addCommand({
      id: "insert-vault-map",
      name: "Insert Vault Map",
      editorCallback: (editor) => {
        const block = [
          "```vaultmap",
          "show_metadata: true",
          "sort_by: created",
          "group_by: area",
          "compact_view: false",
          "```"
        ].join("\n");
        editor.replaceSelection(block + "\n");
      }
    });
    
    // Create links from tag table command
    this.addCommand({
      id: "create-links-from-tag-table",
      name: "Create Links from Tag Table",
      editorCallback: async (editor) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice("No active file found.");
          return;
        }
        
        try {
          const links = await generateLinksFromTagTable(this, file.path);
          if (links === "No area tags found on this page.") {
            new Notice("No area tags found on this page.");
            return;
          }
          
          // Insert the generated links at cursor position
          editor.replaceSelection(links);
          new Notice("Links generated successfully!");
        } catch (error) {
          console.error("Error generating links:", error);
          new Notice("Error generating links. Check console for details.");
        }
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

  async activateVaultMapView() {
    let leaf = this.app.workspace.getLeavesOfType(WIKIKIT_VAULTMAP_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({
        type: WIKIKIT_VAULTMAP_VIEW_TYPE,
        active: true
      });
    } else {
      this.app.workspace.revealLeaf(leaf);
    }
  }

  onunload() {
    // Clean up sidebar references
    const tagTableLeaf = this.app.workspace.getLeavesOfType(WIKIKIT_TAGTABLE_VIEW_TYPE)[0];
    if (tagTableLeaf && tagTableLeaf.view instanceof WikiKitTagTableView) {
      tagTableLeaf.view.onunload();
    }
    const vaultMapLeaf = this.app.workspace.getLeavesOfType(WIKIKIT_VAULTMAP_VIEW_TYPE)[0];
    if (vaultMapLeaf && vaultMapLeaf.view instanceof WikiKitVaultMapView) {
      vaultMapLeaf.view.onunload();
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
      this.contentEl.innerHTML = "<p class='wikikit-sidebar-message'>No file selected.</p>";
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

// --- Sidebar View: Vault Map ---
class WikiKitVaultMapView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    plugin.vaultMapView = this;
  }
  
  getViewType() {
    return WIKIKIT_VAULTMAP_VIEW_TYPE;
  }
  
  getDisplayText() {
    return "WikiKit Vault Map";
  }
  
  getIcon() {
    return typeof this.plugin.addIcon === "function" ? VAULTMAP_ICON_ID : "map";
  }
  
  async onOpen() {
    await this.updateVaultMap();
  }
  
  async updateVaultMap() {
    await renderVaultMap(this.plugin, this.contentEl);
  }
  
  onunload() {
    this.contentEl.innerHTML = "";
    if (this.plugin.vaultMapView === this) {
      this.plugin.vaultMapView = null;
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
          setWikiKitCSSProperties(this.plugin);
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
          setWikiKitCSSProperties(this.plugin);
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
          setWikiKitCSSProperties(this.plugin);
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
      .setDesc('Top-level tag (e.g. area)')
      .addText(text => text
        .setPlaceholder('area')
        .setValue(this.plugin.settings.level1)
        .onChange(async (value) => {
          this.plugin.settings.level1 = value.trim() || 'area';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Level 2
    new Setting(containerEl)
      .setName('Level 2 Tag')
      .setDesc('Middle group tag (e.g. category)')
      .addText(text => text
        .setPlaceholder('category')
        .setValue(this.plugin.settings.level2)
        .onChange(async (value) => {
          this.plugin.settings.level2 = value.trim() || 'category';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Level 3
    new Setting(containerEl)
      .setName('Level 3 Tag')
      .setDesc('Subgroup tag (e.g. subcategory)')
      .addText(text => text
        .setPlaceholder('subcategory')
        .setValue(this.plugin.settings.level3)
        .onChange(async (value) => {
          this.plugin.settings.level3 = value.trim() || 'subcategory';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Table Spacing
    new Setting(containerEl)
      .setName('Table Spacing')
      .setDesc('Spacing between multiple area tables (e.g. 2rem, 20px)')
      .addText(text => text
        .setPlaceholder('2rem')
        .setValue(this.plugin.settings.table_spacing)
        .onChange(async (value) => {
          this.plugin.settings.table_spacing = value.trim() || '2rem';
          setWikiKitCSSProperties(this.plugin);
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Vault Map Settings Section
    containerEl.createEl('h3', { text: 'Vault Map Settings' });
    
    // Collection Tag
    new Setting(containerEl)
      .setName('Collection Tag')
      .setDesc('Tag used to identify collection pages (e.g. zettel/collection)')
      .addText(text => text
        .setPlaceholder('zettel/collection')
        .setValue(this.plugin.settings.vaultmap_collection_tag)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_collection_tag = value.trim() || 'zettel/collection';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Topic Tag
    new Setting(containerEl)
      .setName('Topic Tag')
      .setDesc('Tag used to identify topic pages (e.g. zettel/topic)')
      .addText(text => text
        .setPlaceholder('zettel/topic')
        .setValue(this.plugin.settings.vaultmap_topic_tag)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_topic_tag = value.trim() || 'zettel/topic';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Exclude Folders
    new Setting(containerEl)
      .setName('Exclude Folders')
      .setDesc('Comma-separated list of folder names to exclude from vault map (e.g. templates,archive,drafts)')
      .addText(text => text
        .setPlaceholder('templates,archive,drafts')
        .setValue(this.plugin.settings.vaultmap_exclude_folders)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_exclude_folders = value.trim() || '';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Track Tags
    new Setting(containerEl)
      .setName('Track Tags')
      .setDesc('Comma-separated list of tag prefixes to count in topics table (e.g. status,context,lens)')
      .addText(text => text
        .setPlaceholder('status,context,lens')
        .setValue(this.plugin.settings.vaultmap_track_properties)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_track_properties = value.trim() || 'status,context,lens';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Status Enabled
    new Setting(containerEl)
      .setName('Enable Status Tracking')
      .setDesc('Show status column in vault map tables')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.vaultmap_status_enabled)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_status_enabled = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Status Property
    new Setting(containerEl)
      .setName('Status Property')
      .setDesc('If you tag like status/draft or status/active, then specify "status" here')
      .addText(text => text
        .setPlaceholder('status')
        .setValue(this.plugin.settings.vaultmap_status_property)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_status_property = value.trim() || 'status';
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Show Metadata
    new Setting(containerEl)
      .setName('Show Metadata')
      .setDesc('Display created date, status, and other metadata in vault map tables')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.vaultmap_show_metadata)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_show_metadata = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Sort By
    new Setting(containerEl)
      .setName('Default Sort Order')
      .setDesc('How to sort collections and topics by default')
      .addDropdown(dropdown => dropdown
        .addOption('created', 'Created Date (Newest First)')
        .addOption('modified', 'Modified Date (Newest First)')
        .addOption('name', 'Name (Alphabetical)')
        .addOption('status', 'Status')
        .setValue(this.plugin.settings.vaultmap_sort_by)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_sort_by = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Group By
    new Setting(containerEl)
      .setName('Default Grouping')
      .setDesc('How to group content in the vault map')
      .addDropdown(dropdown => dropdown
        .addOption('area', 'By Area')
        .addOption('status', 'By Status')
        .addOption('none', 'No Grouping')
        .setValue(this.plugin.settings.vaultmap_group_by)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_group_by = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Compact View
    new Setting(containerEl)
      .setName('Default Compact View')
      .setDesc('Use compact overview layout instead of detailed tables by default')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.vaultmap_compact_view)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_compact_view = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Shorten Tracked Tag Names
    new Setting(containerEl)
      .setName('Shorten Tracked Tag Names')
      .setDesc('If enabled, only the last part of each tracked tag (e.g. "Atom" from "zettel/atom") will be shown as the column name in the topics table.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.vaultmap_shorten_tracked_tags)
        .onChange(async (value) => {
          this.plugin.settings.vaultmap_shorten_tracked_tags = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
    
    // Max Collection Rows
    new Setting(containerEl)
      .setName('Max Collection Rows')
      .setDesc('Maximum number of collection rows to display before making the table scrollable (default: 10)')
      .addText(text => text
        .setPlaceholder('10')
        .setValue(String(this.plugin.settings.vaultmap_max_collection_rows || 10))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.vaultmap_max_collection_rows = num;
            await this.plugin.saveData(this.plugin.settings);
          }
        })
        .inputEl.setAttr('type', 'number')
      );
    
    // Max Topic Rows
    new Setting(containerEl)
      .setName('Max Topic Rows')
      .setDesc('Maximum number of topic rows to display before making the table scrollable (default: 15)')
      .addText(text => text
        .setPlaceholder('15')
        .setValue(String(this.plugin.settings.vaultmap_max_topic_rows || 15))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.vaultmap_max_topic_rows = num;
            await this.plugin.saveData(this.plugin.settings);
          }
        })
        .inputEl.setAttr('type', 'number')
      );
    
    // Helpful note about refreshing
    containerEl.createEl('div', { 
      text: '💡 Tip: Vault Map settings changes require refreshing the page view to take effect. Switch to another note and back.',
      cls: 'setting-item-description wikikit-settings-note'
    });
  }
}

