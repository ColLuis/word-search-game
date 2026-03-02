import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';

const ROUND_OPTIONS = [3, 5, 7];
const TIMER_OPTIONS = [30, 60, 90];

export default function LobbyScreen() {
  const { state } = useGame();
  const { roomCode, players, hostId, playerId, totalRounds, roundTimeSeconds, toast } = state;

  const isHost = playerId === hostId;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const handleSettingsChange = (settings) => {
    getSocket().emit('room:settings', settings);
  };

  const handleStart = () => {
    getSocket().emit('game:start');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h2 className="text-2xl font-bold mb-4">Lobby</h2>

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

      <div className="w-full max-w-xs space-y-2 mb-6">
        {players.map((p) => (
          <div
            key={p.id}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: p.color }}
            >
              {p.name[0].toUpperCase()}
            </div>
            <span className="font-semibold flex-1">{p.name}</span>
            {p.id === hostId && (
              <span className="text-xs text-orange-400 bg-orange-400/20 px-2 py-0.5 rounded-full">Host</span>
            )}
            {p.id === playerId && (
              <span className="text-xs text-gray-500">You</span>
            )}
          </div>
        ))}
        {players.length < 4 && (
          <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-lg px-4 py-3 text-center text-gray-500 text-sm">
            Waiting for players...
          </div>
        )}
      </div>

      {isHost && (
        <div className="w-full max-w-xs space-y-3 mb-6">
          <div>
            <label className="text-xs text-gray-500 uppercase mb-1 block">Rounds</label>
            <div className="flex gap-2">
              {ROUND_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSettingsChange({ totalRounds: r })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    totalRounds === r
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase mb-1 block">Timer (seconds)</label>
            <div className="flex gap-2">
              {TIMER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => handleSettingsChange({ roundTimeSeconds: t })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    roundTimeSeconds === t
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={players.length < 2}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition"
          >
            Start Game
          </button>
        </div>
      )}

      {!isHost && (
        <p className="text-gray-500 text-sm">Waiting for host to start...</p>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
