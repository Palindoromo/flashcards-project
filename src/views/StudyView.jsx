/*
  src/views/StudyView.jsx
  ─────────────────────────────────────────────────────────────
  Study screen with a persistent shuffle mode toggle.

  SHUFFLE MODE LOGIC:
  When shuffle is off, `cards` is just deck.cards in original order.
  When shuffle is on, we keep a separate `shuffledCards` array in
  state. This array is generated once when shuffle is enabled, and
  stays fixed until the user disables shuffle or changes deck —
  so Prev/Next navigate through a stable shuffled order, not a
  random new order on every click.

  We use a Fisher-Yates shuffle to randomise the array:
  it works by iterating backwards and swapping each element
  with a random earlier element. This guarantees every possible
  order is equally likely.
*/

import { useState, useEffect } from 'react';
import FlashCard from '../components/FlashCard';

// Fisher-Yates shuffle — returns a new shuffled array,
// never mutates the original.
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function StudyView({ decks }) {
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [cardIndex, setCardIndex]           = useState(0);
  const [shuffleOn, setShuffleOn]           = useState(false);
  const [shuffledCards, setShuffledCards]   = useState([]);

  const deck        = decks.find(d => d.id === selectedDeckId) || null;
  const sourceCards = deck ? deck.cards : [];

  // The active card list: shuffled version or original, depending on mode.
  const cards = shuffleOn ? shuffledCards : sourceCards;
  const total = cards.length;
  const card  = cards[cardIndex] || null;

  // Reset position when the deck changes.
  useEffect(() => {
    setCardIndex(0);
    setShuffleOn(false);
    setShuffledCards([]);
  }, [selectedDeckId]);

  // Auto-select first deck on load.
  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks]);

  // When shuffle is toggled on: generate a shuffled copy and reset to
  // card 0. When toggled off: go back to original order from card 0.
  function toggleShuffle() {
    if (!shuffleOn) {
      setShuffledCards(shuffleArray(sourceCards));
    }
    setCardIndex(0);
    setShuffleOn(s => !s);
  }

  return (
    <div>
      {/* ── Deck selector ────────────────────────────────────── */}
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

      {/*
        Shuffle toggle — only shown when a deck with more than one
        card is selected. Placed below the selector so it reads as
        a setting for the current deck, not an action button.

        CONCEPT: accessible toggle.
        We use a <button> with role="switch" and aria-checked so
        screen readers announce it as a toggle, not a plain button.
        The visual is two divs (track + thumb) animated with CSS.
      */}
     {deck && sourceCards.length > 1 && (
  <div className="shuffle-row">
    <span className="shuffle-label" onClick={toggleShuffle}>
      Shuffle
    </span>
    <button
      className={`toggle-track ${shuffleOn ? 'on' : ''}`}
      role="switch"
      aria-checked={shuffleOn}
      onClick={toggleShuffle}
    >
      <div className="toggle-thumb" />
    </button>
    <span className="shuffle-label" onClick={toggleShuffle}>
      {shuffleOn ? 'On' : 'Off'}
    </span>
  </div>
)}

      {/* ── Empty states ─────────────────────────────────────── */}
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
          {/*
            Progress bar: only shown when shuffle is OFF.
            In shuffle mode, position in the deck is arbitrary,
            so a progress bar would be misleading.
          */}
          
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((cardIndex + 1) / total) * 100}%` }}
              />
            </div>
          

          <FlashCard card={card} key={card.id} />

          {/* Counter: shows position in shuffle or in original deck */}
          <p className="card-counter">{cardIndex + 1} / {total}</p>

          {/* ── Navigation controls ──────────────────────────── */}
          <div className="nav-controls">
            <button
              className="btn"
              onClick={() => setCardIndex(i => i - 1)}
              disabled={cardIndex === 0}
            >← Prev</button>

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