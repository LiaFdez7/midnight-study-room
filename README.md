# Midnight Study Room: standalone website (Stages 1–2)

**New in Stage 2:** the notebook connects to your Morning Brief. After publishing (Part 1 below), follow **STAGE-2-SETUP.md**.

This folder is your complete room, running on its own outside Claude.
Everything you can do in the Claude canvas works here too: books that open Canvas, the lamp, window, plant, drawers, femur reference panel, notebook, focus timer, study log, and Backup & restore.

## What's in this folder

| File | What it is |
| --- | --- |
| `index.html` | The room itself (illustration, styles and logic) |
| `stage.css`, `stage.js` | Widens the scene to 16:10 and scales it to fit your window |
| `dc-runtime.js` | Lets the room's design file run outside Claude |
| `vendor/` | React, copied in so the room doesn't depend on other websites |
| `_source/` | The original room design file and the script that rebuilds `index.html` from it. GitHub Pages doesn't publish this folder. |
| `_setup/Code.gs` | The room connector you paste into your Google Sheet (see STAGE-2-SETUP.md). Not published. |
| `STAGE-2-SETUP.md` | Step-by-step guide to connect the Morning Brief |

---

## Part 1 · Put the room on the web with a permanent address (about 10 minutes)

We'll use **GitHub Pages**: it's free, it gives you a permanent `https://` address, and later (Stage 3) that address can be installed as a Windows app.

1. **Unzip this folder** on your laptop (right-click the .zip → *Extract All…*).
2. Go to **github.com** and create a free account. Your username becomes part of your room's address, so choose one you'll keep.
3. Click the **+** at the top right → **New repository**.
   - Repository name: `midnight-study-room`
   - Choose **Public**. (On a free account, GitHub Pages needs a public repository. Only the room's *code* is public. Your tasks and study history live in your own browser and are never uploaded.)
   - Click **Create repository**.
4. On the next page, click the link **"uploading an existing file"**.
5. Open the unzipped `midnight-study-room` folder, select **everything inside it** (Ctrl + A), and drag it into the GitHub page. Drag the contents, not the folder itself.
6. Scroll down and click **Commit changes**.
7. In the repository, open **Settings → Pages** (in the left menu).
   Under **Build and deployment → Source**, choose **Deploy from a branch**, pick **main** and **/ (root)**, then click **Save**.
8. Wait 1–2 minutes and refresh that page. GitHub will show your address:
   **`https://YOUR-USERNAME.github.io/midnight-study-room/`**
9. Open it in **Microsoft Edge** and add it to your favorites.

> **Keep the address the same.** Your browser keeps your data separately for each website address. If you later rename the repository or your GitHub username, the room at the new address starts empty, and you'd need Backup & restore to bring your data over.

### Updating the room later
When Claude gives you new files, open the repository → **Add file → Upload files**, drag in the new files (same names), and click **Commit changes**. Your saved data isn't affected, because it lives in your browser, not in these files.

---

## Part 2 · Bring over your data from the Claude canvas (2 minutes)

Your browser keeps each website's saved data separately (by website address). **Data saved in the Claude canvas does not appear on your new website by itself.** Move it with Backup & restore:

1. Open the room in the **Claude canvas** and press **Play**.
2. Click the **bottom-right desk drawer** (Settings), then **Backup & restore** at the bottom.
3. Click **Copy backup**. (If the canvas can't copy, click inside the top box, press Ctrl + A, then Ctrl + C.)
4. Open your **new website**. Go to Settings drawer → **Backup & restore**.
5. Paste into the **Restore** box (Ctrl + V) and click **Restore**.

How Restore protects your data:
- It only **adds** things: missing tasks, missing Canvas links, saved links and study-log days. It never deletes or overwrites anything already in the room.
- Restoring the same backup twice changes nothing, so no duplicate tasks.
- Before each restore, the room quietly saves a copy of how it looked first (`midnight-study-room.v1.before-restore`).

If the canvas footer says it *can't save to browser storage*, the canvas never kept anything between visits, so there's nothing to bring over. Just start fresh on the website.

**Tip:** download a backup file every week or two (Backup & restore → **Download file**). If you ever clear your browser data, that file brings everything back.

---

## How it was tested
Before delivery, this exact folder was opened in a real Chromium browser at 1280 × 800 and 1536 × 960 (common 16:10 laptop sizes), and a test script clicked through it:
- Books: a book without a link opens Settings at that course. After you save a link, the book opens Canvas in a new tab and selects the course.
- Notebook: tasks can be added, edited, checked off and deleted.
- Desk objects: the lamp, window, plant, drawers (including closing with Escape) and the femur reference panel all respond.
- Timer: a 25-minute block is logged to the study log. A countdown keeps the right time across a page reload.
- Saving: everything is still there after a reload.
- Restore: a backup restored into a *different* website address merges without duplicates, and a bad paste is refused.
- Keyboard: every control can be reached with the Tab key.
- No errors in the browser console.
