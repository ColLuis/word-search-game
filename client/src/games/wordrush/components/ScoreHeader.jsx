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

  const tierSeconds = finalCountdown % 10 || 10;
  const isCritical = finalCountdownPoints <= 2;
  const isLastPoint = finalCountdownPoints <= 1;

  return (
    <div className="flex flex-col items-center mb-2 w-full gap-1">
      <div className={`flex items-center justify-between px-4 py-2 rounded-lg w-full transition-all duration-300 ${
        showCountdown
          ? isCritical
            ? 'bg-red-900/80 ring-1 ring-red-500/50'
            : 'bg-yellow-900/60 ring-1 ring-yellow-500/30'
          : 'bg-gray-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-semibold text-sm">{me?.name || 'You'}</span>
          <span className="text-xl font-bold text-blue-400 score-pop">{myScore}</span>
        </div>
        <span className={`text-sm font-bold ${showCountdown ? 'text-red-400' : 'text-gray-500'}`}>
          {wordsRemaining} left
        </span>
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
        <div className={`w-full rounded-lg px-3 py-2 ${
          isLastPoint
            ? 'bg-red-900/60 animate-urgency-critical'
            : isCritical
              ? 'bg-red-900/40 animate-urgency'
              : 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 animate-urgency'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-extrabold tracking-wide ${
              isLastPoint ? 'text-red-400' : isCritical ? 'text-red-300' : 'text-yellow-300'
            }`}>
              LAST WORD!
            </span>
            <span className={`text-lg font-black tabular-nums ${
              isLastPoint ? 'text-red-400' : isCritical ? 'text-orange-400' : 'text-green-400'
            }`}>
              +{finalCountdownPoints}pt
            </span>
          </div>

          {/* Timer bar */}
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isLastPoint ? 'bg-red-500' : isCritical ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${(tierSeconds / 10) * 100}%` }}
            />
          </div>

          <p className={`text-xs font-bold mt-1 text-center ${
            isLastPoint ? 'text-red-400' : isCritical ? 'text-orange-300' : 'text-yellow-200'
          }`}>
            {isLastPoint
              ? 'Hurry — minimum points!'
              : `${tierSeconds}s until points drop`}
          </p>
        </div>
      )}
    </div>
  );
}
