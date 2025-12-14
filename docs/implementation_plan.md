# Pangstudy 개발 계획표 (4주)

## 📅 전체 일정 개요

| 주차 | 주제 | 주요 기능 | 예상 시간 |
|------|------|-----------|-----------|
| 1주차 | 긴급 수정 및 기본 기능 개선 | 빌드 오류 수정, 보안 강화, 카드 편집 | 20시간 |
| 2주차 | UX 개선 및 검색 기능 | 덱 검색, 에러 처리, 로딩 상태 | 18시간 |
| 3주차 | 학습 경험 향상 | 진행률 시각화, 다크 모드, 키보드 단축키 | 22시간 |
| 4주차 | 고급 기능 및 최적화 | CSV 가져오기, 페이지네이션, 성능 최적화 | 20시간 |

**총 예상 시간: 80시간 (1일 4시간 기준 약 4주)**

---

## 🔴 1주차: 긴급 수정 및 기본 기능 개선

### Day 1-2: 긴급 버그 수정 (8시간)

#### ✅ Task 1.1: 빌드 오류 수정 (2시간)
**우선순위: 🔴 최고**

**현재 문제:**
- DeckList.js 파일 손상으로 Cloudflare Pages 빌드 실패
- Line 200: 템플릿 리터럴 구문 오류

**작업 내용:**
```javascript
// 수정 전
to={`/ decks / ${ deck.id } `}

// 수정 후
to={`/decks/${deck.id}`}
```

**체크리스트:**
- [ ] DeckList.js 파일 복구
- [ ] 로컬 빌드 테스트
- [ ] GitHub 푸시
- [ ] Cloudflare Pages 배포 확인

---

#### ✅ Task 1.2: 로그인/회원가입 리다이렉션 수정 (3시간)
**우선순위: 🔴 최고**

**현재 문제:**
- 로그인/회원가입 성공 후 `/decks`로 자동 이동하지 않음
- 사용자가 수동으로 이동해야 함

**작업 내용:**

**파일: `client/src/components/Auth/Login.js`**
```javascript
handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ error: '', loading: true });

    try {
        const response = await authAPI.login(this.state.email, this.state.password);
        authAPI.saveToken(response.token, response.user);
        
        if (this.props.onLoginSuccess) {
            this.props.onLoginSuccess();
        }
        
        // 추가: 리다이렉션
        window.location.href = '/decks';
    } catch (err) {
        this.setState({ error: err.message || '로그인 실패' });
    } finally {
        this.setState({ loading: false });
    }
};
```

**파일: `client/src/components/Auth/Register.js`**
```javascript
// 동일한 리다이렉션 로직 추가
window.location.href = '/decks';
```

**체크리스트:**
- [ ] Login.js 수정
- [ ] Register.js 수정
- [ ] 로컬 테스트
- [ ] 배포 및 확인

---

#### ✅ Task 1.3: JWT_SECRET 보안 강화 (3시간)
**우선순위: 🔴 최고**

**현재 문제:**
```toml
# wrangler.toml - GitHub에 노출됨
[vars]
JWT_SECRET = "dev-secret-key-change-in-production"
```

**작업 내용:**

1. **wrangler.toml 수정**
```toml
# JWT_SECRET 제거
[vars]
NODE_ENV = "production"
```

2. **Cloudflare Secret 설정**
```bash
wrangler secret put JWT_SECRET
# 입력: 강력한 랜덤 문자열 (최소 32자)
# 예: openssl rand -base64 32
```

3. **.gitignore 업데이트**
```
# 환경 변수
.env
.env.local
wrangler.toml.local
```

**체크리스트:**
- [ ] 강력한 시크릿 생성
- [ ] Cloudflare Dashboard에서 Secret 설정
- [ ] wrangler.toml에서 JWT_SECRET 제거
- [ ] .gitignore 업데이트
- [ ] 배포 후 인증 테스트

---

### Day 3-4: 카드 편집 기능 (8시간)

#### ✅ Task 1.4: 카드 편집 API 구현 (4시간)
**우선순위: 🟡 높음**

