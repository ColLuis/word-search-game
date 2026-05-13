export default function PlayerStatus({ players, playerId, submittedPlayerIds, scores }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {players.map((p) => {
        const isMe = p.id === playerId;
        const submitted = submittedPlayerIds.includes(p.id);
        const score = scores[p.id] || 0;

        return (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-sans bg-surface ${
              isMe ? 'ring-2 ring-accent-orange' : ''
            }`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: p.color }}
            >
              {p.name[0].toUpperCase()}
            </div>
            <span className="font-bold text-ink">{isMe ? 'You' : p.name}</span>
            <span className="text-ink-soft font-bold">{score}</span>
            {submitted && <span className="text-accent-green text-xs">&#10003;</span>}
          </div>
        );
      })}
    </div>
  );
}
