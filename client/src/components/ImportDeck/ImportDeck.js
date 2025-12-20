// Anki 덱 가져오기 컴포넌트
import React, { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { importAnkiDeck } from '../../utils/ankiImporter';
import { deckAPI, cardAPI } from '../../utils/api';
import { Card, Button, Alert, ProgressBar } from 'react-bootstrap';

export function ImportDeck({ onImportComplete }) {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [commercialAllowed, setCommercialAllowed] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.apkg')) {
            setFile(selectedFile);
            setError('');
        } else {
            setError(t('import.fileFormat'));
            setFile(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError('');
        setSuccess('');

        try {
            // 1. .apkg 파일 파싱
            setProgress(20);
            const { decks, cards } = await importAnkiDeck(file);

            // 2. 덱 생성
            setProgress(40);
            for (const deck of decks) {
                // include metadata: source (file name) and commercial flag from user
                const metadata = {
                    source: `Anki import: ${file.name}`,
                    author: deck.author || null,
                    license: deck.license || null,
                    commercial_allowed: commercialAllowed ? 1 : 0,
                };

                const { deck: createdDeck } = await deckAPI.create(deck.name, deck.description, metadata);

                // 3. 해당 덱의 카드들 생성
                const deckCards = cards.filter(c => c.deckId === deck.ankiId);
                const totalCards = deckCards.length;

                for (let i = 0; i < totalCards; i++) {
                    const card = deckCards[i];
                    await cardAPI.create(
                        createdDeck.id,
                        card.front,
                        card.back,
                        card.media_front,
                        card.media_back
                    );

                    // 진행도 업데이트 (40% ~ 90%)
                    setProgress(40 + Math.floor((i / totalCards) * 50));
                }
            }

            setProgress(100);
            setSuccess(t('import.importSuccess'));
            setFile(null);

            // 2초 후 완료 콜백 호출
            setTimeout(() => {
                if (onImportComplete) onImportComplete();
            }, 2000);

        } catch (err) {
            console.error('Import error:', err);
            setError(err.message || t('import.importFailed'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <Card.Body>
                <h3>{t('import.importAnkiDeck')}</h3>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <div className="mb-3">
                    <input
                        type="file"
                        accept=".apkg"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="form-control"
                    />
                    <small className="text-muted">{t('import.fileFormat')}</small>
                </div>

                <div className="mb-3 form-check">
                    <input
                        id="commercialAllowed"
                        type="checkbox"
                        className="form-check-input"
                        checked={commercialAllowed}
                        onChange={(e) => setCommercialAllowed(e.target.checked)}
                        disabled={uploading}
                    />
                    <label className="form-check-label" htmlFor="commercialAllowed">
                        저는 이 덱을 상업적으로 사용할 권한이 있음을 확인합니다.
                    </label>
                </div>

                {uploading && (
                    <div className="mb-3">
                        <ProgressBar now={progress} label={`${progress}%`} />
                        <small className="text-muted">{t('import.importing')}</small>
                    </div>
                )}

                <Button
                    variant="primary"
                    onClick={handleImport}
                    disabled={!file || uploading}
                >
                    {uploading ? t('import.importing') : t('import.uploadButton')}
                </Button>
            </Card.Body>
        </Card>
    );
}
