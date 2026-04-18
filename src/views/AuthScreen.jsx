/*
  src/views/AuthScreen.jsx
  ─────────────────────────────────────────────────────────────
  Full-screen login / sign-up form. Shown when no session exists.
  On success, calls onAuth({ token, userId }) to hand control
  back to App.

  It imports signIn and signUp from lib/supabase.js — notice how
  the import path uses '../lib/supabase' because this file is
  one level deep inside views/, so it needs to go up one level
  (..) to reach src/, then into lib/.
*/

import { useState } from 'react';
import { signIn, signUp } from '../lib/supabase';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode]     = useState('login'); // 'login' | 'signup'
  const [email, setEmail]   = useState('');
  const [password, setPass] = useState('');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);
  const [notice, setNotice] = useState(null);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setError(null); setNotice(null); setBusy(true);
    try {
      if (mode === 'signup') {
        const data = await signUp(email, password);
        // If email confirmation is enabled in Supabase, access_token
        // won't be present until the user clicks the confirmation link.
        if (!data.access_token) {
          setNotice('Check your email to confirm your account, then sign in.');
          setMode('login');
        } else {
          onAuth({ token: data.access_token, userId: data.user.id });
        }
      } else {
        const data = await signIn(email, password);
        onAuth({ token: data.access_token, userId: data.user.id });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-title">フラッシュカード</div>
        <div className="auth-sub">
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </div>

        {error  && <div className="auth-error">{error}</div>}
        {notice && <div className="auth-info">{notice}</div>}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleSubmit}
          disabled={busy}
        >
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>No account? <button onClick={() => switchMode('signup')}>Sign up</button></>
          ) : (
            <>Already have one? <button onClick={() => switchMode('login')}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
