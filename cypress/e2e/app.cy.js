/**
 * Tests E2E para PulseGuard
 * Flujos de usuario completos
 */

describe('PulseGuard E2E Tests', () => {
  beforeEach(() => {
    // Visitar la aplicación antes de cada test
    cy.visit('/');
  });

  describe('Página de Inicio', () => {
    it('should display the main page', () => {
      // Verificar que el título está presente
      cy.contains('PulseGuard').should('be.visible');
      
      // Verificar que hay elementos de navegación
      cy.get('header').should('exist');
    });

    it('should display empty state when no services', () => {
      // Verificar el estado vacío
      cy.contains('No hay servicios').should('be.visible');
      cy.contains('Agrega tu primer servicio').should('be.visible');
    });
  });

  describe('Gestión de Servicios', () => {
    it('should open add service form', () => {
      // Click en botón de agregar servicio
      cy.contains('Agregar Servicio').click();
      
      // Verificar que el formulario se abre
      cy.contains('Nuevo Servicio').should('be.visible');
      cy.get('input[name="name"]').should('exist');
      cy.get('input[name="url"]').should('exist');
    });

    it('should show validation errors', () => {
      // Abrir formulario
      cy.contains('Agregar Servicio').click();
      
      // Intentar enviar formulario vacío
      cy.contains('Guardar').click();
      
      // Verificar mensajes de error
      cy.contains('El nombre es requerido').should('be.visible');
      cy.contains('La URL es requerida').should('be.visible');
    });

    it('should add a new service', () => {
      // Abrir formulario
      cy.contains('Agregar Servicio').click();
      
      // Llenar formulario
      cy.get('input[name="name"]').type('Test Service');
      cy.get('input[name="url"]').type('https://example.com');
      
      // Guardar
      cy.contains('Guardar').click();
      
      // Verificar que el servicio aparece en la lista
      cy.contains('Test Service').should('be.visible');
      cy.contains('https://example.com').should('be.visible');
    });

    it('should edit an existing service', () => {
      // Primero crear un servicio
      cy.createService({
        name: 'Service to Edit',
        url: 'https://edit-test.com'
      });
      
      // Recargar la página
      cy.visit('/');
      
      // Click en editar
      cy.contains('Service to Edit')
        .parent()
        .find('[data-testid="edit-button"]')
        .click();
      
      // Editar nombre
      cy.get('input[name="name"]').clear().type('Edited Service');
      
      // Guardar cambios
      cy.contains('Guardar').click();
      
      // Verificar cambio
      cy.contains('Edited Service').should('be.visible');
    });

    it('should delete a service', () => {
      // Crear un servicio
      cy.createService({
        name: 'Service to Delete',
        url: 'https://delete-test.com'
      });
      
      // Recargar
      cy.visit('/');
      
      // Click en eliminar
      cy.contains('Service to Delete')
        .parent()
        .find('[data-testid="delete-button"]')
        .click();
      
      // Confirmar eliminación
      cy.contains('Confirmar').click();
      
      // Verificar que ya no existe
      cy.contains('Service to Delete').should('not.exist');
    });
  });

  describe('Filtros y Búsqueda', () => {
    beforeEach(() => {
      // Crear servicios de prueba
      cy.createService({ name: 'Alpha Service', url: 'https://alpha.com', status: 'up' });
      cy.createService({ name: 'Beta Service', url: 'https://beta.com', status: 'down' });
      cy.createService({ name: 'Gamma Service', url: 'https://gamma.com', status: 'up' });
      
      cy.visit('/');
    });

    it('should filter services by status', () => {
      // Filtrar por servicios caídos
      cy.get('[data-testid="filter-down"]').click();
      
      // Solo debería mostrar Beta Service
      cy.contains('Beta Service').should('be.visible');
      cy.contains('Alpha Service').should('not.exist');
      cy.contains('Gamma Service').should('not.exist');
    });

    it('should search services by name', () => {
      // Buscar "Alpha"
      cy.get('input[type="search"]').type('Alpha');
      
      // Solo debería mostrar Alpha Service
      cy.contains('Alpha Service').should('be.visible');
      cy.contains('Beta Service').should('not.exist');
      cy.contains('Gamma Service').should('not.exist');
    });
  });

  describe('Tema Oscuro/Claro', () => {
    it('should toggle dark mode', () => {
      // Verificar tema inicial (light)
      cy.get('html').should('not.have.class', 'dark');
      
      // Click en toggle de tema
      cy.get('[data-testid="theme-toggle"]').click();
      
      // Verificar tema oscuro
      cy.get('html').should('have.class', 'dark');
      
      // Volver a tema claro
      cy.get('[data-testid="theme-toggle"]').click();
      
      // Verificar tema claro
      cy.get('html').should('not.have.class', 'dark');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      // Cambiar a viewport móvil
      cy.viewport('iphone-x');
      
      // Verificar que el menú hamburguesa existe
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      
      // Click en menú
      cy.get('[data-testid="mobile-menu-button"]').click();
      
      // Verificar que el menú se abre
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
    });

    it('should adapt to tablet viewport', () => {
      cy.viewport('ipad-2');
      
      // Verificar que la interfaz se adapta
      cy.get('header').should('be.visible');
    });
  });

  describe('Accesibilidad', () => {
    it('should be accessible', () => {
      // Verificar accesibilidad con axe
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      // Navegar con Tab
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid').and('eq', 'first-focusable');
      
      // Continuar navegación
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid').and('eq', 'second-focusable');
    });
  });

  describe('Exportación de Datos', () => {
    it('should export services data', () => {
      // Crear servicio de prueba
      cy.createService({ name: 'Export Test', url: 'https://export.com' });
      cy.visit('/');
      
      // Click en exportar
      cy.get('[data-testid="export-button"]').click();
      
      // Verificar que se descargó el archivo
      cy.readFile('cypress/downloads/services.json').should('exist');
    });
  });
});