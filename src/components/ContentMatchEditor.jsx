import { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, Code, FileText } from 'lucide-react';

/**
 * ContentMatchEditor - Componente para configurar validación de contenido en respuestas HTTP
 * Permite buscar texto específico o usar regex para validar respuestas
 */
function ContentMatchEditor({ contentMatch, onChange }) {
  const [pattern, setPattern] = useState(contentMatch || '');
  const [isRegex, setIsRegex] = useState(
    contentMatch ? contentMatch.startsWith('/') && contentMatch.lastIndexOf('/') > 0 : false
  );

  const handleChange = (value) => {
    setPattern(value);
    onChange(value);
  };

  const handleToggleRegex = () => {
    const newIsRegex = !isRegex;
    setIsRegex(newIsRegex);
    
    if (newIsRegex && pattern && !pattern.startsWith('/')) {
      // Convertir a formato regex
      const newPattern = `/${pattern}/i`;
      setPattern(newPattern);
      onChange(newPattern);
    } else if (!newIsRegex && pattern.startsWith('/')) {
      // Convertir a texto plano
      const match = pattern.match(/^\/(.+?)\/([gimuy]*)$/);
      if (match) {
        setPattern(match[1]);
        onChange(match[1]);
      }
    }
  };

  // Ejemplos de patrones comunes
  const examples = [
    { text: 'OK', regex: false, description: 'Buscar la palabra "OK"' },
    { text: '/success.*true/i', regex: true, description: 'Buscar "success" seguido de "true" (case-insensitive)' },
    { text: '{"status":"ok"}', regex: false, description: 'Validar respuesta JSON específica' },
    { text: '/error|fail|404/i', regex: true, description: 'Detectar errores (si NO debe aparecer)' }
  ];

  const insertExample = (example) => {
    setPattern(example.text);
    setIsRegex(example.regex);
    onChange(example.text);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4" />
            Verificación de Contenido
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Valida que la respuesta contenga texto específico o coincida con un patrón regex
          </p>
        </div>
      </div>

      {/* Input principal */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
            Patrón de búsqueda
          </label>
          <button
            type="button"
            onClick={handleToggleRegex}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md transition-colors ${
              isRegex
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Code className="w-3 h-3" />
            {isRegex ? 'Regex' : 'Texto'}
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={pattern}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={isRegex ? '/pattern/flags (ej: /success/i)' : 'Texto a buscar (ej: "Welcome")'}
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 
                     rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                     placeholder-slate-400 dark:placeholder-slate-500
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     font-mono"
          />
        </div>

        {pattern && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                {isRegex 
                  ? 'El servicio se marcará como "online" solo si la respuesta coincide con este regex'
                  : `El servicio se marcará como "online" solo si la respuesta contiene "${pattern}"`
                }
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Ejemplos */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Ejemplos comunes:
        </p>
        <div className="space-y-1.5">
          {examples.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => insertExample(example)}
              className="w-full text-left px-2.5 py-2 text-xs bg-white dark:bg-slate-700 
                       border border-slate-200 dark:border-slate-600 rounded-md
                       hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors
                       group"
            >
              <div className="flex items-start gap-2">
                <Code className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                  example.regex 
                    ? 'text-purple-500' 
                    : 'text-slate-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-slate-900 dark:text-white truncate">
                    {example.text}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {example.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info sobre regex */}
      {isRegex && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-300">
              <p className="font-medium mb-1">Formato Regex: /pattern/flags</p>
              <ul className="space-y-0.5 ml-4 list-disc">
                <li><code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">i</code> = case-insensitive</li>
                <li><code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">g</code> = global (todas las coincidencias)</li>
                <li><code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">m</code> = multiline</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tip de uso */}
      <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          💡 <strong>Casos de uso:</strong> Detectar páginas de error que devuelven 200 OK, 
          validar que una API devuelve datos específicos, verificar que el contenido esperado está presente.
        </p>
      </div>
    </div>
  );
}

export default ContentMatchEditor;
