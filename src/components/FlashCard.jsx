/*
  src/components/FlashCard.jsx
  ─────────────────────────────────────────────────────────────
  A single flipping card. This is a "pure" presentational
  component — it receives data via props and renders UI.
  It has no knowledge of Supabase, decks, or the rest of the app.

  WHY components/ and not views/?
  Components are small, reusable pieces that could appear in
  multiple places. Views are full screens tied to a specific
  route or application state. FlashCard could theoretically be
  reused anywhere, so it lives in components/.
*/

import { useState, useEffect } from 'react';

/*
  CONCEPT: named vs default exports.
  `export default` means the importer can name it anything:
    import Card from './FlashCard'   ← works
    import FC   from './FlashCard'   ← also works
  Named exports (`export function X`) must be imported by name:
    import { FlashCard } from './FlashCard'
  Default exports are conventional for the main thing a file provides.
*/
export default function FlashCard({ card }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state whenever the card changes (user navigated).
  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  return (
    <div className="card-scene" onClick={() => setIsFlipped(f => !f)}>
      <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="card-face card-front">
          {card.front}
          <span className="card-hint">tap to flip</span>
        </div>
        <div className="card-face card-back">
          {card.back}
          <span className="card-hint">tap to flip</span>
        </div>
      </div>
    </div>
  );
}
