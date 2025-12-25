import React, { Component } from 'react';

export default class AssignModal extends Component {
  state = {
    user_id: this.props.user ? this.props.user.id : '',
    deck_id: '',
    card_id: '',
    due_date: '',
    repeat_interval_days: 0,
    notes: '',
    submitting: false,
    error: null,
    decks: [],
    cards: [],
  };

  componentDidUpdate(prevProps) {
    if (this.props.user !== prevProps.user) {
      this.setState({ user_id: this.props.user ? this.props.user.id : '' });
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  submit = async () => {
    this.setState({ submitting: true, error: null });
    const token = localStorage.getItem('authToken');
    try {
      const body = {
        user_id: Number(this.state.user_id),
        deck_id: this.state.deck_id ? Number(this.state.deck_id) : null,
        card_id: this.state.card_id ? Number(this.state.card_id) : null,
        due_date: this.state.due_date || null,
        repeat_interval_days: Number(this.state.repeat_interval_days) || 0,
        notes: this.state.notes || null,
      };

      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Assign failed');
      }

      const data = await res.json();
      this.setState({ submitting: false });
      this.props.onSuccess && this.props.onSuccess(data);
    } catch (e) {
      this.setState({ submitting: false, error: e.message });
    }
  };

  componentDidMount() {
    // load decks for dropdown
    fetch('/api/decks')
      .then(r => r.json())
      .then(j => {
        if (j.decks) this.setState({ decks: j.decks });
      })
      .catch(() => {});
  }

  handleDeckChange = (e) => {
    const deck_id = e.target.value;
    this.setState({ deck_id, card_id: '', cards: [] });
    if (!deck_id) return;

    // fetch cards for selected deck
    fetch(`/api/decks/${deck_id}/cards`)
      .then(r => r.json())
      .then(j => {
        if (j.cards) this.setState({ cards: j.cards });
      })
      .catch(() => {});
  };

  render() {
    const { onClose, visible, user } = this.props;
    if (!visible) return null;

    const { user_id, deck_id, card_id, due_date, repeat_interval_days, notes, submitting, error } = this.state;

    return (
      <div className="AssignModal" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', padding: 16, width: 520, borderRadius: 6 }}>
          <h3>Assign to user {user ? user.name : ''}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>
              User ID
              <input name="user_id" value={user_id} onChange={this.handleChange} />
            </label>
            <label>
              Deck
              <select name="deck_id" value={deck_id} onChange={this.handleDeckChange}>
                <option value="">-- 선택 --</option>
                {this.state.decks.map(d => (
                  <option key={d.id} value={d.id}>{d.name} (id:{d.id})</option>
                ))}
              </select>
            </label>
            <label>
              Card
              <select name="card_id" value={card_id} onChange={this.handleChange}>
                <option value="">-- 덱 전체 할당 --</option>
                {this.state.cards.map(c => (
                  <option key={c.id} value={c.id}>{c.front ? c.front.substring(0,40) : ('card ' + c.id)}</option>
                ))}
              </select>
            </label>
            <label>
              Due date (YYYY-MM-DD HH:MM:SS)
              <input name="due_date" value={due_date} onChange={this.handleChange} />
            </label>
            <label>
              Repeat days
              <input name="repeat_interval_days" type="number" value={repeat_interval_days} onChange={this.handleChange} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Notes
              <input name="notes" value={notes} onChange={this.handleChange} />
            </label>
          </div>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={onClose} disabled={submitting}>Cancel</button>
            <button onClick={this.submit} disabled={submitting}>{submitting ? 'Assigning...' : 'Assign'}</button>
          </div>
        </div>
      </div>
    );
  }
}
