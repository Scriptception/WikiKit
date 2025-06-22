
In preview mode, the plugin will render an infobox using frontmatter fields from the current file.

---

## ⚙️ Optional Parameters

You can override or add data using simple key-value syntax inside the code block:

```markdown
```infobox
title: Custom Title
image: my-image.png
caption: This is a caption below the image
exclude: updated, created
hideTable: false

fields:
  Status: Active
  Origin: Earth

sections:
  Features: |
    - Lightweight
    - Easy to use
  Notes: |
    Supports markdown and line breaks
```
```

---

## 🧠 Behavior

- Uses frontmatter fields unless `hideTable: true`.
- Additional `fields:` are rendered below frontmatter.
- `sections:` render custom titled content blocks.
- All parameters are optional.

---

## 🧵 Styling

Include a `styles.css` in your plugin folder to customize the appearance.

Example:

```css
.infobox-float {
  border-radius: 8px;
  background-color: var(--background-secondary);
  padding: 1em;
  margin: 1em 0;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

.infobox-section-header {
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.infobox-caption {
  font-style: italic;
  color: var(--text-muted);
  margin-bottom: 1em;
}
```

---

## ✅ Example

With frontmatter:

```yaml
---
title: Halo Reach
platform: Xbox 360
release: 2010
genre: FPS
---
```

And:

````markdown
```infobox
image: halo.jpg
caption: The Fall of Reach
fields:
  Developer: Bungie
sections:
  Trivia: |
    This was the final Halo game by Bungie.
```

