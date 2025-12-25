import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { authAPI } from '../utils/api';
import LanguageSelector from './LanguageSelector';
import './Layout.css';

class Layout extends Component {
  render() {
    const { t } = this.props;
    const user = authAPI.getUser();
    return (
      <div className="layout-container">
        <header className="layout-header">
          <div className="header-content">
            <div className="header-brand">
              <h1 className="brand-title">Pangstudy</h1>
            </div>
            <nav className="header-nav">
              <Link to="/decks" className="nav-link">{t('nav.decks')}</Link>
              <Link to="/recommendations" className="nav-link">{t('nav.recommendations')}</Link>
              <Link to="/study/assigned" className="nav-link">{t('nav.assigned')}</Link>
              {user && user.is_admin && <Link to="/admin" className="nav-link">{t('nav.admin')}</Link>}
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

export default withTranslation('common')(Layout);
