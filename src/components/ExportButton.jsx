import { useState, useRef, useEffect } from 'react';
import { exportToJSON, exportToCSV, exportReport } from '../utils/exportData';

function ExportButton({ services }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format) => {
    switch (format) {
      case 'json':
        exportToJSON(services);
        break;
      case 'csv':
        exportToCSV(services);
        break;
      case 'report':
        exportReport(services);
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Exportar
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
            Formato de exportación
          </div>
          
          <button
            onClick={() => handleExport('json')}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">JSON</span>
            </div>
            <div>
              <div className="font-medium">Exportar como JSON</div>
              <div className="text-xs text-slate-500 dark:text-gray-400">Datos completos</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-green-600 dark:text-green-400">CSV</span>
            </div>
            <div>
              <div className="font-medium">Exportar como CSV</div>
              <div className="text-xs text-slate-500 dark:text-gray-400">Para Excel/Sheets</div>
            </div>
          </button>

          <div className="border-t border-slate-200 dark:border-gray-700 my-1" />

          <button
            onClick={() => handleExport('report')}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Generar informe</div>
              <div className="text-xs text-slate-500 dark:text-gray-400">Resumen con estadísticas</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
