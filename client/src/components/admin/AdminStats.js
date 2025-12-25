// 관리자 - 통계
import React, { Component } from 'react';
import { adminAPI } from '../../utils/api';

class AdminStats extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stats: null,
            userStats: [],
            loading: true,
            error: ''
        };
    }

    componentDidMount() {
        this.loadStats();
    }

    loadStats = async () => {
        try {
            const [dashRes, userStatsRes] = await Promise.all([
                adminAPI.getDashboardStats(),
                adminAPI.getUserStats()
            ]);
            this.setState({
                stats: dashRes,
                userStats: userStatsRes.users || [],
                loading: false
            });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    render() {
        const { stats, userStats, loading, error } = this.state;

        const cardStyle = {
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
        };

        if (loading) return <div>로딩 중...</div>;
        if (error) return <div style={{ color: 'red' }}>{error}</div>;

        return (
            <div>
                {/* 전체 통계 */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 15px', fontSize: '16px', color: '#2c3e50' }}>전체 통계</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>{stats?.totalUsers || 0}</div>
                            <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '5px' }}>총 사용자</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>{stats?.totalDecks || 0}</div>
                            <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '5px' }}>총 덱</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e67e22' }}>{stats?.totalCards || 0}</div>
                            <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '5px' }}>총 카드</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>{stats?.totalReviews || 0}</div>
                            <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '5px' }}>총 학습 횟수</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1abc9c' }}>{stats?.todayReviews || 0}</div>
                            <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '5px' }}>오늘 학습</div>
                        </div>
                    </div>
                </div>

                {/* 사용자별 통계 */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 15px', fontSize: '16px', color: '#2c3e50' }}>사용자별 학습 현황</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>사용자</th>
                                <th style={{ textAlign: 'center', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>덱 수</th>
                                <th style={{ textAlign: 'center', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>카드 수</th>
                                <th style={{ textAlign: 'center', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>총 학습</th>
                                <th style={{ textAlign: 'center', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>오늘 학습</th>
                                <th style={{ textAlign: 'center', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>마지막 활동</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userStats.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>
                                        <div>{user.username || user.name}</div>
                                        <div style={{ fontSize: '12px', color: '#95a5a6' }}>{user.email}</div>
                                    </td>
                                    <td style={{ padding: '10px 8px', fontSize: '14px', textAlign: 'center' }}>{user.deck_count || 0}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '14px', textAlign: 'center' }}>{user.card_count || 0}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '14px', textAlign: 'center' }}>{user.total_reviews || 0}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '14px', textAlign: 'center' }}>
                                        <span style={{
                                            backgroundColor: user.today_reviews > 0 ? '#d4edda' : '#f8f9fa',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '13px'
                                        }}>
                                            {user.today_reviews || 0}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 8px', fontSize: '13px', textAlign: 'center', color: '#95a5a6' }}>
                                        {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {userStats.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>데이터가 없습니다</div>
                    )}
                </div>
            </div>
        );
    }
}

export default AdminStats;
