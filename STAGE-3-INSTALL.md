# Stage 3 · Midnight Study Room as a Windows app

The room is now a **Progressive Web App**: Microsoft Edge can install it like a normal Windows program, with its own icon, window, taskbar and Start menu entries. It keeps working without internet.

## What's new

| Feature | How it works |
| --- | --- |
| Illustrated app icon | Arched window, crescent moon and books, in all the sizes Windows uses |
| Own window | Opens without Edge's tabs or address bar |
| Taskbar & Start menu | Right-click the taskbar icon for **Open my notebook**, **Start a focus block**, **Study log** |
| Start at sign-in | Optional, chosen when you install (or later in `edge://apps`) |
| Works offline | The whole room, its fonts and your saved data open with no internet. Tasks you add or check off offline are sent to your sheet automatically when you reconnect. |
| Windows notification | Optional: Settings drawer → Focus timer → "Also show a Windows notification…" |
| Quiet updates | When you upload a new version to GitHub, the app switches to it the next time it's minimized, so nothing you're typing is interrupted |

**Your data:** the app uses the same address as your website (`liafdez7.github.io/midnight-study-room`), so it opens with the tasks, links and study history you already have. Nothing to move.

## Updating the website (once)
1. Extract `midnight-study-room-stage3.zip` and open the inner `midnight-study-room` folder.
2. On GitHub, open your repository → **Add file → Upload files** → select everything inside the folder (**Ctrl + A**) and drag it in. New folders `fonts` and `icons` and new files `manifest.webmanifest`, `sw.js` and `pwa.js` are added, and `index.html` is replaced.
3. **Commit changes**, then wait 1–2 minutes.

## Installing in Edge
1. Open `https://liafdez7.github.io/midnight-study-room/` in Edge and press **Ctrl + F5** once.
2. In the address bar, click the **App available** icon (a small square with a plus), then **Install**. If you don't see it, open the **… menu → Apps → Install this site as an app**.
3. In the "App installed" box, tick **Pin to taskbar**, **Pin to Start**, and **Auto-start on device login** if you want the room to open when you sign in. Then click **Allow**.

Change these later at `edge://apps`: find Midnight Study Room → **Details** (or right-click it).

## Good to know
- **When minimized**, Windows lets the app check its timer about once a minute, so a chime or notification can arrive up to a minute late. The minutes logged are always exact, because the timer uses real clock time.
- **Uninstalling** (`edge://apps` → Uninstall): **don't tick "Also clear data from Microsoft Edge"** unless you have a backup. Your tasks live in that data.
- **Test offline mode** by turning off Wi-Fi and opening the app from the taskbar.
