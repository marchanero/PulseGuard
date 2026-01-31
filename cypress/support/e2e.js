/**
 * Archivo de soporte para tests E2E de Cypress
 * Se carga antes de cada test
 */

// Importar comandos personalizados
import './commands';

// Configuración global
cy.on('uncaught:exception', (err, runnable) => {
  // Prevenir que Cypress falle en excepciones no capturadas
  // Útil para errores de terceros
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});

// Comando personalizado para login (si es necesario)
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
  });
});

// Comando para esperar a que la aplicación esté lista
Cypress.Commands.add('waitForApp', () => {
  cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist');
});

// Comando para verificar accesibilidad con axe
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});