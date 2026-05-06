/*
  src/views/StudyView.jsx
  ─────────────────────────────────────────────────────────────
  Study screen with shuffle and loop mode icon buttons.

  SHUFFLE: generates a stable Fisher-Yates shuffled array once
  when enabled. Prev/Next navigate through that fixed order.
  When loop is also on and the deck wraps, a fresh shuffle is
  generated so each loop is a new order.

  LOOP: when on, Next wraps silently from the last card back to
  card 0. When both loop and shuffle are on, wrapping also
  triggers a reshuffle.

  Both toggle states are remembered when switching decks.
  Card index resets to 0 on deck change, but modes persist.

  ICONS: inline SVGs matching the media player convention.
  Shuffle = two intertwined arrows (⇄ style).
  Loop    = circular arrow (↺ style).
  Each icon button shows a small accent dot below it when active.
*/

import { useState, useEffect } from 'react';
import FlashCard from '../components/FlashCard';

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Icon components ───────────────────────────────────────────
// Self-contained SVGs so there's no icon library dependency.
// strokeColor is driven by the active state in the parent.

function ShuffleIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Top arrow: bottom-left to top-right */}
      <path d="M4 22 L10 13 L16 6 L19 6" />
      <polyline points="16 3 20 6 16 9" />
      {/* Bottom arrow: top-left to bottom-right */}
      <path d="M4 2 L10 11 L16 18 L19 18" />
      <polyline points="16 15 20 18 16 21" />
    </svg>
  );
}

function LoopIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// Reusable icon button with optional active dot below.
function IconButton({ onClick, active, icon, label }) {
  return (
    <button
      className="icon-btn"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {icon}
      {/* Active indicator dot — only rendered when active */}
      <span className={`icon-btn-dot ${active ? 'visible' : ''}`} />
    </button>
  );
}

export default function StudyView({ decks }) {
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [cardIndex, setCardIndex]           = useState(0);
  const [shuffleOn, setShuffleOn]           = useState(false);
  const [loopOn, setLoopOn]                 = useState(false);
  const [shuffledCards, setShuffledCards]   = useState([]);

  const deck        = decks.find(d => d.id === selectedDeckId) || null;
  const sourceCards = deck ? deck.cards : [];
  const cards       = shuffleOn ? shuffledCards : sourceCards;
  const total       = cards.length;
  const card        = cards[cardIndex] || null;
  const isLast      = cardIndex === total - 1;

  // Only reset card position on deck change — modes are remembered.
  useEffect(() => {
    setCardIndex(0);
    // Regenerate shuffle for the new deck if shuffle is still on.
    if (shuffleOn) setShuffledCards(shuffleArray(deck?.cards || []));
  }, [selectedDeckId]);

  // Auto-select first deck on load.
  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks]);

  function toggleShuffle() {
    if (!shuffleOn) setShuffledCards(shuffleArray(sourceCards));
    setCardIndex(0);
    setShuffleOn(s => !s);
  }

  function handleNext() {
    if (!isLast) {
      setCardIndex(i => i + 1);
    } else if (loopOn) {
      // Wrap around. If shuffle is also on, generate a fresh order
      // so each loop through the deck is different.
      if (shuffleOn) setShuffledCards(shuffleArray(sourceCards));
      setCardIndex(0);
    }
  }

  // Icon colours driven by active state.
  const INACTIVE = '#3a5a80';
  const ACTIVE   = '#7eb8f7';

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
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((cardIndex + 1) / total) * 100}%` }}
            />
          </div>

          <FlashCard card={card} key={card.id} />

          <p className="card-counter">{cardIndex + 1} / {total}</p>

          {/* ── Navigation controls ──────────────────────────── */}
          <div className="nav-controls">
            <button
              className="btn"
              onClick={() => setCardIndex(i => i - 1)}
              disabled={cardIndex === 0}
            >← Prev</button>

            {/*
              Icon buttons sit between the nav arrows.
              They are only shown when the deck has more than one card.
            */}
            {total > 1 && (
              <div className="mode-btns">
                <IconButton
                  onClick={toggleShuffle}
                  active={shuffleOn}
                  label={shuffleOn ? 'Shuffle on' : 'Shuffle off'}
                  icon={<ShuffleIcon color={shuffleOn ? ACTIVE : INACTIVE} />}
                />
                <IconButton
                  onClick={() => setLoopOn(l => !l)}
                  active={loopOn}
                  label={loopOn ? 'Loop on' : 'Loop off'}
                  icon={<LoopIcon color={loopOn ? ACTIVE : INACTIVE} />}
                />
              </div>
            )}

            <button
              className="btn"
              onClick={handleNext}
              disabled={isLast && !loopOn}
            >Next →</button>
          </div>
        </>
      )}
    </div>
  );
}