import { useState } from 'react';
import { getSocket } from '../lib/socket.js';

const CATEGORIES = ['Animals', 'Food', 'Science', 'Sports', 'Geography'];

export default function HomeScreen() {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [roomCode, setRoomCode] = useState('');
  const [seriesLength, setSeriesLength] = useState(1);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { setError('Enter your name'); return; }
    getSocket().emit('room:create', { playerName: name.trim(), category, seriesLength });
  };

  const handleJoin = () => {
    if (!name.trim()) { setError('Enter your name'); return; }
    if (!roomCode.trim()) { setError('Enter room code'); return; }
    getSocket().emit('room:join', { roomCode: roomCode.trim().toUpperCase(), playerName: name.trim() });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        WordRush
      </h1>
      <p className="text-gray-400 mb-8">Real-time 2-player word search</p>

      {!mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setMode('create')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Create Room
          </button>
          <button
            onClick={() => setMode('join')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Join Room
          </button>
        </div>
      )}

      {mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            maxLength={15}
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />

          {mode === 'create' && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={seriesLength}
              onChange={(e) => setSeriesLength(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value={1}>Single Game</option>
              <option value={3}>Best of 3</option>
              <option value={5}>Best of 5</option>
              <option value={7}>Best of 7</option>
            </select>
          )}

          {mode === 'join' && (
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
              maxLength={6}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 uppercase tracking-widest focus:outline-none focus:border-blue-500"
            />
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={mode === 'create' ? handleCreate : handleJoin}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            {mode === 'create' ? 'Create' : 'Join'}
          </button>
          <button
            onClick={() => { setMode(null); setError(''); }}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
