/*
  src/views/admin/AdminView.jsx
  ─────────────────────────────────────────────────────────────
  Redesigned admin screen with:
  - Horizontal scrollable deck tabs + a + button to add decks
  - Inline input that appears next to tabs when + is clicked
  - New card form always visible at the top
  - List / grid view toggle for the card list

  Layout overview:
  ┌─────────────────────────────────────────┐
  │ [+] [Deck A] [Deck B] [Deck C] →scroll  │  ← tab bar
  ├─────────────────────────────────────────┤
  │ New card form (always visible)          │
  ├─────────────────────────────────────────┤
  │ Cards heading          [≡ list][⊞ grid] │  ← view toggle
  │ card · card · card · card …             │
  └─────────────────────────────────────────┘
*/

import { useState, useEffect, useRef } from "react";
import { uid } from "../../lib/supabase";
import CardEditor from "./CardEditor";

// ── Icons ─────────────────────────────────────────────────────

function DeleteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-faint)" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function AdminView({ decks, onUpdateDecks, userId }) {
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [cardView, setCardView]             = useState("list"); // "list" | "grid"

  // Inline deck creation state
  const [addingDeck, setAddingDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const newDeckInputRef = useRef(null);

  const deck = decks.find(d => d.id === selectedDeckId) || null;

  // Auto-select first deck on load.
  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks]);

  // Focus the inline input as soon as it appears.
  useEffect(() => {
    if (addingDeck) newDeckInputRef.current?.focus();
  }, [addingDeck]);

  function startAddingDeck() {
    setAddingDeck(true);
    setNewDeckName("");
  }

  function confirmAddDeck() {
    if (!newDeckName.trim()) {
      setAddingDeck(false);
      return;
    }
    const newDeck = { id: uid(), name: newDeckName.trim(), cards: [], user_id: userId };
    onUpdateDecks([...decks, newDeck]);
    setSelectedDeckId(newDeck.id);
    setAddingDeck(false);
    setNewDeckName("");
  }

  function cancelAddDeck() {
    setAddingDeck(false);
    setNewDeckName("");
  }

  function deleteDeck(id) {
    const updated = decks.filter(d => d.id !== id);
    onUpdateDecks(updated);
    if (selectedDeckId === id) setSelectedDeckId(updated[0]?.id || null);
  }

  function updateDeck(updatedDeck) {
    onUpdateDecks(decks.map(d => d.id === updatedDeck.id ? updatedDeck : d));
  }

  return (
    <div className="admin-new-layout">

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="deck-tab-bar">

        {/* + button — fixed on the left, outside the scroll area */}
        <button
          className="deck-tab-add"
          onClick={startAddingDeck}
          title="New deck"
          aria-label="Add new deck"
        >+</button>

        {/* Scrollable tab list */}
        <div className="deck-tab-scroll">
          {decks.map(d => (
            <div
              key={d.id}
              className={"deck-tab" + (d.id === selectedDeckId ? " active" : "")}
              onClick={() => setSelectedDeckId(d.id)}
            >
              <span className="deck-tab-name">{d.name}</span>
              <span className="deck-tab-count">{d.cards.length}</span>
              <button
                className="deck-tab-del"
                onClick={e => { e.stopPropagation(); deleteDeck(d.id); }}
                title="Delete deck"
                aria-label={"Delete " + d.name}
              >
                <DeleteIcon />
              </button>
            </div>
          ))}

          {/* Inline input — slides in after the last tab */}
          {addingDeck && (
            <div className="deck-tab-input-wrap">
              <input
                ref={newDeckInputRef}
                className="deck-tab-input"
                placeholder="Deck name…"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter")  confirmAddDeck();
                  if (e.key === "Escape") cancelAddDeck();
                }}
                onBlur={confirmAddDeck}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────── */}
      {decks.length === 0 && (
        <div className="empty">
          No decks yet.<br />Press <strong>+</strong> to create your first one.
        </div>
      )}

      {deck && (
        <CardEditor
          deck={deck}
          onSave={updateDeck}
          cardView={cardView}
          onCardViewChange={setCardView}
        />
      )}

      {!deck && decks.length > 0 && (
        <div className="empty">Select a deck to manage its cards.</div>
      )}
    </div>
  );
}