/**
 * Configuración de Cypress para PulseGuard
 * Tests E2E para la aplicación full-stack
 */
import { defineConfig } from 'cypress';

export default defineConfig({
  // Configuración de tests E2E
  e2e: {
    // URL base de la aplicación
    baseUrl: 'http://localhost:5173',
    
    // Patrón de archivos de spec
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Directorio de archivos de soporte
    supportFile: 'cypress/support/e2e.js',
    
    // Directorio de fixtures
    fixturesFolder: 'cypress/fixtures',
    
    // Directorio de screenshots
    screenshotsFolder: 'cypress/screenshots',
    
    // Directorio de videos
    videosFolder: 'cypress/videos',
    
    // Configuración de viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Tiempo de espera por defecto
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Configuración de retries
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Habilitar/deshabilitar video (útil en CI)
    video: true,
    
    // Habilitar/deshabilitar screenshots en fallos
    screenshotOnRunFailure: true,
    
    // Setup de eventos de Node
    setupNodeEvents(on, config) {
      // Implementar listeners de eventos de Node aquí
      // Ejemplo: tasks personalizadas, reporters, etc.
      
      return config;
    }
  },
  
  // Configuración de component testing (opcional)
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}'
  },
  
  // Configuración de screenshots
  screenshotOnRunFailure: true,
  
  // Configuración de videos
  video: true,
  videoCompression: 32,
  videoUploadOnPasses: false
});