// 한국어 번역 사용 훅
import { useState, useEffect } from 'react';
import ko from './ko.json';

const translations = { ko };

export function useTranslation(lang = 'ko') {
    const [t, setT] = useState(() => createTranslator(lang));

    useEffect(() => {
        setT(() => createTranslator(lang));
    }, [lang]);

    return { t };
}

function createTranslator(lang) {
    const messages = translations[lang] || translations.ko;

    return function translate(key) {
        const keys = key.split('.');
        let value = messages;

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                console.warn(`Translation missing: ${key}`);
                return key;
            }
        }

        return value;
    };
}
