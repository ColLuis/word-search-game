import { useState } from 'react';
import { LEAFLINE_EVENTS as E, MIN_PLAYERS, MAX_PLAYERS } from 'shared/leafline.js';
import TutorialOverlay from '../../../components/TutorialOverlay.jsx';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Card from '../../../components/ui/Card.jsx';
import { Avatar } from '../components/Chrome.jsx';

export default function LobbyScreen({ room, playerId, send, leave }) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === playerId;
  const connected = room.players.filter((p) => p.connected);
  const canStart = connected.length >= MIN_PLAYERS;

  const copyInvite = () => {
    const link = `${window.location.origin}/wordlink?room=${room.code}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6">
      <TutorialOverlay game="leafline" />
      <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-ink mb-4">
        Lobby
      </h2>

      <div className="flex items-center gap-2 mb-6">
        <span className="bg-tile-face shadow-tile rounded-xl px-5 py-3 text-2xl font-display font-bold tracking-[0.3em] text-ink">
          {room.code}
        </span>
        <ChunkyButton onClick={copyInvite} variant="neutral" size="sm">
          {copied ? 'Copied!' : 'Copy link'}
        </ChunkyButton>
      </div>

      <div className="w-full max-w-xs space-y-2 mb-6">
        {room.players.map((p) => (
          <Card
            key={p.id}
            className={`!p-3 flex items-center gap-3 ${p.connected ? '' : 'opacity-50'}`}
          >
            <Avatar player={p} />
            <span className="font-bold text-ink flex-1 truncate">{p.name}</span>
            {!p.connected && (
              <span className="text-xs font-sans font-bold text-ink-muted">Away</span>
            )}
            {p.id === room.hostId && (
              <span className="text-xs font-bold font-sans uppercase tracking-wider text-accent-orange bg-accent-orange/15 px-2 py-0.5 rounded-full">
                Host
              </span>
            )}
            {p.id === playerId && p.id !== room.hostId && (
              <span className="text-xs font-sans font-bold text-ink-muted">You</span>
            )}
            {isHost && p.id !== playerId && (
              <button
                onClick={() => send(E.ROOM_KICK, { playerId: p.id })}
                className="text-ink-muted hover:text-accent-red text-lg leading-none px-1 transition"
                title={`Remove ${p.name}`}
              >
                ×
              </button>
            )}
          </Card>
        ))}
        {room.players.length < MAX_PLAYERS && (
          <div className="rounded-2xl px-4 py-3 text-center text-ink-muted text-sm font-sans border-2 border-dashed border-ink-muted/40">
            {canStart
              ? 'Room for more — up to 6'
              : `Waiting for players… (${connected.length}/${MIN_PLAYERS})`}
          </div>
        )}
      </div>

      {isHost ? (
        <ChunkyButton
          onClick={() => send(E.GAME_START)}
          disabled={!canStart}
          variant="green"
          size="lg"
          className="w-full max-w-xs"
        >
          {canStart ? 'Start Game' : `Need ${MIN_PLAYERS}+ players`}
        </ChunkyButton>
      ) : (
        <p className="text-ink-muted text-sm font-sans font-bold">Waiting for host to start...</p>
      )}

      <button
        onClick={leave}
        className="mt-6 text-ink-soft hover:text-ink text-sm font-sans font-bold transition"
      >
        Leave room
      </button>
    </div>
  );
}
