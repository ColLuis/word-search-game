import { Link } from 'react-router-dom';
import Tile from '../components/ui/Tile';
import Card from '../components/ui/Card';
import ChunkyButton from '../components/ui/ChunkyButton';

const games = [
  {
    name: 'WordRush',
    path: '/wordrush',
    description: 'Real-time word search. Race to find hidden words in a grid.',
    players: '2 players',
    accent: 'green',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={2}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    name: 'WordClash',
    path: '/wordclash',
    description: 'Form the longest word from shared letters. Outscore your opponents.',
    players: '2–4 players',
    accent: 'orange',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={2}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <rect x="2" y="7" width="6" height="10" rx="1.5" />
        <rect x="9" y="7" width="6" height="10" rx="1.5" />
        <rect x="16" y="7" width="6" height="10" rx="1.5" />
        <line x1="4" y1="12" x2="6" y2="12" />
        <line x1="11" y1="10" x2="13" y2="14" />
        <line x1="13" y1="10" x2="11" y2="14" />
        <line x1="19" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Brand wordmark */}
      <div className="flex gap-2 mb-3">
        {['W', 'O', 'R', 'D'].map((l, i) => (
          <Tile key={`w-${i}`} letter={l} size="lg" variant={i === 1 ? 'highlight' : 'default'} />
        ))}
      </div>
      <div className="flex gap-2 mb-8">
        {['G', 'A', 'M', 'E', 'S'].map((l, i) => (
          <Tile key={`g-${i}`} letter={l} size="lg" />
        ))}
      </div>

      <p className="font-display text-ink-soft text-lg mb-10 tracking-wide">
        Pick a game and play.
      </p>

      {/* Game cards */}
      <div className="flex flex-col gap-5 w-full max-w-md">
        {games.map((game) => (
          <Link key={game.path} to={game.path} className="block group">
            <Card
              className={[
                'group-hover:-translate-y-0.5 transition-transform !p-0 overflow-hidden flex',
                game.accent === 'orange'
                  ? 'border-l-4 border-accent-orange'
                  : 'border-l-4 border-accent-green',
              ].join(' ')}
            >
              {/* Colored icon column */}
              <div
                className={[
                  'flex items-center justify-center px-4',
                  game.accent === 'orange' ? 'text-accent-orange' : 'text-accent-green',
                ].join(' ')}
              >
                {game.icon}
              </div>

              {/* Content */}
              <div className="flex-1 py-5 pr-4">
                <div className="flex items-start justify-between mb-1">
                  <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-ink">
                    {game.name}
                  </h2>
                  <span
                    className={[
                      'inline-block rounded-full px-3 py-1 text-xs font-bold font-sans uppercase tracking-wider whitespace-nowrap ml-2 mt-0.5',
                      game.accent === 'orange'
                        ? 'bg-accent-orange/15 text-accent-orange'
                        : 'bg-accent-green/15 text-accent-green',
                    ].join(' ')}
                  >
                    {game.players}
                  </span>
                </div>
                <p className="text-ink-soft text-sm mb-4 max-w-[18rem]">{game.description}</p>
                <ChunkyButton
                  as="span"
                  size="sm"
                  variant={game.accent === 'orange' ? 'orange' : 'green'}
                >
                  Play →
                </ChunkyButton>
              </div>
            </Card>
          </Link>
        ))}

        {/* Coming soon placeholder */}
        <div className="rounded-2xl px-6 py-5 text-center border-2 border-dashed border-ink-muted/30 text-ink-muted">
          <p className="font-display text-sm uppercase tracking-widest">More games coming soon</p>
        </div>
      </div>
    </div>
  );
}
