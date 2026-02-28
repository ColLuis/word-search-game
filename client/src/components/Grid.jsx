import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';
import useGridDrag from '../hooks/useGridDrag.js';
import { GRID_SIZE } from '../lib/constants.js';

function cellKey(r, c) {
  return r * GRID_SIZE + c;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function Grid() {
  const { state } = useGame();
  const { grid, words, playerId, hintCells, hintWord, frozen, scrambled, bonusActive } = state;
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

  // Scrambled letters map — randomize unfound cells visually
  const scrambleMap = useMemo(() => {
    if (!scrambled) return null;
    const map = new Map();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const key = cellKey(r, c);
        if (!foundMap.has(key)) {
          map.set(key, ALPHABET[Math.floor(Math.random() * 26)]);
        }
      }
    }
    return map;
  }, [scrambled, foundMap]);

  if (!grid || grid.length === 0) return null;

  return (
    <div className="relative w-full max-w-[min(90vw,500px)]">
      <div
        ref={gridRef}
        className={`grid select-none aspect-square w-full transition-all duration-300 ${bonusActive ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900 rounded-md' : ''} ${scrambled ? 'animate-shake' : ''}`}
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
            if (hinted) bg = 'bg-yellow-400 animate-pulse';

            const displayLetter = frozen ? '' : (scrambleMap && scrambleMap.has(key) ? scrambleMap.get(key) : letter);

            return (
              <div
                key={key}
                className={`flex items-center justify-center text-xs sm:text-sm font-bold rounded-sm m-[1px] transition-colors duration-100 ${bg}`}
              >
                {displayLetter}
              </div>
            );
          })
        )}
      </div>
      {hintWord && (
        <div className="mt-2 text-center text-yellow-400 text-sm font-bold animate-pulse">
          Find: {hintWord}
        </div>
      )}
      {bonusActive && (
        <div className="mt-2 text-center">
          <span className="bg-green-500 text-black text-sm font-extrabold px-4 py-1 rounded-full animate-bounce inline-block">
            2x BONUS — Next word is worth double!
          </span>
        </div>
      )}
      {scrambled && (
        <div className="mt-2 text-center text-purple-400 text-sm font-bold animate-pulse">
          SCRAMBLED!
        </div>
      )}
    </div>
  );
}
