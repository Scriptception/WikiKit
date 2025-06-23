// wikikit-plugin/main.js
const { Plugin } = require("obsidian");
const fs = require("fs");
const path = require("path");

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

module.exports = class WikiKitPlugin extends Plugin {
  async onload() {
    console.log("WikiKit Plugin loaded ✅");

    // --- Infobox Block Processor ---
    this.registerMarkdownCodeBlockProcessor("infobox", async (source, el, ctx) => {
      const overrides = parseSimpleBlock(source);

      const file = ctx.sourcePath;
      const cache = this.app.metadataCache.getCache(file) || {};
      const frontmatter = cache.frontmatter || {};

      const excludeKeys = new Set(
        ["tags", "aliases", "file", "position", "created", "updated", "Source"]
          .concat((overrides.exclude || "").split(/[\,\n]/).map(k => k.trim().toLowerCase()))
      );

      const originalFileName = file.replace(/^[^/]*[\\/]/, '').replace(/\.md$/, '');
      let displayName = overrides.title || frontmatter.title || originalFileName;

      if (overrides.strip_title !== "false") {
        displayName = displayName.replace(/^.*? - /, '');
      }

      // --- Image handling ---
      let src = null;
      const imageName = overrides.image;
      if (imageName && imageName.startsWith("http")) {
        src = imageName;
      } else {
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

      const rows = overrides.hidetable === "true" ? "" : Object.entries(frontmatter)
        .filter(([k]) => !excludeKeys.has(k.toLowerCase()))
        .map(([k, v]) => {
          const label = k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          const display = v != null ? v.toString() : "—";
          return `<tr><td><strong>${label}</strong></td><td>${display}</td></tr>`;
        })
        .join("");

      const infoboxEl = document.createElement("div");
      infoboxEl.className = "infobox-float callout";
      infoboxEl.setAttribute("data-callout", "infobox");
      infoboxEl.innerHTML = `
        <div class="callout-title">${displayName}</div>
        ${src ? `<img src="${src}" style="width:100%;border-radius:6px;margin:0.75em 0;" />` : ""}
        ${overrides.caption ? `<div class="infobox-caption">${overrides.caption}</div>` : ""}
        ${rows ? `<div class="infobox-section-header">Details</div><table>${rows}</table>` : ""}
      `;

      const wrapper = document.createElement("div");
      wrapper.className = "infobox-wrapper";
      wrapper.setAttribute("style", "float: right; clear: right; width: 320px; margin-left: 2rem; margin-bottom: 1.5rem;");
      wrapper.appendChild(infoboxEl);
      el.parentElement.insertBefore(wrapper, el);
      el.style.display = "none";
    });

    // --- EntityTable Block Processor ---
    this.registerMarkdownCodeBlockProcessor("tagtable", async (source, el, ctx) => {
      const overrides = parseSimpleBlock(source);

      const level1 = overrides.level1?.toLowerCase() || "entity";
      const level2 = overrides.level2?.toLowerCase() || "type";
      const level3 = overrides.level3?.toLowerCase() || "subtype";

      const currentFile = ctx.sourcePath;
      const currentCache = this.app.metadataCache.getCache(currentFile);
      const currentFrontmatter = currentCache?.frontmatter || {};
      const currentTags = (currentFrontmatter.tags || []).map(t => t.toLowerCase());

      const targetEntityTag = currentTags.find(tag => tag.startsWith(`${level1}/`));
      if (!targetEntityTag) {
        el.innerHTML = "<p><em>No Entity tag found on this page.</em></p>";
        return;
      }

      const pages = this.app.vault.getMarkdownFiles();
      const groupedData = {};

      for (const page of pages) {
        const cache = this.app.metadataCache.getCache(page.path);
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
        title = title.replace(/^.*? - /, '');

        groupedData[type][sub].push({
          name: title,
          path: page.path
        });
      }

      const title = targetEntityTag.split("/").slice(-1)[0].replace(/\b\w/g, c => c.toUpperCase());

      const tableWrapper = document.createElement("div");
      tableWrapper.className = "tagtable-wrapper";
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
            .map(e => `<a href="#" data-href="${e.path}">${e.name}</a>`)
            .join(" · ");

          row.appendChild(subCell);
          row.appendChild(entriesCell);
          table.appendChild(row);
        }
      }

      tableWrapper.appendChild(table);
      el.appendChild(tableWrapper);

      tableWrapper.querySelectorAll("a[data-href]").forEach(link => {
        link.addEventListener("click", (evt) => {
          evt.preventDefault();
          const targetPath = link.getAttribute("data-href");
          const targetFile = this.app.vault.getAbstractFileByPath(targetPath);
          if (targetFile) {
            this.app.workspace.openLinkText(
              this.app.metadataCache.fileToLinktext(targetFile, ctx.sourcePath),
              ctx.sourcePath
            );
          }
        });
      });
    });

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
          "level1: Entity",
          "level2: Type",
          "level3: SubType",
          "```"
        ].join("\n");
        editor.replaceSelection(block + "\n");
      }
    });

    this.injectStyles();
  }

  onunload() {
    console.log("WikiKit Plugin unloaded 🛃");
  }

  injectStyles() {
    const pluginPath = this.app.vault.adapter.basePath
      ? path.join(this.app.vault.adapter.basePath, ".obsidian", "plugins", this.manifest.id)
      : "";

    const cssPath = path.join(pluginPath, "styles.css");

    try {
      const css = fs.readFileSync(cssPath, "utf8");
      const styleTag = document.createElement("style");
      styleTag.id = "wikikit-plugin-styles";
      styleTag.textContent = css;
      document.head.appendChild(styleTag);
      console.log("✅ WikiKit CSS injected");
    } catch (err) {
      console.warn("⚠️ No WikiKit styles.css found (skipping)");
    }
  }
};

