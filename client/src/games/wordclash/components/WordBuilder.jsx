import { useDroppable } from '@dnd-kit/core';
import LetterTile from './LetterTile.jsx';

export default function WordBuilder({ tiles, onTileClick, validationStatus, currentWord }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'builder-drop-zone' });

  let statusText = 'Build a word...';
  let statusColor = 'text-gray-500';

  if (currentWord.length > 0 && currentWord.length < 3) {
    statusText = 'Too short (min 3 letters)';
    statusColor = 'text-gray-500';
  } else if (validationStatus && validationStatus.word === currentWord) {
    if (validationStatus.valid) {
      statusText = 'Valid!';
      statusColor = 'text-green-400';
    } else {
      statusText = validationStatus.reason || 'Not a valid word';
      statusColor = 'text-red-400';
    }
  } else if (currentWord.length >= 3) {
    statusText = 'Checking...';
    statusColor = 'text-yellow-400';
  }

  return (
    <div className="w-full">
      <div
        ref={setNodeRef}
        className={`flex flex-wrap justify-center gap-2 p-3 rounded-xl min-h-[76px] border-2 border-dashed transition-colors ${
          isOver ? 'border-orange-400 bg-orange-400/10' : 'border-gray-600 bg-gray-800/30'
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
          <p className="text-gray-600 text-sm self-center">Tap letters to build a word</p>
        )}
      </div>
      <p className={`text-center text-sm mt-2 font-semibold ${statusColor}`}>
        {statusText}
      </p>
    </div>
  );
}
