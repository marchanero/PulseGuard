/**
 * Tests para el hook useTheme
 * Ejemplo de testing de hooks con React Testing Library
 */
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Wrapper para proveer el contexto
const wrapper = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('useTheme Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide theme context', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBeDefined();
    expect(result.current.toggleTheme).toBeDefined();
  });

  it('should toggle theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    const initialTheme = result.current.theme;

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).not.toBe(initialTheme);
  });

  it('should persist theme preference', () => {
    renderHook(() => useTheme(), { wrapper });

    // Verificar que se lee de localStorage al inicio
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
  });
});
