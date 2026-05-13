import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import { launchConfetti } from '../../../lib/confetti.js';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Card from '../../../components/ui/Card.jsx';

function formatTime(ms) {
  if (ms == null) return '—';
  const s = ms / 1000;
  return s < 60
    ? `${s.toFixed(1)}s`
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function ResultsScreen() {
  const { state, dispatch } = useGame();
  const {
    winner,
    scores,
    players,
    playerId,
    words,
    seriesWins,
    seriesLength,
    seriesOver,
    seriesWinner,
    recap,
    rematchVotes,
    playAgainVotes,
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
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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

  const headlineClasses = 'font-display text-4xl font-bold uppercase tracking-wider mb-1';

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      {seriesOver && seriesLength > 1 ? (
        <>
          <h2
            className={`${headlineClasses} ${iSeriesWinner ? 'animate-celebrate-pulse text-accent-orange' : 'text-ink'}`}
          >
            {iSeriesWinner ? 'Series Winner!' : 'Series Over!'}
          </h2>
          <p className="text-ink-soft font-sans mb-4">
            {iSeriesWinner ? 'You won the series!' : `${seriesWinner?.name} wins the series!`}
          </p>
        </>
      ) : (
        <>
          <h2
            className={`${headlineClasses} ${iWon ? 'animate-celebrate-pulse text-accent-orange' : tie ? 'text-ink' : 'text-accent-red'}`}
          >
            {tie ? 'Tie Game!' : iWon ? 'You Win!' : 'You Lose!'}
          </h2>
          <p className="text-ink-soft font-sans mb-4">
            {tie
              ? 'Evenly matched!'
              : iWon
                ? 'Great word hunting!'
                : `${winner.name} found more words`}
          </p>
        </>
      )}

      {/* Score Cards */}
      <div className="flex gap-3 mb-4 w-full">
        <div
          className={`flex-1 rounded-2xl p-4 text-center bg-surface ${iWon ? 'ring-4 ring-accent-green' : ''}`}
        >
          <p className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider">
            {me?.name || 'You'}
          </p>
          <p className="text-4xl font-display font-bold text-accent-green">{myScore}</p>
          <p className="text-xs text-ink-muted font-sans">{myWordsFound} words</p>
        </div>
        <div
          className={`flex-1 rounded-2xl p-4 text-center bg-surface ${!tie && !iWon ? 'ring-4 ring-accent-orange' : ''}`}
        >
          <p className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider">
            {opponent?.name || 'Opponent'}
          </p>
          <p className="text-4xl font-display font-bold text-accent-orange">{oppScore}</p>
          <p className="text-xs text-ink-muted font-sans">{oppWordsFound} words</p>
        </div>
      </div>

      {/* Series Score */}
      {seriesLength > 1 && (
        <div className="w-full mb-4">
          <div className="flex justify-center gap-6 bg-surface rounded-2xl px-4 py-2">
            <div className="text-center">
              <p className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider">
                {me?.name}
              </p>
              <p className="text-2xl font-display font-bold text-accent-green">
                {seriesWins[playerId] || 0}
              </p>
            </div>
            <div className="text-ink-muted text-xl font-display font-bold self-center">—</div>
            <div className="text-center">
              <p className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider">
                {opponent?.name}
              </p>
              <p className="text-2xl font-display font-bold text-accent-orange">
                {opponent ? seriesWins[opponent.id] || 0 : 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Highlight Stats */}
      {showStats && recap && (
        <div className="flex gap-2 mb-4 w-full animate-fade-in">
          {recap.fastestFind && (
            <Card variant="teal" className="flex-1 !p-2 text-center">
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider opacity-80">
                Fastest Find
              </p>
              <p className="text-sm font-display font-bold uppercase">{recap.fastestFind.word}</p>
              <p className="text-xs opacity-80 font-sans">
                {formatTime(recap.fastestFind.foundAtMs)} —{' '}
                {recap.fastestFind.foundBy === playerId ? me?.name : opponent?.name}
              </p>
            </Card>
          )}
          <Card className="flex-1 !p-2 text-center">
            <p className="text-[10px] font-sans font-bold text-ink-muted uppercase tracking-wider">
              Powerups Used
            </p>
            <div className="flex justify-center gap-3 mt-1">
              <span className="text-sm font-display font-bold text-accent-green">
                {recap.powerupsUsed[playerId] || 0}
              </span>
              <span className="text-ink-muted">vs</span>
              <span className="text-sm font-display font-bold text-accent-orange">
                {opponent ? recap.powerupsUsed[opponent.id] || 0 : 0}
              </span>
            </div>
          </Card>
          <Card className="flex-1 !p-2 text-center">
            <p className="text-[10px] font-sans font-bold text-ink-muted uppercase tracking-wider">
              Duration
            </p>
            <p className="text-sm font-display font-bold text-ink">
              {formatTime(recap.gameDuration)}
            </p>
          </Card>
        </div>
      )}

      {/* Word-by-Word Breakdown */}
      {showWords && (
        <div className="w-full mb-4">
          <h3 className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider mb-2">
            Word Breakdown
          </h3>
          <div className="space-y-1">
            {(recap?.wordDetails || words).map((w, i) => {
              const isMe = w.foundBy === playerId;
              const isFastest = recap?.fastestFind?.word === w.word;
              return (
                <div
                  key={w.word}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                    isFastest ? 'bg-accent-orange/15 ring-2 ring-accent-orange' : 'bg-surface'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    {isFastest && <span className="text-accent-orange text-sm">⚡</span>}
                    <span className="font-display font-bold uppercase tracking-wider text-ink">
                      {w.word}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.foundAtMs != null && (
                      <span className="text-xs text-ink-muted font-sans">
                        {formatTime(w.foundAtMs)}
                      </span>
                    )}
                    <span
                      className={`text-xs font-display font-bold uppercase tracking-wider ${
                        isMe ? 'text-accent-green' : 'text-accent-orange'
                      }`}
                    >
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
          <p className="text-center text-accent-green text-sm font-display font-bold uppercase tracking-wider animate-pulse">
            {opponent?.name} wants a rematch!
          </p>
        )}

        {canRematch && (
          <ChunkyButton
            onClick={handleRematch}
            disabled={iVoted}
            variant={iVoted ? 'neutral' : 'green'}
            size="lg"
          >
            {iVoted ? `Waiting for ${opponent?.name}...` : 'Rematch'}
          </ChunkyButton>
        )}

        {!seriesOver && seriesLength > 1 && (
          <>
            {oppVotedNext && !iVotedNext && (
              <p className="text-center text-accent-green text-sm font-display font-bold uppercase tracking-wider animate-pulse">
                {opponent?.name} is ready for the next game!
              </p>
            )}
            <ChunkyButton
              onClick={handlePlayAgain}
              disabled={iVotedNext}
              variant={iVotedNext ? 'neutral' : 'orange'}
              size="lg"
            >
              {iVotedNext ? `Waiting for ${opponent?.name}...` : 'Next Game'}
            </ChunkyButton>
          </>
        )}

        <ChunkyButton onClick={handleHome} variant="neutral" size="lg">
          Home
        </ChunkyButton>
      </div>
    </div>
  );
}
