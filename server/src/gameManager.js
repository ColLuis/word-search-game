import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateGrid } from './gridGenerator.js';
import { WORDS_PER_GAME } from './constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wordLists = JSON.parse(readFileSync(join(__dirname, '../data/wordLists.json'), 'utf-8'));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function startGame(room) {
  const categoryWords = wordLists[room.category];
  if (!categoryWords) throw new Error(`Unknown category: ${room.category}`);

  const selectedWords = shuffle(categoryWords).slice(0, WORDS_PER_GAME);
  const { grid, placements } = generateGrid(selectedWords);

  const words = placements.map((p) => ({
    word: p.word,
    cells: p.cells,
    startRow: p.startRow,
    startCol: p.startCol,
    endRow: p.endRow,
    endCol: p.endCol,
    found: false,
    foundBy: null,
  }));

  room.game = {
    grid,
    words,
    powerups: {}, // playerId -> { freeze: N, hint: N, wordsFound: N, lastFreezeTime: 0 }
  };

  room.players.forEach((p) => {
    p.score = 0;
    room.game.powerups[p.id] = { freeze: 0, hint: 0, fog: 0, bonus: 0, steal: 0, wordsFound: 0, lastFreezeTime: 0 };
  });

  return room.game;
}

export function validateWordFound(room, playerId, startRow, startCol, endRow, endCol) {
  const { words } = room.game;

  // Check if player is frozen
  const powerupState = room.game.powerups[playerId];
  if (powerupState && powerupState.frozenUntil && Date.now() < powerupState.frozenUntil) {
    return { valid: false, message: 'You are frozen!' };
  }

  for (const w of words) {
    if (w.found) continue;
    const forward =
      w.startRow === startRow &&
      w.startCol === startCol &&
      w.endRow === endRow &&
      w.endCol === endCol;
    const reverse =
      w.startRow === endRow &&
      w.startCol === endCol &&
      w.endRow === startRow &&
      w.endCol === startCol;
    if (forward || reverse) {
      w.found = true;
      w.foundBy = playerId;
      return { valid: true, word: w.word, cells: w.cells };
    }
  }

  return { valid: false, message: 'Not a valid word' };
}

export function checkGameEnd(room) {
  return room.game.words.every((w) => w.found);
}
