import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import ScoreBoard from '../components/ScoreBoard.jsx';

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h2 className="text-4xl font-bold mb-2">
        {tie ? 'Tie Game!' : iWon ? 'You Win!' : 'Game Over!'}
      </h2>
      <p className="text-gray-400 mb-6">
        {tie
          ? 'Evenly matched!'
          : iWon
            ? 'Great word building!'
            : `${winner.name} wins!`}
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
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 ring-2 ring-yellow-400"
                  style={{ backgroundColor: winnerPlayer.color }}
                >
                  {winnerPlayer.name[0].toUpperCase()}
                </div>
                <span className="font-bold text-lg">{winnerPlayer.name}</span>
                <span className="text-2xl font-bold text-yellow-400">{scores[winner.id] || 0} pts</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Final rankings */}
      <h3 className="text-sm text-gray-500 uppercase mb-2">Final Rankings</h3>
      <ScoreBoard players={players} scores={scores} />

      {/* Actions */}
      <div className="flex flex-col gap-2 w-full max-w-xs mt-6">
        {isHost && (
          <button
            onClick={handlePlayAgain}
            className="bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Play Again
          </button>
        )}
        <button
          onClick={handleBackToGames}
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Back to Games
        </button>
      </div>
    </div>
  );
}
