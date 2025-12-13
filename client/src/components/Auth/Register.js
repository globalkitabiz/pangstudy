// 회원가입 컴포넌트
import React, { Component } from 'react';
import { authAPI } from '../../utils/api';

class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            username: '',
            error: '',
            loading: false
        };
    }

    handleSubmit = async (e) => {
        e.preventDefault();
        this.setState({ error: '', loading: true });

        try {
            await authAPI.register(this.state.email, this.state.password, this.state.username);
            if (this.props.onRegisterSuccess) {
                this.props.onRegisterSuccess();
            }
        } catch (err) {
            this.setState({ error: err.message || '회원가입 실패' });
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { email, password, username, error, loading } = this.state;
        const { onSwitchToLogin } = this.props;

        return (
            <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>회원가입</h2>

                {error && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={this.handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => this.setState({ email: e.target.value })}
                            required
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>사용자 이름</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => this.setState({ username: e.target.value })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => this.setState({ password: e.target.value })}
                            required
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '로딩 중...' : '가입하기'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <small>
                        이미 계정이 있으신가요?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#007bff',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: 'inherit'
                            }}
                        >
                            로그인
                        </button>
                    </small>
                </div>
            </div>
        );
    }
}

export { Register };
