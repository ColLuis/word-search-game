import { useDroppable } from '@dnd-kit/core';
import LetterTile from './LetterTile.jsx';

export default function LetterBank({ tiles, onTileClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bank-drop-zone' });

  return (
    <div
      ref={setNodeRef}
      className={`flex justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl min-h-[56px] transition-colors ${
        isOver ? 'bg-gray-700/50' : 'bg-gray-800/50'
      }`}
    >
      {tiles.map((tile) => (
        <LetterTile
          key={tile.id}
          tile={tile}
          variant="bank"
          onClick={() => onTileClick(tile.id)}
        />
      ))}
      {tiles.length === 0 && (
        <p className="text-gray-600 text-sm self-center">All letters placed</p>
      )}
    </div>
  );
}
