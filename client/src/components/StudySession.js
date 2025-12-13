// 학습 세션 컴포넌트
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { studyAPI } from '../utils/api';

class StudySession extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cards: [],
            currentIndex: 0,
            showAnswer: false,
            loading: true,
            error: '',
            completed: false,
            stats: { again: 0, hard: 0, good: 0, easy: 0 }
        };
    }

    componentDidMount() {
        this.loadDueCards();
    }

    loadDueCards = async () => {
        const { deckId } = this.props.match.params;
        try {
            this.setState({ loading: true });
            const data = await studyAPI.getDueCards(deckId);
            if (data.cards.length === 0) {
                this.setState({ completed: true, loading: false });
            } else {
                this.setState({ cards: data.cards, loading: false });
            }
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    handleAnswer = async (difficulty) => {
        const { cards, currentIndex, stats } = this.state;
        const currentCard = cards[currentIndex];

        try {
            await studyAPI.submitReview(currentCard.id, difficulty);

            // 통계 업데이트
            const difficultyNames = ['again', 'hard', 'good', 'easy'];
            stats[difficultyNames[difficulty]]++;

            // 다음 카드로
            if (currentIndex + 1 < cards.length) {
                this.setState({
                    currentIndex: currentIndex + 1,
                    showAnswer: false,
                    stats
                });
            } else {
                this.setState({ completed: true, stats });
            }
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    render() {
        const { cards, currentIndex, showAnswer, loading, error, completed, stats } = this.state;
        const { deckId } = this.props.match.params;

        if (loading) {
            return <div style={{ textAlign: 'center', marginTop: '50px' }}>로딩 중...</div>;
        }

        if (completed) {
            return (
                <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
                    <h2>🎉 학습 완료!</h2>
                    <p style={{ fontSize: '18px', marginTop: '20px' }}>오늘의 학습을 모두 마쳤습니다.</p>

                    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <h4>학습 통계</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                            <div><strong>다시:</strong> {stats.again}</div>
                            <div><strong>어려움:</strong> {stats.hard}</div>
                            <div><strong>보통:</strong> {stats.good}</div>
                            <div><strong>쉬움:</strong> {stats.easy}</div>
                        </div>
                        <div style={{ marginTop: '15px', fontSize: '20px', fontWeight: 'bold' }}>
                            총 {stats.again + stats.hard + stats.good + stats.easy}개 카드 학습
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={() => this.props.history.push(`/decks/${deckId}`)}
                            style={{ padding: '12px 24px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
                        >
                            덱으로 돌아가기
                        </button>
                        <button
                            onClick={() => this.props.history.push('/decks')}
                            style={{ padding: '12px 24px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
                        >
                            덱 목록으로
                        </button>
                    </div>
                </div>
            );
        }

        const currentCard = cards[currentIndex];
        const progress = ((currentIndex + 1) / cards.length) * 100;

        return (
            <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
                {error && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span>{currentIndex + 1} / {cards.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#007bff', transition: 'width 0.3s' }} />
                    </div>
                </div>

                <div
                    style={{
                        minHeight: '300px',
                        padding: '40px',
                        border: '2px solid #007bff',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: showAnswer ? 'default' : 'pointer',
                        transition: 'transform 0.3s'
                    }}
                    onClick={() => !showAnswer && this.setState({ showAnswer: true })}
                >
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        {!showAnswer ? (
                            <>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                                    {currentCard.front}
                                </div>
                                <div style={{ color: '#6c757d', marginTop: '30px' }}>
                                    클릭하여 답변 보기
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '20px', color: '#6c757d', marginBottom: '20px' }}>
                                    {currentCard.front}
                                </div>
                                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                                    {currentCard.back}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {showAnswer && (
                    <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        <button
                            onClick={() => this.handleAnswer(0)}
                            style={{ padding: '15px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                        >
                            <div style={{ fontWeight: 'bold' }}>다시</div>
                            <div style={{ fontSize: '12px', marginTop: '5px' }}>&lt;1분</div>
                        </button>
                        <button
                            onClick={() => this.handleAnswer(1)}
                            style={{ padding: '15px', backgroundColor: '#fd7e14', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                        >
                            <div style={{ fontWeight: 'bold' }}>어려움</div>
                            <div style={{ fontSize: '12px', marginTop: '5px' }}>1일</div>
                        </button>
                        <button
                            onClick={() => this.handleAnswer(2)}
                            style={{ padding: '15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                        >
                            <div style={{ fontWeight: 'bold' }}>보통</div>
                            <div style={{ fontSize: '12px', marginTop: '5px' }}>3일</div>
                        </button>
                        <button
                            onClick={() => this.handleAnswer(3)}
                            style={{ padding: '15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                        >
                            <div style={{ fontWeight: 'bold' }}>쉬움</div>
                            <div style={{ fontSize: '12px', marginTop: '5px' }}>7일</div>
                        </button>
                    </div>
                )}
            </div>
        );
    }
}

export default withRouter(StudySession);
