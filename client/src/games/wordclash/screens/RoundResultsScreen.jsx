import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import ScoreBoard from '../components/ScoreBoard.jsx';

export default function RoundResultsScreen() {
  const { state } = useGame();
  const { roundSubmissions, scores, players, playerId, currentRound, totalRounds, bestWords, readyPlayerIds, isLastRound } = state;

  const iReady = readyPlayerIds.includes(playerId);
  const readyCount = readyPlayerIds.length;
  const totalPlayers = players.length;

  const handleReady = () => {
    getSocket().emit('round:ready');
  };

  // Sort submissions by score descending
  const sorted = [...roundSubmissions].sort((a, b) => b.score - a.score);

  // Find highest scorer
  const highestScore = sorted.length > 0 ? sorted[0].score : 0;

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-1">Round {currentRound} Results</h2>
      <p className="text-gray-400 text-sm mb-6">{totalRounds - currentRound} round{totalRounds - currentRound !== 1 ? 's' : ''} remaining</p>

      {/* All players' words */}
      <div className="w-full space-y-2 mb-6">
        {sorted.map((sub) => {
          const player = players.find((p) => p.id === sub.playerId);
          if (!player) return null;
          const isMe = sub.playerId === playerId;
          const isHighest = sub.score === highestScore && sub.score > 0;

          return (
            <div
              key={sub.playerId}
              className={`bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3 ${
                isHighest ? 'ring-1 ring-yellow-400/50' : ''
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: player.color }}
              >
                {player.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{isMe ? 'You' : player.name}</span>
                  {isHighest && <span className="text-yellow-400 text-xs">Best</span>}
                </div>
                <p className="text-lg font-mono font-bold truncate" style={{ color: player.color }}>
                  {sub.word || <span className="text-gray-600 italic text-sm">no word</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold" style={{ color: player.color }}>
                  +{sub.score}
                </p>
                {sub.word && (
                  <p className="text-xs text-gray-500">{sub.word.length} letters</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Best possible words */}
      {bestWords.length > 0 && (
        <div className="w-full mb-6">
          <h3 className="text-sm text-gray-500 uppercase mb-2">Best Possible Words</h3>
          <div className="flex flex-wrap gap-2">
            {bestWords.map((word) => (
              <span
                key={word}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm font-mono font-semibold px-3 py-1.5 rounded-lg"
              >
                {word} <span className="text-gray-500 text-xs">{word.length}L</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Running totals */}
      <h3 className="text-sm text-gray-500 uppercase mb-2">Standings</h3>
      <ScoreBoard players={players} scores={scores} />

      <div className="w-full mt-6">
        {isLastRound ? (
          <p className="text-center text-gray-400 text-sm animate-pulse">Final results coming...</p>
        ) : !iReady ? (
          <button
            onClick={handleReady}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition"
          >
            Ready for Next Round
          </button>
        ) : (
          <p className="text-center text-green-400 text-sm font-semibold animate-pulse">
            Waiting for others... ({readyCount}/{totalPlayers})
          </p>
        )}
      </div>
    </div>
  );
}
