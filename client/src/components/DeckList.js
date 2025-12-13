// 덱 목록 컴포넌트
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { deckAPI } from '../utils/api';
import { authAPI } from '../utils/api';
import { Button, Card, ListGroup, Alert } from 'react-bootstrap';

class DeckList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            decks: [],
            loading: true,
            error: '',
            newDeckName: '',
            showCreateForm: false
        };
    }

    componentDidMount() {
        this.loadDecks();
    }

    loadDecks = async () => {
        try {
            this.setState({ loading: true });
            const data = await deckAPI.getAll();
            this.setState({ decks: data.decks || [], loading: false });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    handleCreateDeck = async (e) => {
        e.preventDefault();
        const { newDeckName } = this.state;
        if (!newDeckName.trim()) return;

        try {
            await deckAPI.create(newDeckName, '');
            this.setState({
                newDeckName: '',
                showCreateForm: false
            });
            this.loadDecks();
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    handleLogout = () => {
        authAPI.logout();
        window.location.href = '/login';
    };

    render() {
        const { decks, loading, error, newDeckName, showCreateForm } = this.state;

        if (loading) {
            return <div className="text-center mt-5">로딩 중...</div>;
        }

        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>내 덱</h2>
                    <Button variant="danger" onClick={this.handleLogout}>로그아웃</Button>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="mb-3">
                    {!showCreateForm ? (
                        <Button
                            variant="primary"
                            onClick={() => this.setState({ showCreateForm: true })}
                        >
                            + 새 덱 만들기
                        </Button>
                    ) : (
                        <Card>
                            <Card.Body>
                                <form onSubmit={this.handleCreateDeck}>
                                    <div className="mb-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="덱 이름"
                                            value={newDeckName}
                                            onChange={(e) => this.setState({ newDeckName: e.target.value })}
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" variant="primary" className="me-2">
                                        만들기
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => this.setState({ showCreateForm: false })}
                                    >
                                        취소
                                    </Button>
                                </form>
                            </Card.Body>
                        </Card>
                    )}
                </div>

                {decks.length === 0 ? (
                    <Alert variant="info">
                        덱이 없습니다. 새 덱을 만들어보세요!
                    </Alert>
                ) : (
                    <ListGroup>
                        {decks.map(deck => (
                            <ListGroup.Item key={deck.id}>
                                <Link to={`/decks/${deck.id}`} className="text-decoration-none">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-1">{deck.name}</h5>
                                            {deck.description && (
                                                <small className="text-muted">{deck.description}</small>
                                            )}
                                        </div>
                                        <div className="text-muted">
                                            <small>{deck.card_count || 0} 카드</small>
                                        </div>
                                    </div>
                                </Link>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </div>
        );
    }
}

export default DeckList;
