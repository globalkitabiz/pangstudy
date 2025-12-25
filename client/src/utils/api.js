// API 유틸리티 함수
const API_BASE_URL = '';

// 토큰 가져오기
const getAuthToken = () => localStorage.getItem('authToken');

// API 요청 함수
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    console.log('[API]', endpoint, 'token:', token ? token.substring(0, 20) + '...' : 'null');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    console.log('[API]', endpoint, 'status:', response.status);

    if (!response.ok) {
        // 401 에러 로깅 (리다이렉트 루프 방지를 위해 자동 리다이렉트 제거)
        const isAuthEndpoint = endpoint.startsWith('/api/auth/');
        if (response.status === 401 && !isAuthEndpoint) {
            console.error('[API] 401 Unauthorized:', endpoint);
            // 자동 리다이렉트 대신 에러만 throw
            throw new Error('Unauthorized - please login again');
        }
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

    create: (name, description, metadata = {}) =>
        apiRequest('/api/decks', {
            method: 'POST',
            body: JSON.stringify({ name, description, ...metadata }),
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
    bulkCreate: (deckId, cards) =>
        apiRequest(`/api/cards/bulk`, {
            method: 'POST',
            body: JSON.stringify({ deckId, cards }),
        }),
};

// 학습 API
export const studyAPI = {
    getDueCards: (deckId) => apiRequest(`/api/study/${deckId}/due`),
    getAssignedDue: () => apiRequest('/api/study/assigned/due'),
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

// 추천 API (MVP)
export const recommendationsAPI = {
    // opts: { my: boolean }
    getRecommendations: (opts = {}) => {
        const params = [];
        if (opts.my) params.push('my=1');
        const q = params.length ? `?${params.join('&')}` : '';
        return apiRequest(`/api/recommendations${q}`);
    },
};

// 관리자 API
export const adminAPI = {
    // 사용자 목록 조회
    getUsers: () => apiRequest('/api/users'),

    // 사용자 추가
    addUser: (name, email, password) =>
        apiRequest('/api/users', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        }),

    // 사용자 삭제
    deleteUser: (userId) =>
        apiRequest(`/api/admin/users?userId=${userId}`, {
            method: 'DELETE',
        }),

    // 사용자 정보 수정
    updateUser: (userId, updates) =>
        apiRequest('/api/admin/users', {
            method: 'PUT',
            body: JSON.stringify({ userId, ...updates }),
        }),

    // 학습 할당
    assignToUser: (data) =>
        apiRequest('/api/admin/assign', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // 대시보드 통계
    getDashboardStats: () => apiRequest('/api/admin/stats'),

    // 모든 덱 조회 (관리자용)
    getAllDecks: () => apiRequest('/api/admin/decks'),

    // 덱 삭제 (관리자용)
    deleteDeck: (deckId) =>
        apiRequest(`/api/admin/decks/${deckId}`, {
            method: 'DELETE',
        }),

    // 덱의 카드 조회
    getDeckCards: (deckId) => apiRequest(`/api/decks/${deckId}/cards`),

    // 할당 목록 조회
    getAssignments: () => apiRequest('/api/admin/assignments'),

    // 할당 삭제
    deleteAssignment: (assignmentId) =>
        apiRequest(`/api/admin/assignments/${assignmentId}`, {
            method: 'DELETE',
        }),

    // 사용자별 통계
    getUserStats: () => apiRequest('/api/admin/user-stats'),
};
