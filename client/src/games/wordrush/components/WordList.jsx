import { useGame } from '../context/GameContext.jsx';

export default function WordList() {
  const { state } = useGame();
  const { words, playerId } = state;

  return (
    <div className="grid grid-cols-3 gap-1 px-2 mt-2">
      {words.map((w) => {
        const isMe = w.foundBy === playerId;
        const isOpponent = w.found && !isMe;
        let cls = 'text-xs py-1 px-2 rounded text-center font-semibold ';
        if (isMe) cls += 'bg-blue-900/50 text-blue-300 line-through';
        else if (isOpponent) cls += 'bg-orange-900/50 text-orange-300 line-through';
        else cls += 'bg-gray-800 text-gray-300';

        return (
          <div key={w.word} className={cls}>
            {w.word}
          </div>
        );
      })}
    </div>
  );
}
