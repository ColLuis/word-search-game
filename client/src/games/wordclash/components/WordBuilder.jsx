import { useDroppable } from '@dnd-kit/core';
import LetterTile from './LetterTile.jsx';

export default function WordBuilder({ tiles, onTileClick, validationStatus, currentWord }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'builder-drop-zone' });

  let statusText = 'Build a word...';
  let statusColor = 'text-ink-muted';

  if (currentWord.length > 0 && currentWord.length < 3) {
    statusText = 'Too short (min 3 letters)';
    statusColor = 'text-ink-muted';
  } else if (validationStatus && validationStatus.word === currentWord) {
    if (validationStatus.valid) {
      statusText = 'Valid!';
      statusColor = 'text-accent-green';
    } else {
      statusText = validationStatus.reason || 'Not a valid word';
      statusColor = 'text-accent-red';
    }
  } else if (currentWord.length >= 3) {
    statusText = 'Checking...';
    statusColor = 'text-accent-orange';
  }

  return (
    <div className="w-full">
      <div
        ref={setNodeRef}
        className={`flex justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-2xl min-h-[64px] border-2 border-dashed transition-colors ${
          isOver
            ? 'border-accent-orange bg-accent-orange/10'
            : 'border-ink-muted/40 bg-surface-sunken'
        }`}
      >
        {tiles.map((tile) => (
          <LetterTile
            key={tile.id}
            tile={tile}
            variant="builder"
            onClick={() => onTileClick(tile.id)}
          />
        ))}
        {tiles.length === 0 && (
          <p className="text-ink-muted text-sm self-center font-sans">
            Tap letters to build a word
          </p>
        )}
      </div>
      <p
        className={`text-center text-sm mt-2 font-bold font-sans uppercase tracking-wider ${statusColor}`}
      >
        {statusText}
      </p>
    </div>
  );
}
