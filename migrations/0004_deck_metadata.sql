-- Add metadata fields to decks for source, author, license, and commercial flag
ALTER TABLE decks ADD COLUMN source TEXT;
ALTER TABLE decks ADD COLUMN author TEXT;
ALTER TABLE decks ADD COLUMN license TEXT;
ALTER TABLE decks ADD COLUMN commercial_allowed INTEGER DEFAULT 0;
