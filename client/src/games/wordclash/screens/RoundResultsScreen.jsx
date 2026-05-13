import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import ScoreBoard from '../components/ScoreBoard.jsx';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Card from '../../../components/ui/Card.jsx';

export default function RoundResultsScreen() {
  const { state } = useGame();
  const {
    roundSubmissions,
    scores,
    players,
    playerId,
    currentRound,
    totalRounds,
    bestWords,
    readyPlayerIds,
    isLastRound,
  } = state;

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
      <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-ink mb-1">
        Round {currentRound} Results
      </h2>
      <p className="text-ink-soft text-sm font-sans mb-6">
        {totalRounds - currentRound} round{totalRounds - currentRound !== 1 ? 's' : ''} remaining
      </p>

      {/* All players' words */}
      <div className="w-full space-y-2 mb-6">
        {sorted.map((sub) => {
          const player = players.find((p) => p.id === sub.playerId);
          if (!player) return null;
          const isMe = sub.playerId === playerId;
          const isHighest = sub.score === highestScore && sub.score > 0;

          return (
            <Card
              key={sub.playerId}
              className={`!p-3 flex items-center gap-3 ${
                isHighest ? 'ring-2 ring-accent-orange' : ''
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                style={{ backgroundColor: player.color }}
              >
                {player.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-ink">{isMe ? 'You' : player.name}</span>
                  {isHighest && (
                    <span className="text-accent-orange text-xs font-bold font-sans uppercase tracking-wider">
                      Best
                    </span>
                  )}
                </div>
                <p
                  className="text-lg font-display font-bold tracking-wider uppercase truncate"
                  style={{ color: player.color }}
                >
                  {sub.word || (
                    <span className="text-ink-muted italic text-sm normal-case">no word</span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-display font-bold" style={{ color: player.color }}>
                  +{sub.score}
                </p>
                {sub.word && (
                  <p className="text-xs text-ink-muted font-sans">{sub.word.length} letters</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Best possible words */}
      {bestWords.length > 0 && (
        <div className="w-full mb-6">
          <h3 className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider mb-2">
            Best Possible Words
          </h3>
          <div className="flex flex-wrap gap-2">
            {bestWords.map((word) => (
              <span
                key={word}
                className="bg-tile-face shadow-tile text-ink text-sm font-display font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl"
              >
                {word}{' '}
                <span className="text-ink-muted text-xs font-sans normal-case tracking-normal">
                  {word.length}L
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Running totals */}
      <h3 className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider mb-2">
        Standings
      </h3>
      <ScoreBoard players={players} scores={scores} />

      <div className="w-full mt-6">
        {isLastRound ? (
          <p className="text-center text-ink-soft text-sm font-sans font-bold animate-pulse">
            Final results coming...
          </p>
        ) : !iReady ? (
          <ChunkyButton onClick={handleReady} variant="green" size="lg" className="w-full">
            Ready for Next Round
          </ChunkyButton>
        ) : (
          <p className="text-center text-accent-green text-sm font-display font-bold uppercase tracking-wider animate-pulse">
            Waiting for others... ({readyCount}/{totalPlayers})
          </p>
        )}
      </div>
    </div>
  );
}
