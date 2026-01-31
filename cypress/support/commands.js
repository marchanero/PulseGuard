/**
 * Comandos personalizados de Cypress
 * Estos comandos están disponibles globalmente en todos los tests E2E
 */

// Comando para crear un servicio
Cypress.Commands.add('createService', (service) => {
  cy.request({
    method: 'POST',
    url: '/api/services',
    body: service,
    failOnStatusCode: false
  });
});

// Comando para eliminar todos los servicios
Cypress.Commands.add('deleteAllServices', () => {
  cy.request({
    method: 'DELETE',
    url: '/api/services',
    failOnStatusCode: false
  });
});

// Comando para verificar que un elemento tiene el foco
Cypress.Commands.add('isFocused', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('have.focus');
  return cy.wrap(subject);
});

// Comando para verificar visibilidad con scroll
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  const bottom = Cypress.$(cy.state('window')).height();
  const rect = subject[0].getBoundingClientRect();

  expect(rect.top).not.to.be.greaterThan(bottom);
  expect(rect.bottom).not.to.be.greaterThan(bottom);
  expect(rect.top).not.to.be.greaterThan(bottom);

  return subject;
});

// Comando para esperar a que un elemento desaparezca
Cypress.Commands.add('waitForElementToDisappear', (selector, timeout = 5000) => {
  cy.get(selector, { timeout }).should('not.exist');
});

// Comando para verificar notificación toast
Cypress.Commands.add('checkToast', (message, type = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`)
    .should('be.visible')
    .and('contain.text', message);
});