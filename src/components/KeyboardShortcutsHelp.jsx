import { useEffect, useCallback } from 'react';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { key: 'Ctrl + N', description: 'Crear nuevo servicio' },
  { key: '/', description: 'Buscar servicios' },
  { key: 'Esc', description: 'Cerrar modales/drawers' },
  { key: 'Ctrl + K', description: 'Búsqueda global (Command Palette)' },
  { key: 'G', description: 'Cambiar vista (Grid/Lista)' },
  { key: 'F', description: 'Abrir filtros' },
  { key: 'R', description: 'Refrescar datos' },
  { key: '?', description: 'Mostrar esta ayuda' },
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('keydown', handleEscape);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Atajos de teclado
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
              >
                <span className="text-slate-600 dark:text-slate-300">
                  {shortcut.description}
                </span>
                <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pulsa <kbd className="px-2 py-0.5 bg-white dark:bg-slate-600 rounded text-xs">Esc</kbd> para cerrar
          </p>
        </div>
      </div>
    </div>
  );
}
