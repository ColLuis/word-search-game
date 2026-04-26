import { useGame } from '../context/GameContext.jsx';

const MULTIPLIER_LABELS = {
  2: 'Double points!',
  3: 'Triple points!',
};

export default function ScoreHeader() {
  const { state } = useGame();
  const { players, scores, playerId, multiplier, words } = state;

  const me = players.find((p) => p.id === playerId);
  const opponent = players.find((p) => p.id !== playerId);

  const myScore = scores[playerId] || 0;
  const oppScore = opponent ? scores[opponent.id] || 0 : 0;

  const wordsRemaining = words.filter((w) => !w.found).length;

  return (
    <div className="flex flex-col items-center mb-2 w-full gap-1">
      <div className="flex items-center justify-between px-4 py-2 rounded-lg w-full bg-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-semibold text-sm">{me?.name || 'You'}</span>
          <span className="text-xl font-bold text-blue-400 score-pop">{myScore}</span>
        </div>
        <span className="text-sm font-bold text-gray-500">{wordsRemaining} left</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-orange-400 score-pop">{oppScore}</span>
          <span className="font-semibold text-sm">{opponent?.name || '---'}</span>
          <div className="w-3 h-3 rounded-full bg-orange-500" />
        </div>
      </div>

      {multiplier > 1 && (
        <span className="text-xs font-bold text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-full animate-pulse">
          {MULTIPLIER_LABELS[multiplier] || `${multiplier}x points!`}
        </span>
      )}
    </div>
  );
}
