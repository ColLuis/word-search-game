import { useDraggable } from '@dnd-kit/core';
import { playLetterClick } from '../../../lib/sounds.js';

export default function LetterTile({ tile, onClick, variant = 'bank' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tile.id,
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 50,
      }
    : undefined;

  const baseClasses =
    'w-[calc((100vw-4.5rem)/10)] max-w-14 aspect-square rounded-lg flex items-center justify-center text-lg sm:text-2xl font-display font-bold uppercase select-none transition-shadow';

  const variantClasses =
    variant === 'builder'
      ? 'bg-accent-orange text-white shadow-tile'
      : 'bg-tile-face text-ink shadow-tile hover:-translate-y-0.5';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => {
        playLetterClick();
        onClick?.();
      }}
      className={`${baseClasses} ${variantClasses} ${isDragging ? 'opacity-50 scale-110' : 'cursor-pointer'}`}
    >
      {tile.letter}
    </div>
  );
}
