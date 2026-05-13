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
    <div className="flex flex-col items-center mb-2 w-full max-w-[min(90vw,500px)] gap-1">
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl w-full bg-surface shadow-card">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-green" />
          <span className="font-bold text-sm text-ink">{me?.name || 'You'}</span>
          <span className="text-xl font-display font-bold text-accent-green score-pop">
            {myScore}
          </span>
        </div>
        <span className="text-xs font-display font-bold text-ink-muted uppercase tracking-wider">
          {wordsRemaining} left
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-accent-orange score-pop">
            {oppScore}
          </span>
          <span className="font-bold text-sm text-ink">{opponent?.name || '---'}</span>
          <div className="w-3 h-3 rounded-full bg-accent-orange" />
        </div>
      </div>

      {multiplier > 1 && (
        <span className="text-xs font-display font-bold uppercase tracking-wider text-accent-orange bg-accent-orange/15 px-3 py-1 rounded-full animate-pulse">
          {MULTIPLIER_LABELS[multiplier] || `${multiplier}x points!`}
        </span>
      )}
    </div>
  );
}
