import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { authAPI } from '../utils/api';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { ThemeContext } from '../contexts/ThemeContext';
import './Layout.css';

class Layout extends Component {
  static contextType = ThemeContext;

  render() {
    const { t } = this.props;
    const user = authAPI.getUser();
    const { theme } = this.context || {};

    return (
      <div className={`layout-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <header className="layout-header">
          <div className="header-content">
            {/* Logo - Left */}
            <div className="header-brand">
              <h1 className="brand-title">Pangstudy</h1>
            </div>

            {/* Navigation - Center */}
            <nav className="header-nav">
              <Link to="/decks" className="nav-link">{t('nav.decks')}</Link>
              <Link to="/recommendations" className="nav-link">{t('nav.recommendations')}</Link>
              <Link to="/study/assigned" className="nav-link">{t('nav.assigned')}</Link>
              {user && user.is_admin && <Link to="/admin" className="nav-link">{t('nav.admin')}</Link>}
            </nav>

            {/* Right Section - Theme, Language & Auth */}
            <div className="header-right">
              <ThemeToggle />
              <LanguageSelector />
              {user ? (
                <button
                  className="logout-btn"
                  onClick={() => {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                >
                  {t('nav.logout')}
                </button>
              ) : (
                <Link to="/login" className="nav-link">{t('nav.login')}</Link>
              )}
            </div>
          </div>
        </header>
        <main className="layout-main">
          {this.props.children}
        </main>
      </div>
    );
  }
}

export default withTranslation('common')(Layout);
