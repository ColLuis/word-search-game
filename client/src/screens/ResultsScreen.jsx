import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';

export default function ResultsScreen() {
  const { state, dispatch } = useGame();
  const { winner, scores, players, playerId, words, seriesWins, seriesLength, seriesOver, seriesWinner } = state;

  const me = players.find((p) => p.id === playerId);
  const opponent = players.find((p) => p.id !== playerId);
  const myScore = scores[playerId] || 0;
  const oppScore = opponent ? scores[opponent.id] || 0 : 0;

  const iWon = winner?.id === playerId;
  const tie = !winner;

  const handlePlayAgain = () => {
    getSocket().emit('room:playAgain');
  };

  const handleHome = () => {
    dispatch({ type: 'RESET' });
    sessionStorage.removeItem('wordrush_room');
    sessionStorage.removeItem('wordrush_name');
  };

  const iSeriesWinner = seriesWinner?.id === playerId;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {seriesOver && seriesLength > 1 ? (
        <>
          <h2 className="text-4xl font-bold mb-2">
            {iSeriesWinner ? 'Series Winner!' : 'Series Over!'}
          </h2>
          <p className="text-gray-400 mb-6">
            {iSeriesWinner ? 'You won the series!' : `${seriesWinner?.name} wins the series!`}
          </p>
        </>
      ) : (
        <>
          <h2 className="text-4xl font-bold mb-2">
            {tie ? 'Tie Game!' : iWon ? 'You Win!' : 'You Lose!'}
          </h2>
          <p className="text-gray-400 mb-6">
            {tie
              ? 'Evenly matched!'
              : iWon
              ? 'Great word hunting!'
              : `${winner.name} found more words`}
          </p>
        </>
      )}

      <div className="flex gap-8 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-400">{me?.name || 'You'}</p>
          <p className="text-3xl font-bold text-blue-400">{myScore}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">{opponent?.name || 'Opponent'}</p>
          <p className="text-3xl font-bold text-orange-400">{oppScore}</p>
        </div>
      </div>

      {seriesLength > 1 && (
        <div className="w-full max-w-xs mb-4">
          <h3 className="text-sm text-gray-500 mb-2">Series Score</h3>
          <div className="flex justify-center gap-6 bg-gray-800 rounded-lg px-4 py-3">
            <div className="text-center">
              <p className="text-xs text-gray-400">{me?.name || 'You'}</p>
              <p className="text-2xl font-bold text-blue-400">{seriesWins[playerId] || 0}</p>
            </div>
            <div className="text-center text-gray-500 text-2xl font-bold self-end">-</div>
            <div className="text-center">
              <p className="text-xs text-gray-400">{opponent?.name || 'Opponent'}</p>
              <p className="text-2xl font-bold text-orange-400">{opponent ? seriesWins[opponent.id] || 0 : 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-xs mb-6">
        <h3 className="text-sm text-gray-500 mb-2">Word Tally</h3>
        <div className="space-y-1">
          {words.map((w) => (
            <div key={w.word} className="flex items-center justify-between bg-gray-800 px-3 py-1 rounded text-sm">
              <span>{w.word}</span>
              <span className={w.foundBy === playerId ? 'text-blue-400' : 'text-orange-400'}>
                {w.foundBy === playerId ? me?.name : opponent?.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        {!seriesOver && (
          <button
            onClick={handlePlayAgain}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            {seriesLength > 1 ? 'Next Game' : 'Play Again'}
          </button>
        )}
        <button
          onClick={handleHome}
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Home
        </button>
      </div>
    </div>
  );
}
