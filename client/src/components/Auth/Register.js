// 회원가입 컴포넌트
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { Form, Button, Alert, Card } from 'react-bootstrap';

export function Register({ onSwitchToLogin, onRegisterSuccess }) {
    const { t } = useTranslation();
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(email, password, username);
            if (onRegisterSuccess) {
                onRegisterSuccess();
            }
        } catch (err) {
            setError(err.message || t('auth.registerFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ maxWidth: '400px', margin: '50px auto' }}>
            <Card.Body>
                <h2 className="text-center mb-4">{t('auth.register')}</h2>

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
                        <Form.Label>{t('auth.username')}</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                        {loading ? t('common.loading') : t('auth.registerButton')}
                    </Button>
                </Form>

                <div className="text-center mt-3">
                    <small>
                        {t('auth.alreadyHaveAccount')}{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
                            {t('auth.login')}
                        </a>
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
}
