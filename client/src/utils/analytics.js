import { authAPI } from './api';

const API_BASE = '';

const getAuthToken = () => localStorage.getItem('authToken');

export async function logRecommendationEvent(eventType, deckId = null, variant = null) {
    const token = getAuthToken();
    const body = { eventType, deckId, variant };
    if (authAPI.getUser()) body.userId = authAPI.getUser().id;

    try {
        await fetch(`${API_BASE}/api/analytics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(body),
        });
    } catch (e) {
        // swallow errors (non-blocking)
        console.warn('analytics log failed', e);
    }
}
