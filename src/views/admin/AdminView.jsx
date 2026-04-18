/*
  src/views/admin/AdminView.jsx
  ─────────────────────────────────────────────────────────────
  The management screen. Shows the deck list on the left and
  CardEditor on the right. Receives decks + onUpdateDecks from
  App — it never calls Supabase directly, it delegates upward.

  When a deck is added, edited, or deleted, it builds the new
  decks array and calls onUpdateDecks(newDecks). App then
  handles the Supabase sync.
*/

import { useState, useEffect } from 'react';
import { uid } from '../../lib/supabase';
import CardEditor from './CardEditor';

export default function AdminView({ decks, onUpdateDecks, userId }) {
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [newDeckName, setNewDeckName]       = useState('');

  const deck = decks.find(d => d.id === selectedDeckId) || null;

  // Auto-select the first deck when the list loads.
  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks]);

  function addDeck() {
    if (!newDeckName.trim()) return;
    // user_id is attached here so upsertDeck can send it to Supabase,
    // satisfying the RLS "owner insert" policy.
    const newDeck = { id: uid(), name: newDeckName.trim(), cards: [], user_id: userId };
    onUpdateDecks([...decks, newDeck]);
    setNewDeckName('');
    setSelectedDeckId(newDeck.id);
  }

  function deleteDeck(id) {
    const updated = decks.filter(d => d.id !== id);
    onUpdateDecks(updated);
    if (selectedDeckId === id) setSelectedDeckId(updated[0]?.id || null);
  }

  // Called by CardEditor when a card is added/edited/deleted.
  // We receive the whole updated deck and splice it into the list.
  function updateDeck(updatedDeck) {
    onUpdateDecks(decks.map(d => d.id === updatedDeck.id ? updatedDeck : d));
  }

  return (
    <div className="admin-layout">
      {/* ── Left: deck list ──────────────────────────────────── */}
      <div>
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <div className="panel-title">Decks</div>

          {decks.map(d => (
            <div
              key={d.id}
              className={`deck-item ${d.id === selectedDeckId ? 'active' : ''}`}
              onClick={() => setSelectedDeckId(d.id)}
            >
              <span>{d.name}</span>
              <span className="count">{d.cards.length}</span>
              <button
                className="deck-del"
                title="Delete deck"
                onClick={e => { e.stopPropagation(); deleteDeck(d.id); }}
              >×</button>
            </div>
          ))}

          {decks.length === 0 && (
            <div style={{ color: '#3a5a80', fontSize: '.85rem' }}>No decks yet.</div>
          )}
        </div>

        {/* New deck form */}
        <div className="panel">
          <div className="panel-title">New deck</div>
          <div className="input-row">
            <input
              className="input"
              placeholder="Deck name…"
              value={newDeckName}
              onChange={e => setNewDeckName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDeck()}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={addDeck}
          >Create</button>
        </div>
      </div>

      {/* ── Right: card editor ───────────────────────────────── */}
      <div>
        {deck
          ? <CardEditor deck={deck} onSave={updateDeck} />
          : <div className="empty">Select or create a deck to manage its cards.</div>
        }
      </div>
    </div>
  );
}
