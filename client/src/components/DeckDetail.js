// 덱 상세 및 카드 관리 컴포넌트
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { cardAPI } from '../utils/api';
import { Button, Card, ListGroup, Alert, Form } from 'react-bootstrap';

class DeckDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deck: null,
            cards: [],
            loading: true,
            error: '',
            showAddForm: false,
            newCard: { front: '', back: '' }
        };
    }

    componentDidMount() {
        this.loadDeckAndCards();
    }

    loadDeckAndCards = async () => {
        const { deckId } = this.props.match.params;
        try {
            this.setState({ loading: true });
            const cardsData = await cardAPI.getByDeck(deckId);
            this.setState({
                cards: cardsData.cards || [],
                deck: { id: deckId, name: `덱 ${deckId}` },
                loading: false
            });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    handleAddCard = async (e) => {
        e.preventDefault();
        const { deckId } = this.props.match.params;
        const { newCard } = this.state;

        if (!newCard.front.trim() || !newCard.back.trim()) return;

        try {
            await cardAPI.create(deckId, newCard.front, newCard.back);
            this.setState({
                newCard: { front: '', back: '' },
                showAddForm: false
            });
            this.loadDeckAndCards();
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    render() {
        const { deck, cards, loading, error, showAddForm, newCard } = this.state;

        if (loading) {
            return <div className="text-center mt-5">로딩 중...</div>;
        }

        return (
            <div className="container mt-4">
                <div className="mb-4">
                    <Link to="/decks" className="btn btn-secondary mb-3">← 덱 목록으로</Link>
                    <h2>{deck && deck.name}</h2>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="mb-3">
                    {!showAddForm ? (
                        <Button
                            variant="primary"
                            onClick={() => this.setState({ showAddForm: true })}
                        >
                            + 카드 추가
                        </Button>
                    ) : (
                        <Card>
                            <Card.Body>
                                <h5>새 카드 추가</h5>
                                <Form onSubmit={this.handleAddCard}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>앞면 (질문)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="예: Hello"
                                            value={newCard.front}
                                            onChange={(e) => this.setState({
                                                newCard: { ...newCard, front: e.target.value }
                                            })}
                                            autoFocus
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>뒷면 (답변)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="예: 안녕하세요"
                                            value={newCard.back}
                                            onChange={(e) => this.setState({
                                                newCard: { ...newCard, back: e.target.value }
                                            })}
                                        />
                                    </Form.Group>
                                    <Button type="submit" variant="primary" className="me-2">
                                        추가
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => this.setState({ showAddForm: false })}
                                    >
                                        취소
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}
                </div>

                <h4 className="mb-3">카드 목록 ({cards.length})</h4>

                {cards.length === 0 ? (
                    <Alert variant="info">
                        카드가 없습니다. 카드를 추가해보세요!
                    </Alert>
                ) : (
                    <ListGroup>
                        {cards.map(card => (
                            <ListGroup.Item key={card.id}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <strong>앞면:</strong>
                                        <p className="mb-0">{card.front}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <strong>뒷면:</strong>
                                        <p className="mb-0">{card.back}</p>
                                    </div>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </div>
        );
    }
}

export default withRouter(DeckDetail);
