import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import TutorialOverlay from '../../../components/TutorialOverlay.jsx';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Card from '../../../components/ui/Card.jsx';

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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6">
      <TutorialOverlay game="wordclash" />
      <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-ink mb-4">
        Lobby
      </h2>

      <div className="flex items-center gap-2 mb-6">
        <span className="bg-tile-face shadow-tile rounded-xl px-5 py-3 text-2xl font-display font-bold tracking-[0.3em] text-ink">
          {roomCode}
        </span>
        <ChunkyButton onClick={handleCopy} variant="neutral" size="sm">
          Copy
        </ChunkyButton>
      </div>

      <div className="w-full max-w-xs space-y-2 mb-6">
        {players.map((p) => (
          <Card key={p.id} className="!p-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: p.color }}
            >
              {p.name[0].toUpperCase()}
            </div>
            <span className="font-bold text-ink flex-1">{p.name}</span>
            {p.id === hostId && (
              <span className="text-xs font-bold font-sans uppercase tracking-wider text-accent-orange bg-accent-orange/15 px-2 py-0.5 rounded-full">
                Host
              </span>
            )}
            {p.id === playerId && p.id !== hostId && (
              <span className="text-xs font-sans font-bold text-ink-muted">You</span>
            )}
          </Card>
        ))}
        {players.length < 4 && (
          <div className="rounded-2xl px-4 py-3 text-center text-ink-muted text-sm font-sans border-2 border-dashed border-ink-muted/40">
            Waiting for players...
          </div>
        )}
      </div>

      {isHost && (
        <div className="w-full max-w-xs space-y-4 mb-6">
          <div>
            <label className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider mb-2 block">
              Rounds
            </label>
            <div className="flex gap-2">
              {ROUND_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSettingsChange({ totalRounds: r })}
                  className={`flex-1 py-2 rounded-xl text-sm font-display font-bold transition ${
                    totalRounds === r
                      ? 'bg-accent-orange text-white shadow-tile'
                      : 'bg-surface text-ink-soft hover:bg-surface-sunken'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-sans font-bold text-ink-muted uppercase tracking-wider mb-2 block">
              Timer
            </label>
            <div className="flex gap-2">
              {TIMER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => handleSettingsChange({ roundTimeSeconds: t })}
                  className={`flex-1 py-2 rounded-xl text-sm font-display font-bold transition ${
                    roundTimeSeconds === t
                      ? 'bg-accent-orange text-white shadow-tile'
                      : 'bg-surface text-ink-soft hover:bg-surface-sunken'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          <ChunkyButton
            onClick={handleStart}
            disabled={players.length < 2}
            variant="green"
            size="lg"
            className="w-full"
          >
            Start Game
          </ChunkyButton>
        </div>
      )}

      {!isHost && (
        <p className="text-ink-muted text-sm font-sans font-bold">Waiting for host to start...</p>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-accent-red text-white px-4 py-2 rounded-xl shadow-card font-sans font-bold">
          {toast}
        </div>
      )}
    </div>
  );
}
