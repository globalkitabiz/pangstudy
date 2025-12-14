// 덱 목록 컴포넌트
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { deckAPI, shareAPI } from '../utils/api';
import Statistics from './Statistics';

class DeckList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            decks: [],
            loading: true,
            error: '',
            success: '',
            newDeckName: '',
            showCreateForm: false,
            showImportForm: false,
            shareToken: ''
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
            this.setState({ newDeckName: '', showCreateForm: false, success: '덱이 생성되었습니다!' });
            this.loadDecks();
            setTimeout(() => this.setState({ success: '' }), 3000);
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    handleImportDeck = async (e) => {
        e.preventDefault();
        const { shareToken } = this.state;
        if (!shareToken.trim()) return;

        try {
            const result = await shareAPI.importSharedDeck(shareToken);
            this.setState({
                shareToken: '',
                showImportForm: false,
                success: result.message || '덱을 가져왔습니다!'
            });
            this.loadDecks();
            setTimeout(() => this.setState({ success: '' }), 3000);
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    render() {
        const { decks, loading, error, success, newDeckName, showCreateForm, showImportForm, shareToken } = this.state;

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

                {success && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
                        {success}
                    </div>
                )}

                <Statistics />

                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    {!showCreateForm && !showImportForm && (
                        <>
                            <button
                                onClick={() => this.setState({ showCreateForm: true })}
                                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                + 새 덱 만들기
                            </button>
                            <button
                                onClick={() => this.setState({ showImportForm: true })}
                                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                📥 공유된 덱 받기
                            </button>
                        </>
                    )}

                    {showCreateForm && (
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa', flex: 1 }}>
                            <h5>새 덱 만들기</h5>
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

                    {showImportForm && (
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa', flex: 1 }}>
                            <h5>공유된 덱 가져오기</h5>
                            <form onSubmit={this.handleImportDeck}>
                                <input
                                    type="text"
                                    placeholder="공유 링크 또는 토큰 입력"
                                    value={shareToken}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // URL에서 토큰 추출
                                        const match = value.match(/shared\/([a-f0-9-]+)/i);
                                        this.setState({ shareToken: match ? match[1] : value });
                                    }}
                                    autoFocus
                                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                                <button
                                    type="submit"
                                    style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    가져오기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => this.setState({ showImportForm: false, shareToken: '' })}
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
                        덱이 없습니다. 새 덱을 만들거나 공유된 덱을 가져와보세요!
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
