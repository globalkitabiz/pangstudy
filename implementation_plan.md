# Anki-like Web App Implementation Plan

## Goal Description
Create a modern, responsive web application that mimics the core functionality of Anki (flashcards with spaced repetition). The app will allow users to create decks, add cards, and study them using an industry-standard SRS algorithm.

## User Review Required
> [!IMPORTANT]
> Since "AnkiDroid" code cannot be directly used, we will use `ts-fsrs` (Free Spaced Repetition Scheduler), a modern TypeScript implementation of the SRS algorithm that is highly compatible with Anki's logic but more performant.

## Proposed Changes

### Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (for premium, modern aesthetics)
- **State Management**: React Context or Zustand
- **SRS Logic**: `ts-fsrs` (or `DolphinSR`)
- **Persistence**: `localStorage` (MVP) -> IndexedDB or Supabase (Future)

### Core Components

#### [NEW] `lib/srs.ts`
- Wrapper around the SRS library to handle card scheduling.

#### [NEW] `types/anki.ts`
- Definitions for `Deck`, `Card`, `ReviewLog`.

#### [NEW] `components/DeckList.tsx`
- Displays available decks with study due counts.

#### [NEW] `components/Flashcard.tsx`
- The main study view with "Front", "Back", and answer buttons (Again, Hard, Good, Easy).

#### [NEW] `app/study/[deckId]/page.tsx`
- The study session page.

## Verification Plan

### Automated Tests
- Unit tests for the scheduling logic to ensure cards are pushed to the correct future dates based on user ratings.

### Manual Verification
- Create a deck.
- Add a few cards.
- Run through a study session.
- Verify that cards reappear at expected intervals (or disappear until due).
