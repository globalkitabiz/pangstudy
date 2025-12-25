// 덱 목록 컴포넌트
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { deckAPI, shareAPI } from '../utils/api';
import Statistics from './Statistics';
import LoadingSpinner from './LoadingSpinner';
import ThemeToggle from './ThemeToggle';
import { ThemeContext } from '../contexts/ThemeContext';
import JSZip from 'jszip';
// sql.js는 CDN에서 동적 로드 (호환성 문제 해결)

class DeckList extends Component {
    static contextType = ThemeContext;

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
            // 1. 클라이언트에서 .apkg (ZIP) 압축 해제
            const arrayBuffer = await ankiFile.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);

            // 2. collection.anki2 또는 collection.anki21 파일 찾기
            let dbFile = zip.file('collection.anki2') || zip.file('collection.anki21');
            if (!dbFile) {
                throw new Error('Anki 데이터베이스를 찾을 수 없습니다.');
            }

            // 3. SQLite 데이터베이스 읽기
            const dbData = await dbFile.async('uint8array');

            // 4. sql.js CDN에서 동적 로드
            // eslint-disable-next-line no-undef
            if (!window.initSqlJs) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://sql.js.org/dist/sql-wasm.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            // eslint-disable-next-line no-undef
            const SQL = await window.initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });
            const db = new SQL.Database(dbData);

            // 5. notes 테이블에서 카드 추출
            const results = db.exec("SELECT flds FROM notes");
            if (!results.length || !results[0].values.length) {
                throw new Error('가져올 카드가 없습니다.');
            }

            const cards = [];
            for (const row of results[0].values) {
                const flds = row[0];
                const parts = flds.split('\x1f'); // Unit Separator
                if (parts.length >= 2) {
                    const front = this.cleanAnkiText(parts[0]);
                    const back = this.cleanAnkiText(parts[1]);
                    if (front && back) {
                        cards.push({ front, back });
                    }
                }
            }

            db.close();

            if (cards.length === 0) {
                throw new Error('유효한 카드를 찾을 수 없습니다.');
            }

            // 6. 서버로 카드 데이터 전송
            const token = localStorage.getItem('authToken');
            const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8788';
            const deckName = ankiFile.name.replace('.apkg', '').replace(/_/g, ' ');

            const response = await fetch(`${API_BASE}/api/anki/import-cards`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deckName,
                    cards: cards.slice(0, 1000) // 최대 1000장
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Anki 파일 가져오기 실패');
            }

            this.setState({
                ankiFile: null,
                showAnkiImport: false,
                ankiImporting: false,
                success: result.message || `${deckName} 덱을 가져왔습니다! (${cards.length}장)`
            });
            this.loadDecks();
            setTimeout(() => this.setState({ success: '' }), 5000);
        } catch (err) {
            console.error('Anki import error:', err);
            this.setState({ error: err.message, ankiImporting: false });
        }
    };

    // Anki 텍스트 정리 (HTML 태그 제거 등)
    cleanAnkiText = (text) => {
        if (!text) return '';
        return text
            .replace(/<[^>]+>/g, '') // HTML 태그 제거
            .replace(/\[sound:[^\]]+\]/g, '') // 사운드 태그 제거
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
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
        const { loading, error, success, newDeckName, showCreateForm, showImportForm, showAnkiImport, shareToken, searchQuery, sortBy } = this.state;
        const { colors } = this.context;

        if (loading) {
            return <LoadingSpinner message="덱 목록을 불러오는 중..." />;
        }

        const filteredDecks = this.getFilteredAndSortedDecks();

        return (
            <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', backgroundColor: colors.background, color: colors.text, minHeight: '100vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: colors.text }}>내 덱</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <ThemeToggle />
                        <button
                            onClick={this.handleLogout}
                            style={{ padding: '8px 16px', backgroundColor: colors.buttonDanger, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: colors.alertDanger.bg, color: colors.alertDanger.text, border: `1px solid ${colors.alertDanger.border}`, borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: colors.alertSuccess.bg, color: colors.alertSuccess.text, border: `1px solid ${colors.alertSuccess.border}`, borderRadius: '4px' }}>
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
                            backgroundColor: colors.inputBackground,
                            color: colors.text,
                            border: `1px solid ${colors.inputBorder}`,
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => this.setState({ sortBy: e.target.value })}
                        style={{
                            padding: '10px',
                            backgroundColor: colors.inputBackground,
                            color: colors.text,
                            border: `1px solid ${colors.inputBorder}`,
                            borderRadius: '4px',
                            fontSize: '14px',
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
                                style={{ padding: '10px 20px', backgroundColor: colors.buttonPrimary, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                + 새 덱 만들기
                            </button>
                            <button
                                onClick={() => this.setState({ showImportForm: true })}
                                style={{ padding: '10px 20px', backgroundColor: colors.buttonSuccess, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
                        <div style={{ padding: '15px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.backgroundSecondary, flex: 1 }}>
                            <h5 style={{ color: colors.text }}>새 덱 만들기</h5>
                            <form onSubmit={this.handleCreateDeck}>
                                <input
                                    type="text"
                                    placeholder="덱 이름"
                                    value={newDeckName}
                                    onChange={(e) => this.setState({ newDeckName: e.target.value })}
                                    autoFocus
                                    style={{ width: '100%', padding: '8px', marginBottom: '10px', backgroundColor: colors.inputBackground, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '4px' }}
                                />
                                <button
                                    type="submit"
                                    style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: colors.buttonPrimary, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    만들기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => this.setState({ showCreateForm: false })}
                                    style={{ padding: '8px 16px', backgroundColor: colors.buttonSecondary, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    취소
                                </button>
                            </form>
                        </div>
                    )}

                    {showImportForm && (
                        <div style={{ padding: '15px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.backgroundSecondary, flex: 1 }}>
                            <h5 style={{ color: colors.text }}>공유된 덱 가져오기</h5>
                            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '10px' }}>
                                Pangstudy 사용자가 공유한 덱의 링크나 토큰을 입력하세요.
                            </p>
                            <form onSubmit={this.handleImportDeck}>
                                <input
                                    type="text"
                                    placeholder="공유 링크 또는 토큰 입력"
                                    value={shareToken}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const tokenMatch = value.match(/shared\/([a-zA-Z0-9-]+)/);
                                        this.setState({ shareToken: tokenMatch ? tokenMatch[1] : value });
                                    }}
                                    autoFocus
                                    style={{ width: '100%', padding: '8px', marginBottom: '10px', backgroundColor: colors.inputBackground, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '4px' }}
                                />
                                <button
                                    type="submit"
                                    style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: colors.buttonSuccess, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    가져오기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => this.setState({ showImportForm: false })}
                                    style={{ padding: '8px 16px', backgroundColor: colors.buttonSecondary, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    취소
                                </button>
                            </form>
                        </div>
                    )}

                    {showAnkiImport && (
                        <div style={{ padding: '15px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.backgroundSecondary, flex: 1 }}>
                            <h5 style={{ color: colors.text, marginBottom: '10px' }}>Anki 덱 가져오기</h5>

                            <div style={{
                                padding: '12px',
                                backgroundColor: colors.alertInfo?.bg || '#e7f3ff',
                                border: `1px solid ${colors.alertInfo?.border || '#b6d4fe'}`,
                                borderRadius: '6px',
                                marginBottom: '15px'
                            }}>
                                <p style={{ fontSize: '13px', color: colors.alertInfo?.text || '#084298', margin: '0 0 8px 0', fontWeight: '500' }}>
                                    Anki 파일(.apkg)을 업로드하여 덱을 가져올 수 있습니다.
                                </p>
                                <p style={{ fontSize: '12px', color: colors.alertInfo?.text || '#084298', margin: '0 0 8px 0' }}>
                                    <strong>Anki 덱 구하는 방법:</strong>
                                </p>
                                <ol style={{ fontSize: '12px', color: colors.alertInfo?.text || '#084298', margin: '0', paddingLeft: '20px' }}>
                                    <li style={{ marginBottom: '4px' }}>AnkiWeb 공유 덱 사이트에서 원하는 덱 검색</li>
                                    <li style={{ marginBottom: '4px' }}>.apkg 파일 다운로드</li>
                                    <li>아래에서 파일 업로드</li>
                                </ol>
                                <button
                                    type="button"
                                    onClick={this.openAnkiWeb}
                                    style={{
                                        marginTop: '10px',
                                        padding: '6px 12px',
                                        backgroundColor: '#0d6efd',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    AnkiWeb 공유 덱 사이트 열기
                                </button>
                            </div>

                            <form onSubmit={this.handleAnkiImport}>
                                <input
                                    type="file"
                                    accept=".apkg"
                                    onChange={(e) => this.setState({ ankiFile: e.target.files[0] })}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '10px',
                                        backgroundColor: colors.inputBackground,
                                        color: colors.text,
                                        border: `1px solid ${colors.inputBorder}`,
                                        borderRadius: '4px'
                                    }}
                                />
                                <p style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '10px' }}>
                                    * .apkg 파일만 지원됩니다.
                                </p>
                                <button
                                    type="submit"
                                    disabled={this.state.ankiImporting}
                                    style={{
                                        padding: '8px 16px',
                                        marginRight: '10px',
                                        backgroundColor: this.state.ankiImporting ? '#999' : '#6f42c1',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: this.state.ankiImporting ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {this.state.ankiImporting ? '가져오는 중...' : '가져오기'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => this.setState({ showAnkiImport: false, ankiFile: null })}
                                    style={{ padding: '8px 16px', backgroundColor: colors.buttonSecondary, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    취소
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {filteredDecks.length === 0 ? (
                    <div style={{ padding: '15px', backgroundColor: colors.alertInfo.bg, color: colors.alertInfo.text, border: `1px solid ${colors.alertInfo.border}`, borderRadius: '4px' }}>
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
                                    border: `1px solid ${colors.cardBorder}`,
                                    borderRadius: '4px',
                                    backgroundColor: colors.cardBackground,
                                    alignItems: 'center'
                                }}
                            >
                                <Link
                                    to={`/decks/${deck.id}`}
                                    style={{
                                        flex: 1,
                                        textDecoration: 'none',
                                        color: colors.text
                                    }}
                                >
                                    <h4 style={{ margin: '0 0 5px 0', color: colors.text }}>{deck.name}</h4>
                                    <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
                                        카드 {deck.card_count || 0}개
                                    </p>
                                </Link>
                                <button
                                    onClick={(e) => this.handleDeleteDeck(e, deck.id, deck.name)}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: colors.buttonDanger,
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
