# IWBI Summer Workshop Signup — setup

The live site lives in `docs/` (plain HTML/CSS/JS, no build step). `project/` is
the original Claude Design export kept for reference — it's not deployed.

## 1. Point submissions at your Google Sheet

Target: **IWBI Summer Workshops Tracker**
(`https://docs.google.com/spreadsheets/d/1Xn2vv8IGRkSf5JKayIixiQtk-WPB8dnZMunemyv2xsg`).

That spreadsheet's existing tab holds sponsor/anchor-attendee planning data —
the same info the signup form is deliberately designed to keep hidden from
staff. So submissions go to their **own tab, `Signups`**, not the planning
tab. The script below creates that tab automatically (with a header row) the
first time it runs, so there's nothing to set up by hand in the sheet itself.

1. Open the tracker spreadsheet → **Extensions → Apps Script**.
2. Replace the default code with:

   ```js
   const SPREADSHEET_ID = "1Xn2vv8IGRkSf5JKayIixiQtk-WPB8dnZMunemyv2xsg";
   const SHEET_NAME = "Signups";

   function doPost(e) {
     const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
     let sheet = ss.getSheetByName(SHEET_NAME);
     if (!sheet) {
       sheet = ss.insertSheet(SHEET_NAME);
       sheet.appendRow(["Submitted at", "Email", "Rank", "Workshop", "Track"]);
     }
     const d = JSON.parse(e.postData.contents);
     (d.picks || []).forEach((p) => {
       sheet.appendRow([d.submittedAt || new Date().toISOString(), d.email, p.rank, p.workshop, p.track]);
     });
     return ContentService.createTextOutput("ok");
   }
   ```

   (One row per pick, so you can pivot/sort by workshop to see popularity
   across all four ranks — not just first choices.)

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

I don't have Apps Script deployment access from here (only read access to
Drive), so steps 1–4 need to happen in your (or Shekhar's) browser — but the
script above is copy-paste ready with the spreadsheet ID already filled in.
Send me the `/exec` URL once you have it and I'll drop it into `app.js` and
commit.

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
