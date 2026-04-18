/*
  src/views/StudyView.jsx
  ─────────────────────────────────────────────────────────────
  The study screen. Receives the deck list from App as a prop
  and manages its own local navigation state (which deck, which
  card index). It imports FlashCard from components/ because
  that's a reusable piece, not a view.
*/

import { useState, useEffect } from 'react';
import FlashCard from '../components/FlashCard';

export default function StudyView({ decks }) {
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);

  // Derived state — computed from props and local state.
  // Never duplicated into separate useState calls.
  const deck  = decks.find(d => d.id === selectedDeckId) || null;
  const cards = deck ? deck.cards : [];
  const total = cards.length;
  const card  = cards[cardIndex] || null;

  // Reset card position when the selected deck changes.
  useEffect(() => { setCardIndex(0); }, [selectedDeckId]);

  // Auto-select the first deck when decks load.
  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks]);

  return (
    <div>
      <div className="study-header">
        <select
          className="select"
          value={selectedDeckId || ''}
          onChange={e => setSelectedDeckId(e.target.value)}
        >
          <option value="" disabled>Choose a deck…</option>
          {decks.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.cards.length} cards)
            </option>
          ))}
        </select>
      </div>

      {decks.length === 0 && (
        <div className="empty">
          No decks yet.<br />Go to <strong>Manage</strong> to create one.
        </div>
      )}
      {deck && total === 0 && (
        <div className="empty">This deck has no cards yet.</div>
      )}

      {card && (
        <>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((cardIndex + 1) / total) * 100}%` }}
            />
          </div>

          {/*
            The `key` prop forces React to create a fresh FlashCard
            instance when the card changes, so the flip state resets.
          */}
          <FlashCard card={card} key={card.id} />

          <p className="card-counter">{cardIndex + 1} / {total}</p>

          <div className="nav-controls">
            <button
              className="btn"
              onClick={() => setCardIndex(i => i - 1)}
              disabled={cardIndex === 0}
            >← Prev</button>

            <button
              className="btn btn-primary"
              onClick={() => setCardIndex(Math.floor(Math.random() * total))}
            >Shuffle</button>

            <button
              className="btn"
              onClick={() => setCardIndex(i => i + 1)}
              disabled={cardIndex === total - 1}
            >Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
