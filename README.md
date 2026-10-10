# 🧊 IceBox

A freezer for your ideas. Jot ideas down in a second, file them into compartments, and track which ones you've thawed (started), served (shipped) or let melt (dropped). It replaces the ever-growing Google Doc.

## How it works

The app has one clean screen per place, like a file browser:

- **Capture first.** Every screen opens with the "Got an idea?" box. Type an idea and press Enter, and it's frozen into the compartment you're in.
- **Compartments**, nested as deep as you like (e.g. *Game development › Space shooter › UI*), look like a chest of drawers. Tap one to pull it open. Its front shows the name, what's inside, and **Add compartment / Edit / Delete** buttons, and its contents sit in the tray below. The **‹ back** link at the top slides it shut and takes you up a level.
- **Statuses:** 🧊 Frozen (for later), 🌡️ Thawing (in progress), 🍨 Served (done) and 💧 Melted (dropped). Served and melted ideas tuck away under **Show finished**.
- **Editing:** tap an idea to edit its title, notes and #tags. Its compartment and status are two tappable pills. Changes save as you type.
- **Selecting:** long-press a compartment or idea, or tap **Select**, then tap more to add them. A **Delete** button appears at the bottom.
- **Deleting a compartment** that has anything inside asks what to do: **Delete everything inside too** (all nested compartments and ideas), or **Keep what's inside** (contents move up one level).
- **The ⋯ menu** on the home screen holds Export/Import backup.
- **Search** (magnifier icon) looks everywhere. Start with `#` to search tags.
- **Drag and drop:** drag an idea or compartment onto a compartment row to file it there, or onto the back link to move it up. On touch screens, long-press first.
- **Shortcuts** (desktop): `n` focuses the capture box, `/` opens search, `Esc` closes things.

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
- Long-press an idea or compartment, then drag it onto a compartment row or the back link. A quick tap still opens it.
- The back button closes whatever is open (editor, menu, search), then goes up one compartment level.

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
  components/     IceBoxApp (screens, menu, search), IdeaRow, CompartmentRow,
                  IdeaSheet, CompartmentSheet, Sheet/PillSelect, DropZone, Snowfall, icons
  lib/            types, reducer + storage, compartment tree helpers, drag state, theme, useIceBox hook
```
