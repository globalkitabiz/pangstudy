// 덱 상세 및 카드 관리 컴포넌트
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { cardAPI } from '../utils/api';

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
            return <div style={{ textAlign: 'center', marginTop: '50px' }}>로딩 중...</div>;
        }

        return (
            <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Link
                        to="/decks"
                        style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            marginBottom: '15px',
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        ← 덱 목록으로
                    </Link>
                    <h2>{deck && deck.name}</h2>
                </div>

                {error && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    {!showAddForm ? (
                        <button
                            onClick={() => this.setState({ showAddForm: true })}
                            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            + 카드 추가
                        </button>
                    ) : (
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                            <h5>새 카드 추가</h5>
                            <form onSubmit={this.handleAddCard}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>앞면 (질문)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="예: Hello"
                                        value={newCard.front}
                                        onChange={(e) => this.setState({ newCard: { ...newCard, front: e.target.value } })}
                                        autoFocus
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>뒷면 (답변)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="예: 안녕하세요"
                                        value={newCard.back}
                                        onChange={(e) => this.setState({ newCard: { ...newCard, back: e.target.value } })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    추가
                                </button>
                                <button
                                    type="button"
                                    onClick={() => this.setState({ showAddForm: false })}
                                    style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    취소
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <h4 style={{ marginBottom: '15px' }}>카드 목록 ({cards.length})</h4>

                {cards.length === 0 ? (
                    <div style={{ padding: '15px', backgroundColor: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb', borderRadius: '4px' }}>
                        카드가 없습니다. 카드를 추가해보세요!
                    </div>
                ) : (
                    <div>
                        {cards.map(card => (
                            <div
                                key={card.id}
                                style={{ padding: '15px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <strong>앞면:</strong>
                                        <p style={{ margin: '5px 0 0 0' }}>{card.front}</p>
                                    </div>
                                    <div>
                                        <strong>뒷면:</strong>
                                        <p style={{ margin: '5px 0 0 0' }}>{card.back}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

export default withRouter(DeckDetail);