**파일: `functions/api/cards/[cardId]/index.js` (신규)**
```javascript
// PUT /api/cards/:cardId
export async function onRequestPut(context) {
    const { env, params, request } = context;
    const cardId = params.cardId;
    
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const { front, back } = await request.json();
        
        // 카드 소유권 확인
        const card = await env.DB.prepare(
            `SELECT c.id FROM cards c
             JOIN decks d ON c.deck_id = d.id
             WHERE c.id = ? AND d.user_id = ?`
        ).bind(cardId, context.user.userId).first();
        
        if (!card) {
            return new Response(JSON.stringify({ error: 'Card not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 카드 업데이트
        await env.DB.prepare(
            'UPDATE cards SET front = ?, back = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(front, back, cardId).run();
        
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

**체크리스트:**
- [ ] API 파일 생성
- [ ] 소유권 검증 로직 구현
- [ ] 로컬 테스트

---

#### ✅ Task 1.5: 카드 편집 UI 구현 (4시간)
**우선순위: 🟡 높음**

**파일: `client/src/components/DeckDetail.js`**
```javascript
// State 추가
this.state = {
    ...
    editingCard: null,
    editForm: { front: '', back: '' }
};

// 편집 시작
handleStartEdit = (card) => {
    this.setState({
        editingCard: card.id,
        editForm: { front: card.front, back: card.back }
    });
};

// 편집 저장
handleSaveEdit = async (cardId) => {
    try {
        await cardAPI.update(cardId, this.state.editForm.front, this.state.editForm.back);
        this.setState({ editingCard: null });
        this.loadDeckAndCards();
    } catch (err) {
        this.setState({ error: err.message });
    }
};

