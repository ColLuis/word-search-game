/**
 * Letter tile — white face, brown serif letter, soft drop shadow.
 * Used for crossword grids, letter banks, and decorative letterforms.
 *
 * Variants:
 *   - default: white face
 *   - highlight: warm orange face (selected / active letter)
 *   - ghost: dashed outline (placeholder / drop target)
 *
 * Sizes: sm | md | lg | xl
 */
const sizeStyles = {
  xs: 'w-6 h-6 text-xs rounded',
  sm: 'w-9 h-9 text-lg rounded-md',
  md: 'w-12 h-12 text-2xl rounded-lg',
  lg: 'w-16 h-16 text-3xl rounded-xl',
  xl: 'w-20 h-20 text-4xl rounded-2xl',
};

const variantStyles = {
  default: 'bg-tile-face text-ink shadow-tile',
  highlight: 'bg-accent-orange text-white shadow-tile',
  ghost: 'bg-transparent text-ink-muted border-2 border-dashed border-ink-muted',
};

export default function Tile({
  letter,
  size = 'md',
  variant = 'default',
  className = '',
  onClick,
  ...rest
}) {
  const interactive = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center font-display font-bold uppercase select-none',
        sizeStyles[size],
        variantStyles[variant],
        interactive
          ? 'cursor-pointer active:translate-y-0.5 active:shadow-tile-pressed transition-transform'
          : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {letter}
    </div>
  );
}
