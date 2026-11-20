import { useState } from 'react';
import {
  LEAFLINE_EVENTS as E,
  LINK_GEOMETRY,
  POINTS_FIRST_TRY,
  POINTS_SECOND_TRY,
} from 'shared/leafline.js';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';
import Card from '../../../components/ui/Card.jsx';
import Board, { Clue } from '../components/Board.jsx';
import WordCard from '../components/WordCard.jsx';
import { PlayerChips, ScreenHeader } from '../components/Chrome.jsx';
import { playLetterClick } from '../../../lib/sounds.js';

export default function GuessingScreen({ room, playerId, send }) {
  const guess = room.guess;
  const isOwner = guess.boardOwnerId === playerId;
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const { slots, locked, tray, attempt } = guess;
  const allFilled = slots.every(Boolean);
  const iSubmitted = guess.submitted.includes(playerId);
  const points = attempt === 1 ? POINTS_FIRST_TRY : POINTS_SECOND_TRY;
  const selectedOnBoard = slots.some((p) => p?.cardId === selected);
  const selectedStillExists =
    selected && (selectedOnBoard || tray.some((p) => p.cardId === selected));
  const activeSelection = selectedStillExists ? selected : null;

  const clueStatus = (linkId) => {
    if (attempt === 1) return 'neutral';
    return LINK_GEOMETRY[linkId].every(({ slot }) => locked.includes(slot)) ? 'solved' : 'missed';
  };

  const pickTray = (cardId) => {
    if (isOwner) return;
    playLetterClick();
    setSelected((s) => (s === cardId ? null : cardId));
  };

  const pickSlot = (slot) => {
    if (isOwner || locked.includes(slot)) return;
    const here = slots[slot];
    if (activeSelection && activeSelection !== here?.cardId) {
      playLetterClick();
      send(E.GUESS_PLACE, { cardId: activeSelection, slot });
      setSelected(null);
    } else if (here) {
      setSelected((s) => (s === here.cardId ? null : here.cardId));
    }
  };

  const rotate = (slot) => {
    playLetterClick();
    send(E.GUESS_ROTATE, { slot });
  };

  const remove = (cardId) => {
    send(E.GUESS_RETURN, { cardId });
    setSelected(null);
  };

  const submitters = room.players.filter((p) => guess.submitted.includes(p.id));

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 gap-4">
      <ScreenHeader
        eyebrow={`Board ${room.currentBoardIndex + 1} of ${room.totalBoards}`}
        title={isOwner ? 'Your board — stay quiet!' : `Rebuild ${guess.boardOwnerName}'s board`}
        sub={`Attempt ${attempt} of 2 · worth ${points} pts`}
      />

      {isOwner && (
        <Card
          variant="teal"
          className="!py-3 max-w-sm w-full text-center font-sans font-bold text-sm"
        >
          Watch your team work. No hints!
        </Card>
      )}

      {attempt === 2 && (
        <div className="w-full max-w-sm rounded-2xl border-2 border-accent-red/40 bg-accent-red/10 px-4 py-3 text-center animate-fade-in">
          <p className="font-display font-bold text-accent-red">✗ First attempt missed</p>
          <p className="text-sm font-sans text-ink-soft mt-0.5">
            {locked.length === 0
              ? 'No cards were in the right spot. They all went back to the tray.'
              : `${locked.length} of 4 ${locked.length === 1 ? 'card was' : 'cards were'} right and ${locked.length === 1 ? 'is' : 'are'} locked in. The rest went back to the tray.`}
          </p>
        </div>
      )}

      <Board
        clues={{
          top: <Clue text={guess.clues.top} status={clueStatus('top')} />,
          right: <Clue text={guess.clues.right} side="right" status={clueStatus('right')} />,
          bottom: <Clue text={guess.clues.bottom} status={clueStatus('bottom')} />,
          left: <Clue text={guess.clues.left} side="left" status={clueStatus('left')} />,
        }}
      >
        {slots.map((p, slot) => {
          const isLocked = locked.includes(slot);
          const isSelected = p && p.cardId === activeSelection;
          const isTarget = !p && activeSelection && !isOwner;
          return (
            <div key={slot} className="relative">
              {p ? (
                <button
                  type="button"
                  onClick={() => pickSlot(slot)}
                  className={[
                    'block w-full rounded-xl transition-transform',
                    isOwner || isLocked ? 'cursor-default' : 'active:translate-y-0.5',
                    isSelected ? 'ring-4 ring-accent-orange/70 -translate-y-0.5' : '',
                    isLocked ? 'ring-4 ring-accent-green/70' : '',
                  ].join(' ')}
                >
                  <WordCard words={p.words} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => pickSlot(slot)}
                  disabled={isOwner}
                  className={[
                    'flex aspect-square w-full items-center justify-center rounded-xl border-2 border-dashed font-sans text-xs font-bold transition-colors',
                    isTarget
                      ? 'border-accent-orange bg-accent-orange/10 text-accent-orange'
                      : 'border-ink-muted/40 bg-surface-sunken/60 text-ink-muted',
                  ].join(' ')}
                >
                  {isTarget ? 'Place here' : 'Empty'}
                </button>
              )}

              {isLocked && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-green text-xs font-bold text-white shadow-tile">
                  ✓
                </span>
              )}

              {p && !isLocked && !isOwner && (
                <>
                  <div className="absolute top-1 left-1">
                    <IconButton label="Rotate" onClick={() => rotate(slot)}>
                      ↻
                    </IconButton>
                  </div>
                  <div className="absolute top-1 right-1">
                    <IconButton label="Back to tray" onClick={() => remove(p.cardId)}>
                      ×
                    </IconButton>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </Board>

      <div className="w-full max-w-sm mt-2">
        <div className="flex items-baseline justify-between px-1 mb-2">
          <p className="text-xs font-sans font-bold uppercase tracking-wider text-ink-muted">
            Tray
          </p>
          {!isOwner && (
            <p className="text-xs font-sans text-ink-muted">
              {activeSelection ? 'Now tap a spot on the board' : 'Tap a card, then a spot'}
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-surface-sunken px-3 py-3 min-h-[6rem] flex flex-wrap gap-2.5 justify-center">
          {tray.map((p) => (
            <button
              key={p.cardId}
              type="button"
              onClick={() => pickTray(p.cardId)}
              disabled={isOwner}
              className={[
                'w-[4.75rem] rounded-xl transition-transform',
                isOwner ? 'cursor-default opacity-80' : 'active:translate-y-0.5',
                p.cardId === activeSelection ? 'ring-4 ring-accent-orange/70 -translate-y-1' : '',
              ].join(' ')}
            >
              <WordCard words={p.words} size="sm" />
            </button>
          ))}
          {tray.length === 0 && (
            <p className="self-center text-ink-muted text-sm font-sans">All cards placed</p>
          )}
        </div>
      </div>

      {!isOwner && (
        <div className="w-full max-w-sm">
          {iSubmitted ? (
            <ChunkyButton
              onClick={() => send(E.GUESS_UNSUBMIT)}
              variant="neutral"
              size="lg"
              className="w-full"
            >
              Waiting · tap to unready
            </ChunkyButton>
          ) : confirming ? (
            <Card className="!p-4 text-center">
              <p className="font-display font-bold text-ink mb-3">Lock in this board?</p>
              <div className="flex gap-2">
                <ChunkyButton
                  onClick={() => {
                    send(E.GUESS_SUBMIT);
                    setConfirming(false);
                  }}
                  variant="green"
                  className="flex-1"
                >
                  Submit
                </ChunkyButton>
                <ChunkyButton
                  onClick={() => setConfirming(false)}
                  variant="neutral"
                  className="flex-1"
                >
                  Cancel
                </ChunkyButton>
              </div>
            </Card>
          ) : (
            <ChunkyButton
              onClick={() => setConfirming(true)}
              disabled={!allFilled}
              variant="green"
              size="lg"
              className="w-full"
            >
              {allFilled ? `Submit · ${points} pts` : 'Fill all 4 spots'}
            </ChunkyButton>
          )}
        </div>
      )}

      {submitters.length > 0 && (
        <div className="w-full max-w-sm">
          <p className="text-center text-xs font-sans font-bold uppercase tracking-wider text-ink-muted mb-2">
            {submitters.length} of {guess.submitsNeeded} ready to submit
          </p>
          <PlayerChips players={submitters} marked={guess.submitted} />
        </div>
      )}
    </div>
  );
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink text-sm font-bold shadow-[0_2px_0_0_#D6C29B] active:translate-y-0.5 active:shadow-none transition-transform"
    >
      {children}
    </button>
  );
}
