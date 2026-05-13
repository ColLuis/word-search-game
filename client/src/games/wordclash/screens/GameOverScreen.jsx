import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import ScoreBoard from '../components/ScoreBoard.jsx';
import { launchConfetti } from '../../../lib/confetti.js';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';

export default function GameOverScreen() {
  const { state, dispatch } = useGame();
  const { winner, scores, players, playerId, hostId } = state;
  const navigate = useNavigate();

  const isHost = playerId === hostId;
  const iWon = winner?.id === playerId;
  const tie = !winner;

  const handlePlayAgain = () => {
    getSocket().emit('room:playAgain');
  };

  const handleBackToGames = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  useEffect(() => {
    if (iWon) launchConfetti();
  }, [iWon]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6">
      <h2
        className={`font-display text-4xl font-bold uppercase tracking-wider text-ink mb-2 ${
          iWon ? 'animate-celebrate-pulse' : ''
        }`}
      >
        {tie ? 'Tie Game!' : iWon ? 'You Win!' : 'Game Over!'}
      </h2>
      <p className="text-ink-soft font-sans mb-6">
        {tie ? 'Evenly matched!' : iWon ? 'Great word building!' : `${winner.name} wins!`}
      </p>

      {/* Winner highlight */}
      {winner && (
        <div className="mb-6 text-center">
          {(() => {
            const winnerPlayer = players.find((p) => p.id === winner.id);
            if (!winnerPlayer) return null;
            return (
              <div className="inline-flex flex-col items-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-bold mb-3 ring-4 ring-accent-orange text-white"
                  style={{ backgroundColor: winnerPlayer.color }}
                >
                  {winnerPlayer.name[0].toUpperCase()}
                </div>
                <span className="font-display font-bold text-lg text-ink">{winnerPlayer.name}</span>
                <span className="text-3xl font-display font-bold text-accent-orange">
                  {scores[winner.id] || 0} pts
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Final rankings */}
      <h3 className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider mb-2">
        Final Rankings
      </h3>
      <ScoreBoard players={players} scores={scores} />

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
        {isHost && (
          <ChunkyButton onClick={handlePlayAgain} variant="orange" size="lg">
            Play Again
          </ChunkyButton>
        )}
        <ChunkyButton onClick={handleBackToGames} variant="neutral" size="lg">
          Back to Games
        </ChunkyButton>
      </div>
    </div>
  );
}
