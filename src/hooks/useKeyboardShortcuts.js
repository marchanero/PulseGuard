import { useEffect, useCallback } from 'react';

export function useKeyboardShortcuts(shortcuts) {
  const handleKeyDown = useCallback((event) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.isContentEditable) {
      // Allow Escape key even in inputs
      if (event.key !== 'Escape') return;
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    for (const shortcut of shortcuts) {
      const { key: shortcutKey, ctrl: needCtrl, shift: needShift, alt: needAlt, handler } = shortcut;
      
      const keyMatch = key === shortcutKey.toLowerCase();
      const ctrlMatch = !!needCtrl === ctrl;
      const shiftMatch = !!needShift === shift;
      const altMatch = !!needAlt === alt;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        handler();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
