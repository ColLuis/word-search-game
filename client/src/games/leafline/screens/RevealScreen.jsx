import { useEffect } from 'react';
import { LEAFLINE_EVENTS as E, POINTS_FIRST_TRY } from 'shared/leafline.js';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Card from '../../../components/ui/Card.jsx';
import Board, { Clue } from '../components/Board.jsx';
import WordCard from '../components/WordCard.jsx';
import { ScreenHeader } from '../components/Chrome.jsx';
import { launchConfetti } from '../../../lib/confetti.js';
import { playWordFound, playWordRejected } from '../../../lib/sounds.js';

export default function RevealScreen({ room, playerId, send }) {
  const { guess, reveal } = room;
  const isHost = room.hostId === playerId;
  const solved = reveal.points > 0;
  const perfect = reveal.points === POINTS_FIRST_TRY;
  const last = room.currentBoardIndex + 1 >= room.totalBoards;

  useEffect(() => {
    if (solved) {
      playWordFound();
      if (perfect) launchConfetti();
    } else {
      playWordRejected();
    }
  }, [solved, perfect]);

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 gap-5">
      <ScreenHeader
        eyebrow={`Board ${room.currentBoardIndex + 1} of ${room.totalBoards}`}
        title={perfect ? 'Perfect!' : solved ? 'Got it on the second try!' : 'Not quite…'}
        sub={`${guess.boardOwnerName}'s board`}
      />

      <div className="flex items-center gap-3">
        <span
          className={[
            'rounded-full px-4 py-1.5 font-display font-bold uppercase tracking-wider text-sm',
            solved ? 'bg-accent-green text-white' : 'bg-surface text-ink-soft',
          ].join(' ')}
        >
          {solved ? `+${reveal.points} pts` : 'No points'}
        </span>
        <span className="font-sans font-bold text-ink-soft text-sm">
          Team score <span className="font-display text-ink text-lg">{room.score}</span>
          <span className="text-ink-muted"> / {room.totalBoards * POINTS_FIRST_TRY}</span>
        </span>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-center text-xs font-sans font-bold uppercase tracking-wider text-ink-muted mb-3">
          The answer
        </p>
        <Board
          clues={{
            top: <Clue text={guess.clues.top} />,
            right: <Clue text={guess.clues.right} side="right" />,
            bottom: <Clue text={guess.clues.bottom} />,
            left: <Clue text={guess.clues.left} side="left" />,
          }}
        >
          {reveal.solution.map((words, slot) => {
            const right = reveal.correctSlots.includes(slot);
            return (
              <div key={slot} className="relative">
                <WordCard
                  words={words}
                  className={right ? 'ring-4 ring-accent-green/70' : 'ring-4 ring-accent-red/50'}
                />
                <span
                  className={[
                    'absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-tile',
                    right ? 'bg-accent-green' : 'bg-accent-red',
                  ].join(' ')}
                >
                  {right ? '✓' : '✗'}
                </span>
              </div>
            );
          })}
        </Board>
        {!solved && (
          <p className="text-center text-xs font-sans text-ink-muted mt-3">
            Green cards were right on your last attempt.
          </p>
        )}
      </div>

      {isHost ? (
        <ChunkyButton
          onClick={() => send(E.BOARD_NEXT)}
          variant="orange"
          size="lg"
          className="w-full max-w-sm"
        >
          {last ? 'See results' : 'Next board'}
        </ChunkyButton>
      ) : (
        <Card className="!py-3 text-center text-ink-muted text-sm font-sans font-bold">
          Waiting for the host to continue…
        </Card>
      )}
    </div>
  );
}
