import { useState, useCallback, useRef } from 'react';
import { snapToDirection, getCellsInLine } from '../lib/gridHelpers.js';
import { getSocket } from '../lib/socket.js';
import { GRID_SIZE } from '../lib/constants.js';

export default function useGridDrag(frozen) {
  const [dragState, setDragState] = useState(null); // { startRow, startCol, endRow, endCol }
  const gridRef = useRef(null);

  const getCellFromPoint = useCallback((x, y) => {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const cellW = rect.width / GRID_SIZE;
    const cellH = rect.height / GRID_SIZE;
    const col = Math.floor((x - rect.left) / cellW);
    const row = Math.floor((y - rect.top) / cellH);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      if (frozen) return;
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragState({ startRow: cell.row, startCol: cell.col, endRow: cell.row, endCol: cell.col });
    },
    [frozen, getCellFromPoint]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragState || frozen) return;
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      const snapped = snapToDirection(dragState.startRow, dragState.startCol, cell.row, cell.col);
      setDragState((prev) => ({ ...prev, endRow: snapped.row, endCol: snapped.col }));
    },
    [dragState, frozen, getCellFromPoint]
  );

  const onPointerUp = useCallback(() => {
    if (!dragState || frozen) {
      setDragState(null);
      return;
    }

    const { startRow, startCol, endRow, endCol } = dragState;
    if (startRow !== endRow || startCol !== endCol) {
      getSocket().emit('word:submit', { startRow, startCol, endRow, endCol });
    }
    setDragState(null);
  }, [dragState, frozen]);

  const draggedCells = dragState
    ? getCellsInLine(dragState.startRow, dragState.startCol, dragState.endRow, dragState.endCol)
    : [];

  return {
    gridRef,
    draggedCells,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
