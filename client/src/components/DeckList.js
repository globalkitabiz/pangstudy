// 덱 목록 컴포넌트
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { deckAPI, authAPI } from '../utils/api';

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
            this.setState({ newDeckName: '', showCreateForm: false });
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
            return <div style={{ textAlign: 'center', marginTop: '50px' }}>로딩 중...</div>;
        }

        return (
            <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>내 덱</h2>
                    <button
                        onClick={this.handleLogout}
                        style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        로그아웃
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    {!showCreateForm ? (
                        <button
                            onClick={() => this.setState({ showCreateForm: true })}
                            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            + 새 덱 만들기
                        </button>
                    ) : (
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                            <form onSubmit={this.handleCreateDeck}>
                                <input
                                    type="text"
                                    placeholder="덱 이름"
                                    value={newDeckName}
                                    onChange={(e) => this.setState({ newDeckName: e.target.value })}
                                    autoFocus
                                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                                <button
                                    type="submit"
                                    style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    만들기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => this.setState({ showCreateForm: false })}
                                    style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    취소
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {decks.length === 0 ? (
                    <div style={{ padding: '15px', backgroundColor: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb', borderRadius: '4px' }}>
                        덱이 없습니다. 새 덱을 만들어보세요!
                    </div>
                ) : (
                    <div>
                        {decks.map(deck => (
                            <Link
                                key={deck.id}
                                to={`/decks/${deck.id}`}
                                style={{
                                    display: 'block',
                                    padding: '15px',
                                    marginBottom: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h5 style={{ margin: '0 0 5px 0' }}>{deck.name}</h5>
                                        {deck.description && <small style={{ color: '#6c757d' }}>{deck.description}</small>}
                                    </div>
                                    <div style={{ color: '#6c757d' }}>
                                        <small>{deck.card_count || 0} 카드</small>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

export default DeckList;
