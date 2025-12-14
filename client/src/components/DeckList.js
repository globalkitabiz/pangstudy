// 덱 목록 컴포넌트
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { deckAPI, shareAPI } from '../utils/api';
import { getErrorMessage, getSuccessMessage } from '../utils/errorHandler';
import Statistics from './Statistics';
import LoadingSpinner from './LoadingSpinner';

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
            showAnkiImport: false,
            shareToken: '',
            ankiFile: null,
            ankiImporting: false,
            searchQuery: '',
            sortBy: 'created'
        };
    }

    componentDidMount() {
        this.loadDecks();
    }

    loadDecks = async () => {
        try {
            const response = await deckAPI.getAll();
            this.setState({ decks: response.decks, loading: false });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
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
            this.setState({ shareToken: '', showImportForm: false, success: result.message || '덱을 가져왔습니다!' });
            this.loadDecks();
            setTimeout(() => this.setState({ success: '' }), 3000);
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    handleAnkiImport = async (e) => {
        e.preventDefault();
        const { ankiFile } = this.state;

        if (!ankiFile) {
            this.setState({ error: 'Anki 파일을 선택해주세요.' });
            return;
        }

        this.setState({ ankiImporting: true, error: '' });

        try {
            const formData = new FormData();
            formData.append('file', ankiFile);

            const token = localStorage.getItem('authToken');
            const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8788';

            const response = await fetch(`${API_BASE}/api/anki/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Anki 파일 가져오기 실패');
            }

            this.setState({
                ankiFile: null,
                showAnkiImport: false,
                ankiImporting: false,
                success: result.message || `${result.deckName} 덱을 가져왔습니다! (${result.cardCount}장)`
            });
            this.loadDecks();
            setTimeout(() => this.setState({ success: '' }), 5000);
        } catch (err) {
            this.setState({ error: err.message, ankiImporting: false });
        }
    };

    openAnkiWeb = () => {
        window.open('https://ankiweb.net/shared/decks', '_blank');
    };

    handleDeleteDeck = async (e, deckId, deckName) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm(`"${deckName}" 덱을 삭제하시겠습니까?\n모든 카드와 학습 기록이 삭제됩니다.`)) {
            return;
        }

        try {
            await deckAPI.delete(deckId);
            this.setState({ success: '덱이 삭제되었습니다.' });
            this.loadDecks();
            setTimeout(() => this.setState({ success: '' }), 3000);
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    // 검색 및 정렬된 덱 목록 가져오기
    getFilteredAndSortedDecks = () => {
        const { decks, searchQuery, sortBy } = this.state;

        // 검색 필터링
        let filtered = decks;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = decks.filter(deck =>
                deck.name.toLowerCase().includes(query) ||
                (deck.description && deck.description.toLowerCase().includes(query))
            );
        }

        // 정렬
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'created':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'cards':
                    return (b.card_count || 0) - (a.card_count || 0);
                default:
                    return 0;
            }
        });

        return sorted;
    };

    render() {
        const { loading, error, success, newDeckName, showCreateForm, showImportForm, showAnkiImport, shareToken, ankiFile, ankiImporting, searchQuery, sortBy } = this.state;

        if (loading) {
            return <LoadingSpinner message="덱 목록을 불러오는 중..." />;
        }

        const filteredDecks = this.getFilteredAndSortedDecks();

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

                {/* 검색 및 정렬 */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="🔍 덱 검색 (이름 또는 설명)..."
                        value={searchQuery}
                        onChange={(e) => this.setState({ searchQuery: e.target.value })}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => this.setState({ sortBy: e.target.value })}
                        style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="created">최신순</option>
                        <option value="name">이름순</option>
                        <option value="cards">카드 수</option>
                    </select>
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {!showCreateForm && !showImportForm && !showAnkiImport && (
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
                                <span role="img" aria-label="받기">📥</span> 공유된 덱 받기
                            </button>
                            <button
                                onClick={() => this.setState({ showAnkiImport: true })}
                                style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                <span role="img" aria-label="Anki">🃏</span> Anki 덱 가져오기
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
                                        const tokenMatch = value.match(/shared\/([a-zA-Z0-9]+)/);
                                        this.setState({ shareToken: tokenMatch ? tokenMatch[1] : value });
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
                                    onClick={() => this.setState({ showImportForm: false })}
                                    style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    취소
                                </button>
                            </form>
                        </div>
                    )}

                    {showAnkiImport && (
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa', flex: 1 }}>
                            <h5>Anki 덱 가져오기</h5>
                            <form onSubmit={this.handleAnkiImport}>
                                <input
                                    type="file"
                                    accept=".apkg"
                                    onChange={(e) => this.setState({ ankiFile: e.target.files[0] })}
                                    style={{ marginBottom: '10px' }}
                                />
                                <div style={{ marginBottom: '10px', fontSize: '12px', color: '#6c757d' }}>
                                    .apkg 파일을 선택하세요. <button type="button" onClick={this.openAnkiWeb} style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>AnkiWeb에서 다운로드</button>
                                </div>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={ankiImporting}
                                        style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: ankiImporting ? '#6c757d' : '#6f42c1', color: '#fff', border: 'none', borderRadius: '4px', cursor: ankiImporting ? 'not-allowed' : 'pointer' }}
                                    >
                                        {ankiImporting ? '가져오는 중...' : '가져오기'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => this.setState({ showAnkiImport: false })}
                                        style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        취소
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {filteredDecks.length === 0 ? (
                    <div style={{ padding: '15px', backgroundColor: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb', borderRadius: '4px' }}>
                        {searchQuery ? '검색 결과가 없습니다.' : '덱이 없습니다. 새 덱을 만들거나 공유된 덱을 가져와보세요!'}
                    </div>
                ) : (
                    <div>
                        {filteredDecks.map(deck => (
                            <div
                                key={deck.id}
                                style={{
                                    display: 'flex',
                                    padding: '15px',
                                    marginBottom: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: '#fff',
                                    alignItems: 'center'
                                }}
                            >
                                <Link
                                    to={`/decks/${deck.id}`}
                                    style={{
                                        flex: 1,
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                >
                                    <h4 style={{ margin: '0 0 5px 0' }}>{deck.name}</h4>
                                    <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                                        카드 {deck.card_count || 0}개
                                    </p>
                                </Link>
                                <button
                                    onClick={(e) => this.handleDeleteDeck(e, deck.id, deck.name)}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#dc3545',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

export default DeckList;
