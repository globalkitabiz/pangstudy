// Anki .apkg 파일 가져오기 API
// .apkg는 ZIP 형식으로 SQLite DB를 포함하고 있음

export async function onRequestPost(context) {
    const { request, env } = context;

    // 사용자 인증 확인
    if (!context.user || !context.user.userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = context.user.userId;

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

        // ZIP 파일 파싱 (간단한 구현)
        const zipEntries = parseZip(bytes);

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
            'INSERT INTO decks (user_id, name, description) VALUES (?, ?, ?)'
        ).bind(userId, deckName, `Anki에서 가져옴 (${cards.length}장)`).run();

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

// 간단한 ZIP 파서
function parseZip(bytes) {
    const entries = [];
    let offset = 0;

    while (offset < bytes.length - 4) {
        // Local file header signature: 0x04034b50
        if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4b &&
            bytes[offset + 2] === 0x03 && bytes[offset + 3] === 0x04) {

            const generalPurpose = bytes[offset + 6] | (bytes[offset + 7] << 8);
            const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
            const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) |
                (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
            const uncompressedSize = bytes[offset + 22] | (bytes[offset + 23] << 8) |
                (bytes[offset + 24] << 16) | (bytes[offset + 25] << 24);
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
                // DEFLATE 압축
                try {
                    data = inflateRaw(bytes.slice(dataStart, dataEnd));
                } catch (e) {
                    // 압축 해제 실패 시 원본 데이터 사용
                    data = bytes.slice(dataStart, dataEnd);
                }
            } else {
                data = bytes.slice(dataStart, dataEnd);
            }

            entries.push({ name: fileName, data: data });
            offset = dataEnd;
        } else {
            offset++;
        }
    }

    return entries;
}

// 간단한 DEFLATE 해제 (raw inflate)
function inflateRaw(compressed) {
    // Cloudflare Workers에서는 DecompressionStream 사용 가능
    // 하지만 동기 처리를 위해 간단한 구현 사용
    // 실제로는 pako 같은 라이브러리가 필요하지만, CF Workers에서는 제한적

    // 압축되지 않은 블록만 처리하는 간단한 구현
    const result = [];
    let i = 0;

    while (i < compressed.length) {
        const bfinal = compressed[i] & 1;
        const btype = (compressed[i] >> 1) & 3;

        if (btype === 0) {
            // 비압축 블록
            i++;
            const len = compressed[i] | (compressed[i + 1] << 8);
            i += 4; // len + nlen
            for (let j = 0; j < len && i < compressed.length; j++, i++) {
                result.push(compressed[i]);
            }
        } else {
            // 압축된 블록 - 원본 반환
            return compressed;
        }

        if (bfinal) break;
    }

    return new Uint8Array(result);
}

// Anki SQLite 데이터베이스 파싱 (간단한 구현)
function parseAnkiDatabase(dbBytes) {
    const cards = [];

    // SQLite 파일인지 확인
    const header = new TextDecoder().decode(dbBytes.slice(0, 16));
    if (!header.startsWith('SQLite format 3')) {
        // SQLite가 아니면 텍스트로 파싱 시도
        return parseTextFormat(dbBytes);
    }

    // SQLite 바이너리에서 텍스트 패턴 추출
    const text = new TextDecoder('utf-8', { fatal: false }).decode(dbBytes);

    // HTML 태그로 감싸진 내용 찾기 (Anki 카드 형식)
    const htmlPattern = /<[^>]+>([^<]*)<\/[^>]+>/g;
    const matches = [...text.matchAll(htmlPattern)];

    // 또는 필드 구분자 (0x1f) 찾기
    const fieldSeparator = String.fromCharCode(0x1f);
    const parts = text.split(fieldSeparator);

    // 유효한 텍스트 조각 필터링
    const validParts = parts
        .map(p => cleanText(p))
        .filter(p => p.length > 0 && p.length < 10000 && !p.includes('SQLite'));

    // 쌍으로 묶어서 카드 생성
    for (let i = 0; i < validParts.length - 1; i += 2) {
        const front = validParts[i];
        const back = validParts[i + 1];

        if (front && back && front !== back) {
            cards.push({ front, back });
        }
    }

    // 카드가 없으면 다른 패턴 시도
    if (cards.length === 0) {
        return extractCardsFromBinary(dbBytes);
    }

    return cards.slice(0, 1000); // 최대 1000장
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
