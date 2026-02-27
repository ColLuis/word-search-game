import { useGame } from '../context/GameContext.jsx';

export default function ScoreHeader() {
  const { state } = useGame();
  const { players, scores, playerId } = state;

  const me = players.find((p) => p.id === playerId);
  const opponent = players.find((p) => p.id !== playerId);

  const myScore = scores[playerId] || 0;
  const oppScore = opponent ? scores[opponent.id] || 0 : 0;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-lg mb-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="font-semibold text-sm">{me?.name || 'You'}</span>
        <span className="text-xl font-bold text-blue-400 score-pop">{myScore}</span>
      </div>
      <span className="text-gray-500 text-sm">vs</span>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-orange-400 score-pop">{oppScore}</span>
        <span className="font-semibold text-sm">{opponent?.name || '---'}</span>
        <div className="w-3 h-3 rounded-full bg-orange-500" />
      </div>
    </div>
  );
}
