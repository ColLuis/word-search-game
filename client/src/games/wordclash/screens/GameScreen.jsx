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

export default function GameScreen() {
  const { state } = useGame();
  const {
    letters, currentRound, totalRounds, roundTimeSeconds,
    players, playerId, submittedPlayerIds, iSubmitted,
    validationStatus, scores, toast,
  } = state;

  const {
    bankTiles, builderTiles, currentWord,
    addToBuilder, returnToBank, clearBuilder, shuffleBank,
    submitWord, submitEmpty, handleDragEnd,
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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col items-center min-h-screen px-3 py-3 max-w-md mx-auto">
        <ReconnectBanner />
        {/* Round info + Timer */}
        <div className="flex items-center justify-between w-full mb-3">
          <div>
            <span className="text-sm text-gray-400">Round </span>
            <span className="text-lg font-bold text-orange-400">{currentRound}</span>
            <span className="text-sm text-gray-400"> / {totalRounds}</span>
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
          <div className="flex gap-3 w-full" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <button
              onClick={clearBuilder}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Clear
            </button>
            <button
              onClick={shuffleBank}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
              title="Shuffle letters"
            >
              Shuffle
            </button>
            <button
              onClick={handleSubmit}
              disabled={currentWord.length > 0 && currentWord.length < 3}
              className={`flex-1 font-semibold py-3 rounded-lg transition ${
                confirming
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white animate-pulse'
                  : isValid
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-orange-600 hover:bg-orange-500 text-white'
              } disabled:bg-gray-700 disabled:text-gray-500`}
            >
              {confirming
                ? (currentWord.length === 0 ? 'Confirm Skip?' : 'Confirm?')
                : (currentWord.length === 0 ? 'Skip' : 'Submit')}
            </button>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-green-400 font-semibold">Submitted! Waiting for others...</p>
          </div>
        )}

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </DndContext>
  );
}