// 렌더링에 편집 버튼 추가
<button onClick={() => this.handleStartEdit(card)}>✏️ 편집</button>
```

**파일: `client/src/utils/api.js`**
```javascript
export const cardAPI = {
    ...
    update: (cardId, front, back) =>
        apiRequest(`/api/cards/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify({ front, back }),
        }),
};
```

**체크리스트:**
- [ ] 편집 모드 UI 구현
- [ ] API 연동
- [ ] 취소 기능 구현
- [ ] 테스트

---

### Day 5: reviews 테이블 마이그레이션 (4시간)

#### ✅ Task 1.6: 데이터베이스 마이그레이션 실행
**우선순위: 🔴 최고**

**작업 내용:**
```bash
# 1. 마이그레이션 파일 확인
cat migrations/0003_reviews_update.sql

# 2. 로컬 테스트
wrangler d1 execute pangstudy-db --file=migrations/0003_reviews_update.sql --local

# 3. 프로덕션 실행
wrangler d1 execute pangstudy-db --file=migrations/0003_reviews_update.sql --remote

# 4. 확인
wrangler d1 execute pangstudy-db --command="PRAGMA table_info(reviews)" --remote
```

**체크리스트:**
- [ ] 마이그레이션 파일 검증
- [ ] 로컬 테스트
- [ ] 프로덕션 실행
- [ ] 학습 기능 테스트

---

## 🟡 2주차: UX 개선 및 검색 기능

### Day 6-7: 덱 검색 기능 (8시간)

#### ✅ Task 2.1: 검색 UI 구현 (4시간)

**파일: `client/src/components/DeckList.js`**
```javascript
constructor(props) {
    super(props);
    this.state = {
        ...
        searchQuery: ''
    };
}

// 검색 필터링
getFilteredDecks = () => {
    const { decks, searchQuery } = this.state;
    if (!searchQuery.trim()) return decks;
    
    return decks.filter(deck => 
        deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
};

// 렌더링
<input
    type="text"
    placeholder="🔍 덱 검색..."
    value={searchQuery}
    onChange={(e) => this.setState({ searchQuery: e.target.value })}
    style={{
        width: '100%',
        padding: '10px',
        marginBottom: '20px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px'
    }}
/>

{this.getFilteredDecks().map(deck => ...)}
```

**체크리스트:**
- [ ] 검색 입력 필드 추가
- [ ] 필터링 로직 구현
- [ ] 검색 결과 없음 메시지
- [ ] 테스트

---

#### ✅ Task 2.2: 덱 정렬 기능 (4시간)

**추가 기능:**
- 이름순 정렬
- 생성일순 정렬
- 카드 수순 정렬

```javascript
<select onChange={(e) => this.setState({ sortBy: e.target.value })}>
    <option value="name">이름순</option>
    <option value="created">최신순</option>
    <option value="cards">카드 수</option>
</select>
```

**체크리스트:**
- [ ] 정렬 드롭다운 추가
- [ ] 정렬 로직 구현
- [ ] 테스트

---

### Day 8-9: 에러 처리 개선 (8시간)

#### ✅ Task 2.3: 에러 메시지 개선 (4시간)

**파일: `client/src/utils/errorHandler.js` (신규)**
```javascript
export const getErrorMessage = (error) => {
    const message = error.message || error.toString();
    
    // 이메일 중복
    if (message.includes('Email already exists') || message.includes('UNIQUE constraint')) {
        return '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.';
    }
    
    // 인증 오류
    if (message.includes('Invalid credentials') || message.includes('Unauthorized')) {
        return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    
    // 비밀번호 오류
    if (message.includes('password')) {
        return '비밀번호는 최소 8자 이상이어야 합니다.';
    }
    
    // 네트워크 오류
    if (message.includes('Failed to fetch') || message.includes('Network')) {
        return '네트워크 연결을 확인해주세요.';
    }
    
    return '오류가 발생했습니다. 다시 시도해주세요.';
};
```

**적용:**
```javascript
// 모든 컴포넌트에서 사용
import { getErrorMessage } from '../utils/errorHandler';

catch (err) {
    this.setState({ error: getErrorMessage(err) });
}
```

**체크리스트:**
- [ ] errorHandler.js 생성
- [ ] 모든 컴포넌트에 적용
- [ ] 다양한 에러 케이스 테스트

---

#### ✅ Task 2.4: 로딩 상태 개선 (4시간)

**파일: `client/src/components/LoadingSpinner.js` (신규)**
```javascript
import React from 'react';

const LoadingSpinner = ({ message = '로딩 중...' }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center'
    }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '15px', color: '#6c757d' }}>{message}</p>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

export default LoadingSpinner;
```

**적용:**
```javascript
import LoadingSpinner from './LoadingSpinner';

if (loading) {
    return <LoadingSpinner message="덱을 불러오는 중..." />;
}
```

**체크리스트:**
- [ ] LoadingSpinner 컴포넌트 생성
- [ ] 모든 로딩 상태에 적용
- [ ] 애니메이션 테스트

---

### Day 10: 테스트 및 버그 수정 (2시간)

**체크리스트:**
- [ ] 1-2주차 기능 통합 테스트
- [ ] 버그 수정
- [ ] 문서 업데이트

---

## 🟢 3주차: 학습 경험 향상

### Day 11-13: 학습 진행률 시각화 (12시간)

#### ✅ Task 3.1: Chart.js 통합 (4시간)

**설치:**
```bash
cd client
npm install chart.js react-chartjs-2
```

**파일: `client/src/components/ProgressChart.js` (신규)**
```javascript
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const ProgressChart = ({ data }) => {
    const chartData = {
        labels: data.labels, // ['월', '화', '수', ...]
        datasets: [{
            label: '학습한 카드 수',
            data: data.values, // [10, 15, 8, ...]
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4
        }]
    };
    
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: '주간 학습 진행률'
            }
        }
    };
    
    return <Line data={chartData} options={options} />;
};

export default ProgressChart;
```

**체크리스트:**
- [ ] Chart.js 설치
- [ ] ProgressChart 컴포넌트 생성
- [ ] Statistics에 통합

---

#### ✅ Task 3.2: 덱별 진행률 표시 (4시간)

**파일: `client/src/components/DeckProgress.js` (신규)**
```javascript
const DeckProgress = ({ total, studied }) => {
    const percentage = total > 0 ? Math.round((studied / total) * 100) : 0;
    
    return (
        <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', color: '#6c757d' }}>
                    진행률: {studied}/{total}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#007bff' }}>
                    {percentage}%
                </span>
            </div>
            <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: percentage === 100 ? '#28a745' : '#007bff',
                    transition: 'width 0.3s'
                }} />
            </div>
        </div>
    );
};
```

**체크리스트:**
- [ ] DeckProgress 컴포넌트 생성
- [ ] DeckList에 통합
- [ ] API에서 진행률 데이터 가져오기

---

#### ✅ Task 3.3: 통계 API 확장 (4시간)

**파일: `functions/api/stats/index.js`**
```javascript
// 주간 학습 데이터 추가
const weeklyData = await env.DB.prepare(
    `SELECT DATE(reviewed_at) as date, COUNT(*) as count
     FROM reviews
     WHERE user_id = ? AND reviewed_at >= DATE('now', '-7 days')
     GROUP BY DATE(reviewed_at)
     ORDER BY date`
).bind(userId).all();

return new Response(JSON.stringify({
    ...기존 통계,
    weeklyData: weeklyData.results
}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
});
```

**체크리스트:**
- [ ] 주간 데이터 쿼리 추가
- [ ] 덱별 진행률 쿼리 추가
- [ ] 프론트엔드 연동

---

### Day 14-15: 다크 모드 (8시간)

#### ✅ Task 3.4: 테마 시스템 구현 (8시간)

**파일: `client/src/contexts/ThemeContext.js` (신규)**
```javascript
import React, { Component } from 'react';

export const ThemeContext = React.createContext();

export class ThemeProvider extends Component {
    constructor(props) {
        super(props);
        this.state = {
            theme: localStorage.getItem('theme') || 'light'
        };
    }
    
    toggleTheme = () => {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.setState({ theme: newTheme });
        localStorage.setItem('theme', newTheme);
    };
    
    render() {
        return (
            <ThemeContext.Provider value={{
                theme: this.state.theme,
                toggleTheme: this.toggleTheme
            }}>
                {this.props.children}
            </ThemeContext.Provider>
        );
    }
}
```

**파일: `client/src/styles/themes.js` (신규)**
```javascript
export const lightTheme = {
    background: '#ffffff',
    text: '#212529',
    primary: '#007bff',
    secondary: '#6c757d',
    border: '#dee2e6',
    cardBg: '#f8f9fa'
};

export const darkTheme = {
    background: '#1a1a1a',
    text: '#e9ecef',
    primary: '#0d6efd',
    secondary: '#adb5bd',
    border: '#495057',
    cardBg: '#2d2d2d'
};
```

**체크리스트:**
- [ ] ThemeContext 생성
- [ ] 테마 스타일 정의
- [ ] 모든 컴포넌트에 적용
- [ ] 토글 버튼 추가

---

### Day 16: 키보드 단축키 (2시간)

#### ✅ Task 3.5: 단축키 구현

**파일: `client/src/components/StudySession.js`**
```javascript
componentDidMount() {
    this.loadDueCards();
    document.addEventListener('keydown', this.handleKeyPress);
}

componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
}

handleKeyPress = (e) => {
    const { showAnswer } = this.state;
    
    // Space: 카드 뒤집기
    if (e.code === 'Space' && !showAnswer) {
        e.preventDefault();
        this.setState({ showAnswer: true });
    }
    
    // 1-4: 난이도 선택
    if (showAnswer && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const difficulty = parseInt(e.code.replace('Digit', '')) - 1;
        this.handleAnswer(difficulty);
    }
};
```

**체크리스트:**
- [ ] 키보드 이벤트 리스너 추가
- [ ] 단축키 안내 표시
- [ ] 테스트

---

## 🔵 4주차: 고급 기능 및 최적화

### Day 17-18: CSV 일괄 가져오기 (8시간)

#### ✅ Task 4.1: CSV 파싱 구현 (4시간)

**설치:**
```bash
npm install papaparse
```

**파일: `client/src/components/ImportCSV.js` (신규)**
```javascript
import React, { Component } from 'react';
import Papa from 'papaparse';
import { cardAPI } from '../utils/api';

class ImportCSV extends Component {
    handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        Papa.parse(file, {
            complete: async (results) => {
                const cards = results.data
                    .filter(row => row.length >= 2)
                    .map(row => ({
                        front: row[0],
                        back: row[1]
                    }));
                
                // 일괄 생성
                for (const card of cards) {
                    await cardAPI.create(
                        this.props.deckId,
                        card.front,
                        card.back
                    );
                }
                
                this.props.onComplete();
            },
            error: (error) => {
                console.error('CSV 파싱 오류:', error);
            }
        });
    };
    
    render() {
        return (
            <div>
                <input
                    type="file"
                    accept=".csv"
                    onChange={this.handleFileUpload}
                />
                <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
                    CSV 형식: 앞면,뒷면
                </p>
            </div>
        );
    }
}

export default ImportCSV;
```

**체크리스트:**
- [ ] CSV 파싱 라이브러리 설치
- [ ] ImportCSV 컴포넌트 생성
- [ ] DeckDetail에 통합
- [ ] 샘플 CSV 파일 생성

---

#### ✅ Task 4.2: 일괄 생성 API 최적화 (4시간)

**파일: `functions/api/cards/batch.js` (신규)**
```javascript
// POST /api/cards/batch
export async function onRequestPost(context) {
    const { env, request } = context;
    
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const { deckId, cards } = await request.json();
        
        // 트랜잭션으로 일괄 삽입
        const statements = cards.map(card => 
            env.DB.prepare(
                'INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?)'
            ).bind(deckId, card.front, card.back)
        );
        
        await env.DB.batch(statements);
        
        return new Response(JSON.stringify({
            success: true,
            count: cards.length
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

**체크리스트:**
- [ ] 일괄 생성 API 구현
- [ ] 프론트엔드 연동
- [ ] 성능 테스트

---

### Day 19-20: 페이지네이션 및 성능 최적화 (8시간)

#### ✅ Task 4.3: 덱 목록 페이지네이션 (4시간)

**파일: `functions/api/decks/index.js`**
```javascript
export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    const decks = await env.DB.prepare(
        `SELECT d.*, COUNT(c.id) as card_count
         FROM decks d
         LEFT JOIN cards c ON d.id = c.deck_id
         WHERE d.user_id = ?
         GROUP BY d.id
         ORDER BY d.created_at DESC
         LIMIT ? OFFSET ?`
    ).bind(userId, limit, offset).all();
    
    const total = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM decks WHERE user_id = ?'
    ).bind(userId).first();
    
    return new Response(JSON.stringify({
        decks: decks.results,
        total: total.count,
        hasMore: offset + limit < total.count
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
```

**체크리스트:**
- [ ] API에 페이지네이션 추가
- [ ] 프론트엔드 페이지네이션 UI
- [ ] 무한 스크롤 옵션

---

#### ✅ Task 4.4: API 응답 캐싱 (4시간)

**파일: `functions/api/decks/index.js`**
```javascript
export async function onRequestGet(context) {
    const { env } = context;
    const userId = context.user.userId;
    
    // 캐시 확인 (Cloudflare Workers KV 사용 시)
    // const cacheKey = `decks:${userId}`;
    // const cached = await env.CACHE.get(cacheKey);
    // if (cached) {
    //     return new Response(cached, {
    //         headers: { 'Content-Type': 'application/json' }
    //     });
    // }
    
    // DB 조회
    const decks = await env.DB.prepare(...).all();
    const response = JSON.stringify({ decks: decks.results });
    
    // 캐시 저장 (5분)
    // await env.CACHE.put(cacheKey, response, { expirationTtl: 300 });
    
    return new Response(response, {
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60'
        }
    });
}
```

**체크리스트:**
- [ ] Cache-Control 헤더 추가
- [ ] 캐시 무효화 로직
- [ ] 성능 측정

---

### Day 21: 최종 테스트 및 문서화 (4시간)

**체크리스트:**
- [ ] 전체 기능 통합 테스트
- [ ] 성능 테스트
- [ ] 버그 수정
- [ ] README 업데이트
- [ ] CHANGELOG 작성

---

## 📊 진행 상황 추적

### 주차별 완료 체크리스트

#### 1주차
- [ ] 빌드 오류 수정
- [ ] 로그인/회원가입 리다이렉션
- [ ] JWT_SECRET 보안 강화
- [ ] 카드 편집 기능
- [ ] reviews 마이그레이션

#### 2주차
- [ ] 덱 검색 기능
- [ ] 덱 정렬 기능
- [ ] 에러 메시지 개선
- [ ] 로딩 상태 개선

#### 3주차
- [ ] 학습 진행률 시각화
- [ ] 다크 모드
- [ ] 키보드 단축키

#### 4주차
- [ ] CSV 일괄 가져오기
- [ ] 페이지네이션
- [ ] API 캐싱
- [ ] 최종 테스트

---

## 🎯 성공 지표

### 기술적 지표
- [ ] 빌드 성공률: 100%
- [ ] API 응답 시간: < 500ms
- [ ] 페이지 로드 시간: < 2초
- [ ] 모바일 점수: > 90 (Lighthouse)

### 사용자 경험 지표
- [ ] 회원가입 완료율: > 80%
- [ ] 학습 세션 완료율: > 70%
- [ ] 오류 발생률: < 1%

---

## 📝 다음 단계 (5주차 이후)

### 장기 계획
1. **PWA 오프라인 지원** (2주)
2. **소셜 로그인** (1주)
3. **이미지 첨부 기능** (2주)
4. **Anki .apkg 파일 가져오기** (2주)
5. **모바일 앱** (4주)

---

## 💡 참고 사항

### 개발 환경
- Node.js: v16+
- React: 16.6.3
- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1

### 배포 프로세스
1. 로컬 테스트
2. GitHub 푸시
3. Cloudflare Pages 자동 배포
4. 프로덕션 테스트

### 문서
- [README.md](file:///C:/win_asp_LMs/pangstudy/README.md)
- [개선 제안](file:///C:/Users/bvcbv/.gemini/antigravity/brain/d903d377-8fdb-4446-ade9-c11202c9b347/improvement_suggestions.md)
