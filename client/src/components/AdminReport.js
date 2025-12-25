import React, { Component } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default class AdminReport extends Component {
  static contextType = ThemeContext;
  state = { content: null, error: null };

  componentDidMount() {
    fetch('/week1_completion.md')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load report');
        return r.text();
      })
      .then((text) => this.setState({ content: text }))
      .catch((e) => this.setState({ error: e.message }));
  }

  render() {
    const { content, error } = this.state;
    const { colors } = this.context || {};

    return (
      <div className="AdminReport" style={{ marginTop: 20 }}>
        <h3 style={{ color: colors?.text }}>Week 1 Report</h3>
        {error && <div style={{ color: colors?.danger || 'red' }}>{error}</div>}
        {content ? (
          <pre style={{ whiteSpace: 'pre-wrap', background: colors?.backgroundSecondary || '#f6f8fa', padding: 12, color: colors?.text, borderRadius: 4, border: `1px solid ${colors?.border || '#ddd'}` }}>{content}</pre>
        ) : (
          <div style={{ color: colors?.text }}>Loading...</div>
        )}
      </div>
    );
  }
}
