/**
 * Configuración de Jest para tests de API (Node.js environment)
 */
export default {
  // Entorno de Node.js para tests de API
  testEnvironment: 'node',

  // Extensiones de archivos a buscar
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Solo buscar tests en server/__tests__
  testMatch: [
    '**/server/__tests__/**/*.[jt]s?(x)'
  ],

  // Transformación de archivos con Babel
  transform: {
    '^.+\.(js|jsx)$': 'babel-jest'
  },

  // Setup files para inicializar TextEncoder/TextDecoder
  setupFiles: ['<rootDir>/server/__tests__/setup.js'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.api.js'],

  // Verbosidad
  verbose: true,

  // Tiempo límite para tests de API (10 segundos)
  testTimeout: 10000
};
