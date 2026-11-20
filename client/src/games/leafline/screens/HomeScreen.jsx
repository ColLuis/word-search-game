import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Tile from '../../../components/ui/Tile.jsx';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';

const NAME_KEY = 'leafline_name';

const inputClasses =
  'bg-tile-face border-2 border-tile-edge rounded-xl px-4 py-3 text-ink font-display font-bold placeholder:text-ink-muted placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-accent-orange';

function savedName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function HomeScreen({ createRoom, joinRoom }) {
  const [params] = useSearchParams();
  const invited = (params.get('room') ?? '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4);
  const [mode, setMode] = useState(invited ? 'join' : null);
  const [name, setName] = useState(savedName);
  const [roomCode, setRoomCode] = useState(invited);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Enter your name');
    if (mode === 'join' && roomCode.length !== 4) return setError('Enter the 4-letter room code');
    setBusy(true);
    setError('');
    try {
      localStorage.setItem(NAME_KEY, trimmed);
    } catch {
      // ignore
    }
    try {
      if (mode === 'create') await createRoom(trimmed);
      else await joinRoom(roomCode, trimmed);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="flex gap-1.5 mb-6">
        {['W', 'O', 'R', 'D'].map((l, i) => (
          <Tile key={`w-${i}`} letter={l} size="md" variant={i === 1 ? 'highlight' : 'default'} />
        ))}
        <div className="w-2" />
        {['L', 'I', 'N', 'K'].map((l, i) => (
          <Tile key={`l-${i}`} letter={l} size="md" variant={i === 0 ? 'highlight' : 'default'} />
        ))}
      </div>

      <p className="text-ink-soft font-display text-lg mb-2 text-center">
        Link the words, rebuild the board
      </p>
      <Link to="/" className="text-ink-muted hover:text-ink text-sm font-sans mb-8 transition">
        ← Back to Games
      </Link>

      {!mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <ChunkyButton onClick={() => setMode('create')} variant="orange" size="lg">
            Create Room
          </ChunkyButton>
          <ChunkyButton onClick={() => setMode('join')} variant="green" size="lg">
            Join Room
          </ChunkyButton>
          <p className="text-center text-ink-muted text-xs font-sans font-bold uppercase tracking-wider mt-2">
            2–6 players · co-op
          </p>
        </div>
      )}

      {mode && (
        <form
          className="flex flex-col gap-3 w-full max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="text"
            placeholder="Your name"
            value={name}
            autoFocus={!invited}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength={16}
            className={inputClasses}
          />

          {mode === 'join' && (
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''));
                setError('');
              }}
              maxLength={4}
              className={`${inputClasses} uppercase tracking-widest text-center`}
            />
          )}

          {error && <p className="text-accent-red text-sm font-bold font-sans">{error}</p>}

          <ChunkyButton type="submit" variant="orange" size="lg" disabled={busy}>
            {busy ? '…' : mode === 'create' ? 'Create' : 'Join'}
          </ChunkyButton>
          <button
            type="button"
            onClick={() => {
              setMode(null);
              setError('');
            }}
            className="text-ink-soft hover:text-ink text-sm font-sans font-bold transition"
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}
