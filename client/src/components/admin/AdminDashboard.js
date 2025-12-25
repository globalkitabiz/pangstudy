// 관리자 대시보드
import React, { Component } from 'react';
import { adminAPI } from '../../utils/api';

class AdminDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stats: null,
            recentUsers: [],
            recentActivity: [],
            loading: true,
            error: ''
        };
    }

    componentDidMount() {
        this.loadDashboardData();
    }

    loadDashboardData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                adminAPI.getDashboardStats(),
                adminAPI.getUsers()
            ]);

            this.setState({
                stats: statsRes,
                recentUsers: usersRes.users?.slice(0, 5) || [],
                loading: false
            });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    render() {
        const { stats, recentUsers, loading, error } = this.state;

        const cardStyle = {
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        };

        const statCardStyle = (color) => ({
            ...cardStyle,
            borderLeft: `4px solid ${color}`,
            flex: 1,
            minWidth: '200px'
        });

        if (loading) {
            return <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>;
        }

        if (error) {
            return <div style={{ color: '#e74c3c', padding: '20px' }}>{error}</div>;
        }

        return (
            <div>
                {/* 통계 카드 */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={statCardStyle('#3498db')}>
                        <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>총 사용자</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
                            {stats?.totalUsers || 0}
                        </div>
                    </div>
                    <div style={statCardStyle('#2ecc71')}>
                        <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>총 덱</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
                            {stats?.totalDecks || 0}
                        </div>
                    </div>
                    <div style={statCardStyle('#e67e22')}>
                        <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>총 카드</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
                            {stats?.totalCards || 0}
                        </div>
                    </div>
                    <div style={statCardStyle('#9b59b6')}>
                        <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>오늘 학습</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
                            {stats?.todayReviews || 0}
                        </div>
                    </div>
                </div>

                {/* 최근 사용자 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={cardStyle}>
                        <h3 style={{ margin: '0 0 15px', color: '#2c3e50', fontSize: '16px' }}>최근 가입 사용자</h3>
                        {recentUsers.length === 0 ? (
                            <div style={{ color: '#95a5a6' }}>사용자가 없습니다</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #eee' }}>
                                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#7f8c8d', fontWeight: 'normal', fontSize: '13px' }}>이름</th>
                                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#7f8c8d', fontWeight: 'normal', fontSize: '13px' }}>이메일</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                            <td style={{ padding: '10px 0', fontSize: '14px' }}>{user.username || user.name}</td>
                                            <td style={{ padding: '10px 0', fontSize: '14px', color: '#7f8c8d' }}>{user.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ margin: '0 0 15px', color: '#2c3e50', fontSize: '16px' }}>시스템 정보</h3>
                        <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <strong>플랫폼:</strong> Cloudflare Pages
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <strong>데이터베이스:</strong> D1 SQLite
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <strong>버전:</strong> 1.0.0
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default AdminDashboard;
