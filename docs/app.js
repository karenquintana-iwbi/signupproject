"use strict";

/**
 * IWBI Summer Workshop Signup
 *
 * ── Connect to Google Sheet ──────────────────────────────────
 * Paste your Google Apps Script Web App URL below and every
 * submission POSTs straight into the Sheet. Until it's set,
 * submit still works end-to-end (records the pick, shows the
 * confirmation screen with a copyable summary as a fallback).
 *
 * See SETUP.md for the Apps Script doPost snippet and step-by-step
 * deployment instructions.
 */
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbzfoFYsnLqj3Ia9Mg2fM7lnj2SaiogswNfjFCjvknAY4ONoN1yR54h4qdW1ObBkn9iFLg/exec";

const TRACK1 = [
  { title: "A truly integrated product needs a fully integrated team", desc: "Designing the team structure, roles, and collaboration model that let product, tech, and standards operate as one fully integrated unit." },
  { title: "Globalization for maximum impact", desc: "Global-first principles — what we standardize, what we adapt locally, and how we scale adoption worldwide rather than expanding out from the U.S." },
  { title: "The ties that bind", desc: "The operating model, governance, and hand-offs that let a small team move fast, stay aligned, and deliver an exceptional customer experience." },
  { title: "IWBI is all in", desc: "Turning everything Track 01 uncovers into a future-state org design — leadership roles, accountabilities, and a priority hiring roadmap." },
];

const SIGNUP = [
  { num: "02", name: "Health Intelligence as the Compass", accent: "#149ebd",
    question: "What does it mean to be the world's premier health intelligence platform — and what's the 2–4 year vision we're building toward?",
    workshops: [
      { id: "t2w1", code: "WORKSHOP 1", sheetCode: "T2.1", title: "Health intelligence as a service", sponsor: "Andre",
        prompt: "What would health intelligence as a service actually do for a client?",
        teaser: "A client-facing experience that turns health data into decisions." },
      { id: "t2w2", code: "WORKSHOP 2", sheetCode: "T2.2", title: "Good data in, good data out", sponsor: "Karen",
        prompt: "How will we partner with building performance and occupant experience partners to generate value and meaning from bidirectional data?",
        teaser: "A new shape for how partners exchange — and are rewarded for — data." },
      { id: "t2w3", code: "WORKSHOP 3", sheetCode: "T2.3", title: "Responsible AI and spatial intelligence", sponsor: "Jodie",
        prompt: "How will IWBI establish itself as the leader of responsible AI in the built environment?",
        teaser: "A framework for human-centric, responsible AI inside the WELL Standard." },
    ] },
  { num: "03", name: "One WELL as the Foundation", accent: "#17aa8d",
    question: "How are we strengthening our core product to deliver on our vision for health intelligence?",
    workshops: [
      { id: "t3w1", code: "WORKSHOP 1", sheetCode: "T3.1", title: "Calculating your return on WELL", sponsor: "Xue Ya & Minjia",
        prompt: "How will we help our customers calculate the ROI of their participation in WELL — down to the asset level?",
        teaser: "A credible way to put a real number on the value of WELL." },
      { id: "t3w2", code: "WORKSHOP 2", sheetCode: "T3.2", title: "Instilling confidence and inspiring action", sponsor: "Kate",
        prompt: "How can we help prospects learn and enroll with confidence?",
        teaser: "A guided experience that helps prospects choose with confidence." },
      { id: "t3w3", code: "WORKSHOP 3", sheetCode: "T3.3", title: "Celebrating progress", sponsor: "Priscilla & Liz P.",
        prompt: "Beyond formal WELL achievements, how do we recognize ongoing progress — and amplify the post-achievement moments?",
        teaser: "New ways to recognize momentum between the big milestones." },
    ] },
  { num: "04", name: "Market Enablement at Scale", accent: "#0f748a",
    question: "How will we fully activate our extended global ecosystem to drive growth?",
    workshops: [
      { id: "t4w1", code: "WORKSHOP 1", sheetCode: "T4.1", title: "Who sells WELL over time?", sponsor: "Kate",
        prompt: "As WELL becomes a continuous discipline, how do the roles of our professionals and providers evolve — and how do we bring them along?",
        teaser: "A picture of how our professional community grows alongside us." },
      { id: "t4w2", code: "WORKSHOP 2", sheetCode: "T4.2", title: "Where Works with WELL meets One WELL", sponsor: "Sian",
        prompt: "When WELL becomes a continuous data layer rather than a checklist, how do products and providers stay discoverable, validated, and valuable?",
        teaser: "A model that keeps providers discoverable, validated, and valuable." },
      { id: "t4w3", code: "WORKSHOP 3", sheetCode: "T4.3", title: "The market transformation playbook", sponsor: "Jason",
        prompt: "How can IWBI sharpen its theory of market transformation, particularly around persistent market asymmetries?",
        teaser: "Bold new market tools that reach beyond WELL itself." },
      { id: "t4w4", code: "WORKSHOP 4", sheetCode: "T4.4", title: "Storytelling and truth-telling at scale", sponsor: "Monica",
        prompt: "How will we exponentially grow our community through stories and science?",
        teaser: "An AI-assisted way to turn one piece of science into many stories." },
    ] },
];

