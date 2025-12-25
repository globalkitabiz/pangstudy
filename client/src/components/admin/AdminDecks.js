// 관리자 - 덱 관리
import React, { Component } from 'react';
import { adminAPI } from '../../utils/api';

class AdminDecks extends Component {
    constructor(props) {
        super(props);
        this.state = {
            decks: [],
            loading: true,
            error: ''
        };
    }

    componentDidMount() {
        this.loadDecks();
    }

    loadDecks = async () => {
        try {
            const res = await adminAPI.getAllDecks();
            this.setState({ decks: res.decks || [], loading: false });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    handleDeleteDeck = async (deckId, deckName) => {
        if (!window.confirm(`정말 "${deckName}" 덱을 삭제하시겠습니까?`)) return;
        try {
            await adminAPI.deleteDeck(deckId);
            this.loadDecks();
        } catch (err) {
            alert('삭제 실패: ' + err.message);
        }
    };

    render() {
        const { decks, loading, error } = this.state;

        const cardStyle = {
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        };

        const btnStyle = (color) => ({
            padding: '6px 12px',
            backgroundColor: color,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
        });

        if (loading) return <div>로딩 중...</div>;
        if (error) return <div style={{ color: 'red' }}>{error}</div>;

        return (
            <div style={cardStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#7f8c8d' }}>ID</th>
                            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#7f8c8d' }}>덱 이름</th>
                            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#7f8c8d' }}>소유자</th>
                            <th style={{ textAlign: 'center', padding: '12px 8px', color: '#7f8c8d' }}>카드 수</th>
                            <th style={{ textAlign: 'left', padding: '12px 8px', color: '#7f8c8d' }}>생성일</th>
                            <th style={{ textAlign: 'right', padding: '12px 8px', color: '#7f8c8d' }}>작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {decks.map(deck => (
                            <tr key={deck.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                <td style={{ padding: '12px 8px', fontSize: '14px' }}>{deck.id}</td>
                                <td style={{ padding: '12px 8px', fontSize: '14px' }}>{deck.name}</td>
                                <td style={{ padding: '12px 8px', fontSize: '14px', color: '#7f8c8d' }}>
                                    {deck.owner_name || deck.owner_email || `User #${deck.user_id}`}
                                </td>
                                <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'center' }}>
                                    {deck.card_count || 0}
                                </td>
                                <td style={{ padding: '12px 8px', fontSize: '14px', color: '#95a5a6' }}>
                                    {deck.created_at ? new Date(deck.created_at).toLocaleDateString() : '-'}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                    <button
                                        onClick={() => this.handleDeleteDeck(deck.id, deck.name)}
                                        style={btnStyle('#e74c3c')}
                                    >
                                        삭제
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {decks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>덱이 없습니다</div>
                )}
            </div>
        );
    }
}

export default AdminDecks;
