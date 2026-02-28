import { GRID_SIZE } from './constants.js';

const DIRECTIONS = [
  { dr: 0, dc: 1 },   // horizontal right
  { dr: 1, dc: 0 },   // vertical down
  { dr: 1, dc: 1 },   // diagonal down-right
  { dr: 0, dc: -1 },  // horizontal left (reverse)
  { dr: -1, dc: 0 },  // vertical up (reverse)
  { dr: -1, dc: -1 }, // diagonal up-left (reverse)
];

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function canPlace(grid, word, row, col, dir) {
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dir.dr;
    const c = col + i * dir.dc;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (grid[r][c] !== null && grid[r][c] !== word[i]) return false;
  }
  return true;
}

function placeWord(grid, word, row, col, dir) {
  const cells = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dir.dr;
    const c = col + i * dir.dc;
    grid[r][c] = word[i];
    cells.push({ row: r, col: c });
  }
  return cells;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateGrid(words) {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = createEmptyGrid();
    const placements = [];
    const sorted = [...words].sort((a, b) => b.length - a.length);
    let allPlaced = true;

    for (const word of sorted) {
      let placed = false;
      const dirs = shuffle(DIRECTIONS);

      for (const dir of dirs) {
        const positions = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (canPlace(grid, word, r, c, dir)) {
              positions.push({ row: r, col: c });
            }
          }
        }
        if (positions.length > 0) {
          const pos = positions[Math.floor(Math.random() * positions.length)];
          const cells = placeWord(grid, word, pos.row, pos.col, dir);
          placements.push({
            word,
            cells,
            startRow: cells[0].row,
            startCol: cells[0].col,
            endRow: cells[cells.length - 1].row,
            endCol: cells[cells.length - 1].col,
          });
          placed = true;
          break;
        }
      }

      if (!placed) {
        allPlaced = false;
        break;
      }
    }

    if (allPlaced) {
      // Fill remaining with random letters
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === null) {
            grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
          }
        }
      }
      return { grid, placements };
    }
  }

  throw new Error('Failed to generate grid after maximum attempts');
}
