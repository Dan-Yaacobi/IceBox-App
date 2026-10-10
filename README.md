# 🧊 IceBox

A freezer for your ideas. Jot ideas down in a second, file them into compartments, and track which ones you've thawed (started), served (shipped) or let melt (dropped). It replaces the ever-growing Google Doc.

## Features

- **Quick capture**: type in the top bar and press Enter. The idea goes into whichever compartment you're viewing, or *Unsorted*.
- **Compartments** (categories), nested as deep as you like, e.g. *Game development › Space shooter › UI*:
  - The sidebar shows them as a tree you can fold. Hover a compartment and press **+** to add a sub-compartment, or **⋯** to rename, recolour, move or delete it.
  - Inside a compartment, a breadcrumb trail shows where you are, and tiles list its sub-compartments; click one to go in. **+ Sub-compartment** lets you add several in a row.
  - Viewing a compartment also shows the ideas in its sub-compartments, and each card says where it's filed. Untick the checkbox to see only that level.
  - Deleting a compartment never loses anything: its ideas and sub-compartments move up one level.
- **Drag and drop**: drag a card onto any compartment in the sidebar, a tile or a breadcrumb to file it there. Drag a compartment onto another to nest it, or onto *All ideas* to make it top-level. Hovering a folded compartment while dragging unfolds it.
- **Statuses**: 🧊 Frozen → 🌡️ Thawing → 🍨 Served, plus 💧 Melted for ideas you've dropped. Click the chip on a card to move it forward.
- **Views**: *Cards* (filter by status, sort) or *Board* (one column per status; drag cards between columns).
- **Notes & tags** on each idea. Search covers titles, notes and tags; type `#tag` or click a tag to filter by it.
- **Shortcuts**: `n` focuses the capture bar, `/` focuses search, `Ctrl/⌘ + Enter` saves the editor, and `Esc` closes it.
- **Backup**: *Export* downloads a JSON file and *Import* restores one, which also moves your ideas between devices.
- Light and dark frosty themes that follow your OS setting, with gentle snowfall that turns off when reduced motion is on.

## Where your data lives

Ideas are saved in your browser's `localStorage`. You don't need a server, database or login. Each browser and device has its own freezer, so use Export/Import to back up or move your ideas.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Deploy

The app is a static Next.js app with no environment variables. On [Vercel](https://vercel.com/new), import the repo and click Deploy. It works on any host that runs Next.js.

## Project layout

```
src/
  app/            layout, page, global (ice) styles, favicon
  components/     IceBoxApp (main screen, breadcrumbs, sub-compartment tiles), Sidebar (tree),
                  IdeaCard, IdeaModal, DropZone, Snowfall
  lib/            types, reducer + storage, compartment tree helpers, drag state, theme, useIceBox hook
```
