// API 호출 유틸리티
const API_BASE = process.env.NODE_ENV === 'production'
    ? '' // Cloudflare Pages에서는 같은 도메인
    : 'http://localhost:8788'; // 로컬 개발 시 Wrangler dev 포트

// 인증 토큰 가져오기
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// API 요청 헬퍼
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

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
    getByDeck: (deckId) => apiRequest(`/api/cards/${deckId}`),

    create: (deckId, front, back, media_front, media_back) =>
        apiRequest(`/api/cards/${deckId}`, {
            method: 'POST',
            body: JSON.stringify({ front, back, media_front, media_back }),
        }),

    delete: (cardId) =>
        apiRequest(`/api/cards/${cardId}`, {
            method: 'DELETE',
        }),
};

// 학습 API
export const studyAPI = {
    getDueCards: (deckId) => apiRequest(`/api/study/${deckId}/due`),

    submitReview: (cardId, difficulty) =>
        apiRequest(`/api/study/review`, {
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

    getSharedDeck: (shareToken) =>
        apiRequest(`/api/shared/${shareToken}`),

    importSharedDeck: (shareToken) =>
        apiRequest(`/api/shared/${shareToken}/import`, {
            method: 'POST',
        }),
};
