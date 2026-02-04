import { useState } from 'react';
import { Tag, X, Plus, Hash } from 'lucide-react';

/**
 * ServiceTags - Muestra y gestiona etiquetas de un servicio
 */
function ServiceTags({ 
  tags = [], 
  onChange, 
  editable = false, 
  size = 'normal',
  maxVisible = 5 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Colores predefinidos para tags
  const tagColors = [
    { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
    { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  ];

  const getTagColor = (tagName) => {
    // Generar un índice basado en el nombre del tag para consistencia
    const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return tagColors[hash % tagColors.length];
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim().toLowerCase()];
      onChange?.(updatedTags);
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    onChange?.(updatedTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTag('');
    }
  };

  const sizeClasses = {
    small: {
      tag: 'px-1.5 py-0.5 text-[10px]',
      icon: 'w-2.5 h-2.5',
      removeBtn: 'w-3 h-3'
    },
    normal: {
      tag: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      removeBtn: 'w-3.5 h-3.5'
    },
    large: {
      tag: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      removeBtn: 'w-4 h-4'
    }
  };

  const currentSize = sizeClasses[size];
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = tags.length - visibleTags.length;

  if (tags.length === 0 && !editable) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleTags.map((tag) => {
        const color = getTagColor(tag);
        return (
          <span
            key={tag}
            className={`
              inline-flex items-center gap-1 rounded-full font-medium border
              ${currentSize.tag} ${color.bg} ${color.text} ${color.border}
              transition-all duration-150
            `}
          >
            <Hash className={currentSize.icon} />
            <span>{tag}</span>
            {editable && (
              <button
                onClick={() => handleRemoveTag(tag)}
                className={`
                  ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 
                  transition-colors p-0.5
                `}
              >
                <X className={currentSize.removeBtn} />
              </button>
            )}
          </span>
        );
      })}

      {hiddenCount > 0 && (
        <span className={`
          inline-flex items-center rounded-full font-medium
          ${currentSize.tag} bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400
        `}>
          +{hiddenCount} más
        </span>
      )}

      {editable && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className={`
            inline-flex items-center gap-1 rounded-full font-medium border border-dashed
            ${currentSize.tag} 
            border-slate-300 dark:border-gray-600 
            text-slate-500 dark:text-gray-400
            hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400
            transition-colors
          `}
        >
          <Plus className={currentSize.icon} />
          <span>Añadir</span>
        </button>
      )}

      {editable && isAdding && (
        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newTag.trim()) {
                setIsAdding(false);
              }
            }}
            placeholder="Nueva etiqueta"
            autoFocus
            className={`
              ${currentSize.tag} 
              rounded-full border border-blue-400 dark:border-blue-500
              bg-white dark:bg-gray-800
              text-slate-900 dark:text-white
              placeholder-slate-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              w-24
            `}
          />
          <button
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewTag('');
            }}
            className="p-1 rounded-full bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * TagFilter - Componente para filtrar por tags
 */
export function TagFilter({ allTags = [], selectedTags = [], onChange }) {
  const tagColors = [
    { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', activeBg: 'bg-blue-500', activeText: 'text-white' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', activeBg: 'bg-purple-500', activeText: 'text-white' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', activeBg: 'bg-emerald-500', activeText: 'text-white' },
    { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', activeBg: 'bg-amber-500', activeText: 'text-white' },
    { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', activeBg: 'bg-rose-500', activeText: 'text-white' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', activeBg: 'bg-cyan-500', activeText: 'text-white' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', activeBg: 'bg-indigo-500', activeText: 'text-white' },
    { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', activeBg: 'bg-pink-500', activeText: 'text-white' },
  ];

  const getTagColor = (tagName) => {
    const hash = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return tagColors[hash % tagColors.length];
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange?.(selectedTags.filter(t => t !== tag));
    } else {
      onChange?.([...selectedTags, tag]);
    }
  };

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag className="w-4 h-4 text-slate-400" />
      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        const color = getTagColor(tag);
        
        return (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              transition-all duration-200
              ${isSelected 
                ? `${color.activeBg} ${color.activeText} shadow-sm` 
                : `${color.bg} ${color.text} hover:shadow-sm`
              }
            `}
          >
            <Hash className="w-3 h-3" />
            <span>{tag}</span>
            {isSelected && (
              <X className="w-3 h-3 ml-0.5" />
            )}
          </button>
        );
      })}
      
      {selectedTags.length > 0 && (
        <button
          onClick={() => onChange?.([])}
          className="text-xs text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

export default ServiceTags;
