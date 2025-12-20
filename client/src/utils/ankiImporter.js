// Anki 덱 가져오기 유틸리티
import { readAnkiPackage } from 'anki-reader';

/**
 * .apkg 파일을 파싱하여 덱과 카드 정보 추출
 * @param {File} file - .apkg 파일
 * @returns {Promise<{decks: Array, cards: Array, media: Object}>}
 */
export async function importAnkiDeck(file) {
    try {
        // 파일을 ArrayBuffer로 읽기
        const arrayBuffer = await file.arrayBuffer();

        // anki-reader로 파싱
        const { collection, media } = await readAnkiPackage(arrayBuffer);

        // 덱 정보 추출
        const decks = extractDecks(collection);

        // 카드 정보 추출
        const cards = extractCards(collection);

        return { decks, cards, media };
    } catch (error) {
        console.error('Anki import error:', error);
        throw new Error('Anki 덱 가져오기 실패: ' + error.message);
    }
}

/**
 * Collection에서 덱 정보 추출
 */
function extractDecks(collection) {
    const decks = [];

    if (collection.decks) {
        for (const [deckId, deck] of Object.entries(collection.decks)) {
            if (deckId !== '1') { // 기본 덱 제외
                decks.push({
                    ankiId: deckId,
                    name: deck.name,
                    description: deck.desc || '',
                    author: null,
                    license: null,
                });
            }
        }
    }

    return decks;
}

/**
 * Collection에서 카드 정보 추출
 */
function extractCards(collection) {
    const cards = [];

    if (collection.notes) {
        collection.notes.forEach(note => {
            // 노트의 필드 파싱
            const fields = note.flds ? note.flds.split('\x1f') : [];

            if (fields.length >= 2) {
                cards.push({
                    deckId: note.did,
                    front: cleanHTML(fields[0]),
                    back: cleanHTML(fields[1]),
                    media_front: extractMedia(fields[0]),
                    media_back: extractMedia(fields[1]),
                });
            }
        });
    }

    return cards;
}

/**
 * HTML 태그 제거 및 정리
 */
function cleanHTML(html) {
    if (!html) return '';

    // 간단한 HTML 정리 (실제로는 더 정교한 처리 필요)
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
}

/**
 * 미디어 파일명 추출
 */
function extractMedia(html) {
    if (!html) return null;

    const mediaFiles = [];
    const imgRegex = /<img[^>]+src="([^"]+)"/gi;
    const soundRegex = /\[sound:([^\]]+)\]/gi;

    let match;

    // 이미지 추출
    while ((match = imgRegex.exec(html)) !== null) {
        mediaFiles.push(match[1]);
    }

    // 오디오 추출
    while ((match = soundRegex.exec(html)) !== null) {
        mediaFiles.push(match[1]);
    }

    return mediaFiles.length > 0 ? mediaFiles : null;
}
