// 통계 컴포넌트
import React, { Component } from 'react';

class Statistics extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stats: null,
            loading: true,
            error: ''
        };
    }

    componentDidMount() {
        this.loadStats();
    }

    loadStats = async () => {
        try {
            const response = await fetch('/api/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load stats');

            const data = await response.json();
            this.setState({ stats: data, loading: false });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    render() {
        const { stats, loading, error } = this.state;

        if (loading) return <div>로딩 중...</div>;
        if (error) return <div>오류: {error}</div>;
        if (!stats) return null;

        return (
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>📊 학습 통계</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.deckCount}</div>
                        <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>총 덱</div>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.cardCount}</div>
                        <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>총 카드</div>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{stats.todayReviews}</div>
                        <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>오늘 학습</div>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.dueCards}</div>
                        <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>학습 대기</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Statistics;
