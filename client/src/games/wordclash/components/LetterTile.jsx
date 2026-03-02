import { useDraggable } from '@dnd-kit/core';

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

  const baseClasses = 'w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold select-none transition-shadow';

  const variantClasses =
    variant === 'builder'
      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
      : 'bg-gray-700 text-white hover:bg-gray-600';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${isDragging ? 'opacity-50 scale-110' : 'cursor-pointer'}`}
    >
      {tile.letter}
    </div>
  );
}
