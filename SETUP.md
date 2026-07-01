# IWBI Summer Workshop Signup — setup

The live site lives in `docs/` (plain HTML/CSS/JS, no build step). `project/` is
the original Claude Design export kept for reference — it's not deployed.

## 1. Point submissions at your Google Sheet

Target: **IWBI Summer Workshops Tracker**
(`https://docs.google.com/spreadsheets/d/1Xn2vv8IGRkSf5JKayIixiQtk-WPB8dnZMunemyv2xsg`).

That spreadsheet's existing tab holds sponsor/anchor-attendee planning data —
the same info the signup form is deliberately designed to keep hidden from
staff. So submissions go to their **own tab, `Signups`**, not the planning
tab. The script below creates that tab automatically if it doesn't exist yet,
and rewrites its header row on every submission — so if the tab already
exists with an older header (e.g. from a previous version of this script),
the next submission fixes it in place rather than leaving stale column
labels above new-format data.

The sheet holds **one row per email** — resubmitting (e.g. via "Edit my
picks") overwrites that person's existing row instead of adding a new one.
Each Rank column stores the workshop's short code (e.g. `T2.2`) from the
tracker's own `T#.#` numbering, not the full title, so it lines up directly
with the planning tab.

Because this endpoint has to be reachable from any visitor's browser with no
login, it's deployed with "Who has access: Anyone" — which also means anyone
who has the URL (visible in the page's public source) can POST to it
directly, not just through the form. The script below guards against the two
concrete risks that creates: it rejects submissions that aren't a
`@wellcertified.com` email, and it neutralizes spreadsheet formula injection
(a value like `=IMPORTXML(...)` sent as the email, which Sheets would
otherwise execute as a live formula the next time someone opens the tab) by
prefixing any cell value that starts with `=`, `+`, `-`, or `@` with a
leading apostrophe so Sheets always stores it as plain text.

1. Open the tracker spreadsheet → **Extensions → Apps Script**.
2. Replace the code with:

   ```js
   const SPREADSHEET_ID = "1Xn2vv8IGRkSf5JKayIixiQtk-WPB8dnZMunemyv2xsg";
   const SHEET_NAME = "Signups";
   const HEADER = ["Submitted at", "Email", "Time zone", "Rank 1", "Rank 2", "Rank 3", "Rank 4"];
   const EMAIL_DOMAIN = "@wellcertified.com";

   function sanitizeCell(v) {
     const s = String(v == null ? "" : v);
     return /^[=+\-@]/.test(s) ? "'" + s : s;
   }

   function doPost(e) {
     try {
       const d = JSON.parse(e.postData.contents);
       const email = String(d.email || "").trim().toLowerCase();
       if (!email.endsWith(EMAIL_DOMAIN)) {
         return ContentService.createTextOutput("rejected: email must be a " + EMAIL_DOMAIN + " address");
       }

       const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
       let sheet = ss.getSheetByName(SHEET_NAME);
       if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
       sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);

       const picks = d.picks || [];
       const row = [
         d.submittedAt || new Date().toISOString(),
         email,
         d.timezone || "",
         picks[0] ? picks[0].code : "",
         picks[1] ? picks[1].code : "",
         picks[2] ? picks[2].code : "",
         picks[3] ? picks[3].code : "",
       ].map(sanitizeCell);

       const dataRows = sheet.getLastRow() - 1;
       const emails = dataRows > 0 ? sheet.getRange(2, 2, dataRows, 1).getValues() : [];
       const existingRow = emails.findIndex((r) => r[0] === email);
       if (existingRow >= 0) {
         sheet.getRange(existingRow + 2, 1, 1, row.length).setValues([row]);
       } else {
         sheet.appendRow(row);
       }

       return ContentService.createTextOutput("ok");
     } catch (err) {
       return ContentService.createTextOutput("error: " + err.message);
     }
   }
   ```

3. **Deploy → Manage deployments → pick the existing web app deployment →
   Edit (pencil icon) → Version: New version → Deploy.**
   Using "New version" on the existing deployment (rather than creating a
   brand-new one) keeps the same `/exec` URL, so `docs/app.js`'s
   `SHEET_ENDPOINT` doesn't need to change.

   If there's no existing deployment yet, use **Deploy → New deployment →
   Web app** instead, with:
   - Execute as: **Me**
   - Who has access: **Anyone**

   and copy the resulting `/exec` URL into `docs/app.js`'s `SHEET_ENDPOINT`.

   Note: the request uses `mode:"no-cors"`, so the browser can't read a
   response back (Apps Script web apps don't return CORS headers). That's
   fine — the row still lands in the Sheet. The confirmation screen and its
   "Copy summary" button don't depend on reading that response.

I don't have Apps Script or Sheets write access from here (only read access
to Drive), so the paste-and-redeploy step needs to happen in your (or
Shekhar's) browser.

## 2. Host it on GitHub Pages

This repo is already laid out for Pages: the site is a static folder at
`docs/` on `main`.

1. GitHub → **Settings → Pages**.
2. **Build and deployment → Source: Deploy from a branch.**
3. **Branch: `main`, folder: `/docs`** → **Save**.
4. GitHub publishes it at `https://<org-or-user>.github.io/<repo>/` within a
   few minutes.

GitHub Pages only serves static files — it has no server-side code — but
that's all this form needs. The Google Sheet connection happens client-side
(the visitor's browser calls the Apps Script URL directly), so it works
identically on GitHub Pages, Netlify, or any other static host.

If you'd rather hand this to Shekhar for Netlify: point Netlify's publish
directory at `docs/` with no build command, and the same `SHEET_ENDPOINT`
setup above applies unchanged.
