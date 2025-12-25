// 관리자 전용 레이아웃
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { authAPI } from '../../utils/api';

class AdminLayout extends Component {
    render() {
        const user = authAPI.getUser();
        const { location } = this.props;
        const currentPath = location.pathname;

        const menuItems = [
            { path: '/admin', label: '대시보드', exact: true },
            { path: '/admin/users', label: '사용자 관리' },
            { path: '/admin/decks', label: '덱 관리' },
            { path: '/admin/assign', label: '학습 할당' },
            { path: '/admin/stats', label: '통계' },
        ];

        const isActive = (item) => {
            if (item.exact) return currentPath === item.path;
            return currentPath.startsWith(item.path);
        };

        return (
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                {/* 사이드바 */}
                <div style={{
                    width: '220px',
                    backgroundColor: '#2c3e50',
                    color: '#ecf0f1',
                    flexShrink: 0
                }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #34495e' }}>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>Pangstudy</h2>
                        <small style={{ color: '#95a5a6' }}>Admin Panel</small>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {menuItems.map(item => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    style={{
                                        display: 'block',
                                        padding: '12px 20px',
                                        color: isActive(item) ? '#fff' : '#bdc3c7',
                                        backgroundColor: isActive(item) ? '#34495e' : 'transparent',
                                        textDecoration: 'none',
                                        borderLeft: isActive(item) ? '4px solid #3498db' : '4px solid transparent'
                                    }}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div style={{ padding: '20px', borderTop: '1px solid #34495e', marginTop: '20px' }}>
                        <Link to="/decks" style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}>
                            &larr; 사이트로 돌아가기
                        </Link>
                    </div>
                </div>

                {/* 메인 콘텐츠 */}
                <div style={{ flex: 1, backgroundColor: '#f5f6fa' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '15px 20px',
                        backgroundColor: '#fff',
                        borderBottom: '1px solid #ddd'
                    }}>
                        <h1 style={{ margin: 0, fontSize: '20px', color: '#2c3e50' }}>
                            {menuItems.find(item => isActive(item))?.label || '관리자'}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ color: '#7f8c8d', fontSize: '14px' }}>
                                {user?.username || user?.email}
                            </span>
                            <button
                                onClick={() => {
                                    authAPI.logout();
                                    window.location.href = '/login';
                                }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#e74c3c',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(AdminLayout);
