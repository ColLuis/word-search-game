import { useState, useEffect } from 'react';
import ChunkyButton from './ui/ChunkyButton.jsx';

const TUTORIALS = {
  wordrush: [
    {
      title: 'Find Hidden Words',
      text: 'Drag across letters to find hidden words in the grid.',
      icon: '🔤',
    },
    {
      title: 'Earn Powerups',
      text: 'Earn powerups every 2 words — freeze, hint, and more!',
      icon: '⚡',
    },
    {
      title: 'Score Multiplier',
      text: 'Words are worth more as the game progresses (1x → 2x → 3x).',
      icon: '✖️',
    },
  ],
  wordclash: [
    {
      title: 'Build Words',
      text: 'Tap or drag letters to build the longest word you can.',
      icon: '🔤',
    },
    {
      title: 'Score Big',
      text: 'Longer words score more — and submitting fast earns a 1.25x speed bonus.',
      icon: '🏆',
    },
    {
      title: 'Watch for Clashes',
      text: 'If two players submit the same word, the fastest gets half points.',
      icon: '⚔️',
    },
  ],
};

export default function TutorialOverlay({ game, onDismiss }) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const [visible, setVisible] = useState(false);

  const storageKey = `tutorial_seen_${game}`;

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  const steps = TUTORIALS[game];
  const current = steps[step];

  const handleDismiss = () => {
    if (dontShow) {
      localStorage.setItem(storageKey, '1');
    }
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
      <div className="bg-surface rounded-3xl p-7 max-w-sm w-full text-center shadow-card">
        <div className="text-5xl mb-3">{current.icon}</div>
        <h3 className="font-display text-2xl font-bold uppercase tracking-wider text-ink mb-2">
          {current.title}
        </h3>
        <p className="text-ink-soft font-sans mb-6">{current.text}</p>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? 'bg-accent-orange' : 'bg-tile-edge'}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 justify-center mb-4">
          {step > 0 && (
            <ChunkyButton onClick={() => setStep(step - 1)} variant="neutral" size="sm">
              Previous
            </ChunkyButton>
          )}
          {step < steps.length - 1 ? (
            <ChunkyButton onClick={() => setStep(step + 1)} variant="orange" size="sm">
              Next
            </ChunkyButton>
          ) : (
            <ChunkyButton onClick={handleDismiss} variant="green" size="sm">
              Got it!
            </ChunkyButton>
          )}
        </div>

        {/* Don't show again */}
        <label className="flex items-center justify-center gap-2 text-xs text-ink-muted font-sans cursor-pointer">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="rounded accent-accent-orange"
          />
          Don&apos;t show again
        </label>
      </div>
    </div>
  );
}
