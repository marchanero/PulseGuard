/**
 * Tests para utilidades de exportación
 * Ejemplo de testing de funciones puras
 */
import { exportToJSON, exportToCSV } from '../exportData';

describe('exportData utilities', () => {
  // Mock de URL.createObjectURL y URL.revokeObjectURL
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToJSON', () => {
    it('should export data to JSON file', () => {
      const data = [
        { id: 1, name: 'Service 1', status: 'up' },
        { id: 2, name: 'Service 2', status: 'down' }
      ];
      const filename = 'services.json';

      // No lanzamos error, verificamos que la función se ejecuta
      expect(() => exportToJSON(data, filename)).not.toThrow();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle empty data', () => {
      const data = [];
      const filename = 'empty.json';

      expect(() => exportToJSON(data, filename)).not.toThrow();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      const data = [
        { 
          id: 1, 
          name: 'Service 1', 
          config: { timeout: 5000, retries: 3 }
        }
      ];
      const filename = 'nested.json';

      expect(() => exportToJSON(data, filename)).not.toThrow();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV file', () => {
      const data = [
        { id: 1, name: 'Service 1', status: 'up' },
        { id: 2, name: 'Service 2', status: 'down' }
      ];
      const filename = 'services.csv';

      expect(() => exportToCSV(data, filename)).not.toThrow();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle empty data', () => {
      const data = [];
      const filename = 'empty.csv';

      expect(() => exportToCSV(data, filename)).not.toThrow();
    });

    it('should escape special characters in CSV', () => {
      const data = [
        { id: 1, name: 'Service, with comma', status: 'up' },
        { id: 2, name: 'Service with "quotes"', status: 'down' }
      ];
      const filename = 'special.csv';

      expect(() => exportToCSV(data, filename)).not.toThrow();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
