import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';

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
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h2 className="text-2xl font-bold mb-1">Lobby</h2>
      <p className="text-gray-400 mb-1">Category: {category}</p>
      <p className="text-gray-400 mb-4 text-sm">
        {seriesLength > 1 ? `Best of ${seriesLength}` : 'Single Game'}
      </p>

      {seriesLength > 1 && me && opponent && (seriesWins[me.id] > 0 || seriesWins[opponent.id] > 0) && (
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-blue-400">{me.name}: {seriesWins[me.id] || 0}</span>
          <span className="text-gray-500">-</span>
          <span className="text-orange-400">{opponent.name}: {seriesWins[opponent.id] || 0}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <span className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-2xl font-mono tracking-[0.3em]">
          {roomCode}
        </span>
        <button
          onClick={handleCopy}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition"
        >
          Copy
        </button>
      </div>

      <div className="w-full max-w-xs space-y-3 mb-6">
        <PlayerSlot player={me} label="You" />
        <PlayerSlot player={opponent} label="Opponent" />
      </div>

      {players.length < 2 && (
        <p className="text-gray-500 text-sm mb-4">Waiting for opponent to join...</p>
      )}

      {players.length === 2 && me && !me.ready && (
        <button
          onClick={handleReady}
          className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-8 rounded-lg transition"
        >
          Ready!
        </button>
      )}

      {me?.ready && (
        <p className="text-green-400 text-sm">
          {opponent?.ready ? 'Starting...' : 'Waiting for opponent...'}
        </p>
      )}
    </div>
  );
}

function PlayerSlot({ player, label }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between">
      <div>
        <span className="text-xs text-gray-500 uppercase">{label}</span>
        <p className="font-semibold">{player?.name || '---'}</p>
      </div>
      {player?.ready && (
        <span className="bg-green-600 text-xs px-2 py-1 rounded-full">Ready</span>
      )}
    </div>
  );
}
