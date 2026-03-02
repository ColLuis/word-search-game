export default function PlayerStatus({ players, playerId, submittedPlayerIds, scores }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {players.map((p) => {
        const isMe = p.id === playerId;
        const submitted = submittedPlayerIds.includes(p.id);
        const score = scores[p.id] || 0;

        return (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              isMe ? 'bg-gray-700 ring-1 ring-orange-500/50' : 'bg-gray-800'
            }`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: p.color }}
            >
              {p.name[0].toUpperCase()}
            </div>
            <span className="font-semibold">{isMe ? 'You' : p.name}</span>
            <span className="text-gray-400">{score}</span>
            {submitted && (
              <span className="text-green-400 text-xs">&#10003;</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