const state = { order: [], email: "", timezone: "" };

function ordinal(n) { return ["", "1st", "2nd", "3rd", "4th"][n] || (n + "th"); }
function byId(id) { for (const t of SIGNUP) for (const w of t.workshops) if (w.id === id) return w; return null; }
function trackOf(id) { for (const t of SIGNUP) for (const w of t.workshops) if (w.id === id) return t; return null; }
function validEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((e || "").trim()); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function orderedPicks() {
  return state.order.map((id) => {
    const w = byId(id), t = trackOf(id);
    return { title: w.title, track: "Track " + t.num + " · " + t.name, accent: t.accent, sheetCode: w.sheetCode };
  });
}

// ── Track 01 (static, no interaction) ──────────────────────────
function renderTrack1() {
  const el = document.getElementById("track1-list");
  el.innerHTML = TRACK1.map((t) => `
    <div class="track1-item">
      <span class="track1-dot"></span>
      <div>
        <div class="track1-title">${escapeHtml(t.title)}</div>
        <div class="track1-desc">${escapeHtml(t.desc)}</div>
      </div>
    </div>`).join("") + `<div class="track1-sponsor">Exec sponsor · <b>Lindsay</b></div>`;
}

// ── Tracks 02–04 + workshop cards ───────────────────────────────
function renderTracks() {
  const el = document.getElementById("tracks");
  el.innerHTML = SIGNUP.map((t) => {
    const cards = t.workshops.map((w) => {
      const rank = state.order.indexOf(w.id) + 1 || null;
      const selected = rank != null;
      const full = state.order.length >= 4 && !selected;
      const actionColor = selected ? t.accent : (full ? "#cbcdd2" : "#0f748a");
      const actionMark = selected ? "✓" : "+";
      const actionLabel = selected
        ? "Ranked " + ordinal(rank) + " · tap to remove"
        : (full ? "Ranking full — remove one to swap" : "Add to my ranking");
      return `
        <div class="card-ws" style="--accent:${t.accent}" data-id="${w.id}" role="button" tabindex="0" aria-pressed="${selected}">
          ${selected ? `<div class="ring"></div><div class="pick-badge">${ordinal(rank).toUpperCase()} PICK</div>` : ""}
          <div class="card-ws-top">
            <span class="card-code">${escapeHtml(w.code)}</span>
            <span class="card-sponsor">Sponsor · <b>${escapeHtml(w.sponsor)}</b></span>
          </div>
          <h4 class="card-title">${escapeHtml(w.title)}</h4>
          <p class="card-prompt">${escapeHtml(w.prompt)}</p>
          <div class="card-teaser">
            <div class="card-teaser-label">A possible direction</div>
            <div class="card-teaser-text">${escapeHtml(w.teaser)}</div>
          </div>
          <div class="card-action" style="--action-color:${actionColor}">
            <span class="card-action-mark">${actionMark}</span>
            ${escapeHtml(actionLabel)}
          </div>
        </div>`;
    }).join("");

    return `
      <section class="track">
        <div class="track-band with-gap" style="background:${t.accent}">
          <div class="track-band-head">
            <span class="track-chip">${t.num}</span>
            <div>
              <div class="track-label">TRACK ${t.num}</div>
              <div class="track-name">${escapeHtml(t.name)}</div>
            </div>
          </div>
          <p class="track-copy">${escapeHtml(t.question)}</p>
        </div>
        <div class="cards">${cards}</div>
      </section>`;
  }).join("");
}

// ── Ranking panel ────────────────────────────────────────────────
function renderRankSlots() {
  const el = document.getElementById("rank-slots");
  el.innerHTML = [0, 1, 2, 3].map((i) => {
    const id = state.order[i];
    if (!id) {
      return `
        <div class="rank-slot-empty">
          <span class="rank-slot-num">${i + 1}</span>
          <span class="rank-slot-hint">Pick a session above to fill this slot</span>
        </div>`;
    }
    const w = byId(id), t = trackOf(id);
    return `
      <div class="rank-slot-filled">
        <span class="rank-slot-num" style="--accent:${t.accent}">${i + 1}</span>
        <div class="rank-slot-info">
          <div class="rank-slot-title">${escapeHtml(w.title)}</div>
          <div class="rank-slot-track">Track ${t.num} · ${escapeHtml(t.name)}</div>
        </div>
        <div class="rank-slot-actions">
          <button class="rank-btn" data-action="up" data-id="${id}" title="Move up" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="rank-btn" data-action="down" data-id="${id}" title="Move down" ${i === state.order.length - 1 ? "disabled" : ""}>↓</button>
          <button class="rank-btn remove" data-action="remove" data-id="${id}" title="Remove">×</button>
        </div>
      </div>`;
  }).join("");
  document.getElementById("rank-count").textContent = String(state.order.length);
}

