import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LEAFLINE_EVENTS as E, POINTS_FIRST_TRY, getRatingBand } from 'shared/leafline.js';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Card from '../../../components/ui/Card.jsx';
import Tile from '../../../components/ui/Tile.jsx';
import { PlayerChips } from '../components/Chrome.jsx';
import { launchConfetti } from '../../../lib/confetti.js';
import { playGameWin } from '../../../lib/sounds.js';

const BAND_NOTE = {
  'Warming up': 'Every team starts somewhere.',
  'In sync': 'You were on the same wavelength.',
  'Mind meld': 'Practically reading each other’s minds.',
  Perfect: 'Every board on the first try!',
};

export default function ResultsScreen({ room, playerId, send, leave }) {
  const max = room.totalBoards * POINTS_FIRST_TRY;
  const band = getRatingBand(room.score, max);
  const pct = max ? Math.round((room.score / max) * 100) : 0;
  const isHost = room.hostId === playerId;

  useEffect(() => {
    playGameWin();
    if (band === 'Perfect' || band === 'Mind meld') launchConfetti();
  }, [band]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 gap-6">
      <div className="flex gap-1.5">
        {band
          .toUpperCase()
          .split('')
          .map((l, i) =>
            l === ' ' ? (
              <div key={i} className="w-2" />
            ) : (
              <Tile key={i} letter={l} size="sm" variant={i === 0 ? 'highlight' : 'default'} />
            )
          )}
      </div>
      <p className="text-ink-soft font-display text-lg -mt-2 text-center">{BAND_NOTE[band]}</p>

      <Card className="w-full max-w-sm text-center !py-6">
        <p className="text-xs font-sans font-bold uppercase tracking-wider text-ink-muted mb-1">
          Team score
        </p>
        <p className="font-display font-bold text-ink text-6xl">
          {room.score}
          <span className="text-2xl text-ink-muted font-normal"> / {max}</span>
        </p>
        <div className="mt-4 h-3 w-full rounded-full bg-surface-sunken overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-green transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm font-sans font-bold text-ink-soft mt-2">{pct}% of a perfect game</p>
      </Card>

      <PlayerChips players={room.players} />

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {isHost ? (
          <ChunkyButton onClick={() => send(E.PLAY_AGAIN)} variant="orange" size="lg">
            Play Again
          </ChunkyButton>
        ) : (
          <p className="text-center text-ink-muted text-sm font-sans font-bold">
            Waiting for the host to start another round…
          </p>
        )}
        <ChunkyButton onClick={leave} variant="neutral" size="md">
          Leave Room
        </ChunkyButton>
        <Link
          to="/"
          className="text-center text-ink-muted hover:text-ink text-sm font-sans transition"
        >
          ← Back to Games
        </Link>
      </div>
    </div>
  );
}
