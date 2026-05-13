import { useDroppable } from '@dnd-kit/core';
import LetterTile from './LetterTile.jsx';

export default function LetterBank({ tiles, onTileClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bank-drop-zone' });

  return (
    <div
      ref={setNodeRef}
      className={`flex justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-2xl min-h-[64px] transition-colors ${
        isOver ? 'bg-surface-sunken' : 'bg-surface'
      }`}
    >
      {tiles.map((tile) => (
        <LetterTile key={tile.id} tile={tile} variant="bank" onClick={() => onTileClick(tile.id)} />
      ))}
      {tiles.length === 0 && (
        <p className="text-ink-muted text-sm self-center font-sans">All letters placed</p>
      )}
    </div>
  );
}
