/**
 * Soft warm card surface. Used for panels (Words Played, Arena Tip, lobby blocks).
 *
 * Variants:
 *   - surface: default warm cream panel
 *   - teal: info / tip card (sage teal background, white text)
 *   - bubble: chat-bubble style with a small notch
 */
const variantStyles = {
  surface: 'bg-surface text-ink shadow-card',
  teal: 'bg-accent-teal text-white shadow-card',
  bubble: 'bg-surface text-ink shadow-card relative',
  'bubble-green': 'bg-accent-green/20 text-ink shadow-card relative',
};

export default function Card({ children, variant = 'surface', className = '', ...rest }) {
  return (
    <div className={['rounded-2xl p-5', variantStyles[variant], className].join(' ')} {...rest}>
      {children}
    </div>
  );
}
