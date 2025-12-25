// 관리자 - 학습 할당
import React, { Component } from 'react';
import { adminAPI } from '../../utils/api';

class AdminAssign extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            decks: [],
            assignments: [],
            loading: true,
            error: '',
            form: {
                userId: '',
                deckId: '',
                cardId: '',
                dueDate: '',
                note: ''
            },
            cards: []
        };
    }

    componentDidMount() {
        this.loadData();
    }

    loadData = async () => {
        try {
            const [usersRes, decksRes, assignRes] = await Promise.all([
                adminAPI.getUsers(),
                adminAPI.getAllDecks(),
                adminAPI.getAssignments()
            ]);
            this.setState({
                users: usersRes.users || [],
                decks: decksRes.decks || [],
                assignments: assignRes.assignments || [],
                loading: false
            });
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    loadCards = async (deckId) => {
        if (!deckId) {
            this.setState({ cards: [] });
            return;
        }
        try {
            const res = await adminAPI.getDeckCards(deckId);
            this.setState({ cards: res.cards || [] });
        } catch (err) {
            console.error('Failed to load cards:', err);
        }
    };

    handleDeckChange = (deckId) => {
        this.setState({ form: { ...this.state.form, deckId, cardId: '' } });
        this.loadCards(deckId);
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { form } = this.state;
        if (!form.userId || !form.deckId) {
            alert('사용자와 덱을 선택하세요');
            return;
        }
        try {
            await adminAPI.assignToUser({
                userId: parseInt(form.userId),
                deckId: parseInt(form.deckId),
                cardId: form.cardId ? parseInt(form.cardId) : null,
                dueDate: form.dueDate || null,
                note: form.note || null
            });
            alert('할당 완료!');
            this.setState({ form: { userId: '', deckId: '', cardId: '', dueDate: '', note: '' }, cards: [] });
            this.loadData();
        } catch (err) {
            alert('할당 실패: ' + err.message);
        }
    };

    handleDeleteAssignment = async (assignmentId) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await adminAPI.deleteAssignment(assignmentId);
            this.loadData();
        } catch (err) {
            alert('삭제 실패: ' + err.message);
        }
    };

    render() {
        const { users, decks, assignments, cards, loading, error, form } = this.state;

        const cardStyle = {
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
        };

        const inputStyle = {
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            width: '100%'
        };

        const btnStyle = {
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
        };

        if (loading) return <div>로딩 중...</div>;
        if (error) return <div style={{ color: 'red' }}>{error}</div>;

        return (
            <div>
                {/* 할당 폼 */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 15px', fontSize: '16px', color: '#2c3e50' }}>새 학습 할당</h3>
                    <form onSubmit={this.handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#7f8c8d', fontSize: '13px' }}>사용자 *</label>
                                <select
                                    value={form.userId}
                                    onChange={(e) => this.setState({ form: { ...form, userId: e.target.value } })}
                                    style={inputStyle}
                                    required
                                >
                                    <option value="">선택하세요</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username || u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#7f8c8d', fontSize: '13px' }}>덱 *</label>
                                <select
                                    value={form.deckId}
                                    onChange={(e) => this.handleDeckChange(e.target.value)}
                                    style={inputStyle}
                                    required
                                >
                                    <option value="">선택하세요</option>
                                    {decks.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#7f8c8d', fontSize: '13px' }}>카드 (선택)</label>
                                <select
                                    value={form.cardId}
                                    onChange={(e) => this.setState({ form: { ...form, cardId: e.target.value } })}
                                    style={inputStyle}
                                    disabled={!form.deckId}
                                >
                                    <option value="">전체 덱</option>
                                    {cards.map(c => (
                                        <option key={c.id} value={c.id}>{c.front.substring(0, 30)}...</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#7f8c8d', fontSize: '13px' }}>마감일</label>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(e) => this.setState({ form: { ...form, dueDate: e.target.value } })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#7f8c8d', fontSize: '13px' }}>메모</label>
                            <input
                                type="text"
                                value={form.note}
                                onChange={(e) => this.setState({ form: { ...form, note: e.target.value } })}
                                style={inputStyle}
                                placeholder="할당 메모 (선택)"
                            />
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <button type="submit" style={btnStyle}>할당하기</button>
                        </div>
                    </form>
                </div>

                {/* 할당 목록 */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 15px', fontSize: '16px', color: '#2c3e50' }}>할당 목록</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>사용자</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>덱</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>마감일</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>메모</th>
                                <th style={{ textAlign: 'right', padding: '10px 8px', color: '#7f8c8d', fontSize: '13px' }}>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>{a.user_name || a.user_email}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>{a.deck_name}</td>
                                    <td style={{ padding: '10px 8px', fontSize: '14px', color: '#95a5a6' }}>
                                        {a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td style={{ padding: '10px 8px', fontSize: '14px', color: '#7f8c8d' }}>{a.note || '-'}</td>
                                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => this.handleDeleteAssignment(a.id)}
                                            style={{ padding: '4px 10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {assignments.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>할당된 항목이 없습니다</div>
                    )}
                </div>
            </div>
        );
    }
}

export default AdminAssign;
