import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './Layout.css';

export class Layout extends Component {
  render() {
    const user = authAPI.getUser();
    return (
      <div className="layout-container">
        <header className="layout-header">
          <div className="header-content">
            <div className="header-brand">
              <h1 className="brand-title">Pangstudy</h1>
            </div>
            <nav className="header-nav">
              <Link to="/decks" className="nav-link">Decks</Link>
              <Link to="/recommendations" className="nav-link">Recommendations</Link>
              <Link to="/study/assigned" className="nav-link">Assigned</Link>
              {user && user.is_admin && <Link to="/admin" className="nav-link">Admin</Link>}
              {user ? (
                <button
                  className="logout-btn"
                  onClick={() => {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" className="nav-link">Login</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="layout-main">
          {this.props.children}
        </main>
      </div>
    );
  }
}

export default Layout;
