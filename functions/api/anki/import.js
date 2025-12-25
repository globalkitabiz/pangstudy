// Anki .apkg 파일 가져오기 API
// .apkg는 ZIP 형식으로 SQLite DB를 포함하고 있음

// JWT 검증 함수 (inline)
async function verifyJWT(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    const [headerB64, payloadB64, signatureB64] = parts;
    const base64urlDecode = (str) => {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return atob(str);
    };
    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (payload.exp && payload.exp < Date.now() / 1000) throw new Error('Token expired');
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = Uint8Array.from(base64urlDecode(signatureB64), c => c.charCodeAt(0));
    if (!await crypto.subtle.verify('HMAC', key, sigBytes, data)) throw new Error('Invalid signature');
    return payload;
}

// JWT fallback 인증 헬퍼
async function authenticateUser(context) {
    const { request, env } = context;
    if (context.user && context.user.userId) {
        return { success: true, userId: context.user.userId };
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false };
    }
    try {
        const payload = await verifyJWT(authHeader.substring(7), env.JWT_SECRET);
        context.user = payload;
        return { success: true, userId: payload.userId };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const auth = await authenticateUser(context);
    if (!auth.success) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = auth.userId;

    try {
        // FormData로 파일 받기
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return new Response(JSON.stringify({ error: '파일이 없습니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 파일 확장자 확인
        if (!file.name.endsWith('.apkg')) {
            return new Response(JSON.stringify({ error: '.apkg 파일만 업로드할 수 있습니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: '파일 크기가 10MB를 초과합니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 파일 읽기
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // ZIP 파일 파싱 (비동기)
        const zipEntries = await parseZip(bytes);

        // collection.anki2 또는 collection.anki21 파일 찾기
        let dbEntry = zipEntries.find(e => e.name === 'collection.anki2' || e.name === 'collection.anki21');

        if (!dbEntry) {
            return new Response(JSON.stringify({ error: 'Anki 데이터베이스를 찾을 수 없습니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // SQLite 데이터베이스 파싱
        const cards = parseAnkiDatabase(dbEntry.data);

        if (cards.length === 0) {
            return new Response(JSON.stringify({ error: '가져올 카드가 없습니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 덱 이름 추출 (파일 이름에서)
        const deckName = file.name.replace('.apkg', '').replace(/_/g, ' ');

        // 새 덱 생성
        const deckResult = await env.DB.prepare(
            'INSERT INTO decks (user_id, name, description, source, author, license, commercial_allowed) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            userId,
            deckName,
            `Anki에서 가져옴 (${cards.length}장)`,
            `Anki import: ${file.name}`,
            null,
            null,
            0
        ).run();

        const deckId = deckResult.meta.last_row_id;

        // 카드들 삽입
        let insertedCount = 0;
        for (const card of cards) {
            try {
                await env.DB.prepare(
                    'INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?)'
                ).bind(deckId, card.front, card.back).run();
                insertedCount++;
            } catch (cardError) {
                console.error('Card insert error:', cardError);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `"${deckName}" 덱을 가져왔습니다!`,
            deckId: deckId,
            deckName: deckName,
            cardCount: insertedCount
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Anki import error:', error);
        return new Response(JSON.stringify({
            error: 'Anki 파일 가져오기 실패',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 비동기 ZIP 파서
async function parseZip(bytes) {
    const entries = [];
    let offset = 0;

    while (offset < bytes.length - 4) {
        // Local file header signature: 0x04034b50
        if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4b &&
            bytes[offset + 2] === 0x03 && bytes[offset + 3] === 0x04) {

            const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
            const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) |
                (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
            const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
            const extraFieldLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

            const fileName = new TextDecoder().decode(
                bytes.slice(offset + 30, offset + 30 + fileNameLength)
            );

            const dataStart = offset + 30 + fileNameLength + extraFieldLength;
            const dataEnd = dataStart + compressedSize;

            let data;
            if (compressionMethod === 0) {
                // 압축되지 않음
                data = bytes.slice(dataStart, dataEnd);
            } else if (compressionMethod === 8) {
                // DEFLATE 압축 - 비동기 해제
                try {
                    data = await inflateRawAsync(bytes.slice(dataStart, dataEnd));
                } catch (e) {
                    console.error('Inflate error for', fileName, e);
                    data = bytes.slice(dataStart, dataEnd);
                }
            } else {
                data = bytes.slice(dataStart, dataEnd);
            }

            entries.push({ name: fileName, data: data, compressionMethod });
            offset = dataEnd;
        } else {
            offset++;
        }
    }

    return entries;
}

// DEFLATE 해제 (DecompressionStream 사용)
async function inflateRawAsync(compressed) {
    try {
        // 'deflate-raw' 사용 (ZIP의 raw deflate 데이터용)
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();

        writer.write(compressed);
        writer.close();

        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result;
    } catch (e) {
        console.error('Deflate-raw error:', e);
        // fallback: 'deflate' 시도
        try {
            const ds = new DecompressionStream('deflate');
            const writer = ds.writable.getWriter();
            const reader = ds.readable.getReader();

            writer.write(compressed);
            writer.close();

            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }

            return result;
        } catch (e2) {
            console.error('Deflate fallback error:', e2);
            return compressed;
        }
    }
}

// 동기 버전 (fallback)
function inflateRaw(compressed) {
    // 압축되지 않은 블록만 처리
    const result = [];
    let i = 0;

    while (i < compressed.length) {
        const bfinal = compressed[i] & 1;
        const btype = (compressed[i] >> 1) & 3;

        if (btype === 0) {
            i++;
            const len = compressed[i] | (compressed[i + 1] << 8);
            i += 4;
            for (let j = 0; j < len && i < compressed.length; j++, i++) {
                result.push(compressed[i]);
            }
        } else {
            return compressed;
        }

        if (bfinal) break;
    }

    return new Uint8Array(result);
}

// Anki SQLite 데이터베이스 파싱 (개선된 버전)
function parseAnkiDatabase(dbBytes) {
    const cards = [];

    // SQLite 파일인지 확인
    const header = new TextDecoder().decode(dbBytes.slice(0, 16));
    if (!header.startsWith('SQLite format 3')) {
        return parseTextFormat(dbBytes);
    }

    // SQLite 바이너리에서 notes 테이블 데이터 추출
    // Anki notes 테이블의 flds 컬럼에서 \x1f로 구분된 필드를 찾음

    // 바이너리에서 UTF-8 텍스트 블록 추출 (더 정교한 방식)
    const extractedCards = extractNotesFromSQLite(dbBytes);

    if (extractedCards.length > 0) {
        return extractedCards.slice(0, 1000);
    }

    // fallback: 기존 방식
    const text = new TextDecoder('utf-8', { fatal: false }).decode(dbBytes);
    const fieldSeparator = String.fromCharCode(0x1f);
    const parts = text.split(fieldSeparator);

    const validParts = parts
        .map(p => cleanText(p))
        .filter(p => p.length > 0 && p.length < 10000 && !p.includes('SQLite'));

    for (let i = 0; i < validParts.length - 1; i += 2) {
        const front = validParts[i];
        const back = validParts[i + 1];
        if (front && back && front !== back) {
            cards.push({ front, back });
        }
    }

    if (cards.length === 0) {
        return extractCardsFromBinary(dbBytes);
    }

    return cards.slice(0, 1000);
}

// SQLite 바이너리에서 notes 레코드 추출
function extractNotesFromSQLite(dbBytes) {
    const cards = [];
    const fieldSeparator = 0x1f; // Unit Separator

    // 바이너리에서 flds 필드 패턴 찾기
    // flds는 \x1f로 구분된 UTF-8 문자열
    let i = 0;
    while (i < dbBytes.length - 10) {
        // \x1f 구분자 찾기
        if (dbBytes[i] === fieldSeparator) {
            // 앞뒤로 텍스트 블록 추출 시도
            const frontStart = findTextStart(dbBytes, i);
            const backEnd = findTextEnd(dbBytes, i + 1);

            if (frontStart !== -1 && backEnd !== -1) {
                const front = decodeUTF8Segment(dbBytes, frontStart, i);
                const backStart = i + 1;
                let nextSep = backStart;
                while (nextSep < dbBytes.length && dbBytes[nextSep] !== fieldSeparator) {
                    nextSep++;
                }
                const back = decodeUTF8Segment(dbBytes, backStart, nextSep);

                if (front && back && front.length > 1 && back.length > 1 &&
                    front !== back && !front.includes('SQLite') && !back.includes('CREATE')) {
                    cards.push({ front: cleanText(front), back: cleanText(back) });
                }
            }
        }
        i++;
    }

    // 중복 제거
    const seen = new Set();
    return cards.filter(c => {
        const key = c.front + '|||' + c.back;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function findTextStart(bytes, pos) {
    let start = pos - 1;
    while (start >= 0 && isValidUTF8Byte(bytes, start)) {
        start--;
    }
    return start + 1;
}

function findTextEnd(bytes, pos) {
    let end = pos;
    while (end < bytes.length && isValidUTF8Byte(bytes, end) && bytes[end] !== 0x1f) {
        end++;
    }
    return end;
}

function isValidUTF8Byte(bytes, pos) {
    const b = bytes[pos];
    // 출력 가능한 ASCII 또는 UTF-8 멀티바이트 시작/연속
    return (b >= 0x20 && b < 0x7f) || (b >= 0x80 && b <= 0xf4);
}

function decodeUTF8Segment(bytes, start, end) {
    if (start >= end || end > bytes.length) return '';
    try {
        const segment = bytes.slice(start, end);
        return new TextDecoder('utf-8', { fatal: false }).decode(segment);
    } catch (e) {
        return '';
    }
}

// 텍스트 정리
function cleanText(text) {
    return text
        .replace(/<[^>]+>/g, '') // HTML 태그 제거
        .replace(/[\x00-\x1f]/g, '') // 제어 문자 제거
        .replace(/\s+/g, ' ') // 여러 공백을 하나로
        .trim();
}

// 바이너리에서 카드 추출 시도
function extractCardsFromBinary(dbBytes) {
    const cards = [];
    const text = new TextDecoder('utf-8', { fatal: false }).decode(dbBytes);

    // 긴 텍스트 블록 찾기
    const textBlocks = [];
    let currentBlock = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) < 127 ||
            char.charCodeAt(0) >= 0xAC00 && char.charCodeAt(0) <= 0xD7AF || // 한글
            char.charCodeAt(0) >= 0x3040 && char.charCodeAt(0) <= 0x30FF || // 일본어
            char.charCodeAt(0) >= 0x4E00 && char.charCodeAt(0) <= 0x9FFF) { // 한자
            currentBlock += char;
        } else {
            if (currentBlock.length >= 2) {
                textBlocks.push(currentBlock.trim());
            }
            currentBlock = '';
        }
    }

    // 유효한 블록 필터링
    const validBlocks = textBlocks.filter(b =>
        b.length >= 2 &&
        b.length <= 500 &&
        !b.match(/^[0-9\s]+$/) &&
        !b.includes('CREATE TABLE') &&
        !b.includes('INSERT INTO')
    );

    // 쌍으로 카드 생성
    for (let i = 0; i < validBlocks.length - 1; i += 2) {
        if (validBlocks[i] !== validBlocks[i + 1]) {
            cards.push({
                front: validBlocks[i],
                back: validBlocks[i + 1]
            });
        }
    }

    return cards.slice(0, 1000);
}

// 텍스트 형식 파싱
function parseTextFormat(bytes) {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const lines = text.split('\n').filter(l => l.trim());
    const cards = [];

    for (const line of lines) {
        // 탭이나 세미콜론으로 구분된 형식
        const parts = line.split(/\t|;/).map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
            cards.push({ front: parts[0], back: parts[1] });
        }
    }

    return cards.slice(0, 1000);
}
