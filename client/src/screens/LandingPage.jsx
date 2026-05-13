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
    preview: 'grid', // mini word-search grid with WORD highlighted
  },
  {
    name: 'WordClash',
    path: '/wordclash',
    description: 'Form the longest word from shared letters. Outscore your opponents.',
    players: '2–4 players',
    accent: 'orange',
    preview: 'tiles', // letters in a row
    sample: ['C', 'L', 'A', 'S', 'H'],
  },
];

// 3 rows × 5 cols mini grid. Row 1 spells WORD as a "found" word.
// Other cells are filler letters that look word-search-y.
const RUSH_GRID = [
  ['X', 'Y', 'Q', 'M', 'N'],
  ['W', 'O', 'R', 'D', 'H'],
  ['K', 'L', 'P', 'V', 'J'],
];
const RUSH_HIGHLIGHT = new Set(['1,0', '1,1', '1,2', '1,3']);

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
            <Card className="group-hover:-translate-y-0.5 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-ink">
                    {game.name}
                  </h2>
                  <p className="text-ink-soft text-sm mt-1 max-w-[20rem]">{game.description}</p>
                </div>
                <span
                  className={[
                    'inline-block rounded-full px-3 py-1 text-xs font-bold font-sans uppercase tracking-wider whitespace-nowrap',
                    game.accent === 'orange'
                      ? 'bg-accent-orange/15 text-accent-orange'
                      : 'bg-accent-green/15 text-accent-green',
                  ].join(' ')}
                >
                  {game.players}
                </span>
              </div>

              {/* Mini preview */}
              <div className="flex items-center justify-between">
                {game.preview === 'grid' ? (
                  <div className="flex flex-col gap-0.5">
                    {RUSH_GRID.map((row, r) => (
                      <div key={r} className="flex gap-0.5">
                        {row.map((l, c) => (
                          <Tile
                            key={c}
                            letter={l}
                            size="xs"
                            variant={RUSH_HIGHLIGHT.has(`${r},${c}`) ? 'highlight' : 'default'}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    {game.sample.map((l, i) => (
                      <Tile
                        key={i}
                        letter={l}
                        size="sm"
                        variant={i === 0 && game.accent === 'orange' ? 'highlight' : 'default'}
                      />
                    ))}
                  </div>
                )}
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
      </div>

      <p className="font-sans text-ink-muted text-xs mt-12 tracking-wide">
        Made with love · word-search-game
      </p>
    </div>
  );
}
