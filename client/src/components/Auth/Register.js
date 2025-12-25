// 회원가입 컴포넌트
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { getErrorMessage } from '../../utils/errorHandler';
import { ThemeContext } from '../../contexts/ThemeContext';

class Register extends Component {
    static contextType = ThemeContext;
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
            const response = await authAPI.register(this.state.email, this.state.password, this.state.username);
            // 토큰과 사용자 정보 저장
            authAPI.saveToken(response.token, response.user);

            if (this.props.onRegisterSuccess) {
                this.props.onRegisterSuccess();
            }

            // 덱 목록 페이지로 리다이렉션 (React Router 사용)
            this.props.history.push('/decks');
        } catch (err) {
            this.setState({ error: getErrorMessage(err) });
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { email, password, username, error, loading } = this.state;
        const { onSwitchToLogin } = this.props;
        const { colors } = this.context || {};

        return (
            <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: `1px solid ${colors?.cardBorder || '#ddd'}`, borderRadius: '8px', backgroundColor: colors?.cardBackground || '#fff' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: colors?.text }}>회원가입</h2>

                {error && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: colors?.alertDanger?.bg || '#f8d7da', color: colors?.alertDanger?.text || '#721c24', border: `1px solid ${colors?.alertDanger?.border || '#f5c6cb'}`, borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={this.handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colors?.text }}>이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => this.setState({ email: e.target.value })}
                            required
                            style={{ width: '100%', padding: '8px', border: `1px solid ${colors?.inputBorder || '#ddd'}`, borderRadius: '4px', fontSize: '14px', backgroundColor: colors?.inputBackground || '#fff', color: colors?.text }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colors?.text }}>사용자 이름</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => this.setState({ username: e.target.value })}
                            style={{ width: '100%', padding: '8px', border: `1px solid ${colors?.inputBorder || '#ddd'}`, borderRadius: '4px', fontSize: '14px', backgroundColor: colors?.inputBackground || '#fff', color: colors?.text }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colors?.text }}>비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => this.setState({ password: e.target.value })}
                            required
                            style={{ width: '100%', padding: '8px', border: `1px solid ${colors?.inputBorder || '#ddd'}`, borderRadius: '4px', fontSize: '14px', backgroundColor: colors?.inputBackground || '#fff', color: colors?.text }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: loading ? '#ccc' : colors?.buttonPrimary || '#007bff',
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

                <div style={{ textAlign: 'center', marginTop: '15px', color: colors?.textSecondary }}>
                    <small>
                        이미 계정이 있으신가요?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: colors?.primary || '#007bff',
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

const RegisterWithRouter = withRouter(Register);
export { RegisterWithRouter as Register };
