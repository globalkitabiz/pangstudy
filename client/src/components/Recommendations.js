import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { recommendationsAPI } from '../utils/api';
import { logRecommendationEvent } from '../utils/analytics';
import { getABVariant } from '../utils/abTest';

const Recommendations = () => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);
    const [myOnly, setMyOnly] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const shownLoggedRef = useRef(false);
    const variant = getABVariant();

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        recommendationsAPI.getRecommendations({ my: myOnly })
            .then((res) => {
                if (!mounted) return;
                setItems(res.recommendations || []);
            })
            .catch((err) => {
                if (!mounted) return;
                setError(err.message || 'Failed to load recommendations');
            })
            .finally(() => mounted && setLoading(false));

        return () => { mounted = false; };
    }, [myOnly, refreshKey]);

    useEffect(() => {
        // reset shown flag when query changes
        shownLoggedRef.current = false;
    }, [myOnly, refreshKey]);

    useEffect(() => {
        if (!loading && !shownLoggedRef.current) {
            shownLoggedRef.current = true;
            logRecommendationEvent('recommendations_shown', null, variant);
        }
    }, [loading, items, variant]);

    if (loading) return <div>추천 항목을 불러오는 중...</div>;
    if (error) return <div>오류: {error}</div>;

    return (
        <div>
            <h2>추천 덱</h2>
            <div style={{ marginBottom: 12 }}>
                <label style={{ marginRight: 12 }}>
                    <input type="checkbox" checked={myOnly} onChange={(e) => setMyOnly(e.target.checked)} /> 내 덱만 보기
                </label>
                <button onClick={() => setRefreshKey(k => k + 1)}>새로고침</button>
            </div>

            {!items.length ? (
                <div>추천할 덱이 없습니다. 학습을 시작해보세요!</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {items.map((i) => (
                        <li key={i.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong>{i.name}</strong>
                                    <div style={{ fontSize: 12, color: '#666' }}>
                                        점수: {Math.round(i.score)}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#444', marginTop: 6 }}>
                                        {i.meta && i.meta.due ? <span>대기 카드: {i.meta.due} · </span> : null}
                                        {i.meta && i.meta.assigned ? <span>할당 대기: {i.meta.assigned} · </span> : null}
                                        {i.meta && i.meta.recent ? <span>최근 리뷰: {i.meta.recent} · </span> : null}
                                        {i.meta && i.meta.wrong ? <span style={{ color: '#b00' }}>오답 이력: {i.meta.wrong}</span> : null}
                                    </div>
                                </div>
                                <div>
                                    <Link to={`/decks/${i.id}`} style={{ marginRight: 8 }}>덱 보기</Link>
                                    <Link to={`/study/${i.id}`} onClick={() => logRecommendationEvent('recommendation_start', i.id, variant)}>학습 시작</Link>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Recommendations;
