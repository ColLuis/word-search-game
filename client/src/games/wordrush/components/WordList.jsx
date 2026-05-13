import { useGame } from '../context/GameContext.jsx';

export default function WordList() {
  const { state } = useGame();
  const { words, playerId, blinded } = state;

  if (blinded) {
    return (
      <div className="relative grid grid-cols-3 gap-1.5 px-2 mt-3 w-full max-w-[min(90vw,500px)]">
        {words.map((w) => (
          <div
            key={w.word}
            className="text-xs py-1.5 px-2 rounded-full text-center font-display font-bold uppercase tracking-wider bg-surface text-surface"
          >
            {'?????'}
          </div>
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-accent-red text-sm font-display font-bold uppercase tracking-wider animate-pulse">
            BLINDED!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 px-2 mt-3 w-full max-w-[min(90vw,500px)]">
      {words.map((w) => {
        const isMe = w.foundBy === playerId;
        const isOpponent = w.found && !isMe;
        let cls =
          'text-xs py-1.5 px-2 rounded-full text-center font-display font-bold uppercase tracking-wider truncate ';
        if (isMe) cls += 'bg-accent-green/15 text-accent-green line-through';
        else if (isOpponent) cls += 'bg-accent-orange/15 text-accent-orange line-through';
        else cls += 'bg-tile-face text-ink shadow-tile';

        return (
          <div key={w.word} className={cls}>
            {w.word}
          </div>
        );
      })}
    </div>
  );
}
