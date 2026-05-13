import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import TutorialOverlay from '../../../components/TutorialOverlay.jsx';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Card from '../../../components/ui/Card.jsx';

export default function LobbyScreen() {
  const { state } = useGame();
  const { roomCode, players, category, seriesLength, seriesWins } = state;

  const handleReady = () => {
    getSocket().emit('player:ready');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const me = players.find((p) => p.id === state.playerId);
  const opponent = players.find((p) => p.id !== state.playerId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6">
      <TutorialOverlay game="wordrush" />
      <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-ink mb-1">
        Lobby
      </h2>
      <p className="text-ink-soft font-sans font-bold mb-1">Category: {category}</p>
      <p className="text-ink-muted font-sans text-sm mb-4">
        {seriesLength > 1 ? `Best of ${seriesLength}` : 'Single Game'}
      </p>

      {seriesLength > 1 &&
        me &&
        opponent &&
        (seriesWins[me.id] > 0 || seriesWins[opponent.id] > 0) && (
          <div className="flex gap-4 mb-4 text-sm font-display font-bold">
            <span className="text-accent-green">
              {me.name}: {seriesWins[me.id] || 0}
            </span>
            <span className="text-ink-muted">-</span>
            <span className="text-accent-orange">
              {opponent.name}: {seriesWins[opponent.id] || 0}
            </span>
          </div>
        )}

      <div className="flex items-center gap-2 mb-6">
        <span className="bg-tile-face shadow-tile rounded-xl px-5 py-3 text-2xl font-display font-bold tracking-[0.3em] text-ink">
          {roomCode}
        </span>
        <ChunkyButton onClick={handleCopy} variant="neutral" size="sm">
          Copy
        </ChunkyButton>
      </div>

      <div className="w-full max-w-xs space-y-3 mb-6">
        <PlayerSlot player={me} label="You" />
        <PlayerSlot player={opponent} label="Opponent" />
      </div>

      {players.length < 2 && (
        <p className="text-ink-muted text-sm font-sans font-bold mb-4">
          Waiting for opponent to join...
        </p>
      )}

      {players.length === 2 && me && !me.ready && (
        <ChunkyButton onClick={handleReady} variant="green" size="lg">
          Ready!
        </ChunkyButton>
      )}

      {me?.ready && (
        <p className="text-accent-green text-sm font-display font-bold uppercase tracking-wider">
          {opponent?.ready ? 'Starting...' : 'Waiting for opponent...'}
        </p>
      )}
    </div>
  );
}

function PlayerSlot({ player, label }) {
  return (
    <Card className="!p-3 flex items-center justify-between">
      <div>
        <span className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider">
          {label}
        </span>
        <p className="font-display font-bold text-ink text-lg">{player?.name || '---'}</p>
      </div>
      {player?.ready && (
        <span className="bg-accent-green text-white text-xs font-display font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Ready
        </span>
      )}
    </Card>
  );
}
