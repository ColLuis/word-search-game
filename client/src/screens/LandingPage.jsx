import { Link } from 'react-router-dom';

const games = [
  {
    name: 'WordRush',
    path: '/wordrush',
    description: 'Real-time 2-player word search. Race to find hidden words in a grid!',
    gradient: 'from-blue-500 to-purple-600',
    players: '2 players',
  },
  {
    name: 'WordClash',
    path: '/wordclash',
    description: 'Form the longest word from shared letters. Outscore your opponents!',
    gradient: 'from-orange-500 to-red-600',
    players: '2-4 players',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
        Word Games
      </h1>
      <p className="text-gray-400 mb-10">Choose a game to play</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {games.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className="block bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className={`text-2xl font-bold bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent`}>
                {game.name}
              </h2>
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">
                {game.players}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
