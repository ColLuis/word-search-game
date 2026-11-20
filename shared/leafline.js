// Leafline rules shared by the server and the client.

export const LEAFLINE_EVENTS = {
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_KICK: 'room:kick',
  GAME_START: 'game:start',
  CLUE_UPDATE: 'clue:update',
  CLUE_READY: 'clue:ready',
  GUESS_PLACE: 'guess:place',
  GUESS_ROTATE: 'guess:rotate',
  GUESS_RETURN: 'guess:return',
  GUESS_SUBMIT: 'guess:submit',
  GUESS_UNSUBMIT: 'guess:unsubmit',
  BOARD_NEXT: 'board:next',
  PLAY_AGAIN: 'play:again',
  STATE: 'state',
  ERROR: 'leafline:error',
};

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const POINTS_FIRST_TRY = 6;
export const POINTS_SECOND_TRY = 2;

export const LINK_IDS = ['top', 'right', 'bottom', 'left'];

// Slots: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right.
// Edges: 0 top, 1 right, 2 bottom, 3 left. Each clue sits on the outside of
// the 2×2 board and links the two card edges that touch along that seam.
export const LINK_GEOMETRY = {
  top: [
    { slot: 0, edge: 1 },
    { slot: 1, edge: 3 },
  ],
  right: [
    { slot: 1, edge: 2 },
    { slot: 3, edge: 0 },
  ],
  bottom: [
    { slot: 2, edge: 1 },
    { slot: 3, edge: 3 },
  ],
  left: [
    { slot: 0, edge: 2 },
    { slot: 2, edge: 0 },
  ],
};

/** words are [top, right, bottom, left]; returns the pair a clue must link. */
export function seamWords(slotWords, linkId) {
  const [a, b] = LINK_GEOMETRY[linkId];
  return [slotWords[a.slot]?.[a.edge] ?? '', slotWords[b.slot]?.[b.edge] ?? ''];
}

export function validateClue(text, wordA, wordB) {
  const t = (text ?? '').trim();
  if (!t) return 'Clue cannot be empty';
  if (!/^[A-Za-z'-]+$/.test(t)) return 'Letters, hyphens and apostrophes only';
  if (t.length > 20) return 'Clue must be at most 20 characters';
  const lower = t.toLowerCase();
  const wa = wordA.toLowerCase();
  const wb = wordB.toLowerCase();
  if (lower === wa || lower === wb) return "Clue can't be one of the linked words";
  if (overlaps(lower, wa)) return `Clue overlaps with "${wordA}"`;
  if (overlaps(lower, wb)) return `Clue overlaps with "${wordB}"`;
  return null;
}

// Short fragments ("ring" in "spring") are fine; only flag real word reuse.
function overlaps(clue, word) {
  return (word.length >= 3 && clue.includes(word)) || (clue.length >= 4 && word.startsWith(clue));
}

export function getRatingBand(score, maxScore) {
  if (maxScore === 0) return 'Warming up';
  const pct = score / maxScore;
  if (pct <= 0.4) return 'Warming up';
  if (pct <= 0.7) return 'In sync';
  if (pct < 1) return 'Mind meld';
  return 'Perfect';
}
