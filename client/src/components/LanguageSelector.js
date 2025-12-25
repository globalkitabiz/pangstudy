import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
  { code: 'id', label: 'ID' }
];

function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.substring(0, 2) || 'ko';

  const handleChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      marginRight: '15px',
      marginLeft: '10px'
    }}>
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: currentLang === lang.code ? '#fff' : 'rgba(255,255,255,0.2)',
            color: currentLang === lang.code ? '#6366f1' : '#fff',
            fontSize: '11px',
            fontWeight: currentLang === lang.code ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSelector;
