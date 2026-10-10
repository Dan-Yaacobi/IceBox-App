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

In a browser, ideas are saved in the browser's `localStorage`. In the Android app, they're saved in the app's own storage on the phone. You don't need a server, database or login. Each browser and device has its own freezer, so use Export/Import to back up or move your ideas. In the app, Export opens Android's share sheet, so you can save the backup to Drive or Files or send it to yourself.

## Android app (offline APK)

The same code is packaged as an Android app with [Capacitor](https://capacitorjs.com). The whole app lives inside the APK and works without internet.

**Install on your phone**

1. On the phone, open **https://github.com/Dan-Yaacobi/IceBox-App/releases/tag/android-latest** and tap **IceBox.apk**.
2. Android asks to allow installs from your browser ("Install unknown apps"). Allow it once, then tap **Install**.
3. To update later, download and install the newest `IceBox.apk` the same way. Your ideas are kept.

Every push to `main` or a `claude/**` branch builds a new APK in GitHub Actions (`.github/workflows/android.yml`) and replaces the file on that release.

**On the phone**
- Long-press a card or compartment, then drag it onto a compartment, tile, breadcrumb or board column. A quick tap still opens it.
- The back button closes the editor, then clears the search, then goes up one compartment level.

**Build it yourself** (needs JDK 21 and the Android SDK, e.g. via Android Studio)

```bash
npm run build:android                       # static export + copy into android/
cd android && ./gradlew assembleRelease     # → app/build/outputs/apk/release/app-release.apk
# or: npm run android:open                  # open the project in Android Studio
```

**Signing:** builds are signed with `android/app/icebox-sideload.keystore`, which is committed to the repo on purpose. Android only installs an update if it was signed with the same key as the installed app, so every build has to use the same key. That's fine for an app you sideload yourself. If this ever goes to the Play Store, switch to a private key kept out of the repo.

**Icons:** the source images are in `assets/`. After changing them, run `npm run android:icons`.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build   # static export to out/
```

## Deploy (web)

`next build` produces a fully static site in `out/` and needs no environment variables. On [Vercel](https://vercel.com/new), import the repo and click Deploy. You can also upload `out/` to any static host.

## Project layout

```
src/
  app/            layout, page, global (ice) styles, favicon
  components/     IceBoxApp (main screen, breadcrumbs, sub-compartment tiles), Sidebar (tree),
                  IdeaCard, IdeaModal, DropZone, Snowfall
  lib/            types, reducer + storage, compartment tree helpers, drag state, theme, useIceBox hook
```
