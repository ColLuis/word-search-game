export default function ScoreBoard({ players, scores }) {
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <div className="w-full max-w-xs space-y-1.5">
      {sorted.map((p, i) => (
        <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface">
          <span className="text-xs font-display font-bold text-ink-muted w-4">{i + 1}.</span>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: p.color }}
          >
            {p.name[0].toUpperCase()}
          </div>
          <span className="text-sm font-bold text-ink flex-1">{p.name}</span>
          <span className="text-sm font-display font-bold" style={{ color: p.color }}>
            {scores[p.id] || 0}
          </span>
        </div>
      ))}
    </div>
  );
}
