import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ko', flag: 'KO' },
  { code: 'en', flag: 'EN' },
  { code: 'id', flag: 'ID' }
];

function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select
      value={i18n.language?.substring(0, 2) || 'ko'}
      onChange={handleChange}
      style={{
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        fontSize: '12px',
        cursor: 'pointer',
        marginRight: '10px'
      }}
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag}
        </option>
      ))}
    </select>
  );
}

export default LanguageSelector;