// ── Submit button + hint (kept separate so the email input never re-renders) ──
function updateSubmitState() {
  const btn = document.getElementById("submit-btn");
  const hint = document.getElementById("submit-hint");
  const ok = validEmail(state.email) && !!state.timezone && state.order.length >= 1;
  btn.disabled = !ok;
  hint.textContent = state.order.length === 0
    ? "Rank at least one session to submit."
    : (!validEmail(state.email) ? "Add your IWBI email to submit."
      : (!state.timezone ? "Select your time zone to submit."
        : "Your picks flow into the summer workshop planning sheet."));
}

function renderAll() {
  renderTracks();
  renderRankSlots();
  updateSubmitState();
}

// ── Actions ──────────────────────────────────────────────────────
function toggleSelect(id) {
  const i = state.order.indexOf(id);
  if (i >= 0) state.order.splice(i, 1);
  else if (state.order.length < 4) state.order.push(id);
  renderAll();
}
function move(id, dir) {
  const i = state.order.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= state.order.length) return;
  [state.order[i], state.order[j]] = [state.order[j], state.order[i]];
  renderAll();
}

async function postToSheet(payload) {
  if (!/^https:\/\//.test(SHEET_ENDPOINT)) return;
  try {
    await fetch(SHEET_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (e) { /* Apps Script web apps don't return readable CORS responses; submission still recorded server-side. */ }
}

function summaryText(picks, email) {
  return "IWBI Summer Workshops — ranking\n" + email + "\n\n" +
    picks.map((p, i) => (i + 1) + ". " + p.title + "  (" + p.track + ")").join("\n");
}

function renderConfirmation() {
  const picks = orderedPicks();
  document.getElementById("confirm-email").textContent = state.email;
  document.getElementById("confirm-rows").innerHTML = picks.map((p, i) => `
    <div class="confirm-row">
      <span class="confirm-rank" style="--accent:${p.accent}">${i + 1}</span>
      <div><div class="confirm-title">${escapeHtml(p.title)}</div><div class="confirm-track">${escapeHtml(p.track)}</div></div>
    </div>`).join("");
}

function submit() {
  const picks = orderedPicks();
  if (!validEmail(state.email) || !state.timezone || picks.length === 0) return;
  const payload = {
    email: state.email,
    timezone: state.timezone,
    submittedAt: new Date().toISOString(),
    picks: picks.map((p, i) => ({ rank: i + 1, workshop: p.title, track: p.track, code: p.sheetCode })),
  };
  postToSheet(payload);
  renderConfirmation();
  document.getElementById("form-view").classList.add("hidden");
  document.getElementById("confirm-view").classList.remove("hidden");
}

function copySummary() {
  const txt = summaryText(orderedPicks(), state.email);
  const btn = document.getElementById("copy-btn");
  navigator.clipboard.writeText(txt).then(() => {
    btn.textContent = "Copied ✓";
    setTimeout(() => { btn.textContent = "Copy summary"; }, 2000);
  }).catch(() => {});
}

function editPicks() {
  document.getElementById("confirm-view").classList.add("hidden");
  document.getElementById("form-view").classList.remove("hidden");
}

// ── Wire up ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderTrack1();
  renderAll();

  document.getElementById("tracks").addEventListener("click", (e) => {
    const card = e.target.closest(".card-ws");
    if (card) toggleSelect(card.dataset.id);
  });
  document.getElementById("tracks").addEventListener("keydown", (e) => {
    const card = e.target.closest(".card-ws");
    if (card && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      toggleSelect(card.dataset.id);
    }
  });

  document.getElementById("rank-slots").addEventListener("click", (e) => {
    const btn = e.target.closest(".rank-btn");
    if (!btn || btn.disabled) return;
    const { action, id } = btn.dataset;
    if (action === "up") move(id, -1);
    else if (action === "down") move(id, 1);
    else if (action === "remove") toggleSelect(id);
  });

  document.getElementById("email-input").addEventListener("input", (e) => {
    state.email = e.target.value;
    updateSubmitState();
  });

  document.getElementById("timezone-input").addEventListener("change", (e) => {
    state.timezone = e.target.value;
    updateSubmitState();
  });

  document.getElementById("submit-btn").addEventListener("click", submit);
  document.getElementById("copy-btn").addEventListener("click", copySummary);
  document.getElementById("edit-btn").addEventListener("click", editPicks);
});
