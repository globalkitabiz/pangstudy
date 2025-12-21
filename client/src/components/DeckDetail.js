// 덱 상세 및 카드 관리 컴포넌트
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { deckAPI, cardAPI, shareAPI } from '../utils/api';

class DeckDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deck: null,
            cards: [],
            loading: true,
            error: '',
            success: '',
            showAddForm: false,
            showShareModal: false,
            showEditDeck: false,
            showCsvImport: false,
            editingCard: null,
            shareUrl: '',
            newCard: { front: '', back: '' },
            editDeckName: '',
            editDeckDescription: '',
            csvText: '',
            csvImporting: false
        };
        this.fileInputRef = React.createRef();
    }

    componentDidMount() {
        this.loadDeckAndCards();
    }

    loadDeckAndCards = async () => {
        const { deckId } = this.props.match.params;
        try {
            this.setState({ loading: true });
            const [deckData, cardsData] = await Promise.all([
                deckAPI.get(deckId),
                cardAPI.getByDeck(deckId)
            ]);
            this.setState({
                deck: deckData.deck,
                cards: cardsData.cards || [],
                editDeckName: deckData.deck.name,
                editDeckDescription: deckData.deck.description || '',
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
                showAddForm: false,
                success: '카드가 추가되었습니다!'
            });
            this.loadDeckAndCards();
            setTimeout(() => this.setState({ success: '' }), 3000);
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    handleShareDeck = async () => {
        const { deckId } = this.props.match.params;
        try {
            const result = await shareAPI.shareDeck(deckId);
            this.setState({
                showShareModal: true,
                shareUrl: result.shareUrl
            });
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    handleCopyShareLink = () => {
        const { shareUrl } = this.state;
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.setState({ success: '공유 링크가 복사되었습니다!' });
            setTimeout(() => this.setState({ success: '' }), 3000);
        });
    };

    handleEditDeck = async (e) => {
        e.preventDefault();
        const { deckId } = this.props.match.params;
        const { editDeckName, editDeckDescription } = this.state;

        if (!editDeckName.trim()) return;

        try {
            await deckAPI.update(deckId, editDeckName, editDeckDescription);
            this.setState({
                showEditDeck: false,
                success: '덱이 수정되었습니다!'
            });
            this.loadDeckAndCards();
            setTimeout(() => this.setState({ success: '' }), 3000);
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    handleDeleteCard = async (cardId) => {
        if (!window.confirm('이 카드를 삭제하시겠습니까?')) return;

        try {
            await cardAPI.delete(cardId);
            this.setState({ success: '카드가 삭제되었습니다!' });
            this.loadDeckAndCards();
            setTimeout(() => this.setState({ success: '' }), 3000);
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    handleEditCard = (card) => {
        this.setState({
            editingCard: { ...card },
            showAddForm: false
        });
    };

    // CSV 파일 선택 처리
    handleCsvFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            this.setState({ csvText: event.target.result });
        };
        reader.readAsText(file, 'UTF-8');
    };

    // CSV 파싱 및 카드 생성
    handleCsvImport = async () => {
        const { csvText } = this.state;
        const { deckId } = this.props.match.params;

        if (!csvText.trim()) {
            this.setState({ error: 'CSV 내용을 입력하거나 파일을 선택해주세요.' });
            return;
        }

        this.setState({ csvImporting: true, error: '' });

        try {
            // CSV 파싱
            const lines = csvText.trim().split('\n');
            const cards = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // 첫 줄이 헤더인지 확인 (front,back)
                if (i === 0 && line.toLowerCase().includes('front') && line.toLowerCase().includes('back')) {
                    continue; // 헤더 건너뛰기
                }

                // 쉼표로 분리 (따옴표 안의 쉼표는 무시)
                const parts = this.parseCsvLine(line);

                if (parts.length >= 2) {
                    const front = parts[0].trim();
                    const back = parts[1].trim();

                    if (front && back) {
                        cards.push({ front, back });
                    }
                }
            }

            if (cards.length === 0) {
                this.setState({ error: '유효한 카드가 없습니다. 형식: 앞면,뒷면', csvImporting: false });
                return;
            }

            // API 호출 - bulk create
            await cardAPI.bulkCreate(deckId, cards);

            this.setState({
                showCsvImport: false,
                csvText: '',
                success: `${cards.length}개의 카드가 추가되었습니다!`,
                csvImporting: false
            });
            this.loadDeckAndCards();
            setTimeout(() => this.setState({ success: '' }), 3000);

        } catch (err) {
            this.setState({ error: err.message || 'CSV 가져오기 실패', csvImporting: false });
        }
    };

    // CSV 라인 파싱 (따옴표 처리)
    parseCsvLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.replace(/^"|"$/g, ''));

        return result;
    };

    handleUpdateCard = async (e) => {
        e.preventDefault();
        const { editingCard } = this.state;

        if (!editingCard.front.trim() || !editingCard.back.trim()) return;

        try {
            await cardAPI.update(editingCard.id, editingCard.front, editingCard.back);
            this.setState({
                editingCard: null,
                success: '카드가 수정되었습니다!'
            });
            this.loadDeckAndCards();
            setTimeout(() => this.setState({ success: '' }), 3000);
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    render() {
        const { deck, cards, loading, error, success, showAddForm, showShareModal, showEditDeck, showCsvImport, editingCard, shareUrl, newCard, editDeckName, editDeckDescription, csvText, csvImporting } = this.state;

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
                    {!showEditDeck ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: '0 0 5px 0' }}>{deck && deck.name}</h2>
                                {deck && deck.description && <p style={{ color: '#6c757d', margin: 0 }}>{deck.description}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => this.props.history.push(`/study/${deck.id}`)}
                                    style={{ padding: '8px 16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <span role="img" aria-label="책">📚</span> 학습
                                </button>
                                <button
                                    onClick={() => this.setState({ showEditDeck: true })}
                                    style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <span role="img" aria-label="수정">✏️</span>
                                </button>
                                <button
                                    onClick={this.handleShareDeck}
                                    style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <span role="img" aria-label="공유">📤</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={this.handleEditDeck} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                            <h5>덱 수정</h5>
                            <input
                                type="text"
                                placeholder="덱 이름"
                                value={editDeckName}
                                onChange={(e) => this.setState({ editDeckName: e.target.value })}
                                style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <textarea
                                placeholder="설명 (선택)"
                                value={editDeckDescription}
                                onChange={(e) => this.setState({ editDeckDescription: e.target.value })}
                                rows={2}
                                style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <button type="submit" style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                저장
                            </button>
                            <button type="button" onClick={() => this.setState({ showEditDeck: false, editDeckName: deck.name, editDeckDescription: deck.description || '' })} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                취소
                            </button>
                        </form>
                    )}
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

                {showShareModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '30px',
                            borderRadius: '8px',
                            maxWidth: '500px',
                            width: '90%'
                        }}>
                            <h3>덱 공유 링크</h3>
                            <p>이 링크를 공유하면 다른 사람이 이 덱을 가져갈 수 있습니다:</p>
                            <div style={{
                                padding: '10px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                marginBottom: '15px',
                                wordBreak: 'break-all'
                            }}>
                                {shareUrl}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={this.handleCopyShareLink}
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    <span role="img" aria-label="복사">📋</span> 링크 복사
                                </button>
                                <button
                                    onClick={() => this.setState({ showShareModal: false })}
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    {!showAddForm && !showCsvImport ? (
                        <>
                            <button
                                onClick={() => this.setState({ showAddForm: true, showCsvImport: false })}
                                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                + 카드 추가
                            </button>
                            <button
                                onClick={() => this.setState({ showCsvImport: true, showAddForm: false })}
                                style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                CSV 가져오기
                            </button>
                        </>
                    ) : showCsvImport ? (
                        <div style={{ width: '100%', padding: '15px', border: '1px solid #17a2b8', borderRadius: '4px', backgroundColor: '#e7f5f7' }}>
                            <h5 style={{ marginBottom: '10px' }}>CSV로 카드 일괄 추가</h5>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                형식: <code>앞면,뒷면</code> (한 줄에 하나씩)<br/>
                                예시: <code>apple,사과</code>
                            </p>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>CSV 파일 선택</label>
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={this.handleCsvFileSelect}
                                    ref={this.fileInputRef}
                                    style={{ marginBottom: '10px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>또는 직접 입력</label>
                                <textarea
                                    rows={8}
                                    placeholder={"apple,사과\nbanana,바나나\nhappiness,행복"}
                                    value={csvText}
                                    onChange={(e) => this.setState({ csvText: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }}
                                />
                            </div>

                            <button
                                onClick={this.handleCsvImport}
                                disabled={csvImporting || !csvText.trim()}
                                style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: csvImporting ? 'not-allowed' : 'pointer', opacity: csvImporting ? 0.7 : 1 }}
                            >
                                {csvImporting ? '가져오는 중...' : '가져오기'}
                            </button>
                            <button
                                onClick={() => this.setState({ showCsvImport: false, csvText: '' })}
                                style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                취소
                            </button>
                        </div>
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

                {editingCard && (
                    <div style={{ padding: '15px', marginBottom: '20px', border: '1px solid #ffc107', borderRadius: '4px', backgroundColor: '#fff3cd' }}>
                        <h5>카드 수정</h5>
                        <form onSubmit={this.handleUpdateCard}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>앞면</label>
                                <textarea
                                    rows={3}
                                    value={editingCard.front}
                                    onChange={(e) => this.setState({ editingCard: { ...editingCard, front: e.target.value } })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>뒷면</label>
                                <textarea
                                    rows={3}
                                    value={editingCard.back}
                                    onChange={(e) => this.setState({ editingCard: { ...editingCard, back: e.target.value } })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <button type="submit" style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                저장
                            </button>
                            <button type="button" onClick={() => this.setState({ editingCard: null })} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                취소
                            </button>
                        </form>
                    </div>
                )}

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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <strong>앞면:</strong>
                                            <p style={{ margin: '5px 0 0 0' }}>{card.front}</p>
                                        </div>
                                        <div>
                                            <strong>뒷면:</strong>
                                            <p style={{ margin: '5px 0 0 0' }}>{card.back}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                                        <button
                                            onClick={() => this.handleEditCard(card)}
                                            style={{ padding: '5px 10px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                            title="수정"
                                        >
                                            <span role="img" aria-label="수정">✏️</span>
                                        </button>
                                        <button
                                            onClick={() => this.handleDeleteCard(card.id)}
                                            style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                            title="삭제"
                                        >
                                            <span role="img" aria-label="삭제">🗑️</span>
                                        </button>
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
