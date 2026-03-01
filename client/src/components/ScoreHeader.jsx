import { useGame } from '../context/GameContext.jsx';

const MULTIPLIER_LABELS = {
  2: 'Double points!',
  3: 'Triple points!',
};

export default function ScoreHeader() {
  const { state } = useGame();
  const { players, scores, playerId, multiplier, finalCountdown, finalCountdownPoints, words } = state;

  const me = players.find((p) => p.id === playerId);
  const opponent = players.find((p) => p.id !== playerId);

  const myScore = scores[playerId] || 0;
  const oppScore = opponent ? scores[opponent.id] || 0 : 0;

  const wordsRemaining = words.filter((w) => !w.found).length;
  const showCountdown = finalCountdown !== null && finalCountdown !== undefined;
  const showMultiplier = !showCountdown && multiplier > 1;

  return (
    <div className="flex flex-col items-center mb-2 w-full gap-1">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-lg w-full">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-semibold text-sm">{me?.name || 'You'}</span>
          <span className="text-xl font-bold text-blue-400 score-pop">{myScore}</span>
        </div>
        <span className="text-gray-500 text-sm">{wordsRemaining} left</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-orange-400 score-pop">{oppScore}</span>
          <span className="font-semibold text-sm">{opponent?.name || '---'}</span>
          <div className="w-3 h-3 rounded-full bg-orange-500" />
        </div>
      </div>

      {showMultiplier && (
        <span className="text-xs font-bold text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-full animate-pulse">
          {MULTIPLIER_LABELS[multiplier] || `${multiplier}x points!`}
        </span>
      )}

      {showCountdown && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-red-400 animate-pulse">
            One word remaining!
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            finalCountdownPoints >= 4 ? 'text-green-400 bg-green-400/20' :
            finalCountdownPoints >= 2 ? 'text-yellow-400 bg-yellow-400/20' :
            'text-red-400 bg-red-400/20'
          }`}>
            {finalCountdownPoints}pts — {finalCountdown}s
          </span>
        </div>
      )}
    </div>
  );
}
