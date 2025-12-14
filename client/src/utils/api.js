// API 유틸리티 함수
const API_BASE_URL = '';

// 토큰 가져오기
const getAuthToken = () => localStorage.getItem('authToken');

// API 요청 함수
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
};

// 인증 API
export const authAPI = {
    register: (email, password, username) =>
        apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username }),
        }),

    login: (email, password) =>
        apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    saveToken: (token, user) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
};

// 덱 API
export const deckAPI = {
    getAll: () => apiRequest('/api/decks'),

    get: (deckId) => apiRequest(`/api/decks/${deckId}`),

    create: (name, description) =>
        apiRequest('/api/decks', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        }),

    delete: (deckId) =>
        apiRequest(`/api/decks/${deckId}`, {
            method: 'DELETE',
        }),
};

// 카드 API
export const cardAPI = {
    create: (deckId, front, back) =>
        apiRequest(`/api/cards`, {
            method: 'POST',
            body: JSON.stringify({ deckId, front, back }),
        }),
    getByDeck: (deckId) => apiRequest(`/api/decks/${deckId}/cards`),
    delete: (cardId) =>
        apiRequest(`/api/cards/${cardId}`, {
            method: 'DELETE',
        }),
    update: (cardId, front, back) =>
        apiRequest(`/api/cards/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify({ front, back }),
        }),
};

// 학습 API
export const studyAPI = {
    getDueCards: (deckId) => apiRequest(`/api/study/${deckId}/due`),
    submitReview: (cardId, difficulty) =>
        apiRequest('/api/study/review', {
            method: 'POST',
            body: JSON.stringify({ cardId, difficulty }),
        }),
};

// 공유 API
export const shareAPI = {
    shareDeck: (deckId) =>
        apiRequest(`/api/decks/${deckId}/share`, {
            method: 'POST',
        }),
    getSharedDeck: (shareToken) => apiRequest(`/api/shared/${shareToken}`),
    importSharedDeck: (shareToken) =>
        apiRequest(`/api/shared/${shareToken}/import`, {
            method: 'POST',
        }),
};

// Anki 가져오기 API
export const ankiAPI = {
    importDeck: (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = getAuthToken();
        return fetch(`${API_BASE_URL}/api/anki/import`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        }).then((res) => {
            if (!res.ok) {
                return res.json().then((error) => {
                    throw new Error(error.error || 'Import failed');
                });
            }
            return res.json();
        });
    },
};
