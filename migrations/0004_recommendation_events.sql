-- migration: add recommendation_events table
CREATE TABLE IF NOT EXISTS recommendation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  deck_id INTEGER,
  user_id INTEGER,
  variant TEXT,
  created_at TEXT NOT NULL
);
