-- reviews 테이블 업데이트
ALTER TABLE reviews ADD COLUMN next_review DATETIME;
ALTER TABLE reviews ADD COLUMN ease_factor REAL DEFAULT 2.5;
ALTER TABLE reviews ADD COLUMN interval_days INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN repetitions INTEGER DEFAULT 0;

-- 기존 데이터 업데이트
UPDATE reviews SET next_review = DATETIME('now') WHERE next_review IS NULL;
