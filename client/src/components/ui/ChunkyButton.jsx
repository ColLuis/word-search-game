/**
 * Chunky 3D button — flat colored top, darker bottom "edge" makes it look pressable.
 * Click presses it down (translates Y) and shrinks the edge shadow.
 *
 * Variants: orange (primary CTA) | green | red | teal | neutral
 * Sizes: sm | md | lg
 */
const variantStyles = {
  orange: 'bg-accent-orange text-white',
  green: 'bg-accent-green text-white',
  red: 'bg-accent-red text-white',
  teal: 'bg-accent-teal text-white',
  neutral: 'bg-surface text-ink',
};

const edgeStyles = {
  orange: 'shadow-[0_4px_0_0_#C77638]',
  green: 'shadow-[0_4px_0_0_#2E5C45]',
  red: 'shadow-[0_4px_0_0_#94372C]',
  teal: 'shadow-[0_4px_0_0_#5A857F]',
  neutral: 'shadow-[0_4px_0_0_#D6C29B]',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
};

export default function ChunkyButton({
  children,
  variant = 'orange',
  size = 'md',
  as: Component = 'button',
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <Component
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider',
        sizeStyles[size],
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'active:translate-y-1 active:shadow-none transition-transform',
        variantStyles[variant],
        disabled ? '' : edgeStyles[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Component>
  );
}
