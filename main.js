// Import Obsidian plugin base class and Node.js utilities
const { Plugin } = require("obsidian");
const fs = require("fs");
const path = require("path");

// Parses simple "key: value" config blocks into an object
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

// Main plugin class
module.exports = class InfoboxPlugin extends Plugin {
  async onload() {
    console.log("Infobox Plugin loaded ✅");

    // Register a custom Markdown code block processor for ```infobox
    this.registerMarkdownCodeBlockProcessor("infobox", async (source, el, ctx) => {
      // Parse config options from the code block
      const overrides = parseSimpleBlock(source);

      // Get the current note file and its frontmatter
      const file = ctx.sourcePath;
      const cache = this.app.metadataCache.getCache(file) || {};
      const frontmatter = cache.frontmatter || {};

      // Determine keys to exclude from the info table
      const excludeKeys = new Set(
        ["tags", "aliases", "file", "position", "created", "updated", "Source"]
          .concat((overrides.exclude || "").split(/[\,\n]/).map(k => k.trim().toLowerCase()))
      );

      // Determine the display title
      const originalFileName = file.replace(/^[^/]*[\\/]/, '').replace(/\.md$/, '');
      let displayName = overrides.title || frontmatter.title || originalFileName;

      // Optionally strip prefix from title (e.g., "Project - Name" → "Name")
      if (overrides.strip_title !== "false") {
        displayName = displayName.replace(/^.*? - /, '');
      }

      // --- Image handling ---
      let src = null;
      const imageName = overrides.image;

      // Use external image if URL is provided
      if (imageName && imageName.startsWith("http")) {
        src = imageName;
      } else {
        // Search for a local image with supported extensions
        const supportedExtensions = ["png", "jpg", "jpeg", "webp", "gif"];
        const baseImageName = imageName || originalFileName;
        const attachmentFolder = this.app.vault.getConfig("attachmentFolderPath") || "";

        for (const ext of supportedExtensions) {
          const tryPath = `${attachmentFolder}/${baseImageName}.${ext}`;
          const fileObj = this.app.metadataCache.getFirstLinkpathDest(tryPath, file);
          if (fileObj) {
            src = this.app.vault.getResourcePath(fileObj);
            break;
          }
        }
      }

      // Generate HTML table rows from frontmatter
      const rows = overrides.hidetable === "true" ? "" : Object.entries(frontmatter)
        .filter(([k]) => !excludeKeys.has(k.toLowerCase()))
        .map(([k, v]) => {
          const label = k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          const display = v != null ? v.toString() : "—";
          return `<tr><td><strong>${label}</strong></td><td>${display}</td></tr>`;
        })
        .join("");

      // Create the main infobox element
      const infoboxEl = document.createElement("div");
      infoboxEl.className = "infobox-float callout";
      infoboxEl.setAttribute("data-callout", "infobox");
      infoboxEl.innerHTML = `
        <div class="callout-title">${displayName}</div>
        ${src ? `<img src="${src}" style="width:100%;border-radius:6px;margin:0.75em 0;" />` : ""}
        ${overrides.caption ? `<div class="infobox-caption">${overrides.caption}</div>` : ""}
        ${rows ? `<div class="infobox-section-header">Details</div><table>${rows}</table>` : ""}
      `;

      // Wrap the infobox and insert it before the original code block
      const wrapper = document.createElement("div");
      wrapper.className = "infobox-wrapper";
      wrapper.setAttribute("style", "float: right; clear: right; width: 320px; margin-left: 2rem; margin-bottom: 1.5rem;");
      wrapper.appendChild(infoboxEl);
      el.parentElement.insertBefore(wrapper, el);

      // Hide the original code block
      el.style.display = "none";
    });

    // Register a command to insert a sample infobox block
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

    // Load the plugin's CSS from styles.css
    this.injectStyles();
  }

  // Called when the plugin is disabled or reloaded
  onunload() {
    console.log("Infobox Plugin unloaded 🛃");
  }

  // Load and inject custom styles from the plugin's styles.css file
  injectStyles() {
    const pluginPath = this.app.vault.adapter.basePath
      ? path.join(this.app.vault.adapter.basePath, ".obsidian", "plugins", this.manifest.id)
      : "";

    const cssPath = path.join(pluginPath, "styles.css");

    try {
      const css = fs.readFileSync(cssPath, "utf8");
      const styleTag = document.createElement("style");
      styleTag.id = "infobox-plugin-styles";
      styleTag.textContent = css;
      document.head.appendChild(styleTag);
      console.log("✅ Infobox CSS injected");
    } catch (err) {
      console.warn("⚠️ No infobox styles.css found (skipping)");
    }
  }
};

