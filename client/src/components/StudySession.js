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
            stats: { again: 0, hard: 0, good: 0, easy: 0 },
            autoSpeak: true, // 자동 음성 재생
            speaking: false,
            voiceGender: 'female', // 'female' or 'male'
            availableVoices: [],
            showVoiceSettings: false
        };
    }

    // 사용 가능한 음성 목록 로드
    loadVoices = () => {
        if (!window.speechSynthesis) return;
        const voices = window.speechSynthesis.getVoices();
        this.setState({ availableVoices: voices });
    };

    // TTS 음성 재생
    speak = (text, lang = 'ko-KR') => {
        if (!window.speechSynthesis) return;

        // 이전 음성 중단
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9; // 약간 느리게

        // 성별에 맞는 음성 선택
        const { availableVoices, voiceGender } = this.state;
        const langVoices = availableVoices.filter(v => v.lang.startsWith(lang.split('-')[0]));

        if (langVoices.length > 0) {
            // 성별 키워드로 필터링
            const genderKeywords = voiceGender === 'female'
                ? ['female', 'woman', 'girl', 'heami', 'yuna', 'sumi', 'zira', 'hazel', 'susan', 'damayanti']
                : ['male', 'man', 'boy', 'david', 'mark', 'james', 'george', 'dede'];

            const genderVoice = langVoices.find(v =>
                genderKeywords.some(k => v.name.toLowerCase().includes(k))
            );

            if (genderVoice) {
                utterance.voice = genderVoice;
            } else {
                // 성별 못찾으면 첫번째 음성 사용
                utterance.voice = langVoices[0];
            }
        }

        utterance.onstart = () => this.setState({ speaking: true });
        utterance.onend = () => this.setState({ speaking: false });
        utterance.onerror = () => this.setState({ speaking: false });

        window.speechSynthesis.speak(utterance);
    };

    // 언어 자동 감지
    detectLanguage = (text) => {
        if (/[가-힣]/.test(text)) return 'ko-KR'; // 한국어
        if (/[ぁ-んァ-ン]/.test(text)) return 'ja-JP'; // 일본어
        if (/[一-龯]/.test(text)) return 'zh-CN'; // 중국어
        if (/[ก-๙]/.test(text)) return 'th-TH'; // 태국어
        // 인도네시아어는 라틴 문자 사용 - 특정 단어로 감지
        if (/\b(dan|yang|di|ke|dari|untuk|dengan|ini|itu|adalah|saya|anda|tidak|bisa|akan|sudah|belum|ada|juga|atau|tetapi|karena|jika|maka|seperti|lebih|sangat|harus|baru|lagi|apa|siapa|mana|kapan|bagaimana|mengapa)\b/i.test(text)) return 'id-ID';
        return 'en-US'; // 기본 영어
    };

    // 현재 카드 음성 재생
    speakCurrentCard = (side = 'front') => {
        const { cards, currentIndex } = this.state;
        const currentCard = cards[currentIndex];
        if (!currentCard) return;

        const text = side === 'front' ? currentCard.front : currentCard.back;
        const lang = this.detectLanguage(text);
        this.speak(text, lang);
    };

    componentDidMount() {
        const { assignedMode } = this.props;
        const { deckId } = this.props.match.params;

        if (assignedMode || deckId === 'assigned') {
            this.loadAssignedCards();
        } else {
            this.loadDueCards();
        }
        // 키보드 이벤트 리스너 추가
        document.addEventListener('keydown', this.handleKeyPress);

        // 음성 목록 로드
        this.loadVoices();
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = this.loadVoices;
        }
    }

    componentWillUnmount() {
        // 키보드 이벤트 리스너 제거
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    loadDueCards = async () => {
        const { deckId } = this.props.match.params;
        try {
            this.setState({ loading: true });
            const data = await studyAPI.getDueCards(deckId);
            if (data.cards.length === 0) {
                this.setState({ completed: true, loading: false });
            } else {
                this.setState({ cards: data.cards, loading: false }, () => {
                    // 첫 카드 자동 음성 재생
                    if (this.state.autoSpeak) {
                        setTimeout(() => this.speakCurrentCard('front'), 300);
                    }
                });
            }
        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    };

    loadAssignedCards = async () => {
        try {
            this.setState({ loading: true });
            const data = await (await fetch('/api/study/assigned/due', { headers: { ...(localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {}) } })).json();
            if (!data.assignments || data.assignments.length === 0) {
                this.setState({ completed: true, loading: false });
            } else {
                // adapt assignments to card-like objects
                const cards = data.assignments.map(a => ({ id: a.id, front: a.card_front || (a.notes || 'Assigned item'), back: a.card_back || '', meta_assignment: a }));
                this.setState({ cards, loading: false });
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
                }, () => {
                    // 다음 카드 자동 음성 재생
                    if (this.state.autoSpeak) {
                        setTimeout(() => this.speakCurrentCard('front'), 300);
                    }
                });
            } else {
                this.setState({ completed: true, stats });
            }
        } catch (err) {
            this.setState({ error: err.message });
        }
    };

    // 키보드 단축키 핸들러
    handleKeyPress = (e) => {
        const { showAnswer, cards, currentIndex } = this.state;
        const currentCard = cards[currentIndex];

        // 카드가 없으면 무시
        if (!currentCard) return;

        // Space: 카드 뒤집기
        if (e.code === 'Space' && !showAnswer) {
            e.preventDefault();
            this.setState({ showAnswer: true });
            return;
        }

        // 답변이 표시된 상태에서만 난이도 선택 가능
        if (showAnswer) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.handleAnswer(0); // 다시
                    break;
                case '2':
                    e.preventDefault();
                    this.handleAnswer(1); // 어려움
                    break;
                case '3':
                    e.preventDefault();
                    this.handleAnswer(2); // 보통
                    break;
                case '4':
                    e.preventDefault();
                    this.handleAnswer(3); // 쉬움
                    break;
                default:
                    break;
            }
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
                    <h2>학습 완료!</h2>
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
            <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
                <h2>학습 세션</h2>

                {/* 단축키 안내 및 음성 설정 */}
                <div style={{
                    padding: '10px',
                    marginBottom: '20px',
                    backgroundColor: '#e7f3ff',
                    border: '1px solid #b3d9ff',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#004085'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <span>
                            <strong>키보드 단축키:</strong> Space = 답변 보기 | 1 = 다시 | 2 = 어려움 | 3 = 보통 | 4 = 쉬움
                        </span>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            {/* 성별 선택 */}
                            <button
                                onClick={() => this.setState({ voiceGender: this.state.voiceGender === 'female' ? 'male' : 'female' })}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: this.state.voiceGender === 'female' ? '#e83e8c' : '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                                title="음성 성별 변경"
                            >
                                {this.state.voiceGender === 'female' ? '여성' : '남성'}
                            </button>
                            {/* 자동 음성 */}
                            <button
                                onClick={() => this.setState({ autoSpeak: !this.state.autoSpeak })}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: this.state.autoSpeak ? '#28a745' : '#6c757d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                                title={this.state.autoSpeak ? '자동 음성 켜짐' : '자동 음성 꺼짐'}
                            >
                                {this.state.autoSpeak ? '음성 ON' : '음성 OFF'}
                            </button>
                        </div>
                    </div>
                </div>
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
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <span>{currentCard.front}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); this.speakCurrentCard('front'); }}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: this.state.speaking ? '#ffc107' : '#17a2b8',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            fontSize: '16px'
                                        }}
                                        title="음성 재생"
                                    >
                                        {this.state.speaking ? '...' : <span role="img" aria-label="speaker">&#128266;</span>}
                                    </button>
                                </div>
                                <div style={{ color: '#6c757d', marginTop: '30px' }}>
                                    클릭하여 답변 보기
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '20px', color: '#6c757d', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <span>{currentCard.front}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); this.speakCurrentCard('front'); }}
                                        style={{
                                            padding: '5px 8px',
                                            backgroundColor: '#6c757d',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                        title="질문 음성 재생"
                                    >
                                        <span role="img" aria-label="speaker">&#128266;</span>
                                    </button>
                                </div>
                                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <span>{currentCard.back}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); this.speakCurrentCard('back'); }}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: this.state.speaking ? '#ffc107' : '#28a745',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            fontSize: '16px'
                                        }}
                                        title="답변 음성 재생"
                                    >
                                        {this.state.speaking ? '...' : <span role="img" aria-label="speaker">&#128266;</span>}
                                    </button>
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
