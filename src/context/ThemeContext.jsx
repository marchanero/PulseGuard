import { useState, useCallback, useRef, useEffect } from 'react';
import { ThemeContext } from './theme';

// Función para obtener el tema inicial
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const isTransitioning = useRef(false);

  // Aplicar tema sincrónicamente sin esperar useEffect
  const applyTheme = useCallback((newTheme) => {
    if (isTransitioning.current) return;
    
    const root = window.document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('theme', newTheme);
  }, []);

  // Aplicar tema inmediatamente cuando cambia
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Escuchar cambios en preferencias del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      // Aplicar inmediatamente para sincronización
      const root = window.document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
