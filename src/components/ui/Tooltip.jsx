import { useState } from 'react';

function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-gray-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-gray-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-gray-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-gray-700'
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap animate-fade-in ${positionStyles[position]}`}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowStyles[position]}`}
          />
        </div>
      )}
    </div>
  );
}

export default Tooltip;
