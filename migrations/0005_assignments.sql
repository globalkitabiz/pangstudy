-- Assignments table: manager assigns cards or decks to users
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  card_id INTEGER,
  deck_id INTEGER,
  assigned_by INTEGER,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME,
  repeat_interval_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'assigned',
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_card ON assignments(card_id);
CREATE INDEX IF NOT EXISTS idx_assignments_deck ON assignments(deck_id);
