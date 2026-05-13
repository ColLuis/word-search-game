import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../lib/socket.js';
import Tile from '../../../components/ui/Tile.jsx';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';

const CATEGORIES = [
  'Animals',
  'Food',
  'Science',
  'Sports',
  'Geography',
  'Music',
  'Technology',
  'Space',
  'Movies',
  'Nature',
];

export default function HomeScreen() {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [roomCode, setRoomCode] = useState('');
  const [seriesLength, setSeriesLength] = useState(1);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    getSocket().emit('room:create', { playerName: name.trim(), category, seriesLength });
  };

  const handleJoin = () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Enter room code');
      return;
    }
    getSocket().emit('room:join', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: name.trim(),
    });
  };

  const inputClasses =
    'bg-tile-face border-2 border-tile-edge rounded-xl px-4 py-3 text-ink font-display font-bold placeholder:text-ink-muted placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-accent-green';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6">
      {/* Wordmark */}
      <div className="flex gap-1.5 mb-6">
        {['W', 'O', 'R', 'D'].map((l, i) => (
          <Tile key={`w-${i}`} letter={l} size="md" variant={i === 1 ? 'highlight' : 'default'} />
        ))}
        <div className="w-2" />
        {['R', 'U', 'S', 'H'].map((l, i) => (
          <Tile key={`r-${i}`} letter={l} size="md" />
        ))}
      </div>

      <p className="text-ink-soft font-display text-lg mb-2">Real-time word search</p>
      <Link to="/" className="text-ink-muted hover:text-ink text-sm font-sans mb-8 transition">
        ← Back to Games
      </Link>

      {!mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <ChunkyButton onClick={() => setMode('create')} variant="green" size="lg">
            Create Room
          </ChunkyButton>
          <ChunkyButton onClick={() => setMode('join')} variant="orange" size="lg">
            Join Room
          </ChunkyButton>
        </div>
      )}

      {mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength={15}
            className={inputClasses}
          />

          {mode === 'create' && (
            <>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClasses}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={seriesLength}
                onChange={(e) => setSeriesLength(Number(e.target.value))}
                className={inputClasses}
              >
                <option value={1}>Single Game</option>
                <option value={3}>Best of 3</option>
                <option value={5}>Best of 5</option>
                <option value={7}>Best of 7</option>
              </select>
            </>
          )}

          {mode === 'join' && (
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError('');
              }}
              maxLength={6}
              className={`${inputClasses} uppercase tracking-widest text-center`}
            />
          )}

          {error && <p className="text-accent-red text-sm font-bold font-sans">{error}</p>}

          <ChunkyButton
            onClick={mode === 'create' ? handleCreate : handleJoin}
            variant="green"
            size="lg"
          >
            {mode === 'create' ? 'Create' : 'Join'}
          </ChunkyButton>
          <button
            onClick={() => {
              setMode(null);
              setError('');
            }}
            className="text-ink-soft hover:text-ink text-sm font-sans font-bold transition"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
