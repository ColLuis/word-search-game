/**
 * Pill — rounded chip used for word lists, scores, badges.
 *
 * Variants:
 *   - default: white face, green text (like the "Words Played" list)
 *   - dashed: dashed outline (peeking word / placeholder)
 *   - solid-green: filled accent green
 *   - solid-orange: filled accent orange
 */
const variantStyles = {
  default: 'bg-tile-face text-accent-green',
  dashed: 'bg-transparent text-ink-muted border-2 border-dashed border-ink-muted/50',
  'solid-green': 'bg-accent-green text-white',
  'solid-orange': 'bg-accent-orange text-white',
};

export default function Pill({ label, score, variant = 'default', className = '', ...rest }) {
  return (
    <div
      className={[
        'inline-flex items-center justify-between gap-3 rounded-full px-4 py-2 font-display font-bold uppercase tracking-wider text-sm',
        variantStyles[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      <span>{label}</span>
      {score !== undefined && score !== null && (
        <span className="text-ink-soft text-xs font-sans font-bold">+{score}</span>
      )}
    </div>
  );
}
