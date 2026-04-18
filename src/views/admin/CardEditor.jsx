/*
  src/views/admin/CardEditor.jsx
  ─────────────────────────────────────────────────────────────
  Form to add/edit cards, plus the list of existing cards for
  the selected deck. Lives inside views/admin/ because it's only
  ever used by AdminView and the two are tightly coupled.

  It receives the full deck object and an onSave callback.
  When the user saves, it calls onSave with the updated deck —
  it never touches Supabase directly. That's AdminView's job.
  This separation makes CardEditor easier to test and reuse.
*/

import { useState } from 'react';
import { uid } from '../../lib/supabase';

export default function CardEditor({ deck, onSave }) {
  const [form, setForm]     = useState({ front: '', back: '' });
  const [editId, setEditId] = useState(null); // null = adding, id = editing

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    if (!form.front.trim() || !form.back.trim()) return;

    if (editId) {
      // Edit: replace the matching card, leave others unchanged.
      const updated = deck.cards.map(c =>
        c.id === editId ? { ...c, ...form } : c
      );
      onSave({ ...deck, cards: updated });
    } else {
      // Add: append a new card with a generated id.
      onSave({ ...deck, cards: [...deck.cards, { id: uid(), ...form }] });
    }

    setForm({ front: '', back: '' });
    setEditId(null);
  }

  function startEdit(card) {
    setEditId(card.id);
    setForm({ front: card.front, back: card.back });
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ front: '', back: '' });
  }

  function deleteCard(id) {
    onSave({ ...deck, cards: deck.cards.filter(c => c.id !== id) });
    if (editId === id) cancelEdit();
  }

  return (
    <div>
      {/* Add / edit form */}
      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="panel-title">{editId ? 'Edit card' : 'New card'}</div>

        <div className="form-group">
          <label className="form-label">Front (question / word)</label>
          <textarea
            className="input"
            placeholder="e.g. 猫"
            value={form.front}
            onChange={e => setField('front', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Back (answer / meaning)</label>
          <textarea
            className="input"
            placeholder="e.g. cat (ねこ)"
            value={form.back}
            onChange={e => setField('back', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editId ? 'Save changes' : '+ Add card'}
          </button>
          {editId && (
            <button className="btn" onClick={cancelEdit}>Cancel</button>
          )}
        </div>
      </div>

      {/* Card list */}
      <div className="panel-title" style={{ marginBottom: '.7rem' }}>
        Cards <span className="badge">{deck.cards.length}</span>
      </div>

      {deck.cards.length === 0 && (
        <div className="empty" style={{ padding: '1.5rem' }}>No cards yet.</div>
      )}

      {deck.cards.map(card => (
        <div className="card-list-item" key={card.id}>
          <div className="front">{card.front}</div>
          <div className="back">{card.back}</div>
          <div className="actions">
            <button
              className="btn"
              style={{ padding: '.3rem .8rem', fontSize: '.8rem' }}
              onClick={() => startEdit(card)}
            >Edit</button>
            <button
              className="btn btn-danger"
              style={{ padding: '.3rem .8rem', fontSize: '.8rem' }}
              onClick={() => deleteCard(card.id)}
            >Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
