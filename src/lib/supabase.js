console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('KEY:', import.meta.env.VITE_SUPABASE_KEY);
/*
  src/lib/supabase.js
  ─────────────────────────────────────────────────────────────
  Everything that talks to Supabase lives here.
  No JSX, no React — pure data-fetching logic.

  WHY a lib/ folder?
  Components should only think about rendering UI. Keeping API
  calls separate means:
    - You can change the backend (e.g. swap Supabase for Firebase)
    without touching any component.
    - You can test this logic independently.
    - Any component that needs data just imports the function it
    needs — no duplication.
*/

// ── Config ────────────────────────────────────────────────────
// Replace these with your values from:
// Supabase dashboard → Project Settings → API
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const BASE = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

// ── Header factories ──────────────────────────────────────────

// Used for auth requests where no user token exists yet.
const BASE_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Content-Type': 'application/json',
};

// Used for all data requests — includes the user's JWT so
// Supabase can evaluate RLS policies (auth.uid() = user_id).
export function authedHeaders(token) {
  return {
    ...BASE_HEADERS,
    'Authorization': `Bearer ${token}`,
    'Prefer': 'return=representation',
  };
}

// ── Auth ──────────────────────────────────────────────────────

export async function signUp(email, password) {
  const res = await fetch(`${AUTH}/signup`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.message || 'Sign-up failed');
  return data; // { access_token, user }
}

export async function signIn(email, password) {
  const res = await fetch(`${AUTH}/token?grant_type=password`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.message || 'Sign-in failed');
  return data; // { access_token, user }
}

// ── Deck CRUD ─────────────────────────────────────────────────

export async function fetchDecks(token) {
  const res = await fetch(`${BASE}/decks?select=*`, {
    headers: authedHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to load decks');
  return res.json();
}

export async function upsertDeck(deck, token) {
  const res = await fetch(`${BASE}/decks?on_conflict=id`, {
    method: 'POST',
    headers: authedHeaders(token),
    body: JSON.stringify({
      id:      deck.id,
      name:    deck.name,
      cards:   deck.cards,
      user_id: deck.user_id,
    }),
  });
  if (!res.ok) throw new Error('Failed to save deck');
}

export async function deleteDeckFromDB(id, token) {
  const res = await fetch(`${BASE}/decks?id=eq.${id}`, {
    method: 'DELETE',
    headers: authedHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete deck');
}

// ── Utilities ─────────────────────────────────────────────────

// Generates a unique ID without any library dependency.
export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
