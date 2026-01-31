import { forwardRef } from 'react';

const Card = forwardRef(({
  children,
  className = '',
  padding = 'md',
  hover = false,
  glow = false,
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      ref={ref}
      className={`
        bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700
        ${paddings[padding]}
        ${hover ? 'transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:-translate-y-1' : ''}
        ${glow ? 'relative' : ''}
        ${className}
      `}
      {...props}
    >
      {glow && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
      )}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
