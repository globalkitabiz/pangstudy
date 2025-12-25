import React, { Component } from 'react';

export default class AdminReport extends Component {
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
    return (
      <div className="AdminReport" style={{ marginTop: 20 }}>
        <h3>Week 1 Report</h3>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {content ? (
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12 }}>{content}</pre>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    );
  }
}
