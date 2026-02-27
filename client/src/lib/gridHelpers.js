import { GRID_SIZE } from './constants.js';

/**
 * Snap a free drag to the nearest cardinal/diagonal direction.
 * Returns { row, col } of the snapped endpoint.
 */
export function snapToDirection(startRow, startCol, currentRow, currentCol) {
  const dr = currentRow - startRow;
  const dc = currentCol - startCol;

  if (dr === 0 && dc === 0) return { row: startRow, col: startCol };

  // Determine dominant direction
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  let stepR, stepC;

  if (absDc >= absDr * 2) {
    // Horizontal
    stepR = 0;
    stepC = dc > 0 ? 1 : -1;
  } else if (absDr >= absDc * 2) {
    // Vertical
    stepR = dr > 0 ? 1 : -1;
    stepC = 0;
  } else {
    // Diagonal
    stepR = dr > 0 ? 1 : -1;
    stepC = dc > 0 ? 1 : -1;
  }

  const dist = Math.max(absDr, absDc);
  const endRow = Math.max(0, Math.min(GRID_SIZE - 1, startRow + stepR * dist));
  const endCol = Math.max(0, Math.min(GRID_SIZE - 1, startCol + stepC * dist));

  return { row: endRow, col: endCol };
}

/**
 * Get all cells along a line from start to end.
 */
export function getCellsInLine(startRow, startCol, endRow, endCol) {
  const cells = [];
  const dr = Math.sign(endRow - startRow);
  const dc = Math.sign(endCol - startCol);
  const steps = Math.max(Math.abs(endRow - startRow), Math.abs(endCol - startCol));

  for (let i = 0; i <= steps; i++) {
    cells.push({ row: startRow + i * dr, col: startCol + i * dc });
  }

  return cells;
}
