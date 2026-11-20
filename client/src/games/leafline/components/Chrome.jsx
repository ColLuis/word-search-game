/** Small shared bits of Leafline screen chrome. */

export function ScreenHeader({ eyebrow, title, sub }) {
  return (
    <div className="text-center">
      {eyebrow && (
        <p className="text-xs font-sans font-bold uppercase tracking-wider2 text-ink-muted">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-2xl font-bold text-ink mt-1">{title}</h2>
      {sub && <p className="text-ink-soft text-sm font-sans mt-0.5">{sub}</p>}
    </div>
  );
}

export function Avatar({ player, size = 'md' }) {
  const s = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: player.color }}
    >
      {player.name[0].toUpperCase()}
    </div>
  );
}

export function PlayerChips({ players, marked = [], mark = '✓' }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {players.map((p) => {
        const on = marked.includes(p.id);
        return (
          <div
            key={p.id}
            className={[
              'flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-sm font-sans font-bold transition-colors',
              on ? 'bg-accent-green/15 text-accent-green' : 'bg-surface text-ink-soft',
              p.connected ? '' : 'opacity-50',
            ].join(' ')}
          >
            <Avatar player={p} size="sm" />
            {p.name}
            {on && <span>{mark}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-accent-red text-white px-4 py-2 rounded-xl shadow-card font-sans font-bold text-sm max-w-[90vw] text-center">
      {message}
    </div>
  );
}
