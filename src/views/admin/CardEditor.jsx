/*
  src/views/admin/CardEditor.jsx
  ─────────────────────────────────────────────────────────────
  Card creation form (always at top) + card list with
  list/grid view toggle.

  Props:
    deck           — the currently selected deck object
    onSave         — callback with the updated deck
    cardView       — "list" | "grid" (owned by AdminView)
    onCardViewChange — setter for cardView
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

export default function CardEditor({ deck, onSave, cardView, onCardViewChange }) {
  const [form, setForm]     = useState({ front: "", back: "" });
  const [editId, setEditId] = useState(null);

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    if (!form.front.trim() || !form.back.trim()) return;
    if (editId) {
      onSave({ ...deck, cards: deck.cards.map(c => c.id === editId ? { ...c, ...form } : c) });
    } else {
      onSave({ ...deck, cards: [...deck.cards, { id: uid(), ...form }] });
    }
    setForm({ front: "", back: "" });
    setEditId(null);
  }

  function startEdit(card) {
    setEditId(card.id);
    setForm({ front: card.front, back: card.back });
    // Scroll to top so the form is visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ front: "", back: "" });
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

        <div style={{ display: "flex", gap: ".5rem" }}>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editId ? "Save changes" : "+ Add card"}
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

      {/*
        List view: full-width stacked rows, same as before.
        Grid view: 2-column grid, each card shows front/back
        in a compact tile with actions on hover.
      */}
      <div className={cardView === "grid" ? "card-grid" : "card-list"}>
        {deck.cards.map(card => (
          cardView === "list"
            ? (
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