import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../lib/socket.js';

export default function HomeScreen() {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { setError('Enter your name'); return; }
    getSocket().emit('room:create', { playerName: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim()) { setError('Enter your name'); return; }
    if (!roomCode.trim()) { setError('Enter room code'); return; }
    getSocket().emit('room:join', { roomCode: roomCode.trim().toUpperCase(), playerName: name.trim() });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
        WordClash
      </h1>
      <p className="text-gray-400 mb-2">Form words, outscore opponents</p>
      <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm mb-6 transition">Back to Games</Link>

      {!mode && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setMode('create')}
            className="bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg transition"
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
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />

          {mode === 'join' && (
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
              maxLength={6}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 uppercase tracking-widest focus:outline-none focus:border-orange-500"
            />
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={mode === 'create' ? handleCreate : handleJoin}
            className="bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg transition"
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
