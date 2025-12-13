// 로그인 컴포넌트
import React, { Component } from 'react';
import { authAPI } from '../../utils/api';
import { Form, Button, Alert, Card } from 'react-bootstrap';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            error: '',
            loading: false
        };
    }

    handleSubmit = async (e) => {
        e.preventDefault();
        this.setState({ error: '', loading: true });

        try {
            await authAPI.login(this.state.email, this.state.password);
            if (this.props.onLoginSuccess) {
                this.props.onLoginSuccess();
            }
        } catch (err) {
            this.setState({ error: err.message || '로그인 실패' });
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { email, password, error, loading } = this.state;
        const { onSwitchToRegister } = this.props;

        return (
            <Card style={{ maxWidth: '400px', margin: '50px auto' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">로그인</h2>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={this.handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => this.setState({ email: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => this.setState({ password: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-100"
                            disabled={loading}
                        >
                            {loading ? '로딩 중...' : '로그인하기'}
                        </Button>
                    </Form>

                    <div className="text-center mt-3">
                        <small>
                            계정이 없으신가요?{' '}
                            <button
                                className="btn btn-link p-0"
                                style={{ textDecoration: 'underline', border: 'none', background: 'none' }}
                                onClick={onSwitchToRegister}
                            >
                                회원가입
                            </button>
                        </small>
                    </div>
                </Card.Body>
            </Card>
        );
    }
}

export { Login };
