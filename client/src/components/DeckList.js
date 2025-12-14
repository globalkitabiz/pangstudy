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
            showAnkiImport: false,
            shareToken: '',
            ankiFile: null,
            ankiImporting: false
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
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    handleAnkiFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            this.setState({ ankiFile: file });
        }
    };

    handleAnkiImport = async (e) => {
        e.preventDefault();
        const { ankiFile } = this.state;
        if (!ankiFile) {
            this.setState({ error: '.apkg 파일을 선택해주세요.' });
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

    render() {
        const { decks, loading, error, success, newDeckName, showCreateForm, showImportForm, showAnkiImport, shareToken, ankiFile, ankiImporting } = this.state;

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

                    {showAnkiImport && (
                        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa', flex: 1, minWidth: '300px' }}>
                            <h5><span role="img" aria-label="Anki">🃏</span> Anki 덱 가져오기</h5>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                                AnkiWeb에서 .apkg 파일을 다운로드하여 업로드하세요.
                            </p>
                            <button
                                type="button"
                                onClick={this.openAnkiWeb}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '15px',
                                    backgroundColor: '#235390',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span role="img" aria-label="외부 링크">🔗</span> AnkiWeb 공유 덱 둘러보기
                            </button>
                            <form onSubmit={this.handleAnkiImport}>
                                <div style={{
                                    border: '2px dashed #ccc',
                                    borderRadius: '4px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    marginBottom: '10px',
                                    backgroundColor: ankiFile ? '#e8f5e9' : '#fff'
                                }}>
                                    <input
                                        type="file"
                                        accept=".apkg"
                                        onChange={this.handleAnkiFileChange}
                                        style={{ display: 'none' }}
                                        id="anki-file-input"
                                    />
                                    <label
                                        htmlFor="anki-file-input"
                                        style={{
                                            cursor: 'pointer',
                                            color: ankiFile ? '#2e7d32' : '#666'
                                        }}
                                    >
                                        {ankiFile ? (
                                            <><span role="img" aria-label="파일">📄</span> {ankiFile.name}</>
                                        ) : (
                                            <><span role="img" aria-label="업로드">📁</span> .apkg 파일을 선택하세요</>
                                        )}
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="submit"
                                        disabled={!ankiFile || ankiImporting}
                                        style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            backgroundColor: ankiFile && !ankiImporting ? '#6f42c1' : '#ccc',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: ankiFile && !ankiImporting ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {ankiImporting ? '가져오는 중...' : '가져오기'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => this.setState({ showAnkiImport: false, ankiFile: null })}
                                        disabled={ankiImporting}
                                        style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        취소
                                    </button>
                                </div>
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
                                <button
                                    onClick={(e) => this.handleDeleteDeck(e, deck.id, deck.name)}
                                    style={{
                                        marginLeft: '10px',
                                        padding: '5px 10px',
                                        backgroundColor: '#dc3545',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                    title="덱 삭제"
                                >
                                    <span role="img" aria-label="삭제">🗑️</span>
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
