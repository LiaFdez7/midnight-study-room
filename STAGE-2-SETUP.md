# Stage 2 · Connect the notebook to your Morning Brief (about 15 minutes, one time)

## How the pieces fit

```
Morning Brief (weekdays 7:47 AM)  ──writes tasks──▶  Google Sheet "Midnight Study Room · Tasks"
                                                           ▲            │
                                                     check-offs,     tasks
                                                     edits, minutes     ▼
                                                    Room connector (tiny script inside the sheet)
                                                           ▲            │
                                                           └── your study room (on your laptop)
```

- **Already done for you:** the sheet exists in your Google Drive, and your Morning Brief now writes tasks into it. It already did once, as a test.
- **What you do below:** install the *room connector* inside the sheet, then paste its link and key into the room.

---

## Part A · Install the room connector (8 minutes)

1. Open your sheet **Midnight Study Room · Tasks** (it's in your Google Drive).
2. In the menu, click **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete everything in the editor (`Ctrl + A`, then `Delete`).
4. Open the file **`_setup/Code.gs`** from this folder in Notepad, select everything (`Ctrl + A`, `Ctrl + C`), and paste it into the editor (`Ctrl + V`).
5. Click the **disk icon** (Save). If it asks for a project name, type `Room connector`.
6. In the toolbar, make sure the function box says **`setup`**, then click **Run**.
7. Google will ask for permission, because the script needs to read and write *this* sheet:
   - Click **Review permissions** → choose your account.
   - You'll see "Google hasn't verified this app." That's expected: the "app" is your own script, not someone else's. Click **Advanced → Go to Room connector (unsafe) → Allow**.
8. At the bottom, the **Execution log** shows `Your room key: …` (a long string of letters and numbers). Keep this tab open; you'll copy the key in Part C.
   (You can see the key again anytime: reload the sheet, then use the new menu **Midnight Study Room → Show my room key**.)

## Part B · Turn it on as a web link (3 minutes)

1. In the Apps Script tab, click **Deploy → New deployment**.
2. Click the **gear icon** next to "Select type" → **Web app**.
3. Fill in:
   - Description: `Room connector`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** (approve again if asked), then **copy the Web app URL**. It starts with `https://script.google.com/macros/s/` and ends with `/exec`.

> **Is "Anyone" safe?** The link only answers requests that include your private room key. Without the key it replies "not-authorized" and reveals nothing. The key is never in your website's code; it's saved only in your laptop's browser. Treat the key like a password: don't post it or share it.

## Part C · Connect the room (2 minutes)

1. Open your study room (your GitHub Pages address).
2. Click the **bottom-right desk drawer** (Settings) and scroll to **Morning Brief connection**.
3. Paste the **Web app URL** into *Room connector link* and the **room key** into *Room key*.
4. Click **Test connection**. You should see "Connected. Your sheet has N tasks."
5. Click **Save settings**. Your Morning Brief tasks appear in the notebook.

---

## How syncing behaves

| When | What happens |
| --- | --- |
| Weekdays 7:47 AM | The Morning Brief reads the sheet first (so it skips finished or dismissed work), then adds new tasks with permanent IDs. |
| You open the room | It pulls the latest tasks within a second or two. |
| You check off, edit, move or dismiss a task | Saved on your laptop right away, sent to the sheet about 1.5 s later. |
| A focus block ends while a task is selected | The minutes are added to that task (for example "25 / 50 min"). The task is **not** marked done; you decide when it's finished. |
| You're offline | Changes wait safely on your laptop and are sent when you're back online. |
| Every 5 minutes while the room is open | Quiet refresh. |

**Rules that protect your work**
- **No duplicates:** each task has a permanent ID, so syncing again never makes a copy.
- **Your changes come first:** the brief never changes a task you've touched in the room, or a task you typed yourself.
- **Finished stays finished:** done and dismissed tasks are never re-added.
- **The newest edit wins:** if the same task was changed in two places, the most recent change is kept.
- **Nothing is deleted:** dismissing hides a task instead of erasing it.

## Optional · Let the brief see Canvas due dates

Right now the brief finds FIU assignments through your Canvas notification emails. To give it every due date:
1. In Canvas, open **Calendar**, then click **Calendar Feed** (bottom right) and copy the link.
2. In Google Calendar, next to **Other calendars**, click **+ → From URL**, paste the link, and click **Add calendar**.

## Updating the connector later
If Claude gives you a new `Code.gs`: paste it over the old code, click Save, then **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. The link stays the same, so you don't need to change anything in the room.
