import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';
import useGridDrag from '../hooks/useGridDrag.js';
import { GRID_SIZE } from '../lib/constants.js';

function cellKey(r, c) {
  return r * GRID_SIZE + c;
}

export default function Grid() {
  const { state } = useGame();
  const { grid, words, playerId, hintCells, frozen } = state;
  const { gridRef, draggedCells, onPointerDown, onPointerMove, onPointerUp } = useGridDrag(frozen);

  // Build found-cells map: cellKey -> 'self' | 'opponent'
  const foundMap = useMemo(() => {
    const map = new Map();
    words.forEach((w) => {
      if (!w.found || !w.cells) return;
      const who = w.foundBy === playerId ? 'self' : 'opponent';
      w.cells.forEach((c) => map.set(cellKey(c.row, c.col), who));
    });
    return map;
  }, [words, playerId]);

  // Dragging set
  const dragSet = useMemo(() => {
    const set = new Set();
    draggedCells.forEach((c) => set.add(cellKey(c.row, c.col)));
    return set;
  }, [draggedCells]);

  // Hint set
  const hintSet = useMemo(() => {
    const set = new Set();
    hintCells.forEach((c) => set.add(cellKey(c.row, c.col)));
    return set;
  }, [hintCells]);

  if (!grid || grid.length === 0) return null;

  return (
    <div
      ref={gridRef}
      className="grid select-none aspect-square w-full max-w-[min(90vw,500px)]"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const key = cellKey(r, c);
          const found = foundMap.get(key);
          const dragging = dragSet.has(key);
          const hinted = hintSet.has(key);

          let bg = 'bg-gray-800';
          if (found === 'self') bg = 'bg-blue-600/60';
          else if (found === 'opponent') bg = 'bg-orange-600/60';

          if (dragging) bg = 'bg-blue-400/70';
          if (hinted) bg = 'bg-yellow-400/50 animate-pulse';

          return (
            <div
              key={key}
              className={`flex items-center justify-center text-xs sm:text-sm font-bold rounded-sm m-[1px] transition-colors duration-100 ${bg}`}
            >
              {letter}
            </div>
          );
        })
      )}
    </div>
  );
}
