export default function ScoreBoard({ players, scores }) {
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <div className="w-full max-w-xs">
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center gap-2 px-3 py-1.5 rounded mb-1"
          style={{ backgroundColor: `${p.color}15` }}
        >
          <span className="text-xs text-gray-500 w-4">{i + 1}.</span>
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: p.color }}
          >
            {p.name[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold flex-1">{p.name}</span>
          <span className="text-sm font-bold" style={{ color: p.color }}>
            {scores[p.id] || 0}
          </span>
        </div>
      ))}
    </div>
  );
}
