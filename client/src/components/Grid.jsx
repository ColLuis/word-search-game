import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';
import useGridDrag from '../hooks/useGridDrag.js';
import { GRID_SIZE } from '../lib/constants.js';

function cellKey(r, c) {
  return r * GRID_SIZE + c;
}

export default function Grid() {
  const { state } = useGame();
  const { grid, words, playerId, hintCells, hintWord, frozen, fogArea, bonusActive, mirrored } = state;
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

  // Fog set
  const fogSet = useMemo(() => {
    const set = new Set();
    if (fogArea) {
      for (let r = fogArea.row; r < fogArea.row + fogArea.size; r++) {
        for (let c = fogArea.col; c < fogArea.col + fogArea.size; c++) {
          set.add(cellKey(r, c));
        }
      }
    }
    return set;
  }, [fogArea]);

  if (!grid || grid.length === 0) return null;

  return (
    <div className="relative w-full max-w-[min(90vw,500px)]">
      {hintWord && (
        <div className="absolute -top-8 left-0 right-0 text-center text-yellow-400 text-sm font-bold animate-pulse z-10">
          Find: {hintWord}
        </div>
      )}
      {bonusActive && (
        <div className="absolute -top-8 left-0 right-0 text-center text-green-400 text-sm font-bold animate-pulse z-10">
          2x BONUS active!
        </div>
      )}
      {mirrored && (
        <div className="absolute -top-8 left-0 right-0 text-center text-pink-400 text-sm font-bold animate-pulse z-10">
          MIRRORED!
        </div>
      )}
      <div
        ref={gridRef}
        className="grid select-none aspect-square w-full transition-transform duration-300"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          touchAction: 'none',
          transform: mirrored ? 'scaleX(-1)' : undefined,
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
            const fogged = fogSet.has(key);

            let bg = 'bg-gray-800';
            if (found === 'self') bg = 'bg-blue-600/60';
            else if (found === 'opponent') bg = 'bg-orange-600/60';

            if (dragging) bg = 'bg-blue-400/70';
            if (hinted) bg = 'bg-yellow-400 animate-pulse';
            if (fogged) bg = 'bg-gray-900';

            return (
              <div
                key={key}
                className={`flex items-center justify-center text-xs sm:text-sm font-bold rounded-sm m-[1px] transition-colors duration-100 ${bg}`}
                style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
              >
                {frozen ? '' : fogged ? '' : letter}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
