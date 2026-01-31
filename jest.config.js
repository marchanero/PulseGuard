/**
 * Configuración de Jest para PulseGuard
 * Soporta React 18, Vite y Testing Library
 */
export default {
  // Entorno de pruebas para simular DOM
  testEnvironment: 'jsdom',

  // Extensiones de archivos a buscar
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Patrones para encontrar archivos de test
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/cypress/'
  ],

  // Transformación de archivos con Babel
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Mapeo de módulos para imports de Vite y estáticos
  moduleNameMapper: {
    // Mapeo de imports de Vite (aliases)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    
    // Mapeo de archivos estáticos
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // Archivo de setup para configurar Testing Library
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/**/index.js',
    '!**/node_modules/**'
  ],

  // Directorio para reportes de cobertura
  coverageDirectory: '<rootDir>/coverage',

  // Umbral mínimo de cobertura (opcional, descomentar para forzar)
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70
  //   }
  // },

  // Limpieza de mocks entre tests
  clearMocks: true,

  // Restaurar mocks después de cada test
  restoreMocks: true,

  // Tiempo máximo de espera para tests
  testTimeout: 10000,

  // Mostrar información detallada de tests fallidos
  verbose: true
};