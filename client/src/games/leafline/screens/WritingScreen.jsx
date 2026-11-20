import { useState } from 'react';
import { LEAFLINE_EVENTS as E, LINK_IDS, seamWords, validateClue } from 'shared/leafline.js';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Board, { Clue } from '../components/Board.jsx';
import WordCard from '../components/WordCard.jsx';
import { PlayerChips, ScreenHeader } from '../components/Chrome.jsx';

const EMPTY = { top: '', right: '', bottom: '', left: '' };
const LABELS = { top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left' };

export default function WritingScreen({ room, playerId, send }) {
  const board = room.myBoard;
  const ready = room.readyIds?.includes(playerId) ?? false;
  const [clues, setClues] = useState(() => ({ ...EMPTY, ...board?.clues }));
  const [errors, setErrors] = useState(EMPTY);
  const [focused, setFocused] = useState(null);

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen text-ink-muted font-sans">
        Waiting for the next game…
      </div>
    );
  }

  const pairs = Object.fromEntries(LINK_IDS.map((id) => [id, seamWords(board.slots, id)]));

  const change = (linkId, value) => {
    const text = value.replace(/\s/g, '');
    setClues((c) => ({ ...c, [linkId]: text }));
    setErrors((e) => ({ ...e, [linkId]: '' }));
    send(E.CLUE_UPDATE, { linkId, text });
  };

  const toggleReady = () => {
    if (!ready) {
      const next = Object.fromEntries(
        LINK_IDS.map((id) => [id, validateClue(clues[id], ...pairs[id]) ?? ''])
      );
      setErrors(next);
      if (Object.values(next).some(Boolean)) return;
    }
    send(E.CLUE_READY, { ready: !ready });
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 gap-5">
      <ScreenHeader
        eyebrow="Your board"
        title="Write your clues"
        sub="One word that links the two words touching on each side"
      />

      <Board
        clues={{
          top: <Clue text={clues.top} status={focused === 'top' ? 'active' : 'neutral'} />,
          right: (
            <Clue
              text={clues.right}
              side="right"
              status={focused === 'right' ? 'active' : 'neutral'}
            />
          ),
          bottom: <Clue text={clues.bottom} status={focused === 'bottom' ? 'active' : 'neutral'} />,
          left: (
            <Clue
              text={clues.left}
              side="left"
              status={focused === 'left' ? 'active' : 'neutral'}
            />
          ),
        }}
      >
        {board.slots.map((words, i) => (
          <WordCard key={i} words={words} />
        ))}
      </Board>

      <div className="w-full max-w-sm flex flex-col gap-2.5">
        {LINK_IDS.map((id) => (
          <label key={id} className="block">
            <div className="flex items-baseline justify-between mb-1 px-1">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-ink-muted">
                {LABELS[id]}
              </span>
              <span className="text-xs font-display font-bold uppercase tracking-wide text-ink-soft">
                {pairs[id][0]} + {pairs[id][1]}
              </span>
            </div>
            <input
              type="text"
              value={clues[id]}
              disabled={ready}
              maxLength={20}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="One-word clue"
              onFocus={() => setFocused(id)}
              onBlur={() => setFocused(null)}
              onChange={(e) => change(id, e.target.value)}
              className={[
                'w-full bg-tile-face border-2 rounded-xl px-4 py-2.5 text-ink font-display font-bold uppercase tracking-wider',
                'placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-muted placeholder:font-sans placeholder:font-normal',
                'focus:outline-none disabled:opacity-60',
                errors[id] ? 'border-accent-red' : 'border-tile-edge focus:border-accent-orange',
              ].join(' ')}
            />
            {errors[id] && (
              <p className="text-accent-red text-xs font-sans font-bold mt-1 px-1">{errors[id]}</p>
            )}
          </label>
        ))}
      </div>

      <ChunkyButton
        onClick={toggleReady}
        variant={ready ? 'neutral' : 'green'}
        size="lg"
        className="w-full max-w-sm"
      >
        {ready ? '✓ Ready · tap to edit' : 'Ready'}
      </ChunkyButton>

      <div className="w-full max-w-sm">
        <p className="text-center text-xs font-sans font-bold uppercase tracking-wider text-ink-muted mb-2">
          {room.readyIds?.length ?? 0} of {room.totalBoards} ready
        </p>
        <PlayerChips players={room.players} marked={room.readyIds ?? []} />
      </div>
    </div>
  );
}
