# IWBI Summer Workshop Signup — setup

The live site lives in `docs/` (plain HTML/CSS/JS, no build step). `project/` is
the original Claude Design export kept for reference — it's not deployed.

## 1. Set up Google Sign-In (Google Cloud Console)

The form verifies the submitter's identity with "Sign in with Google,"
restricted to `wellcertified.com` accounts — this replaces the old free-text
email field, which had no way to confirm someone actually owned the address
they typed. This step creates the credential that verification depends on,
and only you (or someone with access to your Google Cloud/Workspace account)
can do it — I don't have access to create it from here.

1. Go to [console.cloud.google.com](https://console.cloud.google.com), signed
   in as your `@wellcertified.com` account. Create a project (or reuse one),
   e.g. "IWBI Summer Workshop Signup."
2. **APIs & Services → OAuth consent screen** → User type **Internal**. This
   should be available since the project is under a Workspace account — it
   restricts sign-in to `wellcertified.com` accounts at Google's own login
   screen, and skips Google's app-verification review entirely. *If your
   Workspace admin has restricted who can create OAuth consent screens,
   you'll need IT to grant that or set this up for you.* The default
   `openid`/`email`/`profile` scopes are all that's needed — no extra scope
   review.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   → Application type **Web application**.
   - **Authorized JavaScript origins**: add `https://karenquintana-iwbi.github.io`
     (origin only — scheme + host, no `/signupproject` path). Add
     `http://localhost:8000` too if you ever want to test locally.
   - **Authorized redirect URIs**: leave empty — this flow returns the
     credential straight to the page via a JS callback, not a redirect.
   - Save, then copy the **Client ID** (ends in `.apps.googleusercontent.com`).
     It's safe to paste into public client-side code — it's not a secret.
     Ignore the "Client secret" field; this flow never uses it.
4. Paste that same Client ID in **two places**, exactly matching:
   - `docs/app.js` → `const GOOGLE_CLIENT_ID = "...";`
   - The Apps Script below → `const GOOGLE_CLIENT_ID = "...";`

## 2. Point submissions at your Google Sheet

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
directly, not just through the form. The script no longer trusts a raw
`email` field sent by the client at all: it takes the Google ID token the
Sign-In button produced and re-verifies it with Google's own `tokeninfo`
endpoint before writing anything, checking that the token was minted for
*this* app (`aud`), for a verified `wellcertified.com` account (`hd`), and
hasn't expired. Verification failures are logged to a separate **`Rejected`**
tab (reason + whatever email claim was present, never the raw token itself)
instead of silently vanishing — since the client can't read the response
here (see the `no-cors` note below), that tab is the only way to notice a
rejected submission after the fact. It also still neutralizes spreadsheet
formula injection (a value like `=IMPORTXML(...)` in any field, which Sheets
would otherwise execute as a live formula the next time someone opens the
tab) by prefixing any cell value that starts with `=`, `+`, `-`, or `@` with
a leading apostrophe so Sheets always stores it as plain text.

1. Open the tracker spreadsheet → **Extensions → Apps Script**.
2. Replace the code with:

   ```js
   const SPREADSHEET_ID = "1Xn2vv8IGRkSf5JKayIixiQtk-WPB8dnZMunemyv2xsg";
   const SHEET_NAME = "Signups";
   const REJECTED_SHEET_NAME = "Rejected";
   const HEADER = ["Submitted at", "Email", "Time zone", "Rank 1", "Rank 2", "Rank 3", "Rank 4"];
   const GOOGLE_CLIENT_ID = "PASTE-SAME-CLIENT-ID-AS-DOCS-APP-JS.apps.googleusercontent.com";
   const HD_DOMAIN = "wellcertified.com";
   const EMAIL_DOMAIN = "@wellcertified.com"; // defense-in-depth fallback, see note below

   function sanitizeCell(v) {
     const s = String(v == null ? "" : v);
     return /^[=+\-@]/.test(s) ? "'" + s : s;
   }

   // Verifies a Google ID token against Google's own endpoint rather than
   // trusting the client-supplied email — Apps Script has no JWT/JWKS library,
   // and tokeninfo already checks the signature and expiry for us.
   function verifyGoogleIdToken(idToken) {
     if (!idToken) return { error: "missing_token" };
     const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
     let resp;
     for (let attempt = 0; attempt < 3; attempt++) {
       try {
         resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
         break;
       } catch (err) {
         if (attempt === 2) return { error: "network_error", details: err.message };
         Utilities.sleep(300 * (attempt + 1));
       }
     }
     if (resp.getResponseCode() !== 200) return { error: "invalid_or_expired_token" };
     const info = JSON.parse(resp.getContentText());
     if (info.aud !== GOOGLE_CLIENT_ID) return { error: "client_id_mismatch" };
     if (String(info.email_verified) !== "true") return { error: "email_not_verified", details: info.email };
     if (info.hd !== HD_DOMAIN) return { error: "wrong_domain", details: info.email };
     const email = String(info.email || "").trim().toLowerCase();
     if (!email.endsWith(EMAIL_DOMAIN)) return { error: "domain_suffix_check_failed", details: email };
     return { email: email };
   }

   function logRejected(reason, details) {
     const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
     let sheet = ss.getSheetByName(REJECTED_SHEET_NAME);
     if (!sheet) {
       sheet = ss.insertSheet(REJECTED_SHEET_NAME);
       sheet.appendRow(["Logged at", "Reason", "Details"]);
     }
     sheet.appendRow([new Date().toISOString(), reason, details || ""].map(sanitizeCell));
   }

   function doPost(e) {
     try {
       const d = JSON.parse(e.postData.contents);
       const verified = verifyGoogleIdToken(String(d.idToken || ""));
       if (!verified.email) {
         logRejected(verified.error, verified.details);
         return ContentService.createTextOutput("rejected: " + verified.error);
       }
       const email = verified.email;

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

   `EMAIL_DOMAIN` is kept as a cheap fallback check even though `HD_DOMAIN`
   (verified inside the signed token) is what actually closes the
   impersonation gap — nobody can forge `hd` inside a Google-signed token the
   way they could forge a raw `email` field in a POST body.

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
   fine for a successful submission — the row still lands in the Sheet, and
   the confirmation screen and "Copy summary" button don't depend on reading
   that response. It does mean a *rejected* submission still shows the same
   "You're in" confirmation to the visitor with no error — that's exactly
   why rejections are logged to the `Rejected` tab above, so you have a way
   to notice them after the fact.

I don't have Apps Script or Sheets write access from here (only read access
to Drive), so the paste-and-redeploy step needs to happen in your (or
Shekhar's) browser.

## 3. Host it on GitHub Pages

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
