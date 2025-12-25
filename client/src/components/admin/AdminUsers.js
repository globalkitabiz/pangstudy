// 관리자 - 사용자 관리
import React, { Component } from 'react';
import { adminAPI } from '../../utils/api';

class AdminUsers extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            loading: true,
            error: '',
            showAddForm: false,
            newUser: { name: '', email: '', password: '' },
            editingUser: null
        };
    }

    componentDidMount() {
        this.loadUsers();
    }

    loadUsers = async () => {
        try {
            const res = await adminAPI.getUsers();
            this.setState({ users: res.users || [], loading: false });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    handleAddUser = async (e) => {
        e.preventDefault();
        const { newUser } = this.state;
        try {
            await adminAPI.addUser(newUser.name, newUser.email, newUser.password);
            this.setState({ showAddForm: false, newUser: { name: '', email: '', password: '' } });
            this.loadUsers();
        } catch (err) {
            alert('사용자 추가 실패: ' + err.message);
        }
    };

    handleToggleAdmin = async (userId, currentIsAdmin) => {
        try {
            await adminAPI.updateUser(userId, { is_admin: !currentIsAdmin });
            this.loadUsers();
        } catch (err) {
            alert('권한 변경 실패: ' + err.message);
        }
    };

    handleResetPassword = async (userId) => {
        const newPassword = prompt('새 비밀번호를 입력하세요:');
        if (!newPassword) return;
        try {
            await adminAPI.updateUser(userId, { password: newPassword });
            alert('비밀번호가 변경되었습니다.');
        } catch (err) {
            alert('비밀번호 변경 실패: ' + err.message);
        }
    };

    handleDeleteUser = async (userId, email) => {
        if (!window.confirm(`정말 ${email} 사용자를 삭제하시겠습니까?`)) return;
        try {
            await adminAPI.deleteUser(userId);
            this.loadUsers();
        } catch (err) {
            alert('삭제 실패: ' + err.message);
        }
    };

    render() {
        const { users, loading, error, showAddForm, newUser } = this.state;

        const cardStyle = {
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        };

        const btnStyle = (color) => ({
            padding: '6px 12px',
            backgroundColor: color,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginRight: '5px'
        });

        if (loading) return <div>로딩 중...</div>;
        if (error) return <div style={{ color: 'red' }}>{error}</div>;

        return (
            <div>
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={() => this.setState({ showAddForm: !showAddForm })}
                        style={btnStyle('#3498db')}
                    >
                        + 사용자 추가
                    </button>
                </div>

                {showAddForm && (
                    <div style={{ ...cardStyle, marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 15px', fontSize: '16px' }}>새 사용자 추가</h3>
                        <form onSubmit={this.handleAddUser}>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="이름"
                                    value={newUser.name}
                                    onChange={(e) => this.setState({ newUser: { ...newUser, name: e.target.value } })}
                                    required
                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
                                />
                                <input
                                    type="email"
                                    placeholder="이메일"
                                    value={newUser.email}
                                    onChange={(e) => this.setState({ newUser: { ...newUser, email: e.target.value } })}
                                    required
                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
                                />
                                <input
                                    type="password"
                                    placeholder="비밀번호"
                                    value={newUser.password}
                                    onChange={(e) => this.setState({ newUser: { ...newUser, password: e.target.value } })}
                                    required
                                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
                                />
                                <button type="submit" style={btnStyle('#2ecc71')}>추가</button>
                                <button type="button" onClick={() => this.setState({ showAddForm: false })} style={btnStyle('#95a5a6')}>취소</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={cardStyle}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#7f8c8d' }}>ID</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#7f8c8d' }}>이름</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#7f8c8d' }}>이메일</th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', color: '#7f8c8d' }}>관리자</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#7f8c8d' }}>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>{user.id}</td>
                                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>{user.username || user.name}</td>
                                    <td style={{ padding: '12px 8px', fontSize: '14px', color: '#7f8c8d' }}>{user.email}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={user.is_admin === 1 || user.is_admin === true}
                                            onChange={() => this.handleToggleAdmin(user.id, user.is_admin)}
                                        />
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                        <button onClick={() => this.handleResetPassword(user.id)} style={btnStyle('#f39c12')}>비밀번호</button>
                                        <button onClick={() => this.handleDeleteUser(user.id, user.email)} style={btnStyle('#e74c3c')}>삭제</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>사용자가 없습니다</div>
                    )}
                </div>
            </div>
        );
    }
}

export default AdminUsers;
