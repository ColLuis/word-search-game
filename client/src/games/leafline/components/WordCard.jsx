/**
 * A Leafline card: a cream tile with one word along each edge.
 * words are [top, right, bottom, left] as currently rotated.
 */
const SIZES = {
  sm: { word: 'text-[8px]', inset: 'inset-1', pad: 'p-0.5' },
  md: { word: 'text-[10px] sm:text-[11px]', inset: 'inset-1.5', pad: 'p-1' },
};

export default function WordCard({ words, size = 'md', className = '' }) {
  const [top, right, bottom, left] = words;
  const s = SIZES[size];
  const word = `font-display font-bold uppercase tracking-wide text-ink leading-none whitespace-nowrap ${s.word}`;

  return (
    <div
      className={[
        'relative aspect-square w-full rounded-xl bg-tile-face shadow-tile select-none',
        className,
      ].join(' ')}
    >
      <div className={`absolute ${s.inset} flex items-start justify-center`}>
        <span className={word}>{top}</span>
      </div>
      <div className={`absolute ${s.inset} flex items-end justify-center`}>
        <span className={word}>{bottom}</span>
      </div>
      <div className={`absolute ${s.inset} flex items-center justify-start`}>
        <span className={`${word} rotate-180`} style={{ writingMode: 'vertical-rl' }}>
          {left}
        </span>
      </div>
      <div className={`absolute ${s.inset} flex items-center justify-end`}>
        <span className={word} style={{ writingMode: 'vertical-rl' }}>
          {right}
        </span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <LeafMark className={size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} />
      </div>
    </div>
  );
}

export function LeafMark({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`text-tile-edge ${className}`} fill="currentColor">
      <path d="M20 4C11 4 5 8.5 5 15c0 1.6.4 3 1 4.2L4.3 21l1.4 1.4 1.8-1.8C8.7 21.5 10.2 22 12 22c6.5 0 9-6.5 8-18Zm-8 16c-1.2 0-2.3-.3-3.2-.8l6.9-6.9-1.4-1.4-6.9 6.9A6.5 6.5 0 0 1 7 15c0-4.9 4.2-8.6 10.9-8.9C18.5 15 16.6 20 12 20Z" />
    </svg>
  );
}
