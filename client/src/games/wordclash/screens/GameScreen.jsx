import { useCallback, useState, useEffect } from 'react';
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useGame } from '../context/GameContext.jsx';
import useTimer from '../hooks/useTimer.js';
import useWordBuilder from '../hooks/useWordBuilder.js';
import Timer from '../components/Timer.jsx';
import PlayerStatus from '../components/PlayerStatus.jsx';
import WordBuilder from '../components/WordBuilder.jsx';
import LetterBank from '../components/LetterBank.jsx';
import ReconnectBanner from '../components/ReconnectBanner.jsx';
import ChunkyButton from '../../../components/ui/ChunkyButton.jsx';

export default function GameScreen() {
  const { state } = useGame();
  const {
    letters,
    currentRound,
    totalRounds,
    roundTimeSeconds,
    players,
    playerId,
    submittedPlayerIds,
    iSubmitted,
    validationStatus,
    scores,
    toast,
  } = state;

  const {
    bankTiles,
    builderTiles,
    currentWord,
    addToBuilder,
    returnToBank,
    clearBuilder,
    shuffleBank,
    submitWord,
    submitEmpty,
    handleDragEnd,
  } = useWordBuilder(letters);

  const onTimerExpire = useCallback(() => {
    if (!iSubmitted) {
      if (currentWord.length >= 3) {
        submitWord();
      } else {
        submitEmpty();
      }
    }
  }, [iSubmitted, currentWord, submitWord, submitEmpty]);

  const { remaining } = useTimer(roundTimeSeconds, onTimerExpire);

  useEffect(() => {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [currentRound]);

  const [confirming, setConfirming] = useState(false);

  // Reset confirm state when the word changes
  useEffect(() => {
    setConfirming(false);
  }, [currentWord]);

  const handleSubmit = () => {
    if (iSubmitted) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    if (currentWord.length >= 3) {
      submitWord();
    } else {
      submitEmpty();
    }
  };

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 },
  });
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(touchSensor, mouseSensor);

  const isValid = validationStatus?.word === currentWord && validationStatus?.valid;

  let submitVariant = 'orange';
  if (confirming) submitVariant = 'teal';
  else if (isValid) submitVariant = 'green';

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col items-center min-h-screen px-3 py-3 max-w-md mx-auto">
        <ReconnectBanner />
        {/* Round info + Timer */}
        <div className="flex items-center justify-between w-full mb-3">
          <div className="font-sans">
            <span className="text-sm text-ink-soft font-bold uppercase tracking-wider">Round </span>
            <span className="text-2xl font-display font-bold text-accent-orange">
              {currentRound}
            </span>
            <span className="text-sm text-ink-soft font-bold"> / {totalRounds}</span>
          </div>
          <Timer remaining={remaining} total={roundTimeSeconds} />
        </div>

        {/* Player status */}
        <div className="w-full mb-4">
          <PlayerStatus
            players={players}
            playerId={playerId}
            submittedPlayerIds={submittedPlayerIds}
            scores={scores}
          />
        </div>

        {/* Word builder */}
        <div className="w-full mb-4">
          <WordBuilder
            tiles={builderTiles}
            onTileClick={returnToBank}
            validationStatus={validationStatus}
            currentWord={currentWord}
          />
        </div>

        {/* Letter bank */}
        <div className="w-full mb-4">
          <LetterBank tiles={bankTiles} onTileClick={addToBuilder} />
        </div>

        {/* Action buttons */}
        {!iSubmitted ? (
          <div
            className="flex gap-3 w-full"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <ChunkyButton onClick={clearBuilder} variant="red" size="md" className="flex-1">
              Clear
            </ChunkyButton>
            <ChunkyButton onClick={shuffleBank} variant="green" size="md" title="Shuffle letters">
              Shuffle
            </ChunkyButton>
            <ChunkyButton
              onClick={handleSubmit}
              disabled={currentWord.length > 0 && currentWord.length < 3}
              variant={submitVariant}
              size="md"
              className="flex-1"
            >
              {confirming
                ? currentWord.length === 0
                  ? 'Skip?'
                  : 'Confirm?'
                : currentWord.length === 0
                  ? 'Skip'
                  : 'Submit'}
            </ChunkyButton>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-accent-green font-display font-bold uppercase tracking-wider">
              Submitted! Waiting for others...
            </p>
          </div>
        )}

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-accent-red text-white px-4 py-2 rounded-xl shadow-card font-sans font-bold">
            {toast}
          </div>
        )}
      </div>
    </DndContext>
  );
}
