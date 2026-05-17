/*
  src/views/admin/CardEditor.jsx
  ─────────────────────────────────────────────────────────────
  Card creation form + card list with list/grid toggle.
  Includes duplicate detection on submit.

  DUPLICATE CHECK LOGIC:
  On submit, we compare the new front and back values against
  all existing cards in the deck (excluding the card being
  edited, if any). Comparison is case-insensitive and trimmed
  so "Cat" and "cat" are treated as the same.

  If a duplicate is found we set a `warning` state describing
  what matched. The form is NOT blocked — the user sees the
  warning and can either fix the value or submit again to
  confirm and save anyway (the second submit skips the check).
  This "confirm on second submit" pattern avoids an extra
  confirmation dialog while still surfacing the issue clearly.
*/

import { useState } from "react";
import { uid } from "../../lib/supabase";

// ── View toggle icons ──────────────────────────────────────────

function ListIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8"  y1="6"  x2="21" y2="6" />
      <line x1="8"  y1="12" x2="21" y2="12" />
      <line x1="8"  y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6"  r="1.5" fill={color} stroke="none" />
      <circle cx="3" cy="12" r="1.5" fill={color} stroke="none" />
      <circle cx="3" cy="18" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}

function GridIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="3"  width="7" height="7" rx="1" />
      <rect x="14" y="3"  width="7" height="7" rx="1" />
      <rect x="3"  y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

// ── Duplicate checker ──────────────────────────────────────────
// Returns a warning string if duplicates are found, null otherwise.
// Excludes the card currently being edited (by editId) so editing
// a card doesn't falsely flag itself as a duplicate.

function checkDuplicates(cards, form, editId) {
  const front = form.front.trim().toLowerCase();
  const back  = form.back.trim().toLowerCase();

  const others = cards.filter(c => c.id !== editId);

  const frontMatch = others.find(c => c.front.trim().toLowerCase() === front);
  const backMatch  = others.find(c => c.back.trim().toLowerCase()  === back);

  if (frontMatch && backMatch) {
    return "Both the front and back match existing cards in this deck.";
  }
  if (frontMatch) {
    return `The front "${form.front.trim()}" already exists in this deck.`;
  }
  if (backMatch) {
    return `The back "${form.back.trim()}" already exists in this deck.`;
  }
  return null;
}

