import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import { launchConfetti } from '../../../lib/confetti.js';

function formatTime(ms) {
  if (ms == null) return '—';
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function ResultsScreen() {
  const { state, dispatch } = useGame();
  const {
    winner, scores, players, playerId, words,
    seriesWins, seriesLength, seriesOver, seriesWinner,
    recap, rematchVotes, playAgainVotes,
  } = state;
  const navigate = useNavigate();

  const me = players.find((p) => p.id === playerId);
  const opponent = players.find((p) => p.id !== playerId);
  const myScore = scores[playerId] || 0;
  const oppScore = opponent ? scores[opponent.id] || 0 : 0;

  const iWon = winner?.id === playerId;
  const tie = !winner;
  const iSeriesWinner = seriesWinner?.id === playerId;

  const canRematch = seriesOver || seriesLength === 1;
  const iVoted = rematchVotes.includes(playerId);
  const oppVoted = opponent && rematchVotes.includes(opponent.id);

  const iVotedNext = playAgainVotes.includes(playerId);
  const oppVotedNext = opponent && playAgainVotes.includes(opponent.id);

  // Staggered reveal
  const [showWords, setShowWords] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (iWon || iSeriesWinner) launchConfetti();
    const t1 = setTimeout(() => setShowWords(true), 400);
    const t2 = setTimeout(() => setShowStats(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [iWon, iSeriesWinner]);

  const handlePlayAgain = () => {
    getSocket().emit('room:playAgain');
    dispatch({ type: 'PLAY_AGAIN_VOTE', playerId });
  };

  const handleRematch = () => {
    getSocket().emit('room:rematch');
    dispatch({ type: 'REMATCH_VOTE', playerId });
  };

  const handleHome = () => {
    dispatch({ type: 'RESET' });
    sessionStorage.removeItem('wordrush_room');
    sessionStorage.removeItem('wordrush_name');
    navigate('/');
  };

  const myWordsFound = words.filter((w) => w.foundBy === playerId).length;
  const oppWordsFound = words.filter((w) => w.foundBy === opponent?.id).length;

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      {seriesOver && seriesLength > 1 ? (
        <>
          <h2 className={`text-4xl font-bold mb-1 ${iSeriesWinner ? 'animate-celebrate-pulse text-yellow-400' : 'text-white'}`}>
            {iSeriesWinner ? 'Series Winner!' : 'Series Over!'}
          </h2>
          <p className="text-gray-400 mb-4">
            {iSeriesWinner ? 'You won the series!' : `${seriesWinner?.name} wins the series!`}
          </p>
        </>
      ) : (
        <>
          <h2 className={`text-4xl font-bold mb-1 ${iWon ? 'animate-celebrate-pulse text-yellow-400' : tie ? 'text-gray-300' : 'text-red-400'}`}>
            {tie ? 'Tie Game!' : iWon ? 'You Win!' : 'You Lose!'}
          </h2>
          <p className="text-gray-400 mb-4">
            {tie ? 'Evenly matched!' : iWon ? 'Great word hunting!' : `${winner.name} found more words`}
          </p>
        </>
      )}

      {/* Score Cards */}
      <div className="flex gap-4 mb-4 w-full">
        <div className={`flex-1 rounded-xl p-3 text-center ${iWon ? 'bg-blue-900/60 ring-2 ring-blue-400' : 'bg-gray-800'}`}>
          <p className="text-xs text-gray-400">{me?.name || 'You'}</p>
          <p className="text-3xl font-black text-blue-400">{myScore}</p>
          <p className="text-xs text-gray-500">{myWordsFound} words</p>
        </div>
        <div className={`flex-1 rounded-xl p-3 text-center ${!tie && !iWon ? 'bg-orange-900/60 ring-2 ring-orange-400' : 'bg-gray-800'}`}>
          <p className="text-xs text-gray-400">{opponent?.name || 'Opponent'}</p>
          <p className="text-3xl font-black text-orange-400">{oppScore}</p>
          <p className="text-xs text-gray-500">{oppWordsFound} words</p>
        </div>
      </div>

      {/* Series Score */}
      {seriesLength > 1 && (
        <div className="w-full mb-4">
          <div className="flex justify-center gap-6 bg-gray-800 rounded-lg px-4 py-2">
            <div className="text-center">
              <p className="text-xs text-gray-400">{me?.name}</p>
              <p className="text-xl font-bold text-blue-400">{seriesWins[playerId] || 0}</p>
            </div>
            <div className="text-gray-500 text-xl font-bold self-center">—</div>
            <div className="text-center">
              <p className="text-xs text-gray-400">{opponent?.name}</p>
              <p className="text-xl font-bold text-orange-400">{opponent ? seriesWins[opponent.id] || 0 : 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Highlight Stats */}
      {showStats && recap && (
        <div className="flex gap-2 mb-4 w-full animate-fade-in">
          {recap.fastestFind && (
            <div className="flex-1 bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-yellow-500 uppercase font-bold">Fastest Find</p>
              <p className="text-sm font-bold text-yellow-300">{recap.fastestFind.word}</p>
              <p className="text-xs text-gray-400">
                {formatTime(recap.fastestFind.foundAtMs)} — {recap.fastestFind.foundBy === playerId ? me?.name : opponent?.name}
              </p>
            </div>
          )}
          <div className="flex-1 bg-purple-900/30 border border-purple-700/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-purple-500 uppercase font-bold">Powerups Used</p>
            <div className="flex justify-center gap-3 mt-1">
              <span className="text-sm font-bold text-blue-400">{recap.powerupsUsed[playerId] || 0}</span>
              <span className="text-gray-600">vs</span>
              <span className="text-sm font-bold text-orange-400">{opponent ? recap.powerupsUsed[opponent.id] || 0 : 0}</span>
            </div>
          </div>
          <div className="flex-1 bg-gray-800 border border-gray-700/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Duration</p>
            <p className="text-sm font-bold text-gray-300">{formatTime(recap.gameDuration)}</p>
          </div>
        </div>
      )}

      {/* Word-by-Word Breakdown */}
      {showWords && (
        <div className="w-full mb-4">
          <h3 className="text-xs text-gray-500 uppercase font-bold mb-2">Word Breakdown</h3>
          <div className="space-y-1">
            {(recap?.wordDetails || words).map((w, i) => {
              const isMe = w.foundBy === playerId;
              const isFastest = recap?.fastestFind?.word === w.word;
              return (
                <div
                  key={w.word}
                  className={`flex items-center justify-between px-3 py-1.5 rounded text-sm transition-all ${
                    isFastest ? 'bg-yellow-900/40 ring-1 ring-yellow-600' : 'bg-gray-800'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    {isFastest && <span className="text-yellow-400 text-xs">⚡</span>}
                    <span className="font-semibold">{w.word}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.foundAtMs != null && (
                      <span className="text-xs text-gray-500">{formatTime(w.foundAtMs)}</span>
                    )}
                    <span className={isMe ? 'text-blue-400 text-xs font-bold' : 'text-orange-400 text-xs font-bold'}>
                      {isMe ? me?.name : opponent?.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-2 w-full mt-auto">
        {oppVoted && !iVoted && (
          <p className="text-center text-green-400 text-sm font-bold animate-pulse">
            {opponent?.name} wants a rematch!
          </p>
        )}

        {canRematch && (
          <button
            onClick={handleRematch}
            disabled={iVoted}
            className={`font-semibold py-3 px-6 rounded-lg transition ${
              iVoted
                ? 'bg-green-800 text-green-300 cursor-wait'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {iVoted ? `Waiting for ${opponent?.name}...` : 'Rematch'}
          </button>
        )}

        {!seriesOver && seriesLength > 1 && (
          <>
            {oppVotedNext && !iVotedNext && (
              <p className="text-center text-blue-400 text-sm font-bold animate-pulse">
                {opponent?.name} is ready for the next game!
              </p>
            )}
            <button
              onClick={handlePlayAgain}
              disabled={iVotedNext}
              className={`font-semibold py-3 px-6 rounded-lg transition ${
                iVotedNext
                  ? 'bg-blue-800 text-blue-300 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {iVotedNext ? `Waiting for ${opponent?.name}...` : 'Next Game'}
            </button>
          </>
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
