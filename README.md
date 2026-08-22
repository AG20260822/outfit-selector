# index · outfit selector

A small personal wardrobe/outfit selector.

## Project structure

- `index.html` — page structure
- `styles.css` — visual styling
- `app.js` — outfit-generation and interaction logic
- `wardrobe.json` — the wardrobe list (edit this when adding/removing pieces)
- `assets/` — wardrobe photos

## Adding a wardrobe item

1. Add the item's photo to `assets/`.
2. Add one object to `wardrobe.json` with a unique `id`, a `name`, a `type`, a short `note`, and the image path.
3. Commit the changes.

Types currently used: `accessory`, `top`, `bottom`, `layer`, `shoes`.

## Removing an item

Remove its object from `wardrobe.json` and remove its image from `assets/` if it is no longer needed.

## Publishing

This is a static site. It can be connected to Netlify so every commit to the main branch automatically publishes the latest version.

## Important

The current feedback and unavailable-item state are stored in the browser with `localStorage`. This is intentional for the MVP; it can be moved to a database later if needed.