export default function CardEditor({ deck, onSave, cardView, onCardViewChange }) {
  const [form, setForm]         = useState({ front: "", back: "" });
  const [editId, setEditId]     = useState(null);
  const [warning, setWarning]   = useState(null);  // duplicate warning message
  const [confirmed, setConfirmed] = useState(false); // true after user sees warning

  function setField(field, value) {
    // Clear warning when the user starts modifying the form
    // after seeing it — so stale warnings don't linger.
    if (warning) { setWarning(null); setConfirmed(false); }
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    if (!form.front.trim() || !form.back.trim()) return;

    // Only run the duplicate check on the first submit attempt.
    // If the user already saw the warning and clicks again,
    // `confirmed` is true and we skip straight to saving.
    if (!confirmed) {
      const dupe = checkDuplicates(deck.cards, form, editId);
      if (dupe) {
        setWarning(dupe);
        setConfirmed(true); // next submit will save regardless
        return;
      }
    }

    // Save the card.
    if (editId) {
      onSave({ ...deck, cards: deck.cards.map(c => c.id === editId ? { ...c, ...form } : c) });
    } else {
      onSave({ ...deck, cards: [...deck.cards, { id: uid(), ...form }] });
    }

    setForm({ front: "", back: "" });
    setEditId(null);
    setWarning(null);
    setConfirmed(false);
  }

  function startEdit(card) {
    setEditId(card.id);
    setForm({ front: card.front, back: card.back });
    setWarning(null);
    setConfirmed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ front: "", back: "" });
    setWarning(null);
    setConfirmed(false);
  }

  function deleteCard(id) {
    onSave({ ...deck, cards: deck.cards.filter(c => c.id !== id) });
    if (editId === id) cancelEdit();
  }

  const ACTIVE   = "var(--text-accent)";
  const INACTIVE = "var(--text-faint)";

  return (
    <div>
      {/* ── New / edit card form ──────────────────────────────── */}
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-title">{editId ? "Edit card" : "New card"}</div>

        <div className="card-form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Front</label>
            <textarea
              className="input"
              placeholder="e.g. 猫"
              value={form.front}
              onChange={e => setField("front", e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Back</label>
            <textarea
              className="input"
              placeholder="e.g. cat (ねこ)"
              value={form.back}
              onChange={e => setField("back", e.target.value)}
            />
          </div>
        </div>

        {/*
          Warning banner — only shown when a duplicate is detected.
          The message tells the user exactly what matched, and the
          button label changes to "Save anyway" to make it clear
          that a second click will force-save.
        */}
        {warning && (
          <div className="duplicate-warning">
            <span>⚠ {warning}</span>
            <span className="duplicate-warning-hint">Click save again to add it anyway.</span>
          </div>
        )}

        <div style={{ display: "flex", gap: ".5rem" }}>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {warning ? "Save anyway" : editId ? "Save changes" : "+ Add card"}
          </button>
          {editId && (
            <button className="btn" onClick={cancelEdit}>Cancel</button>
          )}
        </div>
      </div>

      {/* ── Card list header with view toggle ────────────────── */}
      <div className="card-list-header">
        <span className="panel-title" style={{ margin: 0 }}>
          Cards <span className="badge">{deck.cards.length}</span>
        </span>
        <div className="view-toggle">
          <button
            className={"view-toggle-btn" + (cardView === "list" ? " active" : "")}
            onClick={() => onCardViewChange("list")}
            title="List view"
            aria-label="Switch to list view"
          >
            <ListIcon color={cardView === "list" ? ACTIVE : INACTIVE} />
          </button>
          <button
            className={"view-toggle-btn" + (cardView === "grid" ? " active" : "")}
            onClick={() => onCardViewChange("grid")}
            title="Grid view"
            aria-label="Switch to grid view"
          >
            <GridIcon color={cardView === "grid" ? ACTIVE : INACTIVE} />
          </button>
        </div>
      </div>

      {/* ── Card list ─────────────────────────────────────────── */}
      {deck.cards.length === 0 && (
        <div className="empty" style={{ padding: "2rem" }}>
          No cards yet. Add one above.
        </div>
      )}

      <div className={cardView === "grid" ? "card-grid" : "card-list"}>
        {deck.cards.map(card => (
          cardView === "list" ? (
            <div className="card-list-item" key={card.id}>
              <div className="front">{card.front}</div>
              <div className="back">{card.back}</div>
              <div className="actions">
                <button
                  className="btn"
                  style={{ padding: ".3rem .8rem", fontSize: ".8rem" }}
                  onClick={() => startEdit(card)}
                >Edit</button>
                <button
                  className="btn btn-danger"
                  style={{ padding: ".3rem .8rem", fontSize: ".8rem" }}
                  onClick={() => deleteCard(card.id)}
                >Delete</button>
              </div>
            </div>
          ) : (
            <div className="card-grid-item" key={card.id}>
              <div className="card-grid-front">{card.front}</div>
              <div className="card-grid-divider" />
              <div className="card-grid-back">{card.back}</div>
              <div className="card-grid-actions">
                <button
                  className="btn"
                  style={{ padding: ".25rem .7rem", fontSize: ".75rem" }}
                  onClick={() => startEdit(card)}
                >Edit</button>
                <button
                  className="btn btn-danger"
                  style={{ padding: ".25rem .7rem", fontSize: ".75rem" }}
                  onClick={() => deleteCard(card.id)}
                >Delete</button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}