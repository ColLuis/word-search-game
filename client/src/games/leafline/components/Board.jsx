/**
 * The 2×2 board with a clue on each outside edge.
 * `clues` is { top, right, bottom, left } of React nodes; `children` are the four slots
 * in order: top-left, top-right, bottom-left, bottom-right.
 */
export default function Board({ clues, children, className = '' }) {
  return (
    <div
      className={[
        'grid w-full max-w-sm grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2',
        className,
      ].join(' ')}
    >
      <div className="col-start-2 row-start-1 flex justify-center">{clues.top}</div>
      <div className="col-start-1 row-start-2 flex justify-center">{clues.left}</div>
      <div className="col-start-2 row-start-2 grid grid-cols-2 gap-2.5">{children}</div>
      <div className="col-start-3 row-start-2 flex justify-center">{clues.right}</div>
      <div className="col-start-2 row-start-3 flex justify-center">{clues.bottom}</div>
    </div>
  );
}

const CLUE_STYLES = {
  neutral: 'bg-accent-orange text-white shadow-[0_3px_0_0_#C77638]',
  solved: 'bg-accent-green text-white shadow-[0_3px_0_0_#2E5C45]',
  missed: 'bg-accent-red text-white shadow-[0_3px_0_0_#94372C]',
  empty: 'bg-transparent text-ink-muted border-2 border-dashed border-ink-muted/50',
  active: 'bg-accent-orange text-white shadow-[0_3px_0_0_#C77638] ring-4 ring-accent-orange/30',
};

/** A clue label. `side` turns it vertical for the left and right edges. */
export function Clue({ text, side, status = 'neutral', placeholder = '?' }) {
  const shown = text?.trim() ? text : placeholder;
  const style = text?.trim() ? CLUE_STYLES[status] : CLUE_STYLES.empty;
  const mark = status === 'solved' ? '✓ ' : status === 'missed' ? '✗ ' : '';
  const vertical = side === 'left' || side === 'right';

  return (
    <div
      className={[
        'rounded-lg font-display font-bold uppercase tracking-wider text-sm whitespace-nowrap transition-colors',
        vertical ? 'px-1 py-3' : 'px-3 py-1',
        style,
      ].join(' ')}
      style={
        vertical
          ? {
              writingMode: 'vertical-rl',
              transform: side === 'left' ? 'rotate(180deg)' : undefined,
            }
          : undefined
      }
    >
      {text?.trim() ? mark : ''}
      {shown}
    </div>
  );
}
