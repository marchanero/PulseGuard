import { useState, useEffect } from 'react';

const STORAGE_KEY = 'serviceMonitor_compactMode';

export function useCompactMode() {
  const [isCompact, setIsCompact] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCompact));
    
    // Apply compact mode class to body for global styling
    if (isCompact) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [isCompact]);

  const toggleCompact = () => setIsCompact(prev => !prev);

  return { isCompact, toggleCompact, setIsCompact };
}
