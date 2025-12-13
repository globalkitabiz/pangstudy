// 로그인 컴포넌트
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { Form, Button, Alert, Card } from 'react-bootstrap';

export function Login({ onSwitchToRegister, onLoginSuccess }) {
    const { t } = useTranslation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            if (onLoginSuccess) {
                onLoginSuccess();
            }
        } catch (err) {
            setError(err.message || t('auth.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ maxWidth: '400px', margin: '50px auto' }}>
            <Card.Body>
                <h2 className="text-center mb-4">{t('auth.login')}</h2>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>{t('auth.email')}</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('auth.password')}</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-100"
                        disabled={loading}
                    >
                        {loading ? t('common.loading') : t('auth.loginButton')}
                    </Button>
                </Form>

                <div className="text-center mt-3">
                    <small>
                        {t('auth.dontHaveAccount')}{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>
                            {t('auth.register')}
                        </a>
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
}
