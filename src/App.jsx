/*
  src/App.jsx
  ─────────────────────────────────────────────────────────────
  The root component. It owns the two pieces of global state:
    - session: { token, userId } | null  (are we logged in?)
    - decks: the user's deck list

  It also owns handleUpdateDecks, which is the only place that
  talks to Supabase for writes. All child components receive
  callbacks and call upward — they never import Supabase directly.

  The rendering logic is simple:
    no session  → <AuthScreen />
    loading     → spinner
    error       → error screen
    logged in   → nav + current view
*/

import { useState } from 'react';
import { fetchDecks, upsertDeck, deleteDeckFromDB } from './lib/supabase';
import AuthScreen from './views/AuthScreen';
import StudyView  from './views/StudyView';
import AdminView  from './views/admin/AdminView';

// Reusable loading spinner — small enough to live inline here.
function Spinner({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: '#5a7ea8', gap: '.75rem',
    }}>
      <span className="spinner" />
      {label}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null); // { token, userId } | null
  const [decks, setDecks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [view, setView]       = useState('study');

  // Called by AuthScreen once the user has authenticated.
  // We immediately fetch their decks.
  function handleAuth(newSession) {
    setSession(newSession);
    setLoading(true);
    fetchDecks(newSession.token)
      .then(rows => { setDecks(rows); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }

  function handleSignOut() {
    setSession(null);
    setDecks([]);
    setView('study');
  }

  /*
    Called by AdminView whenever the deck list changes (add, edit, delete).
    Pattern: optimistic update first (instant UI), then sync to Supabase.

    We diff the old and new arrays to determine which DB operations to run:
      - rows absent in newDecks → DELETE
      - all rows in newDecks    → UPSERT (covers both inserts and updates)
  */
  async function handleUpdateDecks(newDecks) {
    setDecks(newDecks); // optimistic
    try {
      const newIds  = new Set(newDecks.map(d => d.id));
      const deleted = decks.filter(d => !newIds.has(d.id));
      for (const d of deleted) await deleteDeckFromDB(d.id, session.token);
      for (const d of newDecks) await upsertDeck(d, session.token);
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Render logic ──────────────────────────────────────────────

  if (!session) return <AuthScreen onAuth={handleAuth} />;
  if (loading)  return <Spinner label="Loading decks…" />;

  if (error) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '1rem', padding: '2rem',
    }}>
      <div style={{ color: '#f87171', textAlign: 'center' }}>
        Something went wrong.<br />
        <span style={{ fontSize: '.85rem', color: '#5a7ea8' }}>{error}</span>
      </div>
      <button className="btn" onClick={() => setError(null)}>Dismiss</button>
    </div>
  );

  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-title">フラッシュカード</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="nav-tabs">
            <button
              className={`nav-tab ${view === 'study' ? 'active' : ''}`}
              onClick={() => setView('study')}
            >Study</button>
            <button
              className={`nav-tab ${view === 'manage' ? 'active' : ''}`}
              onClick={() => setView('manage')}
            >Manage</button>
          </div>
          <button
            className="btn"
            style={{ padding: '.35rem .9rem', fontSize: '.8rem' }}
            onClick={handleSignOut}
          >Sign out</button>
        </div>
      </nav>

      <main className="main">
        {view === 'study'
          ? <StudyView decks={decks} />
          : <AdminView decks={decks} onUpdateDecks={handleUpdateDecks} userId={session.userId} />
        }
      </main>
    </div>
  );
}
/*
  src/App.jsx
  ─────────────────────────────────────────────────────────────
  Root component. Now also manages the light/dark theme.

  THEME LOGIC:
  1. On first load, read localStorage for a saved preference.
  2. If none exists, read the device system preference via
     window.matchMedia('prefers-color-scheme: dark').
  3. Store the result in `theme` state ('dark' | 'light').
  4. A useEffect watches `theme` and applies/removes the .light
     class on <html> — this is what triggers the CSS variable
     swap in styles.css.
  5. Every time `theme` changes, save it to localStorage so the
     choice is remembered on the next visit.
*/

import { useState, useEffect } from 'react';
import { fetchDecks, upsertDeck, deleteDeckFromDB } from './lib/supabase';
import AuthScreen   from './views/AuthScreen';
import StudyView    from './views/StudyView';
import AdminView    from './views/admin/AdminView';
import ThemeToggle  from './components/ThemeToggle';

function Spinner({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: 'var(--text-muted)', gap: '.75rem',
    }}>
      <span className="spinner" />
      {label}
    </div>
  );
}

// Read the initial theme from localStorage, falling back to the
// device system preference, then to 'dark'.
function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export default function App() {
  const [theme, setTheme]     = useState(getInitialTheme);
  const [session, setSession] = useState(null);
  const [decks, setDecks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [view, setView]       = useState('study');

  // Apply theme class to <html> and persist to localStorage
  // whenever `theme` changes.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  function handleAuth(newSession) {
    setSession(newSession);
    setLoading(true);
    fetchDecks(newSession.token)
      .then(rows => { setDecks(rows); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }

  function handleSignOut() {
    setSession(null);
    setDecks([]);
    setView('study');
  }

  async function handleUpdateDecks(newDecks) {
    setDecks(newDecks);
    try {
      const newIds  = new Set(newDecks.map(d => d.id));
      const deleted = decks.filter(d => !newIds.has(d.id));
      for (const d of deleted) await deleteDeckFromDB(d.id, session.token);
      for (const d of newDecks) await upsertDeck(d, session.token);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session) return <AuthScreen onAuth={handleAuth} />;
  if (loading)  return <Spinner label="Loading decks…" />;

  if (error) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '1rem', padding: '2rem',
    }}>
      <div style={{ color: 'var(--text-danger)', textAlign: 'center' }}>
        Something went wrong.<br />
        <span style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{error}</span>
      </div>
      <button className="btn" onClick={() => setError(null)}>Dismiss</button>
    </div>
  );

  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-title">フラッシュカード</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="nav-tabs">
            <button
              className={`nav-tab ${view === 'study' ? 'active' : ''}`}
              onClick={() => setView('study')}
            >Study</button>
            <button
              className={`nav-tab ${view === 'manage' ? 'active' : ''}`}
              onClick={() => setView('manage')}
            >Manage</button>
          </div>
          {/* ThemeToggle sits between the tabs and sign-out */}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            className="btn"
            style={{ padding: '.35rem .9rem', fontSize: '.8rem' }}
            onClick={handleSignOut}
          >Sign out</button>
        </div>
      </nav>

      <main className="main">
        {view === 'study'
          ? <StudyView decks={decks} />
          : <AdminView decks={decks} onUpdateDecks={handleUpdateDecks} userId={session.userId} />
        }
      </main>
    </div>
  );
}