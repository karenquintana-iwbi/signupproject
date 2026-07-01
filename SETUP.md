# IWBI Summer Workshop Signup — setup

The live site lives in `docs/` (plain HTML/CSS/JS, no build step). `project/` is
the original Claude Design export kept for reference — it's not deployed.

## 1. Point submissions at your Google Sheet

1. Open the Google Sheet you want responses to land in.
2. **Extensions → Apps Script**, and replace the default code with:

   ```js
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     const d = JSON.parse(e.postData.contents);
     const picks = d.picks || [];
     sheet.appendRow([
       new Date(d.submittedAt || Date.now()),
       d.email,
       picks.map((p) => p.rank + ". " + p.workshop + " (" + p.track + ")").join("\n"),
     ]);
     return ContentService.createTextOutput("ok");
   }
   ```

3. **Deploy → New deployment → Web app.**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the resulting Web App URL (ends in `/exec`).
5. In `docs/app.js`, set:

   ```js
   const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycb.../exec";
   ```

6. Commit and push. No further code changes are needed — the form POSTs
   directly from the visitor's browser to that URL.

   Note: the request uses `mode:"no-cors"`, so the browser can't read a
   response back (Apps Script web apps don't return CORS headers). That's
   fine — the row still lands in the Sheet. The confirmation screen and its
   "Copy summary" button don't depend on reading that response.

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
